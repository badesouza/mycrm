import { PrismaClient } from '@prisma/client';
import { WhatsAppService } from './WhatsAppService';

const prisma = new PrismaClient();

export class WhatsAppBillingService {
  private static instance: WhatsAppBillingService;
  private whatsappService: WhatsAppService;

  private   constructor() {
    this.whatsappService = WhatsAppService.getInstance();
  }

  public static getInstance(): WhatsAppBillingService {
    if (!WhatsAppBillingService.instance) {
      WhatsAppBillingService.instance = new WhatsAppBillingService();
    }
    return WhatsAppBillingService.instance;
  }

  /**
   * Processa todas as cobranças pendentes
   */
  public async processBillingMessages(): Promise<void> {
    console.log('📱 Iniciando processamento de cobranças via WhatsApp...');

    try {
      const today = new Date();
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(today.getDate() + 5);
      
      console.log(`📅 Data atual: ${today.toISOString().split('T')[0]}`);
      console.log(`📅 Buscando payments até: ${fiveDaysFromNow.toISOString().split('T')[0]}`);

      // Buscar todos os payments não pagos com due_date menor que hoje + 5 dias
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
              id: true,
              name: true,
              phone: true,
              status: true
            }
          }
        },
        orderBy: {
          due_date: 'asc' // Ordenar por data de vencimento (mais próximos primeiro)
        }
      });

      console.log(`📊 Encontrados ${unpaidPayments.length} pagamentos para cobrança (vencidos + próximos 5 dias)`);

      for (const payment of unpaidPayments) {
        try {
          await this.processPaymentBilling(payment);
        } catch (error) {
          console.error(`❌ Erro ao processar cobrança para payment ${payment.id}:`, error);
        }
      }

      console.log('✅ Processamento de cobranças concluído');
    } catch (error) {
      console.error('💥 Erro no processamento de cobranças:', error);
    }
  }

  /**
   * Processa cobrança para um payment específico
   */
  private async processPaymentBilling(payment: any): Promise<void> {
    const today = new Date();
    const dueDate = new Date(payment.due_date);
    const daysDifference = this.calculateDaysDifference(today, dueDate);

    console.log(`📅 Processando payment ${payment.id} - Diferença: ${daysDifference} dias`);

    // Verificar se o customer está ativo
    if (payment.customer.status !== 'active') {
      console.log(`⚠️ Customer ${payment.customer.name} não está ativo, pulando cobrança`);
      return;
    }

    // Determinar qual mensagem enviar baseado na diferença de dias
    let message = '';
    let messageType = '';

    if (daysDifference === 5) {
      // 5 dias antes do vencimento - lembrete
      message = this.createReminderMessage(payment.customer.name, 5);
      messageType = 'Lembrete 5 dias';
    } else if (daysDifference === 3) {
      // 3 dias antes do vencimento - lembrete
      message = this.createReminderMessage(payment.customer.name, 3);
      messageType = 'Lembrete 3 dias';
    } else if (daysDifference === 2) {
      // 2 dias antes do vencimento - lembrete
      message = this.createReminderMessage(payment.customer.name, 2);
      messageType = 'Lembrete 2 dias';
    } else if (daysDifference === 0) {
      // Vence hoje
      message = this.createDueTodayMessage(payment.customer.name);
      messageType = 'Vencimento hoje';
    } else if (daysDifference === -1 || daysDifference === -2) {
      // 1-2 dias atrasado (valores negativos)
      message = this.createOverdueMessage(payment.customer.name, Math.abs(daysDifference));
      messageType = 'Atraso 1-2 dias';
    } else if (daysDifference === -3) {
      // 3 dias atrasado - urgência
      message = this.createUrgencyMessage(payment.customer.name);
      messageType = 'Urgência 3 dias';
    } else if (daysDifference <= -7) {
      // 7+ dias atrasado - suspensão
      message = this.createSuspensionMessage(payment.customer.name);
      messageType = 'Suspensão 7+ dias';
    } else if (daysDifference === -4 || daysDifference === -5 || daysDifference === -6) {
      // 4-6 dias atrasado - cobrança padrão
      message = this.createOverdueMessage(payment.customer.name, Math.abs(daysDifference));
      messageType = `Atraso ${Math.abs(daysDifference)} dias`;
    }

    // Log para debug
    console.log(`🔍 Payment ${payment.id} - daysDifference: ${daysDifference}, messageType: ${messageType}, hasMessage: ${!!message}`);

    // Enviar mensagem se houver uma definida
    if (message) {
      console.log(`📤 Enviando mensagem ${messageType} para ${payment.customer.phone}`);
      await this.sendWhatsAppMessage(payment.customer.phone, message, messageType);
    } else {
      console.log(`⚠️ Nenhuma mensagem definida para payment ${payment.id} com ${daysDifference} dias de diferença`);
    }
  }

  /**
   * Calcula a diferença em dias entre duas datas
   * Retorna: positivo = ainda não venceu, negativo = vencido
   */
  private calculateDaysDifference(today: Date, dueDate: Date): number {
    // Normalizar as datas para comparar apenas o dia (sem horas)
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    // Calcular diferença: dueDate - today
    // Positivo = ainda não venceu, Negativo = vencido
    const diffTime = dueDateNormalized.getTime() - todayNormalized.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }


  /**
   * Cria mensagem de lembrete (5 dias antes)
   */
  private createReminderMessage(customerName: string, daysLeft: number): string {
    return `👋 Olá ${customerName}!

📅 Sua assinatura do Gesfood vence em ${daysLeft} dias.

💳 Para manter o acesso contínuo, realize o pagamento através do PIX.

✅ Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Obrigado pela preferência! 🙏`;
  }

  /**
   * Cria mensagem de vencimento (no dia)
   */
  private createDueTodayMessage(customerName: string): string {
    return `⚠️ Olá ${customerName}!

📅 Seu plano vence HOJE!

🚨 Para evitar a suspensão do serviço, realize o pagamento através do PIX.

💳 Mantenha seu acesso ativo ao Gesfood.

Obrigado! 🙏`;
  }

  /**
   * Cria mensagem de atraso (1-2 dias)
   */
  private createOverdueMessage(customerName: string, daysOverdue: number): string {
    return `⏰ Olá ${customerName}!

📅 Seu pagamento está atrasado há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}.

⚠️ Para evitar a suspensão do serviço, realize o pagamento através do PIX.

💳 Mantenha seu acesso ativo ao Gesfood.

Obrigado pela compreensão! 🙏`;
  }

  /**
   * Cria mensagem de urgência (3 dias após)
   */
  private createUrgencyMessage(customerName: string): string {
    return `🚨 URGENTE - Olá ${customerName}!

⚠️ Identificamos que seu pagamento ainda não foi efetuado.

⏰ O acesso será SUSPENSO em 24h se o pagamento não for realizado.

💳 Realize o pagamento através do PIX IMEDIATAMENTE.

🔒 Evite a suspensão do seu serviço Gesfood.

Obrigado pela atenção! 🙏`;
  }

  /**
   * Cria mensagem de suspensão (7 dias após)
   */
  private createSuspensionMessage(customerName: string): string {
    return `🔒 Olá ${customerName}!

⚠️ Sua conta foi temporariamente SUSPENSA devido ao atraso no pagamento.

💳 Para reativar seu acesso, realize o pagamento através do PIX.

✅ Assim que o pagamento for confirmado, reativaremos automaticamente.

🔄 Seu serviço Gesfood será restaurado em até 24h após o pagamento.

Obrigado pela compreensão! 🙏`;
  }

  /**
   * Cria mensagem de confirmação de pagamento
   */
  private createPaymentConfirmationMessage(customerName: string): string {
    return `🎉 Olá ${customerName}!

✅ Seu pagamento foi confirmado com sucesso!

💳 Obrigado por manter sua assinatura conosco.

🚀 Seu acesso ao Gesfood está ativo e funcionando perfeitamente.

🙏 Agradecemos sua confiança em nossos serviços!

Tenha um excelente dia! 😊`;
  }

  /**
   * Envia mensagem via WhatsApp
   */
  private async sendWhatsAppMessage(phone: string, message: string, messageType: string): Promise<void> {
    try {
      console.log(`📱 Enviando ${messageType} para ${phone}: ${message}`);
      
      // Verificar se o WhatsApp está conectado
      const isConnected = await this.whatsappService.isSessionValid();
      if (!isConnected) {
        console.log(`⚠️ WhatsApp não está conectado. Iniciando conexão...`);
        await this.whatsappService.initialize();
        
        // Aguardar um pouco para a conexão ser estabelecida
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Enviar mensagem real via WhatsApp
      await this.whatsappService.sendMessage(phone, message);
      
      console.log(`✅ Mensagem ${messageType} enviada com sucesso para ${phone}`);
      
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem ${messageType} para ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Processa confirmação de pagamento
   */
  public async processPaymentConfirmation(paymentId: string): Promise<void> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          customer: {
            select: {
              name: true,
              phone: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment não encontrado');
      }

      const message = this.createPaymentConfirmationMessage(payment.customer.name);
      await this.sendWhatsAppMessage(payment.customer.phone, message, 'Confirmação de pagamento');

      console.log(`✅ Mensagem de confirmação enviada para payment ${paymentId}`);
    } catch (error) {
      console.error(`❌ Erro ao processar confirmação de pagamento ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Executa o processamento manualmente (para testes)
   */
  public async runBillingProcessManually(): Promise<void> {
    console.log('🔧 Executando processamento de cobranças manualmente...');
    await this.processBillingMessages();
  }
}
