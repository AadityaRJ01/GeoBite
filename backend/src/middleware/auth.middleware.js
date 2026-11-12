/**
 * GeoBite — Authentication Middleware
 *
 * Verifies Bearer JWT tokens on protected routes, attaches authenticated user
 * context to requests, and applies endpoint-level brute force protection.
 */

import { verifyToken } from '../services/auth.service.js';
import prisma from '../lib/prisma.js';

/**
 * Protects routes requiring user authentication via Bearer JWT
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication token is required. Please log in.',
        statusCode: 401,
      },
    });
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Malformed authorization header. Bearer token missing.',
        statusCode: 401,
      },
    });
  }

  try {
    const decoded = verifyToken(token);

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'The account associated with this token no longer exists.',
          statusCode: 401,
        },
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication token has expired. Please log in again.',
          statusCode: 401,
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid authentication token.',
        statusCode: 401,
      },
    });
  }
}

/**
 * In-memory sliding window rate limiter for auth endpoints
 * Default: max 15 requests per 15 minutes per IP
 */
const rateLimitMap = new Map();

export function authRateLimiter({ maxAttempts = 15, windowMs = 15 * 60 * 1000 } = {}) {
  return (req, res, next) => {
    // In test environment, skip or relax rate limiting
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
    } else {
      entry.count += 1;
    }

    rateLimitMap.set(ip, entry);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', maxAttempts);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > maxAttempts) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many authentication attempts. Please try again later.',
          statusCode: 429,
          retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000),
        },
      });
    }

    next();
  };
}

