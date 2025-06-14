import { Request, Response } from 'express';
import { WhatsAppService } from '../services/WhatsAppService';

export class WhatsAppController {
  private whatsAppService: WhatsAppService;

  constructor() {
    this.whatsAppService = new WhatsAppService();
    this.initializeWhatsApp();
  }

  private async initializeWhatsApp() {
    try {
      await this.whatsAppService.initialize();
      
      // Listen for QR code updates
      this.whatsAppService.onQR((qrCode) => {
        console.log('New QR Code received');
      });

      // Listen for status updates
      this.whatsAppService.onStatus((status) => {
        console.log('WhatsApp status:', status);
      });
    } catch (error) {
      console.error('Failed to initialize WhatsApp:', error);
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const isReady = this.whatsAppService.isReady();
      const qrCode = this.whatsAppService.getQRCode();

      res.json({
        connected: isReady,
        qrCode: qrCode
      });
    } catch (error) {
      console.error('Error getting WhatsApp status:', error);
      res.status(500).json({ error: 'Failed to get WhatsApp status' });
    }
  }

  async disconnect(req: Request, res: Response) {
    try {
      await this.whatsAppService.close();
      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({ error: 'Phone number and message are required' });
      }

      if (!this.whatsAppService.isReady()) {
        return res.status(503).json({ error: 'WhatsApp service is not ready' });
      }

      const response = await this.whatsAppService.sendMessage(to, message);
      res.json({ success: true, response });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
  }
} 