'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import Swal from 'sweetalert2';

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
}

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    email: '',
    phone: '',
    district: '',
    manager: '',
    due_date: '',
    amount: 0,
    paymentMethod: 'credit_card'
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch customer');
        }
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error('Error fetching customer:', error);
        Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível carregar os dados do cliente.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };

    fetchCustomer();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    setFormData(prev => ({
      ...prev,
      phone: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      Swal.fire({
        title: 'Sucesso!',
        text: 'Cliente atualizado com sucesso.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        router.push('/customers');
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      Swal.fire({
        title: 'Erro!',
        text: 'Não foi possível atualizar o cliente.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
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
            Bairro
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
            Gerente
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
            step="0.01"
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
            <option value="credit_card">Cartão de Crédito</option>
            <option value="bank_transfer">Transferência Bancária</option>
            <option value="cash">Dinheiro</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/customers')}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
} 