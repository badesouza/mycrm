'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home as HomeIcon, Users, DollarSign, LogOut, UserCog, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'Home',
    path: '/home',
    icon: HomeIcon,
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clientes',
    path: '/customers',
    icon: Users,
  },
  {
    title: 'Contas a receber',
    path: '/payments',
    icon: DollarSign,
  },
  {
    title: 'Usuários',
    path: '/users',
    icon: UserCog,
  },
  {
    title: 'WhatsApp',
    path: '/whatsapp',
    icon: MessageSquare,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Você será desconectado da sua conta",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, sair!',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#fff',
    });

    if (result.isConfirmed) {
      // Remove token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show success message
      await Swal.fire({
        title: 'Desconectado!',
        text: 'Você foi desconectado com sucesso.',
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

  useEffect(() => {
    // Sidebar always collapsed; expose fixed width for layout
    document.documentElement.style.setProperty('--sidebar-width', '5rem');
  }, []);

  return (
    <div className={cn('fixed left-0 top-0 h-screen bg-gray-800 transition-all duration-300 w-20 p-3')}>
      <div className="mb-6 flex items-center justify-center">
        <div className="text-white font-bold text-lg">G</div>
      </div>

      <nav className={cn('space-y-2')}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.title}
              href={item.path}
              className={cn(
                'flex rounded-lg text-sm font-medium transition-colors h-16 w-full items-center justify-center flex-col gap-y-1',
                isActive 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
              title={item.title}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn('text-[11px] leading-tight text-center break-words')}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={cn('absolute bottom-4 right-0 left-0 px-2')}>
        <button
          className={cn('flex w-full items-center rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white h-10 justify-center gap-x-2')}
          onClick={handleLogout}
          title={'Sair'}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[11px] leading-tight">Sair</span>
        </button>
      </div>
    </div>
  );
} 