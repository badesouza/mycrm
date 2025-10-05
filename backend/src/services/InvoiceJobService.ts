import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { WhatsAppBillingService } from './WhatsAppBillingService';

const prisma = new PrismaClient();

export class InvoiceJobService {
  private static instance: InvoiceJobService;
  private isRunning = false;
  private billingService: WhatsAppBillingService;

  private constructor() {
    this.billingService = WhatsAppBillingService.getInstance();
  }

  public static getInstance(): InvoiceJobService {
    if (!InvoiceJobService.instance) {
      InvoiceJobService.instance = new InvoiceJobService();
    }
    return InvoiceJobService.instance;
  }

  /**
   * Inicia o job que roda diariamente às 2:30 AM
   */
  public startInvoiceJob(): void {
    console.log('🕐 Iniciando job de faturamento automático...');
    
    // Job roda diariamente às 2:30 AM
    cron.schedule('30 2 * * *', async () => {
      console.log('⏰ Job de faturamento iniciado às', new Date().toISOString());
      await this.processInvoices();
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    });

    console.log('✅ Job de faturamento agendado para rodar diariamente às 2:30 AM');
  }

  /**
   * Processa as faturas que devem ser geradas hoje
   */
  private async processInvoices(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Job já está em execução, pulando...');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Processando faturas automáticas...');

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      console.log('📅 Verificando customers com next_invoice_at entre:', startOfDay.toISOString(), 'e', endOfDay.toISOString());

      // Buscar customers que devem gerar fatura hoje
      const customersToInvoice = await prisma.customer.findMany({
        where: {
          next_invoice_at: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'active'
        }
      });

      console.log(`📊 Encontrados ${customersToInvoice.length} customers para faturar`);

      let successCount = 0;
      let errorCount = 0;

      for (const customer of customersToInvoice) {
        try {
          await this.generateInvoiceForCustomer(customer);
          successCount++;
          console.log(`✅ Fatura gerada para customer: ${customer.name} (${customer.id})`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Erro ao gerar fatura para customer ${customer.name}:`, error);
        }
      }

      console.log(`🎉 Job concluído: ${successCount} sucessos, ${errorCount} erros`);

      // Processar cobranças via WhatsApp
      console.log('📱 Processando cobranças via WhatsApp...');
      await this.billingService.processBillingMessages();
    } catch (error) {
      console.error('💥 Erro no job de faturamento:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Gera uma nova fatura para um customer específico
   */
  private async generateInvoiceForCustomer(customer: any): Promise<void> {
    // Buscar um usuário ativo para associar ao pagamento
    const user = await prisma.user.findFirst({
      where: { status: 'active' }
    });

    if (!user) {
      throw new Error('Nenhum usuário ativo encontrado para gerar fatura');
    }

    // Criar novo pagamento
    const payment = await prisma.payment.create({
      data: {
        customerId: customer.id,
        userId: user.id,
        amount: customer.amount,
        status: 'unpaid',
        due_date: customer.next_invoice_at!,
        userName: user.name,
        paymentMethod: customer.paymentMethod
      }
    });

    // Calcular próxima data de faturamento (próximo mês)
    const currentInvoiceDate = customer.next_invoice_at!;
    const nextInvoiceDate = new Date(
      currentInvoiceDate.getFullYear(),
      currentInvoiceDate.getMonth() + 1,
      currentInvoiceDate.getDate()
    );

    // Atualizar customer com próxima data de faturamento
    await prisma.customer.update({
      where: { id: customer.id },
      data: { next_invoice_at: nextInvoiceDate }
    });

    console.log(`📄 Fatura criada:`, {
      customerId: customer.id,
      customerName: customer.name,
      paymentId: payment.id,
      amount: payment.amount,
      due_date: payment.due_date,
      next_invoice_at: nextInvoiceDate
    });
  }

  /**
   * Para o job (útil para testes)
   */
  public stopInvoiceJob(): void {
    console.log('🛑 Parando job de faturamento...');
    // Note: node-cron não tem método destroy, o job para automaticamente quando o processo termina
  }

  /**
   * Executa o job manualmente (útil para testes)
   */
  public async runInvoiceJobManually(): Promise<void> {
    console.log('🔧 Executando job manualmente...');
    await this.processInvoices();
  }

  /**
   * Executa o processamento de faturas (método público)
   */
  public async executeInvoiceProcessing(): Promise<void> {
    await this.processInvoices();
  }
}
