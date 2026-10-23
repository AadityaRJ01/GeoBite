import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Returns service health status and metadata
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'GeoBite API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
