import express from 'express';
import { WhatsAppController } from '../controllers/WhatsAppController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const whatsAppController = new WhatsAppController();

// Get WhatsApp status and QR code
router.get('/status', authenticateToken, whatsAppController.getStatus.bind(whatsAppController));

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