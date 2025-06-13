import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Customer</h1>
      </div>

      <div className="rounded-lg bg-gray-800 p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter customer email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-300">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="district" className="text-sm font-medium text-gray-300">
                District
              </label>
              <input
                type="text"
                id="district"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter district"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="manager" className="text-sm font-medium text-gray-300">
                Manager
              </label>
              <input
                type="text"
                id="manager"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter manager name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="due_date" className="text-sm font-medium text-gray-300">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-gray-300">
                Amount
              </label>
              <input
                type="number"
                id="amount"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="payment_method" className="text-sm font-medium text-gray-300">
                Payment Method
              </label>
              <select
                id="payment_method"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select payment method</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/customers">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Create Customer</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 