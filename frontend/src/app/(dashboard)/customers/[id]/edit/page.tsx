'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Swal from 'sweetalert2';
import ClientWrapper from '@/components/ClientWrapper';
import { use } from 'react';
import Image from 'next/image';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  manager: string;
  due_date: string;
  amount: number;
  status: string;
  paymentMethod: string;
  imageLogo: string | null;
}

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  useEffect(() => {
    if (customer?.imageLogo) {
      setImagePreview(customer.imageLogo.startsWith('http') 
        ? customer.imageLogo 
        : `http://localhost:3001/uploads/${customer.imageLogo.replace(/^\/|\//, '')}`);
    }
  }, [customer]);

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:3001/api/customers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load customer data',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Error!',
        text: 'Image size should be less than 5MB',
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

    // Upload image
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`http://localhost:3001/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      const data = await response.json();
      
      if (customer) {
        // Update customer with new image
        setCustomer({
          ...customer,
          imageLogo: data.filename
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to upload image',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Ensure imageLogo is included in the update
      const updateData = {
        ...customer,
        imageLogo: customer.imageLogo || null
      };

      const response = await fetch(`http://localhost:3001/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      await Swal.fire({
        title: 'Success!',
        text: 'Customer updated successfully',
        icon: 'success',
        background: '#1f2937',
        color: '#fff',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true
      });

      router.push('/customers');
    } catch (error) {
      console.error('Error updating customer:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update customer',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
    }
  };

  if (loading) {
    return (
      <ClientWrapper>
        <div className="flex-1 p-8 ml-64">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </ClientWrapper>
    );
  }

  if (!customer) {
    return (
      <ClientWrapper>
        <div className="flex-1 p-8 ml-64">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-white">Customer not found</div>
          </div>
        </div>
      </ClientWrapper>
    );
  }

  return (
    <ClientWrapper>
      <div className="flex-1 p-8 ml-64">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Editar Cliente</h1>
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
                        alt="Logo preview"
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
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Escolher Logo
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone
                </label>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                Cidade
                </label>
                <input
                  type="text"
                  value={customer.district}
                  onChange={(e) => setCustomer({ ...customer, district: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                Responsável
                </label>
                <input
                  type="text"
                  value={customer.manager}
                  onChange={(e) => setCustomer({ ...customer, manager: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Vencimento
                </label>
                <input
                  type="date"
                  value={new Date(customer.due_date).toISOString().split('T')[0]}
                  onChange={(e) => setCustomer({ ...customer, due_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customer.amount}
                  onChange={(e) => setCustomer({ ...customer, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                Método de Pagamento
                </label>
                <select
                  value={customer.paymentMethod}
                  onChange={(e) => setCustomer({ ...customer, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={customer.status}
                  onChange={(e) => setCustomer({ ...customer, status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ClientWrapper>
  );
} 