import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initSchema, usingTurso, get, all, run } from './db.js';
import { saveFile, readFile, deleteFile, storageBackend } from './storage.js';
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  attachUser,
  requireAdmin,
} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PORT = process.env.PORT || 3000;
// The desktop (Electron) build sets HOST=127.0.0.1 so only this machine can connect.
const HOST = process.env.HOST || '0.0.0.0';
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 50);
const FILE_CATEGORIES = ['Course', 'TD', 'TP', 'Exam', 'Other'];
// Academic years/programs a course can belong to. '' means "unassigned".
const COURSE_YEARS = ['L1', 'L2', 'L3 ISIL', 'L3 SIQ'];
const normalizeYear = (y) => (COURSE_YEARS.includes((y || '').trim()) ? (y || '').trim() : '');
// Semesters a course can belong to. '' means "unassigned".
const COURSE_SEMESTERS = ['Semester 1', 'Semester 2'];
const normalizeSemester = (s) =>
  COURSE_SEMESTERS.includes((s || '').trim()) ? (s || '').trim() : '';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => attachUser(req, res, next).catch(next));

// Files are held in memory so they can go to either Supabase or local disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

// Wraps an async route so rejected promises reach the error handler.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function fileCountFor(courseId) {
  const row = await get('SELECT COUNT(*) AS n FROM files WHERE course_id = ?', [courseId]);
  return row.n;
}

/* ------------------------------------------------------------------ */
/* Auth routes                                                         */
/* ------------------------------------------------------------------ */

app.post('/api/auth/register', wrap(async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const exists = await get('SELECT id FROM users WHERE email = ?', [email]);
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

  // Self-registration always creates a student. Admins are provisioned separately.
  const info = await run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hashPassword(password), 'student']
  );
  const user = await get('SELECT * FROM users WHERE id = ?', [info.lastInsertRowid]);
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: publicUser(user) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  setAuthCookie(res, signToken(user));
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

// The lists of academic years/programs and semesters courses can be filed under.
app.get('/api/years', (_req, res) => {
  res.json({ years: COURSE_YEARS });
});

app.get('/api/semesters', (_req, res) => {
  res.json({ semesters: COURSE_SEMESTERS });
});

/* ------------------------------------------------------------------ */
/* Course routes (read = everyone, write = admin only)                */
/* ------------------------------------------------------------------ */

// Search / list courses. Students use ?q= to find classes.
app.get('/api/courses', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  const year = normalizeYear(req.query.year);
  const semester = normalizeSemester(req.query.semester);

  const where = [];
  const args = [];
  if (q) {
    const like = `%${q}%`;
    where.push(
      '(code LIKE ? OR title LIKE ? OR description LIKE ? OR department LIKE ? OR teacher LIKE ?)'
    );
    args.push(like, like, like, like, like);
  }
  if (year) {
    where.push('year = ?');
    args.push(year);
  }
  if (semester) {
    where.push('semester = ?');
    args.push(semester);
  }
  const sql =
    'SELECT * FROM courses' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ' ORDER BY created_at DESC';
  const rows = await all(sql, args);

  const courses = [];
  for (const c of rows) {
    courses.push({ ...c, fileCount: await fileCountFor(c.id) });
  }
  res.json({ courses });
}));

// Course detail with its files.
app.get('/api/courses/:id', wrap(async (req, res) => {
  const course = await get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const files = await all(
    `SELECT id, category, title, original_name, size, mime, created_at
     FROM files WHERE course_id = ? ORDER BY category, created_at DESC`,
    [course.id]
  );
  res.json({ course, files });
}));

// Create a course — admin only.
app.post('/api/courses', requireAdmin, wrap(async (req, res) => {
  const code = (req.body.code || '').trim();
  const title = (req.body.title || '').trim();
  if (!code || !title) return res.status(400).json({ error: 'Course code and title are required' });

  const info = await run(
    `INSERT INTO courses (code, title, description, department, level, year, semester, teacher, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      title,
      (req.body.description || '').trim(),
      (req.body.department || '').trim(),
      (req.body.level || '').trim(),
      normalizeYear(req.body.year),
      normalizeSemester(req.body.semester),
      (req.body.teacher || '').trim(),
      req.user.id,
    ]
  );
  const course = await get('SELECT * FROM courses WHERE id = ?', [info.lastInsertRowid]);
  res.status(201).json({ course });
}));

// Update a course — admin only.
app.put('/api/courses/:id', requireAdmin, wrap(async (req, res) => {
  const course = await get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  await run(
    `UPDATE courses SET code = ?, title = ?, description = ?, department = ?,
       level = ?, year = ?, semester = ?, teacher = ? WHERE id = ?`,
    [
      (req.body.code ?? course.code).trim(),
      (req.body.title ?? course.title).trim(),
      (req.body.description ?? course.description).trim(),
      (req.body.department ?? course.department).trim(),
      (req.body.level ?? course.level).trim(),
      req.body.year !== undefined ? normalizeYear(req.body.year) : course.year,
      req.body.semester !== undefined ? normalizeSemester(req.body.semester) : course.semester,
      (req.body.teacher ?? course.teacher).trim(),
      course.id,
    ]
  );
  res.json({ course: await get('SELECT * FROM courses WHERE id = ?', [course.id]) });
}));

// Delete a course (and its files in storage + DB) — admin only.
app.delete('/api/courses/:id', requireAdmin, wrap(async (req, res) => {
  const course = await get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const files = await all('SELECT stored_name FROM files WHERE course_id = ?', [course.id]);
  for (const f of files) await deleteFile(f.stored_name);
  // Remove file rows explicitly so it works whether or not FK cascade is on.
  await run('DELETE FROM files WHERE course_id = ?', [course.id]);
  await run('DELETE FROM courses WHERE id = ?', [course.id]);
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/* File routes                                                         */
/* ------------------------------------------------------------------ */

// Upload a file to a course — admin only.
app.post('/api/courses/:id/files', requireAdmin, upload.single('file'), wrap(async (req, res) => {
  const course = await get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  let category = (req.body.category || 'Course').trim();
  if (!FILE_CATEGORIES.includes(category)) category = 'Other';
  const title = (req.body.title || req.file.originalname).trim();

  const storedName = await saveFile(req.file.buffer, req.file.originalname, req.file.mimetype);

  const info = await run(
    `INSERT INTO files (course_id, category, title, original_name, stored_name, size, mime, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      course.id,
      category,
      title,
      req.file.originalname,
      storedName,
      req.file.size,
      req.file.mimetype,
      req.user.id,
    ]
  );
  const file = await get(
    'SELECT id, category, title, original_name, size, mime, created_at FROM files WHERE id = ?',
    [info.lastInsertRowid]
  );
  res.status(201).json({ file });
}));

// Edit a file's title/category and optionally replace its contents — admin only.
app.put('/api/files/:id', requireAdmin, upload.single('file'), wrap(async (req, res) => {
  const file = await get('SELECT * FROM files WHERE id = ?', [req.params.id]);
  if (!file) return res.status(404).json({ error: 'File not found' });

  let category = (req.body.category || file.category).trim();
  if (!FILE_CATEGORIES.includes(category)) category = 'Other';
  const title = (req.body.title || file.title).trim();

  let { stored_name: storedName, original_name: originalName, size, mime } = file;

  // If a replacement file was uploaded, store it and remove the old object.
  if (req.file) {
    const newKey = await saveFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    await deleteFile(storedName);
    storedName = newKey;
    originalName = req.file.originalname;
    size = req.file.size;
    mime = req.file.mimetype;
  }

  await run(
    `UPDATE files SET category = ?, title = ?, original_name = ?, stored_name = ?, size = ?, mime = ?
     WHERE id = ?`,
    [category, title, originalName, storedName, size, mime, file.id]
  );
  const updated = await get(
    'SELECT id, category, title, original_name, size, mime, created_at FROM files WHERE id = ?',
    [file.id]
  );
  res.json({ file: updated });
}));

// Download / view a file — open to everyone (students need no account).
app.get('/api/files/:id/download', wrap(async (req, res) => {
  const file = await get('SELECT * FROM files WHERE id = ?', [req.params.id]);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const buffer = await readFile(file.stored_name);
  if (!buffer) return res.status(410).json({ error: 'File is no longer available' });

  res.setHeader('Content-Type', file.mime || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${file.original_name.replace(/"/g, '')}"`
  );
  res.send(buffer);
}));

// Delete a file — admin only.
app.delete('/api/files/:id', requireAdmin, wrap(async (req, res) => {
  const file = await get('SELECT * FROM files WHERE id = ?', [req.params.id]);
  if (!file) return res.status(404).json({ error: 'File not found' });

  await deleteFile(file.stored_name);
  await run('DELETE FROM files WHERE id = ?', [file.id]);
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/* Static frontend + error handling                                   */
/* ------------------------------------------------------------------ */

app.use(express.static(path.join(ROOT, 'public')));

// Multer / generic error handler — keep last.
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File too large (max ${MAX_UPLOAD_MB} MB)` });
    }
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  // Operational errors (e.g. storage failures) carry an explicit, safe message.
  if (err && err.expose) {
    return res.status(err.status || 400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Something went wrong' });
});

/* ------------------------------------------------------------------ */
/* Bootstrap first admin                                              */
/* ------------------------------------------------------------------ */

async function ensureAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existing) {
    await run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
      'Administrator',
      adminEmail,
      hashPassword(adminPassword),
      'admin',
    ]);
    console.log(`Created default admin account: ${adminEmail} / ${adminPassword}`);
  }
}

async function start() {
  await initSchema();
  await ensureAdmin();
  app.listen(PORT, HOST, () => {
    console.log(`Student Course Portal running at http://localhost:${PORT}`);
    console.log(`  database: ${usingTurso ? 'Turso (cloud)' : 'local SQLite file'}`);
    console.log(`  file storage: ${storageBackend === 'supabase' ? 'Supabase Storage' : 'local disk'}`);
    if (usingTurso && storageBackend === 'local') {
      console.warn(
        '  WARNING: running on a cloud DB but file storage is LOCAL DISK. ' +
          'Set SUPABASE_URL and SUPABASE_SERVICE_KEY so uploads persist.'
      );
    }
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
