// Seeds a few sample courses so the portal isn't empty on first run.
// Usage: npm run seed
import { initSchema, get, run } from './db.js';

const samples = [
  {
    code: 'CS101',
    title: 'Introduction to Programming',
    description: 'Fundamentals of programming with variables, loops, functions and recursion.',
    department: 'Computer Science',
    level: 'L1 / Year 1',
    semester: 'Fall 2026',
    teacher: 'Dr. Smith',
  },
  {
    code: 'MATH201',
    title: 'Linear Algebra',
    description: 'Vectors, matrices, eigenvalues and linear transformations.',
    department: 'Mathematics',
    level: 'L2 / Year 2',
    semester: 'Spring 2026',
    teacher: 'Prof. Dubois',
  },
  {
    code: 'PHY110',
    title: 'Classical Mechanics',
    description: 'Newtonian mechanics, energy, momentum and rotational dynamics.',
    department: 'Physics',
    level: 'L1 / Year 1',
    semester: 'Fall 2026',
    teacher: 'Dr. Garcia',
  },
];

async function seed() {
  await initSchema();
  const admin = await get("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  const createdBy = admin ? admin.id : null;

  let added = 0;
  for (const s of samples) {
    const exists = await get('SELECT id FROM courses WHERE code = ?', [s.code]);
    if (!exists) {
      await run(
        `INSERT INTO courses (code, title, description, department, level, semester, teacher, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.code, s.title, s.description, s.department, s.level, s.semester, s.teacher, createdBy]
      );
      added++;
    }
  }
  console.log(`Seed complete. Added ${added} new course(s).`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
