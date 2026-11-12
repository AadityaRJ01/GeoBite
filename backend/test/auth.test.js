/**
 * GeoBite — Day 17: Authentication & User Profiles Test Suite
 *
 * Comprehensive tests covering:
 * 1. User registration (happy path, validation, duplicate email, email normalization)
 * 2. Password security (bcrypt hashing, passwordHash never exposed)
 * 3. User login (happy path, wrong password, non-existent user, timing protection)
 * 4. JWT generation and verification (valid token, expired token, invalid token, missing header)
 * 5. Current user profile (/api/auth/me)
 * 6. Profile update (/api/auth/profile, protected field rejection)
 * 7. User data isolation (User A vs User B)
 * 8. Stateless logout acknowledgment
 */

import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import {
  hashPassword,
  comparePassword,
  normalizeEmail,
  toSafeUser,
} from '../src/services/auth.service.js';

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    server.close(async () => {
      await prisma.$disconnect();
      resolve();
    });
  });
}

async function getJson(endpoint, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${endpoint}`, { headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function postJson(endpoint, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function putJson(endpoint, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runAuthTests() {
  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.error(`  ✗ ${name}${details ? ': ' + details : ''}`);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log('   GeoBite Day 17: Authentication & User Profiles Tests');
  console.log('======================================================\n');

  const testUserEmailA = `test-day17-a-${Date.now()}@geobite.test`;
  const testUserEmailB = `test-day17-b-${Date.now()}@geobite.test`;
  const testPassword = 'StrongPassword123!';

  let tokenA = null;
  let tokenB = null;
  let userA = null;
  let userB = null;

  try {
    // ── 1. Unit Tests for Auth Utilities ──────────────────────────────
    console.log('--- 1. Testing Auth Service Unit Functions ---');
    const normalized = normalizeEmail('  User.NAME@Example.COM  ');
    assert('Normalizes email to trimmed lowercase', normalized === 'user.name@example.com');

    const hashedPassword = await hashPassword('MySecretPassword');
    assert('Hashes password using bcrypt', hashedPassword.startsWith('$2'));
    assert('Plaintext password matches hash', await comparePassword('MySecretPassword', hashedPassword));
    assert('Incorrect password fails hash comparison', !(await comparePassword('WrongPassword', hashedPassword)));

    const mockRawUser = {
      id: 'uuid-123',
      name: 'Test Explorer',
      email: 'test@example.com',
      passwordHash: '$2a$12$supersecurehashneverleak',
      createdAt: new Date(),
    };
    const safeUser = toSafeUser(mockRawUser);
    assert('toSafeUser strips passwordHash', safeUser.passwordHash === undefined);
    assert('toSafeUser preserves id, name, email', safeUser.id === 'uuid-123' && safeUser.name === 'Test Explorer');

    // ── 2. User Registration Endpoint ─────────────────────────────────
    console.log('\n--- 2. Testing POST /api/auth/register ---');
    await startServer();

    // Successful registration
    const regRes = await postJson('/api/auth/register', {
      name: 'Alice Explorer',
      email: testUserEmailA,
      password: testPassword,
    });

    assert('Successful registration returns 201 Created', regRes.status === 201);
    assert('Registration returns authentication token', Boolean(regRes.data?.data?.token));
    assert('Registration returns user object', Boolean(regRes.data?.data?.user?.id));
    assert('User name is preserved', regRes.data?.data?.user?.name === 'Alice Explorer');
    assert('User email is normalized', regRes.data?.data?.user?.email === testUserEmailA.toLowerCase());
    assert('passwordHash is NEVER returned in response', regRes.data?.data?.user?.passwordHash === undefined);

    tokenA = regRes.data?.data?.token;
    userA = regRes.data?.data?.user;

    // Duplicate email registration (case-insensitive)
    const dupRes = await postJson('/api/auth/register', {
      name: 'Alice Clone',
      email: testUserEmailA.toUpperCase(),
      password: testPassword,
    });
    assert('Duplicate email registration returns 409 Conflict', dupRes.status === 409);
    assert('Error message informs email exists', dupRes.data?.error?.message?.includes('already exists'));

    // Validation: Empty name
    const emptyNameRes = await postJson('/api/auth/register', {
      name: '   ',
      email: `valid-${Date.now()}@example.com`,
      password: testPassword,
    });
    assert('Rejects empty name with 400 Bad Request', emptyNameRes.status === 400);

    // Validation: Invalid email format
    const invalidEmailRes = await postJson('/api/auth/register', {
      name: 'Bob Valid',
      email: 'not-an-email-address',
      password: testPassword,
    });
    assert('Rejects invalid email format with 400 Bad Request', invalidEmailRes.status === 400);

    // Validation: Weak/short password (< 8 chars)
    const shortPasswordRes = await postJson('/api/auth/register', {
      name: 'Bob Short',
      email: `valid2-${Date.now()}@example.com`,
      password: 'short',
    });
    assert('Rejects short password (< 8 chars) with 400 Bad Request', shortPasswordRes.status === 400);

    // Register second user for isolation testing
    const regResB = await postJson('/api/auth/register', {
      name: 'Bob Voyager',
      email: testUserEmailB,
      password: testPassword,
    });
    assert('Second user registration succeeds', regResB.status === 201);
    tokenB = regResB.data?.data?.token;
    userB = regResB.data?.data?.user;

    // ── 3. User Login Endpoint ────────────────────────────────────────
    console.log('\n--- 3. Testing POST /api/auth/login ---');

    // Successful login (case-insensitive email)
    const loginRes = await postJson('/api/auth/login', {
      email: testUserEmailA.toUpperCase(),
      password: testPassword,
    });
    assert('Successful login returns 200 OK', loginRes.status === 200);
    assert('Login returns fresh JWT token', Boolean(loginRes.data?.data?.token));
    assert('Login returns safe user object without passwordHash', loginRes.data?.data?.user?.passwordHash === undefined);

    // Incorrect password
    const wrongPassRes = await postJson('/api/auth/login', {
      email: testUserEmailA,
      password: 'WrongPassword999!',
    });
    assert('Incorrect password returns 401 Unauthorized', wrongPassRes.status === 401);
    assert('Returns generic error message (no password leak)', wrongPassRes.data?.error?.message === 'Invalid email or password.');

    // Non-existent user email
    const nonExistentRes = await postJson('/api/auth/login', {
      email: 'nonexistent-user-404@nowhere.com',
      password: testPassword,
    });
    assert('Non-existent user returns 401 Unauthorized', nonExistentRes.status === 401);
    assert('Generic error message prevents account enumeration', nonExistentRes.data?.error?.message === 'Invalid email or password.');

    // Missing fields
    const missingEmailRes = await postJson('/api/auth/login', { password: testPassword });
    assert('Missing email returns 400 Bad Request', missingEmailRes.status === 400);

    const missingPassRes = await postJson('/api/auth/login', { email: testUserEmailA });
    assert('Missing password returns 400 Bad Request', missingPassRes.status === 400);

    // ── 4. Token Verification & Authentication Middleware ─────────────
    console.log('\n--- 4. Testing JWT Verification & Middleware ---');

    // Request with missing Authorization header
    const noHeaderRes = await getJson('/api/auth/me');
    assert('Missing Authorization header returns 401', noHeaderRes.status === 401);

    // Request with malformed Authorization header (no Bearer)
    const malformedHeaderRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Basic dXNlcjpwYXNz` },
    });
    assert('Malformed Authorization header returns 401', malformedHeaderRes.status === 401);

    // Request with invalid signature JWT
    const fakeToken = jwt.sign({ userId: 'fake-id' }, 'wrong-secret-key');
    const invalidTokenRes = await getJson('/api/auth/me', fakeToken);
    assert('Invalid JWT signature returns 401', invalidTokenRes.status === 401);

    // Request with expired JWT
    const jwtSecret = process.env.JWT_SECRET || 'geobite-jwt-secret-key-change-in-production-min32chars';
    const expiredToken = jwt.sign({ userId: userA.id }, jwtSecret, { expiresIn: '-1s' });
    const expiredRes = await getJson('/api/auth/me', expiredToken);
    assert('Expired JWT returns 401 with expiration notice', expiredRes.status === 401 && expiredRes.data?.error?.message?.includes('expired'));

    // ── 5. Protected Endpoint: GET /api/auth/me ───────────────────────
    console.log('\n--- 5. Testing GET /api/auth/me ---');
    const meResA = await getJson('/api/auth/me', tokenA);
    assert('Valid token gets user profile with 200 OK', meResA.status === 200);
    assert('Profile matches User A id', meResA.data?.data?.user?.id === userA.id);
    assert('Profile matches User A email', meResA.data?.data?.user?.email === userA.email);
    assert('Profile does not contain passwordHash', meResA.data?.data?.user?.passwordHash === undefined);

    // ── 6. Protected Endpoint: PUT /api/auth/profile ──────────────────
    console.log('\n--- 6. Testing PUT /api/auth/profile ---');

    // Update name
    const updateRes = await putJson('/api/auth/profile', { name: 'Alice Senior Explorer' }, tokenA);
    assert('Profile update succeeds with 200 OK', updateRes.status === 200);
    assert('Updated name is reflected in response', updateRes.data?.data?.user?.name === 'Alice Senior Explorer');

    // Verify change is persisted in database
    const verifyDbUser = await prisma.user.findUnique({ where: { id: userA.id } });
    assert('Database record reflects updated name', verifyDbUser.name === 'Alice Senior Explorer');

    // Rejection of protected field modifications
    const rejectIdRes = await putJson('/api/auth/profile', { id: 'malicious-uuid-overwrite' }, tokenA);
    assert('Rejects attempted id modification with 400', rejectIdRes.status === 400);

    const rejectEmailRes = await putJson('/api/auth/profile', { email: 'stolen@example.com' }, tokenA);
    assert('Rejects attempted email modification with 400', rejectEmailRes.status === 400);

    const rejectPassRes = await putJson('/api/auth/profile', { password: 'newpassword123' }, tokenA);
    assert('Rejects attempted password overwrite with 400', rejectPassRes.status === 400);

    // ── 7. User Data Isolation ────────────────────────────────────────
    console.log('\n--- 7. Testing User Data Isolation ---');
    const meResB = await getJson('/api/auth/me', tokenB);
    assert('User B profile returns User B id', meResB.data?.data?.user?.id === userB.id);
    assert('User B cannot see User A data via auth token', meResB.data?.data?.user?.id !== userA.id);

    // ── 8. Stateless Logout Endpoint ──────────────────────────────────
    console.log('\n--- 8. Testing POST /api/auth/logout ---');
    const logoutRes = await postJson('/api/auth/logout', {});
    assert('Logout returns 200 OK with client token clearance instruction', logoutRes.status === 200 && logoutRes.data?.success === true);

  } finally {
    // Clean up created test users from PostgreSQL
    try {
      await prisma.user.deleteMany({
        where: {
          email: { in: [testUserEmailA.toLowerCase(), testUserEmailB.toLowerCase()] },
        },
      });
      console.log('\n✓ Cleaned up test user records from database.');
    } catch (cleanupErr) {
      console.warn('Test user cleanup warning:', cleanupErr.message);
    }

    if (server) {
      await stopServer();
    }
  }

  console.log('\n======================================================');
  console.log(`AUTH TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal auth test error:', err);
  process.exit(1);
});

