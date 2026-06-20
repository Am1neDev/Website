import { createClient } from '@libsql/client';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production set TURSO_DATABASE_URL (libsql://...) + TURSO_AUTH_TOKEN.
// Locally, with neither set, we fall back to a plain on-disk SQLite file so
// the app runs with zero configuration.
// .trim() guards against trailing spaces/newlines from pasted env vars.
let url = (process.env.TURSO_DATABASE_URL || '').trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim();

const isRemote = /^(libsql|wss|ws|https|http):\/\//i.test(url);

if (isRemote && !authToken) {
  throw new Error(
    'TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is missing or empty. ' +
      'Create a *database* auth token in Turso (turso db tokens create <db>) ' +
      'and set TURSO_AUTH_TOKEN in your environment.'
  );
}

if (!url) {
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  url = `file:${path.join(dataDir, 'portal.db')}`;
}

const client = createClient(authToken ? { url, authToken } : { url });

export const usingTurso = isRemote;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT    NOT NULL,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    department  TEXT    NOT NULL DEFAULT '',
    level       TEXT    NOT NULL DEFAULT '',
    semester    TEXT    NOT NULL DEFAULT '',
    teacher     TEXT    NOT NULL DEFAULT '',
    created_by  INTEGER,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS files (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    category      TEXT    NOT NULL DEFAULT 'Course'
                  CHECK (category IN ('Course', 'TD', 'TP', 'Exam', 'Other')),
    title         TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    stored_name   TEXT    NOT NULL,
    size          INTEGER NOT NULL DEFAULT 0,
    mime          TEXT    NOT NULL DEFAULT 'application/octet-stream',
    uploaded_by   INTEGER,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_files_course ON files(course_id);
`;

export async function initSchema() {
  try {
    await client.executeMultiple(SCHEMA);
  } catch (err) {
    if (isRemote && (err?.cause?.status === 401 || /401/.test(String(err?.message)))) {
      throw new Error(
        'Turso rejected the connection (HTTP 401 = bad credentials). Check that:\n' +
          '  1. TURSO_AUTH_TOKEN is a *database auth token* (turso db tokens create <db>),\n' +
          '     not a Turso platform/API token.\n' +
          '  2. The token has no extra spaces or line breaks.\n' +
          '  3. TURSO_DATABASE_URL points to the same database the token was made for.\n' +
          `Current URL: ${url}`
      );
    }
    throw err;
  }
}

// Thin async helpers that keep the call sites readable.
export async function get(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows[0];
}

export async function all(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows;
}

// Returns the result; use `.lastInsertRowid` (as a Number) for inserts.
export async function run(sql, args = []) {
  const res = await client.execute({ sql, args });
  return {
    ...res,
    lastInsertRowid:
      res.lastInsertRowid != null ? Number(res.lastInsertRowid) : undefined,
  };
}

export default client;
