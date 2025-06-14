'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Users, DollarSign, UserCog } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Painel de Controle</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-700 rounded-lg shadow p-6 hover:bg-gray-600 transition-colors cursor-pointer"
               onClick={() => router.push('/customers')}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Clientes</h2>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-gray-400 mb-4">Gerencie seu banco de dados de clientes</p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Ver Clientes
            </Button>
          </div>

          <div className="bg-gray-700 rounded-lg shadow p-6 hover:bg-gray-600 transition-colors cursor-pointer"
               onClick={() => router.push('/payments')}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Pagamentos</h2>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-gray-400 mb-4">Acompanhe e gerencie pagamentos</p>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Ver Pagamentos
            </Button>
          </div>

          <div className="bg-gray-700 rounded-lg shadow p-6 hover:bg-gray-600 transition-colors cursor-pointer"
               onClick={() => router.push('/users')}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Usuários</h2>
              <UserCog className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-gray-400 mb-4">Gerencie usuários do sistema</p>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Ver Usuários
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 