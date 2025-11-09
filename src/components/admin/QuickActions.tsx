import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BarChart3, Ticket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Manage All Tickets',
      description: 'View, filter, and update all tickets in the system with advanced management tools.',
      icon: Ticket,
      path: '/admin/tickets',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      hoverBg: 'hover:bg-purple-100'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts, permissions, and access controls across the platform.',
      icon: Users,
      path: '/admin/users',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      hoverBg: 'hover:bg-emerald-100',
      showFor: ['super_admin'] // Only show for super admin
    },
    {
      title: 'Analytics & Reports',
      description: 'Generate detailed reports and analytics with comprehensive insights.',
      icon: BarChart3,
      path: '/admin/analytics',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      hoverBg: 'hover:bg-blue-100'
    }
  ];

  const filteredActions = quickActions.filter(action => 
    !action.showFor || action.showFor.includes(user?.role || '')
  );

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredActions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className={`p-6 rounded-2xl shadow-lg border border-gray-100 ${action.bgColor} ${action.hoverBg} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group text-left`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${action.bgColor}`}>
                <action.icon className={`h-6 w-6 ${action.iconColor}`} />
              </div>
              <svg
                className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
            <p className="text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
};