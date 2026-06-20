import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { get } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const TOKEN_TTL = '7d';
const COOKIE_NAME = 'token';

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

// Populates req.user from the auth cookie (or Authorization header) if present.
// Never blocks the request; route guards decide what to do with the result.
export async function attachUser(req, _res, next) {
  const headerToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = req.cookies?.token || headerToken;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await get('SELECT id, name, email, role FROM users WHERE id = ?', [payload.id]);
      if (user) req.user = user;
    } catch {
      // invalid / expired token — treat as anonymous
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}
