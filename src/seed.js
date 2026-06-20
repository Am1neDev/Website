// Seeds a few sample courses so the portal isn't empty on first run.
// Usage: npm run seed
import db from './db.js';

const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
const createdBy = admin ? admin.id : null;

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

const insert = db.prepare(
  `INSERT INTO courses (code, title, description, department, level, semester, teacher, created_by)
   VALUES (@code, @title, @description, @department, @level, @semester, @teacher, @created_by)`
);

let added = 0;
for (const s of samples) {
  const exists = db.prepare('SELECT id FROM courses WHERE code = ?').get(s.code);
  if (!exists) {
    insert.run({ ...s, created_by: createdBy });
    added++;
  }
}

console.log(`Seed complete. Added ${added} new course(s).`);
