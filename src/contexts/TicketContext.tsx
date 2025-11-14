import React, { createContext, useContext, useState } from 'react';
import { Ticket } from '../types';

interface TicketContextType {
  tickets: Ticket[];
  createTicket: (ticket: Omit<Ticket, 'id' | 'submissionDate' | 'updates' | 'submittedBy'> & { imageFile?: File }) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: 'pending' | 'in-progress' | 'resolved', message?: string) => Promise<void>;
  updateTicketPriority: (ticketId: string, priority: 'low' | 'medium' | 'high', message?: string) => Promise<void>;
  getTicketById: (id: string) => Ticket | undefined;
  getUserTickets: (userId: string) => Ticket[];
  getDepartmentTickets: (department: string) => Ticket[];
  getAllTickets: () => Ticket[];
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};

const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Fetch tickets from backend
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

      const response = await fetch(`${apiBase}/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to fetch tickets');
      }

      const data = await response.json();
      // Expecting ApiResponse shape { success: boolean, data: { tickets: Ticket[] } }
      if (data && typeof data.success === 'boolean' && data.success && data.data && Array.isArray(data.data.tickets)) {
        setTickets(data.data.tickets);
      } else {
        console.warn('Unexpected tickets response shape:', data);
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  // Initial fetch
  React.useEffect(() => {
    fetchTickets();
  }, []);
  // Polling for updates every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for auth changes to refresh tickets (login/logout)
  React.useEffect(() => {
    const handler = () => fetchTickets();
    window.addEventListener('app:auth-changed', handler as EventListener);
    return () => window.removeEventListener('app:auth-changed', handler as EventListener);
  }, []);

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'submissionDate' | 'updates' | 'submittedBy'> & { imageFile?: File }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated. Please login and try again.');
      }

      const formData = new FormData();

      // Add all ticket data except imageFile
      Object.entries(ticketData).forEach(([key, value]) => {
        if (key !== 'imageFile' && value !== undefined) {
          // Ensure primitive values are stringified
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      });

      // Add image file if present
      if (ticketData.imageFile) {
        formData.append('imageFile', ticketData.imageFile);
      }

      // Use explicit API base (Vite env or default) to avoid depending on dev proxy config
      const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

      const response = await fetch(`${apiBase}/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message = error?.error?.message || error?.message || 'Failed to create ticket';
        throw new Error(message);
      }

      // Refresh tickets list after successful creation
      await fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: 'pending' | 'in-progress' | 'resolved', message?: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newStatus: status, message: message || `Status updated to ${status}` })
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }

      // Fetch updated tickets to ensure we have the latest data
      await fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  };

  const updateTicketPriority = async (ticketId: string, priority: 'low' | 'medium' | 'high', message?: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/tickets/${ticketId}/priority`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPriority: priority, message: message || `Priority updated to ${priority}` })
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket priority');
      }

      // Fetch updated tickets to ensure we have the latest data
      await fetchTickets();
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      throw error;
    }
  };

  const getTicketById = (id: string) => {
    return tickets.find(ticket => ticket.id === id);
  };

  const getUserTickets = (userId: string) => {
    return tickets.filter(ticket => ticket.submittedBy.id === userId);
  };

  const getDepartmentTickets = (department: string) => {
    return tickets.filter(ticket => ticket.department === department);
  };

  const getAllTickets = () => {
    return tickets;
  };

  return (
    <TicketContext.Provider value={{
      tickets,
      createTicket,
      updateTicketStatus,
      updateTicketPriority,
      getTicketById,
      getUserTickets,
      getDepartmentTickets,
      getAllTickets
    }}>
      {children}
    </TicketContext.Provider>
  );
}

export { TicketProvider };
export default TicketProvider;
