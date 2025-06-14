'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import ClientWrapper from '@/components/ClientWrapper';

interface Customer {
  id: string;
  name: string;
}

export default function RegisterPaymentPage() {
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    due_date: '',
    paymentMethod: 'credit_card',
    status: 'unpaid'
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Please log in again to continue'
        });
        return;
      }

      console.log('Fetching customers with token:', token.substring(0, 10) + '...');
      
      const response = await fetch('http://localhost:3001/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch customers');
      }

      const { data } = await response.json();
      console.log('Fetched customers:', data);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to fetch customers'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Cookies.get('token');
      if (!token) {
        console.error('No token found');
        Swal.fire('Error', 'Authentication token not found', 'error');
        return;
      }

      // Decode token to check its contents
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', payload);
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }

      console.log('Submitting payment with token:', token.substring(0, 20) + '...');
      console.log('Form data:', formData);

      const response = await fetch('http://localhost:3001/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          due_date: new Date(formData.due_date).toISOString()
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          Swal.fire({
            title: 'Sessão Expirada',
            text: 'Por favor, faça login novamente para continuar',
            icon: 'error',
            background: '#1f2937',
            color: '#fff',
          });
          router.push('/login');
          return;
        }
        throw new Error(responseData.message || 'Falha ao criar pagamento');
      }

      await Swal.fire({
        title: 'Sucesso!',
        text: 'Pagamento foi criado com sucesso.',
        icon: 'success',
        background: '#1f2937',
        color: '#fff',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true
      });

      // Clear form
      setFormData({
        customerId: '',
        amount: '',
        due_date: '',
        paymentMethod: 'credit_card',
        status: 'unpaid'
      });

      // Redirect after success
      setTimeout(() => {
        router.push('/payments');
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      Swal.fire({
        title: 'Erro!',
        text: error instanceof Error ? error.message : 'Falha ao criar pagamento',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientWrapper>
      <div className="flex-1 p-8 ml-64">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Registrar Novo Pagamento</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-300 mb-2">
                  Cliente
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 text-white border-gray-600 rounded-md px-3 py-2"
                >
                  <option value="">Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                  Valor
                </label>
                <Input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full bg-gray-700 text-white border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Vencimento
                </label>
                <Input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 text-white border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 text-white border-gray-600 rounded-md px-3 py-2"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 text-white border-gray-600 rounded-md px-3 py-2"
                >
                  <option value="unpaid">Não Pago</option>
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={() => router.push('/payments')}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Criando...' : 'Criar Pagamento'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ClientWrapper>
  );
} 