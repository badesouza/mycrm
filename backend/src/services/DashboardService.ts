import { PrismaClient } from '@prisma/client';

export class DashboardService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getStats(startDateIso?: string, endDateIso?: string) {
    try {
      // Resolve period (defaults to current month)
      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const startDate = startDateIso ? new Date(startDateIso) : defaultStart;
      const endDate = endDateIso ? new Date(endDateIso) : defaultEnd;

      // Get active customers count (total)
      const activeCustomers = await this.prisma.customer.count({
        where: { status: 'active' }
      });
      console.log('Active customers:', activeCustomers);

      // New customers in period
      const newCustomersInPeriod = await this.prisma.customer.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      console.log('New customers in period:', newCustomersInPeriod);

      // Total contracted amount in period (customers created in period)
      const totalAmountInPeriodAgg = await this.prisma.customer.aggregate({
        where: { 
          status: 'active',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        }
      });

      const amount = totalAmountInPeriodAgg._sum.amount || 0;
      console.log('Total amount:', new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount));

      // Revenue (paid payments) in period by payment_date
      const getTotalPaid = await this.prisma.payment.aggregate({
        where: { 
          status: 'paid',
          payment_date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        }
      });

      const getTotalUnpaid = await this.prisma.payment.aggregate({
        where: { 
          status: 'unpaid',
          due_date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        }
      });

      // Forecast in period (all payments scheduled in the period regardless of status)
      const getForecast = await this.prisma.payment.aggregate({
        where: {
          due_date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        }
      });

      const totalPaid = getTotalPaid._sum.amount || 0;
      const totalUnpaid = getTotalUnpaid._sum.amount || 0;
      const forecastInPeriod = getForecast._sum.amount || 0;

      // Calculate performance in the period (paid vs forecast)
      const performance = forecastInPeriod > 0 ? (totalPaid / forecastInPeriod) * 100 : 0;

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

      // Build daily customer evolution
      const startOfStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0);
      const baselineCount = await this.prisma.customer.count({
        where: {
          status: 'active',
          createdAt: {
            lt: startOfStartMonth
          }
        }
      });

      // Fetch customers created within period grouped by day
      const createdInPeriod = await this.prisma.customer.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: { createdAt: true }
      });

      const dayKey = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const additionsByDay: Record<string, number> = {};
      for (const c of createdInPeriod) {
        const key = dayKey(c.createdAt);
        additionsByDay[key] = (additionsByDay[key] || 0) + 1;
      }

      const evolution: Array<{ date: string; total: number }> = [];
      let running = baselineCount;
      const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      while (cursor <= endDate) {
        const key = dayKey(cursor);
        running += additionsByDay[key] || 0;
        evolution.push({ date: new Date(cursor).toISOString(), total: running });
        cursor.setDate(cursor.getDate() + 1);
      }

      return {
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        totalCustomers: activeCustomers,
        newCustomersInPeriod,
        totalAmount: amount, // total contracted in period (customers)
        revenueInPeriod: totalPaid, // paid in period
        totalUnpaid: totalUnpaid, // unpaid in period (by due_date)
        forecastInPeriod: forecastInPeriod, // all payments due in period
        performance: performance, // paid / forecast
        evolution
      };
    } catch (error) {
      console.error('Error in DashboardService.getStats:', error);
      throw error;
    }
  }
} 