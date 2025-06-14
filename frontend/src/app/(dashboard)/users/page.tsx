'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setTotalItems(data.length);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja excluir o usuário "${userName}"?`,
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
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${Cookies.get('token')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete user');
        }

        await Swal.fire({
          title: 'Excluído!',
          text: 'Usuário foi excluído com sucesso.',
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true
        });

        // Refresh the users list
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        Swal.fire({
          title: 'Erro!',
          text: error instanceof Error ? error.message : 'Falha ao excluir usuário',
          icon: 'error',
          background: '#1f2937',
          color: '#fff',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <Button
            onClick={() => router.push('/users/register')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Novo Usuário
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        onClick={() => router.push(`/users/${user.id}/edit`)}
                        className="text-blue-400 hover:text-blue-300 mr-4"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDelete(String(user.id), user.name)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-gray-300">
            {users.length > 0 ? (
              <>Mostrando {((page - 1) * pageSize) + 1} até {Math.min(page * pageSize, totalItems)} de {totalItems} usuários</>
            ) : (
              <>Nenhum usuário encontrado</>
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
      </div>
    </div>
  );
} 