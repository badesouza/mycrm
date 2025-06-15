'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CreditCard, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from '@/components/ui/use-toast';

interface DashboardStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalAmount: number;
  totalPaid: number;
  totalUnpaid: number;
  performance: number;
}

const API_BASE_URL = 'http://localhost:3001';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    performance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        toast({
          title: 'Erro',
          description: 'Por favor, faça login novamente',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      // Test API connection first
      console.log('Testing API connection...');
      const apiTestResponse = await fetch(`${API_BASE_URL}/api/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!apiTestResponse.ok) {
        throw new Error(`API test failed: ${apiTestResponse.status}`);
      }

      // Test authentication
      console.log('Testing authentication...');
      const authTestResponse = await fetch(`${API_BASE_URL}/api/dashboard/test-auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!authTestResponse.ok) {
        const errorData = await authTestResponse.json().catch(() => null);
        console.error('Auth test failed:', {
          status: authTestResponse.status,
          statusText: authTestResponse.statusText,
          error: errorData
        });
        throw new Error(`Authentication failed: ${authTestResponse.status}`);
      }

      // Fetch dashboard stats
      console.log('Fetching dashboard stats...');
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Stats fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData?.message || `Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received stats:', data);
      setStats(data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao carregar estatísticas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customers Card - Blue Theme */}
          <Card className="bg-blue-900/50 border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Total Customers */}
                <div>
                  <div className="text-sm text-blue-300">Total</div>
                  <div className="text-xl font-bold text-blue-100">
                    {loading ? '...' : stats.totalCustomers}
                  </div>
                </div>

                {/* New Customers This Month */}
                <div>
                  <div className="text-sm text-blue-300">Novos este mês</div>
                  <div className="text-lg font-bold text-blue-100">
                    {loading ? '...' : stats.newCustomersThisMonth}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/customers')}
                  className="text-blue-200 border-blue-700 hover:bg-blue-800/50"
                >
                  Ver Clientes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/customers/register')}
                  className="text-blue-200 border-blue-700 hover:bg-blue-800/50"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments Card - Green Theme */}
          <Card className="bg-emerald-900/50 border-emerald-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-200">Faturamento</CardTitle>
              <CreditCard className="h-4 w-4 text-emerald-300" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Total Amount */}
                <div>
                  <div className="text-sm text-emerald-300">Total</div>
                  <div className="text-xl font-bold text-emerald-100">
                    {loading ? '...' : new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(stats.totalAmount)}
                  </div>
                </div>

                {/* Paid and Unpaid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-emerald-300">Pago</div>
                    <div className="text-lg font-bold text-emerald-100">
                      {loading ? '...' : new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(stats.totalPaid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-emerald-300">Pendente</div>
                    <div className="text-lg font-bold text-emerald-100">
                      {loading ? '...' : new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(stats.totalUnpaid)}
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <div className="text-sm text-emerald-300">Performance</div>
                  <div className="text-lg font-bold text-emerald-100">
                    {loading ? '...' : new Intl.NumberFormat('pt-BR', {
                      style: 'percent',
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    }).format(stats.performance / 100)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/payments')}
                  className="text-emerald-200 border-emerald-700 hover:bg-emerald-800/50"
                >
                  Ver Pagamentos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/payments/new')}
                  className="text-emerald-200 border-emerald-700 hover:bg-emerald-800/50"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Novo Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 