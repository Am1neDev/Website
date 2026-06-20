import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import db from './db.js';
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  attachUser,
  requireAuth,
  requireAdmin,
} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
// UPLOAD_DIR lets hosts (e.g. Render) store uploads on a persistent disk.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PORT = process.env.PORT || 3000;
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 50);
const FILE_CATEGORIES = ['Course', 'TD', 'TP', 'Exam', 'Other'];

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUser);

/* ------------------------------------------------------------------ */
/* File uploads                                                        */
/* ------------------------------------------------------------------ */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } });

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function fileCountFor(courseId) {
  return db.prepare('SELECT COUNT(*) AS n FROM files WHERE course_id = ?').get(courseId).n;
}

/* ------------------------------------------------------------------ */
/* Auth routes                                                         */
/* ------------------------------------------------------------------ */

app.post('/api/auth/register', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

  // Self-registration always creates a student. Admins are provisioned separately.
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hashPassword(password), 'student');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  setAuthCookie(res, signToken(user));
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

/* ------------------------------------------------------------------ */
/* Course routes (read = everyone, write = admin only)                */
/* ------------------------------------------------------------------ */

// Search / list courses. Students use ?q= to find classes.
app.get('/api/courses', (req, res) => {
  const q = (req.query.q || '').trim();
  let rows;
  if (q) {
    const like = `%${q}%`;
    rows = db
      .prepare(
        `SELECT * FROM courses
         WHERE code LIKE ? OR title LIKE ? OR description LIKE ?
            OR department LIKE ? OR teacher LIKE ? OR level LIKE ?
         ORDER BY created_at DESC`
      )
      .all(like, like, like, like, like, like);
  } else {
    rows = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
  }
  res.json({ courses: rows.map((c) => ({ ...c, fileCount: fileCountFor(c.id) })) });
});

// Course detail with its files.
app.get('/api/courses/:id', (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const files = db
    .prepare(
      `SELECT id, category, title, original_name, size, mime, created_at
       FROM files WHERE course_id = ? ORDER BY category, created_at DESC`
    )
    .all(course.id);
  res.json({ course, files });
});

// Create a course — admin only.
app.post('/api/courses', requireAdmin, (req, res) => {
  const code = (req.body.code || '').trim();
  const title = (req.body.title || '').trim();
  if (!code || !title) return res.status(400).json({ error: 'Course code and title are required' });

  const info = db
    .prepare(
      `INSERT INTO courses (code, title, description, department, level, semester, teacher, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      code,
      title,
      (req.body.description || '').trim(),
      (req.body.department || '').trim(),
      (req.body.level || '').trim(),
      (req.body.semester || '').trim(),
      (req.body.teacher || '').trim(),
      req.user.id
    );
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ course });
});

// Update a course — admin only.
app.put('/api/courses/:id', requireAdmin, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  db.prepare(
    `UPDATE courses SET code = ?, title = ?, description = ?, department = ?,
       level = ?, semester = ?, teacher = ? WHERE id = ?`
  ).run(
    (req.body.code ?? course.code).trim(),
    (req.body.title ?? course.title).trim(),
    (req.body.description ?? course.description).trim(),
    (req.body.department ?? course.department).trim(),
    (req.body.level ?? course.level).trim(),
    (req.body.semester ?? course.semester).trim(),
    (req.body.teacher ?? course.teacher).trim(),
    course.id
  );
  res.json({ course: db.prepare('SELECT * FROM courses WHERE id = ?').get(course.id) });
});

// Delete a course (and its files on disk) — admin only.
app.delete('/api/courses/:id', requireAdmin, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const files = db.prepare('SELECT stored_name FROM files WHERE course_id = ?').all(course.id);
  for (const f of files) {
    fs.rm(path.join(UPLOAD_DIR, f.stored_name), { force: true }, () => {});
  }
  db.prepare('DELETE FROM courses WHERE id = ?').run(course.id);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* File routes                                                         */
/* ------------------------------------------------------------------ */

// Upload a file to a course — admin only.
app.post('/api/courses/:id/files', requireAdmin, upload.single('file'), (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) {
    if (req.file) fs.rm(req.file.path, { force: true }, () => {});
    return res.status(404).json({ error: 'Course not found' });
  }
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  let category = (req.body.category || 'Course').trim();
  if (!FILE_CATEGORIES.includes(category)) category = 'Other';
  const title = (req.body.title || req.file.originalname).trim();

  const info = db
    .prepare(
      `INSERT INTO files (course_id, category, title, original_name, stored_name, size, mime, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      course.id,
      category,
      title,
      req.file.originalname,
      req.file.filename,
      req.file.size,
      req.file.mimetype,
      req.user.id
    );
  const file = db
    .prepare('SELECT id, category, title, original_name, size, mime, created_at FROM files WHERE id = ?')
    .get(info.lastInsertRowid);
  res.status(201).json({ file });
});

// Download / view a file — any authenticated user (students included).
app.get('/api/files/:id/download', requireAuth, (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(UPLOAD_DIR, file.stored_name);
  if (!fs.existsSync(filePath)) return res.status(410).json({ error: 'File is no longer available' });

  res.download(filePath, file.original_name);
});

// Delete a file — admin only.
app.delete('/api/files/:id', requireAdmin, (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  fs.rm(path.join(UPLOAD_DIR, file.stored_name), { force: true }, () => {});
  db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
  res.json({ ok: true });
});

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
  res.status(500).json({ error: 'Something went wrong' });
});

/* ------------------------------------------------------------------ */
/* Bootstrap first admin                                              */
/* ------------------------------------------------------------------ */

function ensureAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'Administrator',
      adminEmail,
      hashPassword(adminPassword),
      'admin'
    );
    console.log(`Created default admin account: ${adminEmail} / ${adminPassword}`);
  }
}

ensureAdmin();

app.listen(PORT, () => {
  console.log(`Student Course Portal running at http://localhost:${PORT}`);
});

export default app;
