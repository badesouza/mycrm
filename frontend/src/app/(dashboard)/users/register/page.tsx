'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

export default function RegisterUserPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const nameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        title: 'Erro!',
        text: 'As senhas não coincidem',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

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
        throw new Error(data.message || 'Falha ao criar usuário');
      }

      await Swal.fire({
        title: 'Sucesso!',
        text: 'Usuário foi criado com sucesso.',
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
        password: '',
        confirmPassword: ''
      });

      // Focus on name input for next entry
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      Swal.fire({
        title: 'Erro!',
        text: error instanceof Error ? error.message : 'Falha ao criar usuário',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Cadastrar Novo Usuário</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Senha
            </label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={() => router.push('/users')}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 