'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, DollarSign, LogOut, UserCog } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: Home,
  },
  {
    title: 'Customers',
    path: '/customers',
    icon: Users,
  },
  {
    title: 'Payments',
    path: '/payments',
    icon: DollarSign,
  },
  {
    title: 'Users',
    path: '/users',
    icon: UserCog,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!',
      background: '#1f2937',
      color: '#fff',
    });

    if (result.isConfirmed) {
      // Remove token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show success message
      await Swal.fire({
        title: 'Logged out!',
        text: 'You have been successfully logged out.',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: '#1f2937',
        color: '#fff',
      });

      // Redirect to login page
      router.push('/login');
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gray-800 p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Modern CRM</h1>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.title}
              href={item.path}
              className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <button
          className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
} 