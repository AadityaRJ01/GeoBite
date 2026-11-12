/**
 * GeoBite — Authentication Controller
 *
 * Implements user registration, login, current profile inspection,
 * profile update, and logout endpoints.
 */

import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  normalizeEmail,
} from '../services/auth.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

/**
 * Validates registration input
 * @param {Object} body
 * @returns {string|null} validation error message or null if valid
 */
function validateRegistrationInput({ name, email, password }) {
  if (!name || typeof name !== 'string' || name.trim().length < MIN_NAME_LENGTH) {
    return `Name is required and must be at least ${MIN_NAME_LENGTH} characters.`;
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return `Name cannot exceed ${MAX_NAME_LENGTH} characters.`;
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(normalizeEmail(email))) {
    return 'A valid email address is required.';
  }
  if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    const validationError = validateRegistrationInput({ name, email, password });
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          message: validationError,
          statusCode: 400,
        },
      });
    }

    const { user, token } = await registerUser({ name, email, password });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email and password are required.',
          statusCode: 400,
        },
      });
    }

    if (!EMAIL_REGEX.test(normalizeEmail(email))) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid email address format.',
          statusCode: 400,
        },
      });
    }

    const { user, token } = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Retrieves authenticated user profile
 */
export async function getMe(req, res, next) {
  try {
    // req.user is set by authenticateToken middleware
    const user = await getUserById(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/profile
 * Updates user profile (only safe fields: name)
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, email, id, password, passwordHash, role, createdAt, updatedAt } = req.body || {};

    // Reject attempted modification of protected fields
    if (id !== undefined || email !== undefined || password !== undefined || passwordHash !== undefined || role !== undefined || createdAt !== undefined || updatedAt !== undefined) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Modifying id, email, password, or system timestamps is not permitted via this endpoint.',
          statusCode: 400,
        },
      });
    }

    if (name === undefined || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Field "name" is required for profile update.',
          statusCode: 400,
        },
      });
    }

    const updatedUser = await updateUserProfile(req.user.id, { name });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Acknowledges stateless logout
 */
export function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard the stored authentication token on the client.',
  });
}

