import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import { EventEmitter } from 'events';

export class WhatsAppService {
  private client: Whatsapp | null = null;
  private eventEmitter: EventEmitter;
  private isInitialized: boolean = false;
  private qrCode: string | null = null;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('WhatsApp service already initialized');
        return;
      }

      console.log('Initializing WhatsApp service...');
      
      this.client = await create({
        session: 'mycrm-session',
        catchQR: (base64QrCode: string) => {
          this.qrCode = base64QrCode;
          this.eventEmitter.emit('qr', base64QrCode);
        },
        statusFind: (statusSession: string) => {
          console.log('Status Session:', statusSession);
          this.eventEmitter.emit('status', statusSession);
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

      this.isInitialized = true;
      console.log('WhatsApp service initialized successfully');
    } catch (error) {
      console.error('Error initializing WhatsApp service:', error);
      throw error;
    }
  }

  async sendMessage(to: string, message: string) {
    try {
      if (!this.client) {
        throw new Error('WhatsApp client not initialized');
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
    return this.isInitialized && this.client !== null;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.isInitialized = false;
    }
  }
} 