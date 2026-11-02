import crypto from 'node:crypto';

const SESSION_AGE_SECONDS = 7 * 24 * 60 * 60;
const COOKIE_NAME = 'pymaster_session';
const HASH_PREFIX = 'scrypt';

export function isPasswordHash(value) {
  return typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`);
}

export function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 1) throw new TypeError('Invalid password');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || !isPasswordHash(encoded)) return false;
  const fields = encoded.split('$');
  if (fields.length !== 3 || !/^[0-9a-f]{32}$/.test(fields[1]) || !/^[0-9a-f]{128}$/.test(fields[2])) return false;
  const expected = Buffer.from(fields[2], 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(fields[1], 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function sessionDigest(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getCookie(req, key) {
  const header = req.headers.cookie || '';
  for (const entry of header.split(';')) {
    const i = entry.indexOf('=');
    if (i > 0 && entry.slice(0, i).trim() === key) return entry.slice(i + 1).trim();
  }
  return '';
}

function sessionHeader(value, maxAge) {
  const parts = [
    `${COOKIE_NAME}=${value}`, 'HttpOnly', 'SameSite=Strict', 'Path=/',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function createSecurity(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
  const saveSession = db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
  const getSession = db.prepare(`
    SELECT users.* FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `);
  const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
  const deleteUserSessions = db.prepare('DELETE FROM sessions WHERE user_id = ?');

  function migrateLegacyPasswords() {
    const rows = db.prepare('SELECT id, password FROM users').all();
    const update = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    const migrate = db.transaction(() => {
      for (const user of rows) {
        if (!isPasswordHash(user.password)) {
          update.run(hashPassword(user.password), user.id);
        }
      }
    });
    migrate();
  }

  function startSession(res, userId) {
    const token = crypto.randomBytes(32).toString('base64url');
    const now = Date.now();
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
    saveSession.run(sessionDigest(token), userId, now + SESSION_AGE_SECONDS * 1000);
    res.setHeader('Set-Cookie', sessionHeader(token, SESSION_AGE_SECONDS));
  }

  function requireAuth(req, res, next) {
    const token = getCookie(req, COOKIE_NAME);
    if (!/^[a-zA-Z0-9_-]{40,80}$/.test(token)) {
      return res.status(401).json({ error: '请先登录' });
    }
    const actor = getSession.get(sessionDigest(token), Date.now());
    if (!actor) return res.status(401).json({ error: '登录状态已过期' });
    req.actor = actor;
    req.sessionDigest = sessionDigest(token);
    next();
  }

  function requireAdmin(req, res, next) {
    if (req.actor?.role !== 'admin') return res.status(403).json({ error: '无管理员权限' });
    next();
  }

  function requireSelfOrAdmin(req, res, next) {
    if (req.actor?.role !== 'admin' && req.actor?.id !== req.params.userId) {
      return res.status(403).json({ error: '无权访问其他用户数据' });
    }
    next();
  }

  function requireSelf(req, res, next) {
    if (req.actor?.id !== req.body?.userId) {
      return res.status(403).json({ error: '无权修改其他用户的状态' });
    }
    next();
  }

  // Requires a non-simple request header; cross-site HTML forms cannot supply it.
  // Use in addition to SameSite cookies, not instead of authentication.
  function requireCsrfHeader(req, res, next) {
    if (req.get('X-Requested-With') !== 'pymaster') {
      return res.status(403).json({ error: '请求来源验证失败' });
    }
    next();
  }

  function endSession(req, res) {
    if (req.sessionDigest) deleteSession.run(req.sessionDigest);
    res.setHeader('Set-Cookie', sessionHeader('', 0));
  }

  function revokeUserSessions(userId) {
    deleteUserSessions.run(userId);
  }

  return {
    migrateLegacyPasswords, startSession, requireAuth, requireAdmin,
    requireSelfOrAdmin, requireSelf, requireCsrfHeader, endSession, revokeUserSessions,
  };
}
