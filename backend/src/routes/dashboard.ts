import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { DashboardController } from '../controllers/DashboardController';

const router = express.Router();
const dashboardController = new DashboardController();

// Test endpoint
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Dashboard route is working', timestamp: new Date().toISOString() });
});

// Test auth endpoint
router.get('/test-auth', authenticateToken, dashboardController.testAuth.bind(dashboardController));

// Get dashboard statistics
router.get('/stats', authenticateToken, dashboardController.getStats.bind(dashboardController));

// Log when routes are registered
console.log('Dashboard routes registered:');
console.log('- GET /test');
console.log('- GET /test-auth');
console.log('- GET /stats');

export default router; 