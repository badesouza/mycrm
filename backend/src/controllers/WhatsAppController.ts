import { Request, Response } from 'express';
import { WhatsAppService } from '../services/WhatsAppService';

export class WhatsAppController {
  private whatsAppService: WhatsAppService;

  constructor() {
    this.whatsAppService = WhatsAppService.getInstance();
    this.initializeWhatsApp();
  }

  private async initializeWhatsApp() {
    try {
      // Listen for QR code updates
      this.whatsAppService.onQR((qrCode: string) => {
        console.log('QR Code updated:', qrCode.substring(0, 50) + '...');
      });

      // Listen for status updates
      this.whatsAppService.onStatus((status: string) => {
        console.log('WhatsApp status updated:', status);
      });

      // Initialize the service
      await this.whatsAppService.initialize();
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      console.log('Checking WhatsApp status...');
      const status = this.whatsAppService.getStatus();
      console.log('WhatsApp service status:', status);
      
      const response = {
        connected: status.isConnected && status.hasClient,
        qrCode: status.qrCode,
        details: status
      };
      
      console.log('Sending response:', response);
      res.json(response);
    } catch (error) {
      console.error('Error getting WhatsApp status:', error);
      res.status(500).json({ 
        error: 'Failed to get WhatsApp status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        console.error('Missing required fields:', { to, message });
        return res.status(400).json({ 
          error: 'Phone number and message are required',
          details: { to, message }
        });
      }

      console.log('Attempting to send WhatsApp message:', {
        to,
        messageLength: message.length,
        isConnected: this.whatsAppService.isReady()
      });

      if (!this.whatsAppService.isReady()) {
        console.error('WhatsApp is not connected');
        return res.status(503).json({ 
          error: 'WhatsApp is not connected',
          details: 'Please ensure WhatsApp is connected before sending messages'
        });
      }

      const result = await this.whatsAppService.sendMessage(to, message);
      console.log('Message sent successfully:', result);
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).json({ 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async disconnect(req: Request, res: Response) {
    try {
      await this.whatsAppService.close();
      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      res.status(500).json({ error: 'Failed to disconnect' });
    }
  }
} 