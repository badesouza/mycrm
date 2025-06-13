import { Users, DollarSign, CreditCard } from 'lucide-react';

const stats = [
  {
    name: 'Total Customers',
    value: '0',
    icon: Users,
    change: '+0%',
  },
  {
    name: 'Total Payments',
    value: '$0',
    icon: DollarSign,
    change: '+0%',
  },
  {
    name: 'Pending Payments',
    value: '0',
    icon: CreditCard,
    change: '0%',
  },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="rounded-lg bg-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-400">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-gray-800 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-400">No recent activity to display.</p>
      </div>
    </div>
  );
} 