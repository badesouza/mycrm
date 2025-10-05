import express from 'express';
import { WhatsAppController } from '../controllers/WhatsAppController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const whatsAppController = new WhatsAppController();

// Test endpoint to verify authentication
router.get('/test', authenticateToken, (req, res) => {
  res.json({ message: 'Authentication working', user: req.user });
});

// Get WhatsApp status and QR code
router.get('/status', authenticateToken, whatsAppController.getStatus.bind(whatsAppController));

// Check session validity
router.get('/session-valid', authenticateToken, async (req, res) => {
  try {
    const isValid = await whatsAppController.whatsAppService.isSessionValid();
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check session validity' });
  }
});

// Keep session alive
router.post('/keep-alive', authenticateToken, async (req, res) => {
  try {
    const success = await whatsAppController.whatsAppService.keepSessionAlive();
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: 'Failed to keep session alive' });
  }
});

// Disconnect WhatsApp
router.post('/disconnect', authenticateToken, whatsAppController.disconnect.bind(whatsAppController));

// Send WhatsApp message
router.post('/send', authenticateToken, whatsAppController.sendMessage.bind(whatsAppController));

// Log when routes are registered
console.log('WhatsApp routes registered:');
console.log('- GET /status');
console.log('- POST /disconnect');
console.log('- POST /send');

export default router; 