import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, isPasswordHash, verifyPassword, createSecurity } from './security.js';

test('passwords are salted and not stored in plaintext', () => {
  const a = hashPassword('some-strong-pass');
  const b = hashPassword('some-strong-pass');
  assert.ok(isPasswordHash(a));
  assert.notEqual(a, b);
  assert.ok(verifyPassword('some-strong-pass', a));
  assert.equal(verifyPassword('wrong-password', a), false);
  assert.equal(verifyPassword('some-strong-pass', 'some-strong-pass'), false);
  assert.equal(verifyPassword('some-strong-pass', 'scrypt$bad$bad'), false);
});

test('role and self access checks reject other users', () => {
  // Lightweight fixture: real SQL database tests should be added to CI.
  const db = {
    exec() {},
    prepare(query) {
      if (query.includes('SELECT users.*')) return { get() { return null; } };
      return { run() {}, get() { return null; }, all() { return []; } };
    },
    transaction(fn) { return fn; },
  };
  const security = createSecurity(db);
  const res = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json() { return this; } });
  const denied = res();
  security.requireAdmin({ actor: { id: 'u1', role: 'student' } }, denied, () => assert.fail('Must deny'));
  assert.equal(denied.statusCode, 403);
  const foreign = res();
  security.requireSelfOrAdmin({ actor: { id: 'u1', role: 'student' }, params: { userId: 'u2' } }, foreign, () => assert.fail('Must deny'));
  assert.equal(foreign.statusCode, 403);
  let allowed = false;
  security.requireSelfOrAdmin({ actor: { id: 'u1', role: 'student' }, params: { userId: 'u1' } }, res(), () => { allowed = true; });
  assert.ok(allowed);
});
