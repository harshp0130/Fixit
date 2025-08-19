import React, { createContext, useContext, useState } from 'react';
import { Ticket, TicketUpdate } from '../types';
import { mockTickets } from '../data/mockData';

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

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Fetch tickets from backend
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data);
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

  // Re-fetch tickets when auth state changes
  // Re-fetch tickets when component mounts and periodically
  React.useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'submissionDate' | 'updates' | 'submittedBy'> & { imageFile?: File }) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add all ticket data except imageFile
      Object.entries(ticketData).forEach(([key, value]) => {
        if (key !== 'imageFile' && value !== undefined) {
          formData.append(key, value as string);
        }
      });

      // Add image file if present
      if (ticketData.imageFile) {
        formData.append('imageFile', ticketData.imageFile);
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create ticket');
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
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
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
      const response = await fetch(`/api/tickets/${ticketId}/priority`, {
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
};