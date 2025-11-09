import { Request, Response } from 'express';
import Ticket from '../models/Ticket';
import { IUser } from '../models/User';
import mongoose from 'mongoose';

// Correctly types the request object to include user with ObjectId
declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: mongoose.Types.ObjectId };
    }
  }
}

// Create a new ticket
export const createTicket = async (req: Request, res: Response) => {
  const { title, description, institute, location, roomNumber, department, priority } = req.body;
  const user = req.user!; // Use non-null assertion as auth middleware ensures user exists
  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const imageUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : undefined;

  try {
    const newTicket = new Ticket({
      title, 
      description, 
      institute, 
      location, 
      roomNumber, 
      department, 
      priority,
      status: 'pending',
      imageUrl,
      submittedBy: {
        id: user._id.toHexString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      updates: [{
        message: `Ticket created by ${user.name}`,
        status: 'pending',
        updatedBy: {
          id: user._id.toHexString(),
          name: user.name,
          role: user.role
        }
      }]
    });
    await newTicket.save();
    res.status(201).json({
      success: true,
      data: {
        message: 'Ticket created successfully',
        ticket: newTicket
      }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// Get all tickets for a specific user, or for admins based on role
export const getTickets = async (req: Request, res: Response) => {
  const user = req.user!; // Use non-null assertion
  let query: any = {}; // Use `any` for flexible query object
  
  if (user.role === 'sub_admin' && user.department) {
    // Sub-admins see tickets for their department only
    query = { department: user.department };
  } else if (user.role === 'super_admin') {
    // Super admins see all tickets - no query filter needed
    query = {};
  } else {
    // Students and faculty see only their own tickets
    // stored submittedBy.id is a string (toHexString), so compare with string form
    query = { 'submittedBy.id': user._id.toHexString() };
  }
  
  try {
    const tickets = await Ticket.find(query)
      .sort({ submissionDate: -1 });
    res.json({ success: true, data: { tickets } });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// Get a single ticket by ID
export const getTicketById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!; // Use non-null assertion

  try {
    const ticket = await Ticket.findById(id).populate('submittedBy', 'name email').populate('updates.updatedBy', 'name');
    
    if (!ticket) {
      return res.status(404).json({ success: false, error: { message: 'Ticket not found', code: 'NOT_FOUND' } });
    }

    // Check if the user is the owner or an admin with proper department access
    const isOwner = ticket.submittedBy.id === user._id.toHexString();
    const isSuperAdmin = user.role === 'super_admin';
    const isSubAdminSameDept = user.role === 'sub_admin' && ticket.department === user.department;

    if (!isOwner && !isSuperAdmin && !isSubAdminSameDept) {
      return res.status(403).json({ success: false, error: { message: 'Access denied', code: 'FORBIDDEN' } });
    }
    
    res.json({ success: true, data: { ticket } });
  } catch (error) {
    console.error('Get ticket by id error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// Update ticket status (Admin only)
export const updateTicketStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newStatus, message } = req.body;
  const user = req.user!; // Use non-null assertion

  try {
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, error: { message: 'Ticket not found', code: 'NOT_FOUND' } });
    }

    // Authorization check for sub-admins
    if (user.role === 'sub_admin' && ticket.department !== user.department) {
      return res.status(403).json({ success: false, error: { message: 'Access denied', code: 'FORBIDDEN' } });
    }

    ticket.status = newStatus;
    ticket.updates.push({
      message,
      status: newStatus,
      updatedBy: {
        id: user._id.toHexString(),
        name: user.name,
        role: user.role
      },
      timestamp: new Date()
    });
    await ticket.save();
    res.json({ success: true, data: { message: 'Ticket status updated', ticket } });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// Update ticket priority (Admin only)
export const updateTicketPriority = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPriority, message } = req.body;
  const user = req.user!; // Use non-null assertion

  try {
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, error: { message: 'Ticket not found', code: 'NOT_FOUND' } });
    }

    // Authorization check for sub-admins
    if (user.role === 'sub_admin' && ticket.department !== user.department) {
      return res.status(403).json({ success: false, error: { message: 'Access denied', code: 'FORBIDDEN' } });
    }

    ticket.priority = newPriority;
    ticket.updates.push({
      message,
      priority: newPriority,
      updatedBy: {
        id: user._id.toHexString(),
        name: user.name,
        role: user.role
      },
      timestamp: new Date()
    });
    await ticket.save();
    res.json({ success: true, data: { message: 'Ticket priority updated', ticket } });
  } catch (error) {
    console.error('Update ticket priority error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// Get analytics data for the dashboard
export const getAnalytics = async (req: Request, res: Response) => {
  const user = req.user!; // Use non-null assertion
  let query: any = {};
  
  if (user.role === 'sub_admin' && user.department) {
    query = { department: user.department };
  }

  try {
    const tickets = await Ticket.find(query).populate('submittedBy', 'name email');
    
    // Calculate all the required analytics metrics
    const analytics = {
      totalTickets: tickets.length,
      pendingTickets: tickets.filter(t => t.status === 'pending').length,
      inProgressTickets: tickets.filter(t => t.status === 'in-progress').length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
      highPriorityTickets: tickets.filter(t => t.priority === 'high').length,
      thisWeekTickets: tickets.filter(t => new Date(t.submissionDate) >= new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)).length,
      thisMonthTickets: tickets.filter(t => new Date(t.submissionDate) >= new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate())).length,
      resolutionRate: tickets.length > 0 ? Math.round((tickets.filter(t => t.status === 'resolved').length / tickets.length) * 100) : 0,
      avgResolutionTime: tickets.length > 0 ? Math.round(Math.random() * 5 + 1) : 0, // Mocked for simplicity
      departmentStats: tickets.reduce((acc, ticket) => { acc[ticket.department] = (acc[ticket.department] || 0) + 1; return acc; }, {} as Record<string, number>),
      priorityStats: {
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length
      },
      statusStats: {
        pending: tickets.filter(t => t.status === 'pending').length,
        'in-progress': tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length
      },
      topUsers: tickets.reduce((acc, ticket) => {
        const userId = ticket.submittedBy.toString();
        acc[userId] = (acc[userId] || { count: 0, name: (ticket.submittedBy as any).name, email: (ticket.submittedBy as any).email });
        acc[userId].count++;
        return acc;
      }, {} as Record<string, { count: number; name: string; email: string }>),
      dailyTrends: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(new Date().getTime() - i * 24 * 60 * 60 * 1000);
        const dayTickets = tickets.filter(t => new Date(t.submissionDate).toDateString() === date.toDateString()).length;
        return { date: date.toLocaleDateString('en-US', { weekday: 'short' }), tickets: dayTickets };
      }).reverse()
    };
    
    res.json({ success: true, data: { analytics } });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};