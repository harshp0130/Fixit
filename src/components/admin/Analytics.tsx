import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  Users,
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Zap
} from 'lucide-react';
import { useTickets } from '../../contexts/TicketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';

export const Analytics: React.FC = () => {
  const { tickets, getDepartmentTickets } = useTickets();
  const { user } = useAuth();

  // Filter tickets based on user role
  const relevantTickets = useMemo(() => {
    if (user?.role === 'super_admin') {
      // Super Admin sees all tickets
      return tickets;
    } else if (user?.role === 'sub_admin' && user?.department) {
      // Sub Admin sees only their department tickets
      return getDepartmentTickets(user.department);
    }
    return [];
  }, [tickets, user, getDepartmentTickets]);

  const analytics = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Basic stats
    const totalTickets = relevantTickets.length;
    const pendingTickets = relevantTickets.filter(t => t.status === 'pending').length;
    const inProgressTickets = relevantTickets.filter(t => t.status === 'in-progress').length;
    const resolvedTickets = relevantTickets.filter(t => t.status === 'resolved').length;
    const highPriorityTickets = relevantTickets.filter(t => t.priority === 'high').length;

    // Time-based analytics
    const thisWeekTickets = relevantTickets.filter(t => new Date(t.submissionDate) >= lastWeek).length;
    const thisMonthTickets = relevantTickets.filter(t => new Date(t.submissionDate) >= lastMonth).length;
    
    // Resolution rate
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
    
    // Average resolution time (mock calculation)
    const avgResolutionTime = resolvedTickets > 0 ? Math.round(Math.random() * 5 + 1) : 0;

    // Category breakdown
    const departmentStats = relevantTickets.reduce((acc, ticket) => {
      acc[ticket.department] = (acc[ticket.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Priority breakdown
    const priorityStats = {
      high: relevantTickets.filter(t => t.priority === 'high').length,
      medium: relevantTickets.filter(t => t.priority === 'medium').length,
      low: relevantTickets.filter(t => t.priority === 'low').length
    };

    // Status breakdown
    const statusStats = {
      pending: pendingTickets,
      'in-progress': inProgressTickets,
      resolved: resolvedTickets
    };

    // User activity (mock data based on tickets)
    const userActivity = relevantTickets.reduce((acc, ticket) => {
      const userId = ticket.submittedBy.id;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => {
        const ticket = relevantTickets.find(t => t.submittedBy.id === userId);
        return {
          name: ticket?.submittedBy.name || 'Unknown',
          email: ticket?.submittedBy.email || '',
          ticketCount: count
        };
      });

    // Daily ticket trends (last 7 days)
    const dailyTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayTickets = relevantTickets.filter(t => {
        const ticketDate = new Date(t.submissionDate);
        return ticketDate.toDateString() === date.toDateString();
      }).length;
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        tickets: dayTickets
      };
    }).reverse();

    return {
      totalTickets,
      pendingTickets,
      inProgressTickets,
      resolvedTickets,
      highPriorityTickets,
      thisWeekTickets,
      thisMonthTickets,
      resolutionRate,
      avgResolutionTime,
      departmentStats,
      priorityStats,
      statusStats,
      topUsers,
      dailyTrends
    };
  }, [relevantTickets]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    color: string;
  }> = ({ title, value, icon, trend, color }) => (
    <div className={`bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 ${color} rounded-xl`}>
              {icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="ml-1 text-sm font-semibold">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-8 py-12 text-white">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <BarChart3 className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {user?.role === 'super_admin' ? 'System Analytics & Reports' : `${user?.department} Analytics`}
              </h1>
              <p className="text-purple-100 text-lg font-medium">
                {user?.role === 'super_admin' 
                  ? 'Comprehensive system-wide insights and performance metrics'
                  : `Department-specific insights and performance metrics for ${user?.department}`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets"
          value={analytics.totalTickets}
          icon={<Ticket className="h-6 w-6 text-blue-600" />}
          trend={12}
          color="bg-blue-50"
        />
        <StatCard
          title="Resolution Rate"
          value={`${analytics.resolutionRate}%`}
          icon={<Target className="h-6 w-6 text-green-600" />}
          trend={8}
          color="bg-green-50"
        />
        <StatCard
          title="Avg Resolution Time"
          value={`${analytics.avgResolutionTime} days`}
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          trend={-5}
          color="bg-amber-50"
        />
        <StatCard
          title="High Priority"
          value={analytics.highPriorityTickets}
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          trend={-15}
          color="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-bold text-gray-900">Status Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(analytics.statusStats).map(([status, count]) => {
                const percentage = analytics.totalTickets > 0 ? Math.round((count / analytics.totalTickets) * 100) : 0;
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'resolved': return 'bg-green-500';
                    case 'in-progress': return 'bg-blue-500';
                    case 'pending': return 'bg-amber-500';
                    default: return 'bg-gray-500';
                  }
                };
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`}></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(status)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-10">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-bold text-gray-900">Priority Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(analytics.priorityStats).map(([priority, count]) => {
                const percentage = analytics.totalTickets > 0 ? Math.round((count / analytics.totalTickets) * 100) : 0;
                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case 'high': return 'bg-red-500';
                    case 'medium': return 'bg-amber-500';
                    case 'low': return 'bg-green-500';
                    default: return 'bg-gray-500';
                  }
                };
                
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getPriorityColor(priority)}`}></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-10">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Departments */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-bold text-gray-900">Top Departments</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(analytics.departmentStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([department, count]) => (
                  <div key={department} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Ticket className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{department}</span>
                    </div>
                    <Badge variant="default">{count}</Badge>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-bold text-gray-900">Most Active Users</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.topUsers.map((user, index) => (
                <div key={user.email} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="success">{user.ticketCount}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Trends */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900">Daily Ticket Trends (Last 7 Days)</h3>
        </div>
        <div className="p-6">
          <div className="flex items-end justify-between space-x-2 h-40">
            {analytics.dailyTrends.map((day, index) => {
              const maxTickets = Math.max(...analytics.dailyTrends.map(d => d.tickets));
              const height = maxTickets > 0 ? (day.tickets / maxTickets) * 100 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                  <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '120px' }}>
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg absolute bottom-0 w-full transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                      {day.tickets}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900">Performance Insights</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="mx-auto w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Quick Response</h4>
              <p className="text-sm text-gray-600">
                {analytics.thisWeekTickets} tickets submitted this week
              </p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="mx-auto w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Active Resolution</h4>
              <p className="text-sm text-gray-600">
                {analytics.inProgressTickets} tickets currently in progress
              </p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
              <div className="mx-auto w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Success Rate</h4>
              <p className="text-sm text-gray-600">
                {analytics.resolutionRate}% of tickets successfully resolved
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};