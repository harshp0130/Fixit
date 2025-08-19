import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/auth';

// Get all departments
export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const departments = await User.distinct('department');
    const filteredDepartments = departments.filter(Boolean); // Remove null/undefined
    
    const departmentStats = await Promise.all(
      filteredDepartments.map(async (dept) => {
        const total = await User.countDocuments({ department: dept });
        const students = await User.countDocuments({ department: dept, role: 'student' });
        const faculty = await User.countDocuments({ department: dept, role: 'faculty' });
        const subAdmins = await User.countDocuments({ department: dept, role: 'sub_admin' });
        
        return {
          name: dept,
          total,
          students,
          faculty,
          subAdmins
        };
      })
    );

    res.json({ departments: departmentStats });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new department
export const createDepartment = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;

  try {
    // Check if department already exists
    const existingDepartment = await User.findOne({ department: name });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    // Create sub-admin for the department
    const subAdmin = new User({
      name: `${name} Admin`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@admin.edu`,
      password: 'tempPassword123', // Should be changed on first login
      role: 'sub_admin',
      department: name
    });

    await subAdmin.save();

    res.status(201).json({ 
      message: 'Department created successfully',
      department: name,
      subAdmin: {
        id: subAdmin._id,
        email: subAdmin.email
      }
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update department
export const updateDepartment = async (req: AuthRequest, res: Response) => {
  const { oldName, newName } = req.body;

  try {
    // Check if new department name already exists
    const existingDepartment = await User.findOne({ department: newName });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department name already exists' });
    }

    // Update all users in the department
    await User.updateMany(
      { department: oldName },
      { $set: { department: newName } }
    );

    res.json({ 
      message: 'Department updated successfully',
      department: newName
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete department
export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  const { name } = req.params;

  try {
    // Check if department has users
    const usersInDepartment = await User.countDocuments({ department: name });
    if (usersInDepartment > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department with existing users' 
      });
    }

    // No need to delete department as it's just a field in user documents
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Merge departments
export const mergeDepartments = async (req: AuthRequest, res: Response) => {
  const { sourceDepartment, targetDepartment } = req.body;

  try {
    // Check if both departments exist
    const [sourceExists, targetExists] = await Promise.all([
      User.exists({ department: sourceDepartment }),
      User.exists({ department: targetDepartment })
    ]);

    if (!sourceExists || !targetExists) {
      return res.status(404).json({ 
        message: 'One or both departments not found' 
      });
    }

    // Update all users from source department
    await User.updateMany(
      { department: sourceDepartment },
      { $set: { department: targetDepartment } }
    );

    res.json({ 
      message: 'Departments merged successfully',
      department: targetDepartment
    });
  } catch (error) {
    console.error('Error merging departments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get department statistics
export const getDepartmentStats = async (req: AuthRequest, res: Response) => {
  const { department } = req.params;

  try {
    const stats = {
      total: await User.countDocuments({ department }),
      students: await User.countDocuments({ department, role: 'student' }),
      faculty: await User.countDocuments({ department, role: 'faculty' }),
      subAdmins: await User.countDocuments({ department, role: 'sub_admin' }),
      activeTickets: 0, // Would need to be implemented with Ticket model
      resolvedTickets: 0 // Would need to be implemented with Ticket model
    };

    res.json({ department, stats });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
