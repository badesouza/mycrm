'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import Swal from 'sweetalert2';
import ClientWrapper from '@/components/ClientWrapper';
import { useDebounce } from '@/lib/useDebounce';
import { toast } from '@/components/ui/use-toast';
import { MessageSquare } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  manager: string;
  due_date: string;
  amount: number;
  paymentMethod: string;
  status: string;
  imageLogo: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line
  }, [debouncedSearch, page, pageSize]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? token.substring(0, 10) + '...' : 'No token found');

      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: debouncedSearch.toLowerCase().trim(),
      });

      console.log('Fetching customers with params:', params.toString());
      const response = await fetch(`http://localhost:3001/api/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Customers response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch customers');
      }

      const data = await response.json();
      console.log('Customers data:', {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        customersCount: data.data.length
      });

      setCustomers(data.data);
      setTotalPages(Math.ceil(data.total / data.pageSize));
      setTotalItems(data.total);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao buscar clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

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

        const response = await fetch(`http://localhost:3001/api/customers/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete customer');
        }

        await Swal.fire({
          title: 'Excluído!',
          text: 'Cliente foi excluído com sucesso.',
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
        });

        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        Swal.fire({
          title: 'Erro!',
          text: 'Falha ao excluir cliente',
          icon: 'error',
          background: '#1f2937',
          color: '#fff',
        });
      }
    }
  };

  const handleWhatsAppClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsWhatsAppOpen(true);
  };

  const handleSendWhatsApp = async () => {
    if (!selectedCustomer?.phone || !message.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite uma mensagem',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Format phone number: remove all non-numeric characters and ensure it has country code
      const formattedPhone = selectedCustomer.phone
        .replace(/\D/g, '') // Remove all non-numeric characters
        .replace(/^(\d{2})9(\d{8})$/, '$1$2') // Remove the 9 after DDD
        + '@c.us'; // Add WhatsApp API suffix

      console.log('Original phone:', selectedCustomer.phone);
      console.log('Formatted phone:', formattedPhone);

      // Check WhatsApp connection status first
      const statusResponse = await fetch('http://localhost:3001/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        console.error('WhatsApp status error:', errorData);
        throw new Error(errorData.message || 'Failed to check WhatsApp status');
      }

      const statusData = await statusResponse.json();
      console.log('WhatsApp status:', statusData);

      if (!statusData.connected) {
        let errorMessage = 'WhatsApp não está conectado.';
        if (statusData.details) {
          if (!statusData.details.isInitialized) {
            errorMessage += ' O serviço não foi inicializado.';
          } else if (!statusData.details.isConnected) {
            errorMessage += ' Aguardando conexão.';
          } else if (!statusData.details.hasClient) {
            errorMessage += ' Cliente não disponível.';
          }
        }
        toast({
          title: 'Erro',
          description: errorMessage + ' Por favor, conecte o WhatsApp primeiro.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Sending WhatsApp message:', {
        url: 'http://localhost:3001/api/whatsapp/send',
        phone: formattedPhone,
        message: message.trim(),
        token: token.substring(0, 10) + '...',
      });

      const response = await fetch('http://localhost:3001/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: formattedPhone,
          message: message.trim(),
        }),
      });

      console.log('WhatsApp response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('WhatsApp error response:', errorData);
        throw new Error(errorData.message || 'Failed to send WhatsApp message');
      }

      const data = await response.json();
      console.log('WhatsApp success response:', data);

      toast({
        title: 'Sucesso',
        description: 'Mensagem enviada com sucesso!',
      });

      setIsWhatsAppOpen(false);
      setMessage('');
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao enviar mensagem',
        variant: 'destructive',
      });
    }
  };

  return (
    <ClientWrapper>
      <div className="flex-1 p-8 ml-64">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold text-white">Clientes</h1>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={search}
                onChange={e => { 
                  setSearch(e.target.value); 
                  setPage(1); 
                }}
                className="rounded-md px-3 py-2 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minWidth: 220 }}
              />
              <Button
                onClick={() => router.push('/customers/register')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Adicionar Novo Cliente
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-white">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span>Carregando...</span>
              </div>
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center h-40 text-white">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span>Buscando...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Logo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Localização
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                          Carregando...
                        </td>
                      </tr>
                    ) : customers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                          Nenhum cliente encontrado
                        </td>
                      </tr>
                    ) : (
                      customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {customer.imageLogo ? (
                              <img
                                src={customer.imageLogo.startsWith('http') ? customer.imageLogo : `http://localhost:3001/uploads/${customer.imageLogo.replace(/^\/|\//, '')}`}
                                alt={customer.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-600 bg-gray-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 border border-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {customer.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="font-medium">{customer.manager}</div>
                            <div>{customer.email}</div>
                            <div className="text-gray-400">{customer.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div>{customer.district}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div>{new Date(customer.due_date).toLocaleDateString('pt-BR')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div>{customer.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}</div>
                            <div className="text-gray-400">
                              {customer.paymentMethod === 'credit_card' && 'Cartão de Crédito'}
                              {customer.paymentMethod === 'bank_transfer' && 'Transferência Bancária'}
                              {customer.paymentMethod === 'cash' && 'Dinheiro'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWhatsAppClick(customer)}
                                className="text-green-500 hover:text-green-400"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                WhatsApp
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/customers/edit/${customer.id}`)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(customer.id)}
                                className="text-red-500 hover:text-red-400"
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 gap-4">
                <div className="text-gray-400 text-sm">
                  Mostrando {customers.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalItems)} de {totalItems} clientes
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-gray-300">Página {page} de {totalPages || 1}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    Próximo
                  </button>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="px-2 py-1 rounded bg-gray-700 text-gray-300"
                  >
                    <option value="10">10 por página</option>
                    <option value="20">20 por página</option>
                    <option value="50">50 por página</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Enviar mensagem WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Enviando para: {selectedCustomer?.name} ({selectedCustomer?.phone})
              </p>
              <Textarea
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWhatsAppOpen(false);
                setMessage('');
                setSelectedCustomer(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSendWhatsApp}>
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClientWrapper>
  );
} 