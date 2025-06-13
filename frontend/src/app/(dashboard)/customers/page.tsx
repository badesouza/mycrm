'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import ClientWrapper from '@/components/ClientWrapper';
import { useDebounce } from '@/lib/useDebounce';

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
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 400);
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line
  }, [debouncedSearch, page, pageSize]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: String(page),
        pageSize: String(pageSize),
      });
      const response = await fetch(`http://localhost:3001/api/customers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const { data, total } = await response.json();
      setCustomers(data);
      setTotal(total);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load customers',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      background: '#1f2937',
      color: '#fff',
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get('token');
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
          title: 'Deleted!',
          text: 'Customer has been deleted.',
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
        });

        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete customer',
          icon: 'error',
          background: '#1f2937',
          color: '#fff',
        });
      }
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <ClientWrapper>
      <div className="flex-1 p-8 ml-64">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="rounded-md px-3 py-2 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minWidth: 220 }}
              />
              <Button
                onClick={() => router.push('/customers/register')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add New Customer
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
                        Logo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {customers.map((customer) => (
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
                          <div>{customer.amount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}</div>
                          <div className="text-gray-400">
                            {customer.paymentMethod === 'credit_card' && 'Credit Card'}
                            {customer.paymentMethod === 'bank_transfer' && 'Bank Transfer'}
                            {customer.paymentMethod === 'cash' && 'Cash'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            onClick={() => router.push(`/customers/${customer.id}/edit`)}
                            className="text-blue-400 hover:text-blue-300 mr-4"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 gap-4">
                <div className="text-gray-400 text-sm">
                  Showing {customers.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, total)} of {total} customers
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-gray-300">Page {page} of {totalPages || 1}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    Next
                  </button>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="ml-2 rounded bg-gray-700 text-gray-300 border border-gray-600 px-2 py-1"
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size} / page</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ClientWrapper>
  );
} 