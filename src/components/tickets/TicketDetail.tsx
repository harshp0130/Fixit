import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { useTickets } from '../../contexts/TicketContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTicketById } = useTickets();
  
  const ticket = getTicketById(id!);

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket not found</h3>
        <p className="text-gray-500 mb-4">The ticket you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/tickets')}>Go Back</Button>
      </div>
    );
  }

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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/tickets')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {ticket.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="font-medium">#{ticket.id}</span>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(ticket.submissionDate)}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {ticket.submittedBy.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(ticket.status)}>
                  {ticket.status.replace('-', ' ').toUpperCase()}
                </Badge>
                <Badge variant={getPriorityColor(ticket.priority)}>
                  {ticket.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Institute</h3>
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-900">{ticket.institute}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-900">{ticket.location}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Room Number</h3>
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-900">{ticket.roomNumber}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-900">{ticket.department}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted by</h3>
                <div className="text-sm text-gray-900">
                  <div>{ticket.submittedBy.name}</div>
                  <div className="text-gray-500">{ticket.submittedBy.email}</div>
                </div>
              </div>
            </div>
            
            {ticket.imageUrl && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Attached Image</h3>
                <img
                  src={ticket.imageUrl}
                  alt="Ticket attachment"
                  className="max-w-md h-auto rounded-lg shadow-md border border-gray-200"
                />
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
        </div>
        <div className="px-6 py-4">
          <div className="flow-root">
            <ul className="-mb-8">
              {ticket.updates.map((update, index) => (
                <li key={update.id}>
                  <div className="relative pb-8">
                    {index !== ticket.updates.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <User className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {update.message}
                            {update.status && (
                              <span className="ml-2">
                                <Badge variant={getStatusColor(update.status)}>
                                  {update.status.replace('-', ' ').toUpperCase()}
                                </Badge>
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            by {update.updatedBy.name}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {formatDate(update.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};