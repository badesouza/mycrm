'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Swal from 'sweetalert2';
import Image from 'next/image';
import ClientWrapper from '@/components/ClientWrapper';

export default function RegisterCustomerPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    manager: '',
    due_date: '',
    amount: '',
    paymentMethod: 'credit_card',
    imageLogo: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numbers = value.replace(/\D/g, '');
    
    let formattedNumber = '';
    if (numbers.length > 0) {
      formattedNumber = `(${numbers.slice(0, 2)}`;
      if (numbers.length > 2) {
        formattedNumber += `) ${numbers.slice(2, 7)}`;
        if (numbers.length > 7) {
          formattedNumber += `-${numbers.slice(7, 11)}`;
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      phone: formattedNumber
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Error!',
        text: 'Please select an image file',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Error!',
        text: 'File size should be less than 5MB',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Store file in form data
    setFormData(prev => ({
      ...prev,
      imageLogo: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token); // Debug log
      console.log('Token value:', token ? token.substring(0, 10) + '...' : 'No token'); // Debug log
      
      if (!token) {
        Swal.fire({
          title: 'Authentication Error',
          text: 'Please log in again to continue',
          icon: 'error',
          background: '#1f2937',
          color: '#fff',
        });
        router.push('/login');
        return;
      }

      // Create FormData for multipart/form-data
      const submitData = new FormData();
      
      // Format due_date to ISO string
      const formattedData = {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      };
      
      // Append all form fields
      Object.entries(formattedData).forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'imageLogo' && value instanceof File) {
            submitData.append(key, value);
          } else if (key !== 'imageLogo') {
            submitData.append(key, String(value));
          }
        }
      });

      // Log the request details
      console.log('Request URL:', 'http://localhost:3001/api/customers');
      console.log('Request method:', 'POST');
      console.log('Request headers:', {
        'Authorization': `Bearer ${token}`
      });
      console.log('Form data:', Object.fromEntries(submitData.entries()));

      const response = await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      const responseData = await response.json();
      console.log('Server response:', responseData); // Debug log

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
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
        throw new Error(responseData.message || 'Falha ao criar cliente');
      }

      await Swal.fire({
        title: 'Sucesso!',
        text: 'Cliente foi criado com sucesso.',
        icon: 'success',
        background: '#1f2937',
        color: '#fff',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        district: '',
        manager: '',
        due_date: '',
        amount: '',
        paymentMethod: 'credit_card',
        imageLogo: null
      });
      setImagePreview(null);

      // Redirect after success
      setTimeout(() => {
        router.push('/customers');
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      Swal.fire({
        title: 'Erro!',
        text: error instanceof Error ? error.message : 'Falha ao criar cliente',
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
            <h1 className="text-2xl font-bold text-white">Cadastrar Novo Cliente</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-700 border border-gray-600">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Visualização do logo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      Escolher Logo
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome
                </label>
                <Input
                  ref={nameInputRef}
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Digite o nome do cliente"
                  className="w-full bg-gray-700 text-white border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Digite o e-mail do cliente"
                  className="w-full bg-gray-700 text-white border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone
                </label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(99) 99999-9999"
                  maxLength={15}
                  required
                  className="w-full bg-gray-700 text-white border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-300 mb-2">
                  Cidade
                </label>
                <Input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  placeholder="Digite o bairro"
                  className="w-full bg-gray-700 text-white border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="manager" className="block text-sm font-medium text-gray-300 mb-2">
                  Responsável
                </label>
                <Input
                  type="text"
                  id="manager"
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                  required
                  placeholder="Digite o nome do gerente"
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
                  step="50.00"
                  min="0"
                  placeholder="Digite o valor"
                  className="w-full bg-gray-700 text-white border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-300 mb-2">
                  Método de Pagamento
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 text-white border-gray-600 rounded-md px-3 py-2"
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={() => router.push('/customers')}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Criando...' : 'Criar Cliente'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ClientWrapper>
  );
} 