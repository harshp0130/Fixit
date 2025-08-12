import React, { createContext, useContext, useState } from 'react';
import { Ticket, TicketUpdate } from '../types';
import { mockTickets } from '../data/mockData';

interface TicketContextType {
  tickets: Ticket[];
  createTicket: (ticket: Omit<Ticket, 'id' | 'submissionDate' | 'updates'>) => void;
  updateTicketStatus: (ticketId: string, status: 'pending' | 'in-progress' | 'resolved', message?: string) => void;
  updateTicketPriority: (ticketId: string, priority: 'low' | 'medium' | 'high', message?: string) => void;
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
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);

  const createTicket = (ticketData: Omit<Ticket, 'id' | 'submissionDate' | 'updates'>) => {
    const newTicket: Ticket = {
      ...ticketData,
      id: `TCK-${String(tickets.length + 1).padStart(3, '0')}`,
      submissionDate: new Date().toISOString(),
      updates: [
        {
          id: `UPD-${Date.now()}`,
          message: 'Ticket submitted successfully',
          timestamp: new Date().toISOString(),
          updatedBy: { name: 'System', role: 'system' }
        }
      ]
    };
    
    setTickets(prev => [newTicket, ...prev]);
  };

  const updateTicketStatus = (ticketId: string, status: 'pending' | 'in-progress' | 'resolved', message?: string) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        const newUpdate: TicketUpdate = {
          id: `UPD-${Date.now()}`,
          message: message || `Status updated to ${status}`,
          timestamp: new Date().toISOString(),
          updatedBy: { name: 'Admin User', role: 'admin' },
          status
        };
        
        return {
          ...ticket,
          status,
          updates: [...ticket.updates, newUpdate]
        };
      }
      return ticket;
    }));
  };

  const updateTicketPriority = (ticketId: string, priority: 'low' | 'medium' | 'high', message?: string) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        const newUpdate: TicketUpdate = {
          id: `UPD-${Date.now()}`,
          message: message || `Priority updated to ${priority}`,
          timestamp: new Date().toISOString(),
          updatedBy: { name: 'Admin User', role: 'admin' }
        };
        
        return {
          ...ticket,
          priority,
          updates: [...ticket.updates, newUpdate]
        };
      }
      return ticket;
    }));
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