import { PrismaClient } from '@prisma/client';

export class DashboardService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getStats() {
    try {
      // Get active customers count
      const activeCustomers = await this.prisma.customer.count({
        where: { status: 'active' }
      });
      console.log('Active customers:', activeCustomers);

      // Get customers created in current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const newCustomersThisMonth = await this.prisma.customer.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });
      console.log('New customers this month:', newCustomersThisMonth);

      // Get total amount
      const totalAmount = await this.prisma.customer.aggregate({
        where: { status: 'active' },
        _sum: {
          amount: true
        }
      });

      const amount = totalAmount._sum.amount || 0;
      console.log('Total amount:', new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount));

      const getTotalPaid = await this.prisma.payment.aggregate({
        where: { status: 'paid' },
        _sum: {
          amount: true
        }
      });

      const getTotalUnpaid = await this.prisma.payment.aggregate({
        where: { status: 'unpaid' },
        _sum: {
          amount: true
        }
      });

      const totalPaid = getTotalPaid._sum.amount || 0;
      const totalUnpaid = getTotalUnpaid._sum.amount || 0;

      // Calculate performance only if totalAmount is not zero to avoid division by zero
      const performance = amount > 0 ? (totalPaid / amount) * 100 : 0;

      console.log('Total paid:', new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(totalPaid));

      console.log('Total unpaid:', new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(totalUnpaid));

      console.log('Performance:', new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(performance / 100));

      return {
        totalCustomers: activeCustomers,
        newCustomersThisMonth,
        totalAmount: amount,
        totalPaid: totalPaid,
        totalUnpaid: totalUnpaid,
        performance: performance
      };
    } catch (error) {
      console.error('Error in DashboardService.getStats:', error);
      throw error;
    }
  }
} 