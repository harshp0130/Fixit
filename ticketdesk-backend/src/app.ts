import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db';

import { registerUser, loginUser } from './controllers/authController';
import { getUsers, addUser, updateUser, deleteUser } from './controllers/userController';
import { createTicket, getTickets, getTicketById, updateTicketStatus, updateTicketPriority, getAnalytics } from './controllers/ticketController';
import auth from './middleware/auth';
import { subAdmin, superAdmin } from './middleware/admin';
import upload from './middleware/upload';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

connectDB();

// Auth Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

// User Routes
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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));