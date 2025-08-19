import express from 'express';
import { auth } from '../middleware/auth';
import { superAdmin, subAdmin } from '../middleware/admin';
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser
} from '../controllers/userController';

const router = express.Router();

// Get all users (requires admin access)
router.get('/', auth, subAdmin, getUsers);

// Add new user (requires super admin or sub admin for their department)
router.post('/', auth, subAdmin, addUser);

// Update user (requires super admin or sub admin for their department)
router.put('/:id', auth, subAdmin, updateUser);

// Delete user (requires super admin or sub admin for their department)
router.delete('/:id', auth, subAdmin, deleteUser);

// Routes that only super admin can access
router.post('/super-admin', auth, superAdmin, addUser); // Add super admin
router.put('/:id/role', auth, superAdmin, updateUser); // Change user roles
router.get('/analytics', auth, superAdmin, getUsers); // Get user analytics

export default router;
