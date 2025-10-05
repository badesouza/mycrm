import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export class WhatsAppService {
  private static instance: WhatsAppService;
  private client: Whatsapp | null = null;
  private eventEmitter: EventEmitter;
  private isInitialized: boolean = false;
  private qrCode: string | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private sessionPath: string;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.sessionPath = path.join(process.cwd(), 'tokens', 'mycrm-session');
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
      // Tentar restaurar sessão existente
      WhatsAppService.instance.tryRestoreSession();
    }
    return WhatsAppService.instance;
  }

  /**
   * Tenta restaurar uma sessão existente
   */
  private async tryRestoreSession() {
    try {
      if (fs.existsSync(this.sessionPath)) {
        console.log('🔄 Tentando restaurar sessão existente...');
        await this.initialize();
      }
    } catch (error) {
      console.log('⚠️ Não foi possível restaurar a sessão:', error);
    }
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

  /**
   * Limpa a sessão do WhatsApp (método público)
   */
  public async clearSessionPublic(): Promise<void> {
    this.clearSession();
  }

  async initialize() {
    try {
      console.log('WhatsApp initialize() called');
      console.log('Current state:', {
        isInitialized: this.isInitialized,
        isConnected: this.isConnected,
        isConnecting: this.isConnecting,
        hasClient: !!this.client
      });

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
      
      // Clear existing session and QR code
      this.clearSession();
      this.qrCode = null;
      
      this.client = await create({
        session: 'mycrm-session',
        catchQR: (base64QrCode: string) => {
          console.log('QR Code received - length:', base64QrCode.length);
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
            this.qrCode = null;
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
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        puppeteerOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ],
          timeout: 30000,
          headless: true
        },
        disableWelcome: true,
        updatesLog: false,
        autoClose: 60000,
        tokenStore: 'file',
        folderNameToken: './tokens',
        createPathFileToken: true
      });

      // Check if we're already connected
      try {
        const isConnected = await this.client.isConnected();
        if (isConnected) {
          this.isInitialized = true;
          this.isConnected = true;
          this.qrCode = null;
          console.log('WhatsApp already connected');
        } else {
          // Clear QR code if not connected
          this.qrCode = null;
        }
      } catch (error) {
        console.log('WhatsApp not connected yet');
        this.qrCode = null;
      }

      console.log('WhatsApp service initialized successfully');
    } catch (error) {
      console.error('Error initializing WhatsApp service:', error);
      this.isConnecting = false;
      this.isConnected = false;
      this.isInitialized = false;
      this.qrCode = null;
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
      
      // Validate number length
      if (formattedNumber.length < 10 || formattedNumber.length > 13) {
        throw new Error(`Número inválido: ${to} (${formattedNumber.length} dígitos). Deve ter 10-13 dígitos.`);
      }
      
      // Add country code if not present
      const numberWithCountryCode = formattedNumber.startsWith('55') 
        ? formattedNumber 
        : `55${formattedNumber}`;

      console.log(`📱 Enviando mensagem para ${numberWithCountryCode} (original: ${to})`);
      console.log(`💬 Mensagem: ${message}`);
      
      const response = await this.client.sendText(`${numberWithCountryCode}@c.us`, message);
      console.log('✅ Mensagem enviada com sucesso:', response);
      
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

  // Method to check if session is still valid
  async isSessionValid() {
    try {
      if (!this.client) return false;
      return await this.client.isConnected();
    } catch (error) {
      console.log('Session validation failed:', error);
      return false;
    }
  }

  // Method to keep session alive
  async keepSessionAlive() {
    try {
      if (this.client && this.isConnected) {
        // Send a simple ping to keep session active
        await this.client.getHostDevice();
        console.log('Session keep-alive successful');
        return true;
      }
      return false;
    } catch (error) {
      console.log('Session keep-alive failed:', error);
      return false;
    }
  }
} 