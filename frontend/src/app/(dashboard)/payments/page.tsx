'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import ClientWrapper from '@/components/ClientWrapper';
import { useDebounce } from '@/lib/useDebounce';
import { toast } from '@/components/ui/use-toast';
import Swal from 'sweetalert2';
import { getPaymentMethodLabel } from '@/types/paymentMethods';
import WhatsAppMessageModal from '@/components/WhatsAppMessageModal';

interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
  paymentDate: string;
  payment_date: string | null;
  due_date: string;
  paymentMethod: string;
  status: string;
  userName: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebounce(search, 400);
  const router = useRouter();
  
  // Estados para o modal WhatsApp
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? token.substring(0, 10) + '...' : 'No token found');

      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: debouncedSearch,
      });

      console.log('Fetching payments with params:', params.toString());
      const response = await fetch(`http://localhost:3001/api/payments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Payments response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch payments');
      }

      const data = await response.json();
      console.log('Payments data:', {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        paymentsCount: data.data.length,
        firstPayment: data.data[0]
      });

      setPayments(data.data);
      setTotalPages(Math.ceil(data.total / data.pageSize));
      setTotalItems(data.total);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao buscar pagamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Você não poderá reverter esta ação!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir!',
      background: '#1f2937',
      color: '#fff',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:3001/api/payments/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete payment');
        }

        await Swal.fire({
          title: 'Excluído!',
          text: 'Pagamento foi excluído com sucesso.',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          background: '#1f2937',
          color: '#fff',
        });

        fetchPayments();
      } catch (error) {
        console.error('Error deleting payment:', error);
        Swal.fire({
          title: 'Erro!',
          text: error instanceof Error ? error.message : 'Falha ao excluir pagamento',
          icon: 'error',
          background: '#1f2937',
          color: '#fff',
        });
      }
    }
  };

  const handleEdit = (id: string) => {
    console.log('handleEdit called with ID:', id);
    if (!id) {
      console.error('No payment ID provided for edit');
      toast({
        title: 'Erro',
        description: 'ID de pagamento inválido',
        variant: 'destructive',
      });
      return;
    }
    console.log('Navigating to edit page for payment ID:', id);
    router.push(`/payments/${id}/edit`);
  };

  const handleWhatsAppMessage = (payment: Payment) => {
    console.log('Opening WhatsApp modal for payment:', payment);
    console.log('Customer phone:', payment.customerPhone);
    console.log('Customer phone type:', typeof payment.customerPhone);
    console.log('Customer phone value:', JSON.stringify(payment.customerPhone));
    setSelectedPayment(payment);
    setWhatsappModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '-';
    }
    
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'Pago';
      case 'unpaid':
        return 'Não Pago';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };


  return (
    <ClientWrapper>
      <div className="flex-1 p-8">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold text-white">Contas a receber</h1>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
              <input
                type="text"
                placeholder="Pesquisar pagamentos..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="rounded-md px-3 py-2 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minWidth: 220 }}
              />
              <Button
                onClick={() => router.push('/payments/register')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Novo Pagamento
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-white">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Data Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Data Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                          Nenhum pagamento encontrado
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => {
                        console.log('Rendering payment:', payment); // Debug log
                        return (
                          <tr key={payment.id} className="hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {payment.customerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {formatDate(payment.due_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {getPaymentMethodLabel(payment.paymentMethod)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                {getStatusLabel(payment.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {payment.userName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                onClick={() => {
                                  console.log('Edit button clicked for payment:', payment);
                                  if (!payment.id) {
                                    console.error('Payment has no ID:', payment);
                                    toast({
                                      title: 'Error',
                                      description: 'Invalid payment data',
                                      variant: 'destructive',
                                    });
                                    return;
                                  }
                                  handleEdit(payment.id);
                                }}
                                className="text-blue-400 hover:text-blue-300 mr-4"
                              >
                                Receber
                              </Button>
                              <Button
                                onClick={() => handleWhatsAppMessage(payment)}
                                className="text-green-400 hover:text-green-300 mr-4"
                              >
                                WhatsApp
                              </Button>
                              <Button
                                onClick={() => handleDelete(payment.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                Excluir
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-gray-300">
                  {payments.length > 0 ? (
                    <>Mostrando {((page - 1) * pageSize) + 1} até {Math.min(page * pageSize, totalItems)} de {totalItems} pagamentos</>
                  ) : (
                    <>Nenhum pagamento encontrado</>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                    className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal WhatsApp */}
      {selectedPayment && (
        <WhatsAppMessageModal
          isOpen={whatsappModalOpen}
          onClose={() => {
            setWhatsappModalOpen(false);
            setSelectedPayment(null);
          }}
          customerName={selectedPayment.customerName}
          customerPhone={selectedPayment.customerPhone || ''}
          paymentId={selectedPayment.id}
          dueDate={selectedPayment.due_date}
          amount={selectedPayment.amount}
        />
      )}
    </ClientWrapper>
  );
} 