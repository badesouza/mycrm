'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
}

interface EditPaymentFormProps {
  paymentId: {
    id: string;
  };
}

export default function EditPaymentForm({ paymentId }: EditPaymentFormProps) {
  const { id } = paymentId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!id) {
      console.error('No payment ID provided to EditPaymentForm');
      toast({
        title: 'Error',
        description: 'Invalid payment ID',
        variant: 'destructive',
      });
      router.push('/payments');
      return;
    }
    console.log('EditPaymentForm received ID:', id);
    fetchPayment();
  }, [id, router]);

  const fetchPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching payment with ID:', id);
      const response = await fetch(`http://localhost:3001/api/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payment');
      }

      const data = await response.json();
      console.log('Fetched payment data:', data);
      setPayment(data);
    } catch (error) {
      console.error('Error fetching payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch payment',
        variant: 'destructive',
      });
      router.push('/payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:3001/api/payments/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: payment.amount,
          due_date: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment');
      }

      toast({
        title: 'Success',
        description: 'Payment updated successfully',
      });

      router.push('/payments');
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 ml-64">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Edit Payment</h1>
          </div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex-1 p-8 ml-64">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Edit Payment</h1>
          </div>
          <div className="text-white">Payment not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Edit Payment</h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-300">
            Customer: <span className="text-white font-semibold">{payment.customerName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <Input
              ref={amountInputRef}
              type="number"
              id="amount"
              step="0.01"
              required
              value={payment.amount}
              onChange={(e) => setPayment({ ...payment, amount: parseFloat(e.target.value) })}
              className="w-full bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-300 mb-2">
              Payment Date
            </label>
            <Input
              type="date"
              id="paymentDate"
              required
              value={payment.paymentDate.split('T')[0]}
              onChange={(e) => setPayment({ ...payment, paymentDate: e.target.value })}
              className="w-full bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-300 mb-2">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              required
              value={payment.paymentMethod}
              onChange={(e) => setPayment({ ...payment, paymentMethod: e.target.value })}
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
              required
              value={payment.status}
              onChange={(e) => setPayment({ ...payment, status: e.target.value })}
              className="w-full bg-gray-700 text-white border-gray-600 rounded-md px-3 py-2"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={() => router.push('/payments')}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 