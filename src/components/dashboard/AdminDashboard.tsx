import React from 'react';
import { useTickets } from '../../contexts/TicketContext';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Eye,
  ArrowUpRight,
  BarChart,
  Shield
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const AdminDashboard: React.FC = () => {
  const { tickets } = useTickets();
  
  const getOverallStats = () => {
    const pending = tickets.filter(t => t.status === 'pending').length;
    const inProgress = tickets.filter(t => t.status === 'in-progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const highPriority = tickets.filter(t => t.priority === 'high').length;
    
    return { pending, inProgress, resolved, total: tickets.length, highPriority };
  };

  const getCategoryStats = () => {
    const departmentCount: { [key: string]: number } = {};
    tickets.forEach(ticket => {
      departmentCount[ticket.department] = (departmentCount[ticket.department] || 0) + 1;
    });
    return Object.entries(departmentCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getRecentTickets = () => {
    return tickets
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
      .slice(0, 6);
  };

  const stats = getOverallStats();
  const departmentStats = getCategoryStats();
  const recentTickets = getRecentTickets();

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
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-8 py-12 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-indigo-100 text-lg font-medium">
                System Overview & Management
              </p>
            </div>
          </div>
          <p className="text-indigo-100 text-lg opacity-90">
            Manage and oversee all support tickets across the system
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
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

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
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

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
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

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
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

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    High Priority
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.highPriority}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Recent Tickets</h3>
              <Link to="/admin/tickets">
                <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform">View All</Button>
              </Link>
            </div>
          </div>
          <div className="px-6 py-4">
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold text-gray-900">No tickets yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No tickets have been submitted yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.title}
                        </p>
                        <Badge variant={getStatusColor(ticket.status)} >
                          {ticket.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span>#{ticket.id}</span>
                        <span className="mx-2">•</span>
                        <span>{ticket.submittedBy.name}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(ticket.submissionDate)}</span>
                      </div>
                    </div>
                    <Link to={`/tickets/${ticket.id}`}>
                      <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-bold text-gray-900">Top Departments</h3>
          </div>
          <div className="px-6 py-4">
            {departmentStats.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold text-gray-900">No data yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Department statistics will appear once tickets are submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {departmentStats.map(([department, count]) => (
                  <div key={department} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Ticket className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">{department}</p>
                        <p className="text-sm text-gray-600">{count} tickets</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-blue-500 rounded-full px-3 py-1 shadow-lg">
                        <span className="text-sm font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/admin/tickets">
              <div className="relative group bg-gradient-to-br from-purple-50 to-indigo-50 p-8 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-purple-100">
                <div>
                  <span className="rounded-2xl inline-flex p-4 bg-purple-500 text-white ring-4 ring-purple-100 shadow-lg">
                    <Ticket className="h-8 w-8" />
                  </span>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      Manage All Tickets
                    </h3>
                    <ArrowUpRight className="h-5 w-5 text-purple-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    View, filter, and update all tickets in the system with advanced management tools.
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/admin/users">
              <div className="relative group bg-gradient-to-br from-emerald-50 to-green-50 p-8 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-emerald-100">
                <div>
                  <span className="rounded-2xl inline-flex p-4 bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-lg">
                    <Users className="h-8 w-8" />
                  </span>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      <span className="absolute inset-0" />
                      User Management
                    </h3>
                    <ArrowUpRight className="h-5 w-5 text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    Manage user accounts, permissions, and access controls across the platform.
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/admin/analytics">
              <div className="relative group bg-gradient-to-br from-blue-50 to-cyan-50 p-8 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-blue-100">
                <div>
                  <span className="rounded-2xl inline-flex p-4 bg-blue-500 text-white ring-4 ring-blue-100 shadow-lg">
                    <BarChart className="h-8 w-8" />
                  </span>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      Analytics & Reports
                    </h3>
                    <ArrowUpRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    Generate detailed reports and analytics with comprehensive insights.
                  </p>
                  <span className="absolute inset-0" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};