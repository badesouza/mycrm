import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NewPaymentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Payment</h1>
      </div>

      <div className="rounded-lg bg-gray-800 p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="customer" className="text-sm font-medium text-gray-300">
                Customer
              </label>
              <select
                id="customer"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select customer</option>
                {/* Customer options will be populated dynamically */}
              </select>
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
              <label htmlFor="interest" className="text-sm font-medium text-gray-300">
                Interest
              </label>
              <input
                type="number"
                id="interest"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter interest"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-gray-300">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/payments">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Create Payment</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 