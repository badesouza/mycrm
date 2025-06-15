import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export class WhatsAppService {
  private client: Whatsapp | null = null;
  private eventEmitter: EventEmitter;
  private isInitialized: boolean = false;
  private qrCode: string | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private sessionPath: string;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.sessionPath = path.join(process.cwd(), 'tokens', 'mycrm-session');
  }

  private clearSession() {
    try {
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
        console.log('Session cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  async initialize() {
    try {
      if (this.isInitialized && this.isConnected) {
        console.log('WhatsApp service already initialized and connected');
        return;
      }

      if (this.isConnecting) {
        console.log('WhatsApp service is already connecting');
        return;
      }

      this.isConnecting = true;
      console.log('Initializing WhatsApp service...');
      
      // Clear existing session if any
      this.clearSession();
      
      this.client = await create({
        session: 'mycrm-session',
        catchQR: (base64QrCode: string) => {
          console.log('QR Code received');
          // Remove data:image/png;base64, prefix if present
          this.qrCode = base64QrCode.replace('data:image/png;base64,', '');
          this.isConnected = false;
          this.eventEmitter.emit('qr', this.qrCode);
        },
        statusFind: (statusSession: string) => {
          console.log('Status Session:', statusSession);
          if (statusSession === 'CONNECTED') {
            this.isInitialized = true;
            this.isConnected = true;
            this.qrCode = null;
            this.eventEmitter.emit('status', statusSession);
          } else if (statusSession === 'DISCONNECTED') {
            this.isConnected = false;
            this.isInitialized = false;
            this.clearSession();
            this.eventEmitter.emit('status', statusSession);
          }
        },
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: true,
        browserWS: '',
        browserArgs: [''],
        puppeteerOptions: {},
        disableWelcome: true,
        updatesLog: true,
        autoClose: 60000,
        tokenStore: 'file',
        folderNameToken: './tokens'
      });

      // Check if we're already connected
      try {
        const isConnected = await this.client.isConnected();
        if (isConnected) {
          this.isInitialized = true;
          this.isConnected = true;
          this.qrCode = null;
          console.log('WhatsApp already connected');
        }
      } catch (error) {
        console.log('WhatsApp not connected yet');
      }

      console.log('WhatsApp service initialized successfully');
    } catch (error) {
      console.error('Error initializing WhatsApp service:', error);
      this.isConnecting = false;
      this.isConnected = false;
      this.isInitialized = false;
      this.clearSession();
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async sendMessage(to: string, message: string) {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('WhatsApp client not initialized or not connected');
      }

      // Format phone number (remove any non-numeric characters)
      const formattedNumber = to.replace(/\D/g, '');
      
      // Add country code if not present
      const numberWithCountryCode = formattedNumber.startsWith('55') 
        ? formattedNumber 
        : `55${formattedNumber}`;

      console.log(`Sending message to ${numberWithCountryCode}: ${message}`);
      
      const response = await this.client.sendText(`${numberWithCountryCode}@c.us`, message);
      console.log('Message sent successfully:', response);
      
      return response;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  onQR(callback: (qrCode: string) => void) {
    this.eventEmitter.on('qr', callback);
  }

  onStatus(callback: (status: string) => void) {
    this.eventEmitter.on('status', callback);
  }

  getQRCode() {
    return this.qrCode;
  }

  isReady() {
    return this.isConnected && this.client !== null;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      hasClient: this.client !== null,
      qrCode: this.qrCode
    };
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.isInitialized = false;
      this.isConnected = false;
      this.clearSession();
    }
  }
} 