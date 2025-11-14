import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import { uploadsConfig } from './config/uploads';
import connectDB from './config/db';

// Import custom Express type definition to ensure it's included
import { securityHeaders } from './middleware/security';
import { generalLimiter, authLimiter, ticketCreateLimiter, adminLimiter } from './middleware/rateLimit';
import { validateRegistration, validateLogin, validateTicketCreation, validateTicketStatusUpdate, validateTicketPriorityUpdate, validateUserUpdate } from './middleware/validation';

import { registerUser, loginUser, verifyToken } from './controllers/authControllerEnhanced';
import { getUsers, addUser, updateUser, deleteUser } from './controllers/userController';
import { createTicket, getTickets, getTicketById, updateTicketStatus, updateTicketPriority, getAnalytics } from './controllers/ticketController';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, mergeDepartments } from './controllers/departmentController';
import auth from './middleware/auth';
import { subAdmin, superAdmin } from './middleware/admin';
import upload from './middleware/upload';

dotenv.config();

const app = express();

// Security middleware - apply early
app.use(securityHeaders);

// Compression middleware
app.use(compression());

// General rate limiting
app.use('/api/', generalLimiter);

// Configure CORS for development
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use(uploadsConfig.baseUrl, express.static(uploadsConfig.directory));

connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Auth Routes with enhanced security
app.post('/api/auth/register', authLimiter, validateRegistration, registerUser);
app.post('/api/auth/login', authLimiter, validateLogin, loginUser);
app.get('/api/auth/verify', auth, verifyToken);

// User Management Routes (Super Admin Only)
app.get('/api/users', auth, superAdmin, adminLimiter, getUsers);
app.post('/api/users', auth, superAdmin, adminLimiter, validateUserUpdate, addUser);
app.put('/api/users/:id', auth, superAdmin, adminLimiter, validateUserUpdate, updateUser);
app.delete('/api/users/:id', auth, superAdmin, adminLimiter, deleteUser);

// Ticket Routes with rate limiting
app.get('/api/tickets', auth, getTickets);
app.get('/api/tickets/:id', auth, getTicketById);
app.post('/api/tickets', auth, ticketCreateLimiter, upload.single('imageFile'), validateTicketCreation, createTicket);
app.put('/api/tickets/:id/status', auth, subAdmin, validateTicketStatusUpdate, updateTicketStatus);
app.put('/api/tickets/:id/priority', auth, subAdmin, validateTicketPriorityUpdate, updateTicketPriority);

// Analytics Route
app.get('/api/analytics', auth, subAdmin, getAnalytics);

// Dashboard Route (You can use the getTickets controller for dashboard data)
app.get('/api/dashboard', auth, getTickets);

// Department Routes
app.get('/api/departments', auth, getDepartments);
app.post('/api/departments', auth, superAdmin, adminLimiter, createDepartment);
app.put('/api/departments/:name', auth, superAdmin, adminLimiter, updateDepartment);
app.delete('/api/departments/:name', auth, superAdmin, adminLimiter, deleteDepartment);
app.post('/api/departments/merge', auth, superAdmin, adminLimiter, mergeDepartments);

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} with enhanced security`));
