import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Calendar, User, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const TicketList: React.FC = () => {
  const { user } = useAuth();
  const { getUserTickets } = useTickets();
  
  const userTickets = getUserTickets(user!.id);

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tickets</h1>
          <p className="text-lg text-gray-600">Track and manage your submitted support requests</p>
        </div>
        <Link to="/tickets/new">
          <Button className="hover:scale-105 transition-transform shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Submit New Ticket
          </Button>
        </Link>
      </div>

      {userTickets.length === 0 ? (
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-12">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No tickets yet</h3>
            <p className="text-gray-500 mb-6 text-lg">You haven't submitted any tickets yet.</p>
            <Link to="/tickets/new">
              <Button size="lg" className="hover:scale-105 transition-transform shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Submit Your First Ticket
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-xl overflow-hidden rounded-2xl border border-gray-100">
          <ul className="divide-y divide-gray-200">
            {userTickets.map((ticket) => (
              <li key={ticket.id}>
                <div className="px-6 py-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-blue-600 truncate hover:text-blue-700 transition-colors">
                        {ticket.title}
                      </p>
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <div className="flex items-center mr-4">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {formatDate(ticket.submissionDate)}
                        </div>
                        <span className="mr-2 font-mono font-semibold">#{ticket.id}</span>
                        <Badge variant={getPriorityColor(ticket.priority)} >
                          {ticket.priority.toUpperCase()}
                        </Badge>
                        <span className="mx-2">•</span>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link to={`/tickets/${ticket.id}`}>
                        <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform shadow-md">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-600 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};