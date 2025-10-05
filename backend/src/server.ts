import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import customerRoutes from './routes/customers';
import uploadRoutes from './routes/upload';
import paymentsRouter from './routes/payments';
import dashboardRoutes from './routes/dashboard';
import whatsappRoutes from './routes/whatsapp';
import { initializeScheduler } from './services/scheduler';
import { InvoiceJobService } from './services/InvoiceJobService';
import { WhatsAppBillingService } from './services/WhatsAppBillingService';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ 
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentsRouter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Initialize scheduler
initializeScheduler();

// Initialize invoice job
const invoiceJob = InvoiceJobService.getInstance();
invoiceJob.startInvoiceJob();

// Initialize WhatsApp billing service
const billingService = WhatsAppBillingService.getInstance();

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the CRM API' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test invoice job manually
app.post('/api/test-invoice-job', async (req, res) => {
  try {
    console.log('🔧 Executando job de faturamento manualmente...');
    await invoiceJob.runInvoiceJobManually();
    res.json({ 
      message: 'Job de faturamento executado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao executar job manualmente:', error);
    res.status(500).json({ 
      message: 'Erro ao executar job de faturamento',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test WhatsApp billing manually
app.post('/api/test-whatsapp-billing', async (req, res) => {
  try {
    console.log('📱 Executando processamento de cobranças via WhatsApp...');
    await billingService.runBillingProcessManually();
    res.json({ 
      message: 'Processamento de cobranças via WhatsApp executado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao executar processamento de cobranças:', error);
    res.status(500).json({ 
      message: 'Erro ao executar processamento de cobranças',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Auto-restore WhatsApp session
app.post('/api/whatsapp-auto-restore', async (req, res) => {
  try {
    const { WhatsAppService } = await import('./services/WhatsAppService');
    const whatsappService = WhatsAppService.getInstance();
    
    // Verificar se já está conectado
    const isConnected = await whatsappService.isSessionValid();
    if (isConnected) {
      return res.json({
        message: 'WhatsApp já está conectado',
        isConnected: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Tentar restaurar sessão
    console.log('🔄 Tentando restaurar sessão do WhatsApp...');
    await whatsappService.initialize();
    
    // Aguardar um pouco para a conexão ser estabelecida
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalStatus = await whatsappService.isSessionValid();
    
    res.json({
      message: finalStatus ? 'Sessão restaurada com sucesso' : 'Não foi possível restaurar a sessão',
      isConnected: finalStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao restaurar sessão do WhatsApp:', error);
    res.status(500).json({ 
      message: 'Erro ao restaurar sessão do WhatsApp',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check WhatsApp status (public endpoint for testing)
app.get('/api/whatsapp-status-public', async (req, res) => {
  try {
    const { WhatsAppService } = await import('./services/WhatsAppService');
    const whatsappService = WhatsAppService.getInstance();
    
    const isConnected = await whatsappService.isSessionValid();
    const qrCode = whatsappService.getQRCode();
    
    res.json({
      isConnected,
      hasQRCode: qrCode !== null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status do WhatsApp:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar status do WhatsApp',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check unpaid payments in database
app.get('/api/check-unpaid-payments', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);
    
    console.log(`📅 Verificando payments até: ${fiveDaysFromNow.toISOString().split('T')[0]}`);
    
    // Buscar payments não pagos com due_date menor que hoje + 5 dias
    const unpaidPayments = await prisma.payment.findMany({
      where: {
        status: 'unpaid',
        due_date: {
          lt: fiveDaysFromNow
        }
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            status: true
          }
        }
      },
      orderBy: {
        due_date: 'asc'
      }
    });
    
    const paymentsWithDays = unpaidPayments.map(payment => {
      const dueDate = new Date(payment.due_date);
      
      // Normalizar as datas para comparar apenas o dia (sem horas)
      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      // Calcular diferença: dueDate - today (positivo = não venceu, negativo = vencido)
      const daysDifference = Math.round((dueDateNormalized.getTime() - todayNormalized.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determinar tipo de mensagem baseado nos dias de diferença
      let messageType = '';
      if (daysDifference === 5) {
        messageType = 'Lembrete 5 dias';
      } else if (daysDifference === 3) {
        messageType = 'Lembrete 3 dias';
      } else if (daysDifference === 2) {
        messageType = 'Lembrete 2 dias';
      } else if (daysDifference === 0) {
        messageType = 'Vencimento hoje';
      } else if (daysDifference === -1 || daysDifference === -2) {
        messageType = 'Atraso 1-2 dias';
      } else if (daysDifference === -3) {
        messageType = 'Urgência 3 dias';
      } else if (daysDifference <= -7) {
        messageType = 'Suspensão 7+ dias';
      } else if (daysDifference === -4 || daysDifference === -5 || daysDifference === -6) {
        messageType = `Atraso ${Math.abs(daysDifference)} dias`;
      } else {
        messageType = 'Sem mensagem';
      }
      
      return {
        id: payment.id,
        customerName: payment.customer.name,
        customerPhone: payment.customer.phone,
        customerStatus: payment.customer.status,
        amount: payment.amount,
        due_date: payment.due_date,
        daysDifference: daysDifference,
        messageType: messageType,
        isOverdue: daysDifference < 0,
        isReminder: daysDifference === 5 || daysDifference === 3 || daysDifference === 2
      };
    });
    
    res.json({
      total: unpaidPayments.length,
      payments: paymentsWithDays,
      today: today.toISOString(),
      fiveDaysFromNow: fiveDaysFromNow.toISOString(),
      message: `Encontrados ${unpaidPayments.length} payments para cobrança (lembretes + vencidos)`
    });
  } catch (error) {
    console.error('Erro ao verificar payments não pagos:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar payments não pagos',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test invoice job manually
app.post('/api/test-invoice-job-manual', async (req, res) => {
  try {
    console.log('🔄 TESTE MANUAL - Executando job de cobranças...');
    
    // Importar e executar o InvoiceJobService
    const { InvoiceJobService } = await import('./services/InvoiceJobService');
    const invoiceJobService = InvoiceJobService.getInstance();
    
    // Executar o processamento manualmente
    await invoiceJobService.executeInvoiceProcessing();
    
    res.json({
      message: 'Job de cobranças executado manualmente com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao executar job manual:', error);
    res.status(500).json({ 
      message: 'Erro ao executar job manual',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear WhatsApp session
app.post('/api/clear-whatsapp-session', async (req, res) => {
  try {
    const { WhatsAppService } = await import('./services/WhatsAppService');
    const whatsappService = WhatsAppService.getInstance();
    
    // Clear session
    await whatsappService.clearSessionPublic();
    
    res.json({
      message: 'Sessão do WhatsApp limpa com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao limpar sessão do WhatsApp:', error);
    res.status(500).json({ 
      message: 'Erro ao limpar sessão do WhatsApp',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix customer phone number format (remove extra digit)
app.post('/api/fix-customer-phone-correct', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Buscar customer com número de 13 dígitos (incorreto)
    const customer = await prisma.customer.findFirst({
      where: {
        phone: {
          startsWith: '55738' // Números que começam com 55738 (13 dígitos)
        }
      }
    });
    
    if (!customer) {
      return res.json({
        message: 'Nenhum customer com número de 13 dígitos encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    // Corrigir número para formato correto
    // 5573981112735 -> 5573981112735 (12 dígitos)
    const currentPhone = customer.phone;
    
    // Se tem 13 dígitos, remover o dígito extra do meio
    if (currentPhone.length === 13) {
      // 5573981112735 -> 557381112735 (remover o 9 extra)
      const correctedPhone = currentPhone.substring(0, 5) + currentPhone.substring(6);
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: correctedPhone }
      });
      
      return res.json({
        message: 'Número do customer corrigido (removido dígito extra)',
        customerId: customer.id,
        customerName: customer.name,
        oldPhone: currentPhone,
        newPhone: correctedPhone,
        oldLength: currentPhone.length,
        newLength: correctedPhone.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // Se já está correto (12 dígitos), não fazer nada
    const correctedPhone = currentPhone;
    
    // Atualizar no banco
    await prisma.customer.update({
      where: { id: customer.id },
      data: { phone: correctedPhone }
    });
    
    res.json({
      message: 'Número do customer corrigido (removido dígito extra)',
      customerId: customer.id,
      customerName: customer.name,
      oldPhone: currentPhone,
      newPhone: correctedPhone,
      oldLength: currentPhone.length,
      newLength: correctedPhone.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao corrigir número do customer:', error);
    res.status(500).json({ 
      message: 'Erro ao corrigir número do customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix customer phone number format
app.post('/api/fix-customer-phone', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Buscar customer com número mal formatado
    const customer = await prisma.customer.findFirst({
      where: {
        phone: {
          contains: '('
        }
      }
    });
    
    if (!customer) {
      return res.json({
        message: 'Nenhum customer com número mal formatado encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    // Formatar número corretamente
    const formattedPhone = customer.phone.replace(/\D/g, '');
    const phoneWithCountryCode = formattedPhone.startsWith('55') 
      ? formattedPhone 
      : `55${formattedPhone}`;
    
    // Atualizar no banco
    await prisma.customer.update({
      where: { id: customer.id },
      data: { phone: phoneWithCountryCode }
    });
    
    res.json({
      message: 'Número do customer corrigido com sucesso',
      customerId: customer.id,
      customerName: customer.name,
      oldPhone: customer.phone,
      newPhone: phoneWithCountryCode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao corrigir número do customer:', error);
    res.status(500).json({ 
      message: 'Erro ao corrigir número do customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test WhatsApp with valid number
app.post('/api/test-whatsapp-valid-number', async (req, res) => {
  try {
    // Número de teste válido (substitua por um número real do WhatsApp)
    const testPhone = '5511999999999'; // Número de teste
    const testMessage = `🧪 TESTE - Sistema de Cobrança Gesfood

✅ Sistema funcionando perfeitamente!

📱 Esta é uma mensagem de teste do sistema automatizado de cobranças.

🔧 Se você recebeu esta mensagem, o sistema está operacional.

Obrigado! 🙏`;
    
    console.log('📱 Testando envio para número válido...');
    console.log(`📞 Número: ${testPhone}`);
    console.log(`💬 Mensagem: ${testMessage}`);
    
    const { WhatsAppService } = await import('./services/WhatsAppService');
    const whatsappService = WhatsAppService.getInstance();
    
    // Verificar se está conectado
    const isConnected = await whatsappService.isSessionValid();
    if (!isConnected) {
      return res.status(400).json({ 
        message: 'WhatsApp não está conectado',
        error: 'Conecte o WhatsApp primeiro em http://localhost:3000/whatsapp'
      });
    }
    
    // Enviar mensagem
    await whatsappService.sendMessage(testPhone, testMessage);
    
    res.json({
      message: 'Mensagem de teste enviada com sucesso',
      phone: testPhone,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
    res.status(500).json({ 
      message: 'Erro ao enviar mensagem de teste',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test WhatsApp message sending directly
app.post('/api/test-whatsapp-message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ 
        message: 'Phone and message are required',
        example: { phone: '+5511999999999', message: 'Test message' }
      });
    }
    
    console.log('📱 Enviando mensagem de teste via WhatsApp...');
    console.log(`📞 Telefone: ${phone}`);
    console.log(`💬 Mensagem: ${message}`);
    
    // Usar o WhatsAppService singleton
    const { WhatsAppService } = await import('./services/WhatsAppService');
    const whatsappService = WhatsAppService.getInstance();
    
    // Verificar se está conectado
    const isConnected = await whatsappService.isSessionValid();
    if (!isConnected) {
      console.log('⚠️ WhatsApp não está conectado. Iniciando conexão...');
      await whatsappService.initialize();
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Enviar mensagem
    await whatsappService.sendMessage(phone, message);
    
    res.json({ 
      message: 'Mensagem enviada com sucesso via WhatsApp',
      phone: phone,
      sentMessage: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem via WhatsApp:', error);
    res.status(500).json({ 
      message: 'Erro ao enviar mensagem via WhatsApp',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err instanceof Error ? err.message : 'Unknown error'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app; 