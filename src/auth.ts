import bcrypt from 'bcryptjs';
import { getRoles, type Role } from '@/lib/access';

export type SessionUser = {
  id: number;
  name: string;
  username: string;
  role: Role;
  roles?: Role[];
  must_change_password?: number;
};

type UserRow = SessionUser & {
  password_hash: string;
  status: string;
};

const COOKIE_NAME = 'bmkt_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') ?? '';
  const parts = cookie.split(';').map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function login(db: D1Database, username: string, password: string): Promise<{ user: SessionUser; cookie: string } | null> {
  const user = await db
    .prepare('SELECT id, name, username, password_hash, role, status, must_change_password FROM users WHERE username = ? LIMIT 1')
    .bind(username.trim())
    .first<UserRow>();

  if (!user || user.status !== 'ATIVO') return null;

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;

  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256(token);
  await db
    .prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', '+8 hours'))")
    .bind(user.id, tokenHash)
    .run();

  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=${SESSION_TTL_SECONDS}`;
  return { user: { id: user.id, name: user.name, username: user.username, role: user.role, roles: await getRoles(db, user), must_change_password: user.must_change_password }, cookie };
}

export async function getSessionUser(request: Request, db: D1Database): Promise<SessionUser | null> {
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return null;

  const tokenHash = await sha256(token);
  const user = await db
    .prepare(
      `SELECT users.id, users.name, users.username, users.role, users.must_change_password
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > CURRENT_TIMESTAMP AND users.status = 'ATIVO'
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<SessionUser>();
  return user ? { ...user, roles: await getRoles(db, user) } : null;
}

export async function logout(request: Request, db: D1Database): Promise<string> {
  const token = getCookie(request, COOKIE_NAME);
  if (token) {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  }

  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=0`;
}
