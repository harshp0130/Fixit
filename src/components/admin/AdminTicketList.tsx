import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar,
  User,
  Tag,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { useTickets } from '../../contexts/TicketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

export const AdminTicketList: React.FC = () => {
  const { tickets, updateTicketStatus, updateTicketPriority, getDepartmentTickets, getAllTickets } = useTickets();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'pending' | 'in-progress' | 'resolved'>('pending');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [statusMessage, setStatusMessage] = useState('');
  const [priorityMessage, setPriorityMessage] = useState('');

  const filteredAndSortedTickets = useMemo(() => {
    // Filter tickets based on user role
    let availableTickets = tickets;
    if (user?.role === 'sub_admin' && user?.department) {
      // Sub Admin: Only see tickets from their department
      availableTickets = getDepartmentTickets(user.department);
    } else if (user?.role === 'super_admin') {
      // Super Admin: See all tickets across all departments
      availableTickets = getAllTickets();
    }
    
    let filtered = availableTickets.filter(ticket => {
      const matchesSearch = 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.submittedBy.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.department === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    // Sort tickets
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime());
        break;
      case 'priority-desc':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]);
        break;
      case 'status':
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        break;
    }

    return filtered;
  }, [tickets, user, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, getDepartmentTickets]);

  const handleStatusUpdate = () => {
    if (selectedTicket) {
      updateTicketStatus(selectedTicket, newStatus, statusMessage || `Status updated to ${newStatus}`);
      toast.success('Ticket status updated successfully!');
      setIsStatusModalOpen(false);
      setSelectedTicket(null);
      setStatusMessage('');
    }
  };

  const handlePriorityUpdate = () => {
    if (selectedTicket) {
      updateTicketPriority(selectedTicket, newPriority, priorityMessage || `Priority updated to ${newPriority}`);
      toast.success('Ticket priority updated successfully!');
      setIsPriorityModalOpen(false);
      setSelectedTicket(null);
      setPriorityMessage('');
    }
  };

  const openStatusModal = (ticketId: string, currentStatus: string) => {
    setSelectedTicket(ticketId);
    setNewStatus(currentStatus as 'pending' | 'in-progress' | 'resolved');
    setIsStatusModalOpen(true);
  };

  const openPriorityModal = (ticketId: string, currentPriority: string) => {
    setSelectedTicket(ticketId);
    setNewPriority(currentPriority as 'low' | 'medium' | 'high');
    setIsPriorityModalOpen(true);
  };

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(tickets.map(t => t.department))];
    return categories.sort();
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Departments' },
    ...getUniqueCategories().map(cat => ({ value: cat, label: cat }))
  ];

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'priority-desc', label: 'High Priority First' },
    { value: 'status', label: 'By Status' }
  ];

  const newStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const newPriorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {user?.role === 'super_admin' ? 'All System Tickets' : `${user?.department} Tickets`}
            </h1>
            <p className="text-lg text-gray-600">
              {user?.role === 'super_admin' 
                ? 'Master Admin - Full system ticket management and oversight' 
                : `Sub Admin - Manage tickets for ${user?.department} department only`
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {filteredAndSortedTickets.length}
            </div>
            <div className="text-sm text-gray-500">
              {user?.role === 'super_admin' 
                ? `of ${tickets.length} total tickets`
                : `department tickets`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="px-8 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter & Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              options={priorityOptions}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            />
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white shadow-xl overflow-hidden rounded-2xl border border-gray-100">
        {filteredAndSortedTickets.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No tickets found</h3>
            <p className="mt-2 text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {ticket.title}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">#{ticket.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {ticket.submittedBy.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.submittedBy.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{ticket.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(ticket.submissionDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link to={`/tickets/${ticket.id}`}>
                          <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openStatusModal(ticket.id, ticket.status)}
                          className="hover:scale-105 transition-transform"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openPriorityModal(ticket.id, ticket.priority)}
                          className="hover:scale-105 transition-transform"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Priority
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Ticket Status"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="New Status"
            options={newStatusOptions}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as 'pending' | 'in-progress' | 'resolved')}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Update Message (Optional)
            </label>
            <textarea
              rows={3}
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a message about this status update..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Priority Update Modal */}
      <Modal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        title="Update Ticket Priority"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="New Priority"
            options={newPriorityOptions}
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Update Message (Optional)
            </label>
            <textarea
              rows={3}
              value={priorityMessage}
              onChange={(e) => setPriorityMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a message about this priority update..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsPriorityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePriorityUpdate}>
              Update Priority
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};