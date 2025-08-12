import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Plus, List, Settings, X, BarChart3, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    ...(user?.role !== 'sub_admin' && user?.role !== 'super_admin' ? [{ name: 'New Ticket', href: '/tickets/new', icon: Plus }] : []),
    ...(user?.role !== 'sub_admin' && user?.role !== 'super_admin' ? [{ name: 'My Tickets', href: '/tickets', icon: List }] : []),
    ...((user?.role === 'sub_admin' || user?.role === 'super_admin') ? [
      { name: 'Admin Dashboard', href: '/admin/dashboard', icon: BarChart3 },
      { name: 'All Tickets', href: '/admin/tickets', icon: List },
      ...(user?.role === 'super_admin' ? [{ name: 'User Management', href: '/admin/users', icon: Users }] : []),
      { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp }
    ] : []),
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={onClose}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} currentPath={location.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <SidebarContent navigation={navigation} currentPath={location.pathname} />
          </div>
        </div>
      </div>
    </>
  );
};

const SidebarContent: React.FC<{
  navigation: Array<{ name: string; href: string; icon: any }>;
  currentPath: string;
}> = ({ navigation, currentPath }) => {
  return (
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <h1 className="text-xl font-bold text-gray-900">TicketDesk</h1>
      </div>
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
            >
              <item.icon
                className={`${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 flex-shrink-0 h-6 w-6`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};