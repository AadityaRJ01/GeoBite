/**
 * GeoBite — Authentication Service
 *
 * Handles password hashing, verification, JWT creation/verification,
 * email normalization, and user profile operations with PostgreSQL.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const BCRYPT_SALT_ROUNDS = 12;
const JWT_SECRET =
  process.env.JWT_SECRET || 'geobite-jwt-secret-key-change-in-production-min32chars';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Normalizes email address to lowercase and trimmed string
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Strips passwordHash and privileged internal fields from a user object
 * @param {Object} user
 * @returns {Object|null}
 */
export function toSafeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Hashes a plaintext password using bcrypt
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares plaintext password against a bcrypt hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JSON Web Token for the user
 * @param {Object} user
 * @returns {string}
 */
export function signToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifies and decodes a JWT
 * @param {string} token
 * @returns {Object} decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Registers a new user
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function registerUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);

  // Check for existing user with this email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password securely
  const passwordHash = await hashPassword(password);

  // Persist user record
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    },
  });

  const token = signToken(user);
  return {
    user: toSafeUser(user),
    token,
  };
}

/**
 * Authenticates user credentials and issues a token
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always run compare to mitigate timing attacks even if user is not found
  const dummyHash = '$2a$12$e80yqXwZqO8w1yYvK.o74O.kMv7f3/jF6iZtX7zG1Iqgq3Pq9mU1K';
  const hashToCompare = user ? user.passwordHash : dummyHash;
  const isMatch = await comparePassword(password, hashToCompare);

  if (!user || !isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = signToken(user);
  return {
    user: toSafeUser(user),
    token,
  };
}

/**
 * Fetches user profile by ID
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  return toSafeUser(user);
}

/**
 * Updates user profile fields (only safe mutable fields: name)
 *
 * @param {string} userId
 * @param {Object} updates
 * @param {string} [updates.name]
 * @returns {Promise<Object>}
 */
export async function updateUserProfile(userId, updates = {}) {
  const allowedData = {};

  if (typeof updates.name === 'string') {
    const trimmed = updates.name.trim();
    if (trimmed.length < 2) {
      const error = new Error('Name must be at least 2 characters long.');
      error.statusCode = 400;
      throw error;
    }
    allowedData.name = trimmed;
  }

  if (Object.keys(allowedData).length === 0) {
    const error = new Error('No valid profile fields provided for update.');
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: allowedData,
  });

  return toSafeUser(updatedUser);
}

