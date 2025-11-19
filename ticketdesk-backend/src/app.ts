import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { uploadsConfig } from './config/uploads';
import connectDB from './config/db';

import { registerUser, loginUser, verifyToken } from './controllers/authController';
import { getUsers, addUser, updateUser, deleteUser } from './controllers/userController';
import { createTicket, getTickets, getTicketById, updateTicketStatus, updateTicketPriority, getAnalytics } from './controllers/ticketController';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, mergeDepartments } from './controllers/departmentController';
import auth from './middleware/auth';
import { subAdmin, superAdmin } from './middleware/admin';
import upload from './middleware/upload';

dotenv.config();

const app = express();
app.use(express.json());
// Configure CORS for development
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['https://infrastructureservice-frontend.onrender.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve uploaded files
app.use(uploadsConfig.baseUrl, express.static(uploadsConfig.directory));

connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      status: 'ok',
      timestamp: new Date().toISOString()
    } 
  });
});

// Auth Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/verify', auth, verifyToken);

// User Management Routes (Super Admin Only)
app.get('/api/users', auth, superAdmin, getUsers);
app.post('/api/users', auth, superAdmin, addUser);
app.put('/api/users/:id', auth, superAdmin, updateUser);
app.delete('/api/users/:id', auth, superAdmin, deleteUser);

// Ticket Routes
app.get('/api/tickets', auth, getTickets);
app.get('/api/tickets/:id', auth, getTicketById);
app.post('/api/tickets', auth, upload.single('imageFile'), createTicket);
app.put('/api/tickets/:id/status', auth, subAdmin, updateTicketStatus);
app.put('/api/tickets/:id/priority', auth, subAdmin, updateTicketPriority);

// Analytics Route
app.get('/api/analytics', auth, subAdmin, getAnalytics);

// Dashboard Route (You can use the getTickets controller for dashboard data)
app.get('/api/dashboard', auth, getTickets);

// Department Routes
app.get('/api/departments', auth, getDepartments);
app.post('/api/departments', auth, superAdmin, createDepartment);
app.put('/api/departments/:name', auth, superAdmin, updateDepartment);
app.delete('/api/departments/:name', auth, superAdmin, deleteDepartment);
app.post('/api/departments/merge', auth, superAdmin, mergeDepartments);

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
