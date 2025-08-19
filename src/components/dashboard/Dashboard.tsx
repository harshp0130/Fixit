import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { Link } from 'react-router-dom';
import { Plus, Ticket, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { tickets, getUserTickets } = useTickets();
  
  const userTickets = user ? getUserTickets(user.id) : [];
  
  const getTicketStats = () => {
    const pending = userTickets.filter(t => t.status === 'pending').length;
    const inProgress = userTickets.filter(t => t.status === 'in-progress').length;
    const resolved = userTickets.filter(t => t.status === 'resolved').length;
    
    return { pending, inProgress, resolved, total: userTickets.length };
  };

  const stats = getTicketStats();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-8 py-12 text-white">
          <h1 className="text-4xl font-bold mb-3">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-blue-100 text-xl font-medium">
            {user?.role === 'super_admin'
              ? 'Master Admin - Full system access and control'
              : user?.role === 'sub_admin'
              ? `Sub Admin - Manage ${user?.department} department tickets`
              : 'Track your submitted tickets and create new support requests'
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    Total Tickets
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    Pending
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.pending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    In Progress
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.inProgress}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    Resolved
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.resolved}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user?.role !== 'admin' && (
              <Link to="/tickets/new">
                <div className="relative group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-blue-100">
                  <div>
                    <span className="rounded-2xl inline-flex p-4 bg-blue-500 text-white ring-4 ring-blue-100 shadow-lg">
                      <Plus className="h-8 w-8" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      <span className="absolute inset-0" />
                      Submit New Ticket
                    </h3>
                    <p className="mt-3 text-gray-600 leading-relaxed">
                      Create a new support request for any issues you're experiencing.
                    </p>
                  </div>
                </div>
              </Link>
            )}
            
            <Link to="/tickets">
              <div className="relative group bg-gradient-to-br from-emerald-50 to-green-50 p-8 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-emerald-100">
                <div>
                  <span className="rounded-2xl inline-flex p-4 bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-lg">
                    <Ticket className="h-8 w-8" />
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    <span className="absolute inset-0" />
                    {(user?.role === 'sub_admin' || user?.role === 'super_admin') ? 'Manage Tickets' : 'View My Tickets'}
                  </h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    {user?.role === 'super_admin' ? 'Manage all tickets across all departments.' : user?.role === 'sub_admin' ? 'Manage and track your department tickets.' : 'Check the status and history of your submitted tickets.'}
                  </p>
                </div>
              </div>
            </Link>

            {(user?.role === 'sub_admin' || user?.role === 'super_admin') && (
              <Link to="/admin/tickets">
                <div className="relative group bg-gradient-to-br from-purple-50 to-indigo-50 p-8 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-purple-100">
                  <div>
                    <span className="rounded-2xl inline-flex p-4 bg-purple-500 text-white ring-4 ring-purple-100 shadow-lg">
                      <AlertTriangle className="h-8 w-8" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      <span className="absolute inset-0" />
                      {user?.role === 'super_admin' ? 'Master Control Panel' : `${user?.department} Department`}
                    </h3>
                    <p className="mt-3 text-gray-600 leading-relaxed">
                      {user?.role === 'super_admin' ? 'Full system access - manage all departments and admins.' : `Manage tickets and operations for ${user?.department} department only.`}
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Recent Tickets</h3>
            <Link to="/tickets">
              <Button variant="secondary" size="sm">View All</Button>
            </Link>
          </div>
        </div>
        <div className="px-6 py-4">
          {userTickets.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Ticket className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
              <p className="text-gray-500 mb-4">
                {(user?.role === 'sub_admin' || user?.role === 'super_admin')
                  ? 'No tickets have been submitted yet.'
                  : 'Get started by creating your first ticket.'
                }
              </p>
              {user?.role !== 'sub_admin' && user?.role !== 'super_admin' && (
                <div className="mt-6">
                  <Link to="/tickets/new">
                    <Button className="hover:scale-105 transition-transform">
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {userTickets.slice(0, 5).map((ticket) => (
                  <li key={ticket.id} className="py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 rounded-xl px-4 -mx-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-base font-semibold text-gray-900 truncate">
                            {ticket.title}
                          </p>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <span className="font-mono">#{ticket.id}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(ticket.submissionDate)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Link to={`/tickets/${ticket.id}`}>
                          <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};