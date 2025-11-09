import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Ticket from '../models/Ticket';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let query: any = {};
    let roleQuery: any = {};

    // Only super_admin and sub_admin can access user list
    if (!['super_admin', 'sub_admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Access denied. Admin privileges required.', code: 'FORBIDDEN' } });
    }

    // Role-based filtering
    switch (user.role) {
      case 'super_admin':
        // Super admin can see all users
        // No additional query needed
        break;
      
      case 'sub_admin':
        if (!user.department) {
          return res.status(400).json({ success: false, error: { message: 'Sub-admin must be assigned to a department', code: 'MISSING_DEPARTMENT' } });
        }
        // Sub admin can only see users from their department
        query.department = user.department;
        // And can only see students and faculty
        roleQuery.role = { $in: ['student', 'faculty'] };
        break;
      
      default:
        return res.status(403).json({ success: false, error: { message: 'Access denied', code: 'FORBIDDEN' } });
    }

    const users = await User.find({ 
      ...query,
      ...roleQuery,
      _id: { $ne: user._id } // Exclude current user
    }).select('-password');
    
    // For super admin, include department statistics
    if (user.role === 'super_admin') {
      const departments = await User.aggregate([
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            students: {
              $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] }
            },
            faculty: {
              $sum: { $cond: [{ $eq: ['$role', 'faculty'] }, 1, 0] }
            },
            subAdmins: {
              $sum: { $cond: [{ $eq: ['$role', 'sub_admin'] }, 1, 0] }
            }
          }
        },
        {
          $match: {
            '_id': { $ne: null }
          }
        }
      ]);

      res.json({ success: true, data: { users, departments, stats: { total: users.length, byRole: { students: users.filter(u => u.role === 'student').length, faculty: users.filter(u => u.role === 'faculty').length, subAdmins: users.filter(u => u.role === 'sub_admin').length, superAdmins: users.filter(u => u.role === 'super_admin').length } } } });
    } else {
      res.json({ success: true, data: { users, stats: { total: users.length, students: users.filter(u => u.role === 'student').length, faculty: users.filter(u => u.role === 'faculty').length } } });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

export const addUser = async (req: Request, res: Response) => {
  const { name, email, role, password, department } = req.body;
  const currentUser = req.user!;

  try {
    // Check if user already exists
  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ success: false, error: { message: 'User already exists', code: 'USER_ALREADY_EXISTS' } });

    // Only super_admin and sub_admin can add users
    if (!['super_admin', 'sub_admin'].includes(currentUser.role)) {
      return res.status(403).json({ success: false, error: { message: 'Access denied. Admin privileges required.', code: 'FORBIDDEN' } });
    }

    // Role-based permissions and validation
    switch (currentUser.role) {
      case 'super_admin':
        // Super admin can create any type of user except another super_admin
        if (!['student', 'faculty', 'sub_admin'].includes(role)) {
          return res.status(400).json({ success: false, error: { message: 'Invalid role specified. Cannot create super_admin directly.', code: 'INVALID_ROLE' } });
        }

        // Validate department for department-specific roles
        if (['sub_admin', 'faculty', 'student'].includes(role) && !department) {
          return res.status(400).json({ success: false, error: { message: 'Department is required for this role', code: 'MISSING_DEPARTMENT' } });
        }
        break;

      case 'sub_admin':
        // Sub-admin restrictions
        if (!currentUser.department) {
          return res.status(400).json({ success: false, error: { message: 'Sub-admin must be assigned to a department', code: 'MISSING_DEPARTMENT' } });
        }

        // Can only add students and faculty
        if (!['student', 'faculty'].includes(role)) {
          return res.status(403).json({ success: false, error: { message: 'Sub-admins can only add students and faculty members', code: 'FORBIDDEN' } });
        }
        
        // Can only add to their own department
        if (department !== currentUser.department) {
          return res.status(403).json({ success: false, error: { message: 'You can only add users to your own department', code: 'FORBIDDEN' } });
        }
        break;

      default:
        return res.status(403).json({ 
          message: 'You do not have permission to add users' 
        });
    }

    // Set department based on role and permissions
    const userDepartment = currentUser.role === 'sub_admin' ? currentUser.department : department;

    // Create the user with proper defaults and validation
    user = new User({ 
      name, 
      email, 
      role, 
      password,
      department: userDepartment
    });
    
    // Additional validation before save
    if (!user.name || !user.email || !user.role || !user.password) {
      return res.status(400).json({ success: false, error: { message: 'All required fields must be provided', code: 'MISSING_FIELDS' } });
    }

    await user.save();

    // Return sanitized user object
    const sanitizedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };

    res.status(201).json({ success: true, data: { message: 'User added successfully', user: sanitizedUser } });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ success: false, error: { message: error instanceof Error ? error.message : 'Server error', code: 'SERVER_ERROR' } });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, department } = req.body;
  const currentUser = req.user!;

  try {
    // Get the user to be updated
    const userToUpdate = await User.findById(id).exec();
    if (!userToUpdate) {
      return res.status(404).json({ success: false, error: { message: 'User not found', code: 'NOT_FOUND' } });
    }

    // Cannot update own account through this endpoint
    if (currentUser._id && userToUpdate._id && 
        userToUpdate._id.toString() === currentUser._id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Cannot modify your own account through this endpoint', code: 'FORBIDDEN' } });
    }

    // Role-based access control
    switch (currentUser.role) {
      case 'super_admin':
        // Super admin restrictions
        if (userToUpdate.role === 'super_admin') {
          return res.status(403).json({ success: false, error: { message: 'Cannot modify super admin accounts', code: 'FORBIDDEN' } });
        }

        // Validate role change
        if (role && !['student', 'faculty', 'sub_admin'].includes(role)) {
          return res.status(400).json({ success: false, error: { message: 'Invalid role specified', code: 'INVALID_ROLE' } });
        }

        // Validate department for department-specific roles
        if (role && ['student', 'faculty', 'sub_admin'].includes(role) && !department) {
          return res.status(400).json({ success: false, error: { message: 'Department is required for this role', code: 'MISSING_DEPARTMENT' } });
        }
        break;

      case 'sub_admin':
        if (!currentUser.department) {
          return res.status(400).json({ success: false, error: { message: 'Sub-admin must be assigned to a department', code: 'MISSING_DEPARTMENT' } });
        }

        // Can only update students and faculty
        if (!['student', 'faculty'].includes(userToUpdate.role)) {
          return res.status(403).json({ success: false, error: { message: 'Sub-admins can only modify students and faculty accounts', code: 'FORBIDDEN' } });
        }

        // Can only update users in their department
        if (userToUpdate.department !== currentUser.department) {
          return res.status(403).json({ success: false, error: { message: 'You can only modify users in your department', code: 'FORBIDDEN' } });
        }

        // Can only assign student or faculty roles
        if (role && !['student', 'faculty'].includes(role)) {
          return res.status(403).json({ success: false, error: { message: 'Sub-admins can only assign student or faculty roles', code: 'FORBIDDEN' } });
        }

        // Cannot change user's department
        if (department && department !== currentUser.department) {
          return res.status(403).json({ success: false, error: { message: 'Cannot assign user to a different department', code: 'FORBIDDEN' } });
        }
        break;

      default:
        return res.status(403).json({ 
          message: 'You do not have permission to update users' 
        });
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (department) updateData.department = department;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: { message: 'User not found', code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: { message: 'User updated successfully', user: updatedUser } });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: { message: error instanceof Error ? error.message : 'Server error', code: 'SERVER_ERROR' } });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  try {
    // Cannot delete your own account
    if (currentUser._id && currentUser._id.toString() === id) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete your own account', code: 'INVALID_OPERATION' } });
    }

    // Get the user to be deleted
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, error: { message: 'User not found', code: 'NOT_FOUND' } });
    }

    // Role-based access control
    switch (currentUser.role) {
      case 'super_admin':
        // Super admin cannot delete other super admins
        if (userToDelete.role === 'super_admin') {
          return res.status(403).json({ success: false, error: { message: 'Cannot delete super admin accounts', code: 'FORBIDDEN' } });
        }
        break;

      case 'sub_admin':
        if (!currentUser.department) {
          return res.status(400).json({ success: false, error: { message: 'Sub-admin must be assigned to a department', code: 'MISSING_DEPARTMENT' } });
        }

        // Can only delete students and faculty
        if (!['student', 'faculty'].includes(userToDelete.role)) {
          return res.status(403).json({ success: false, error: { message: 'Sub-admins can only delete student and faculty accounts', code: 'FORBIDDEN' } });
        }

        // Can only delete users from their department
        if (userToDelete.department !== currentUser.department) {
          return res.status(403).json({ success: false, error: { message: 'You can only delete users from your department', code: 'FORBIDDEN' } });
        }
        break;

      default:
        return res.status(403).json({ 
          message: 'You do not have permission to delete users' 
        });
    }

    // Check for associated tickets before deletion
    const ticketCount = await Ticket.countDocuments({
      $or: [
        { 'submittedBy._id': userToDelete._id },
        { 'assignedTo._id': userToDelete._id }
      ]
    });

    if (ticketCount > 0) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete user with associated tickets. Please reassign or close their tickets first.', code: 'ASSOCIATED_TICKETS' } });
    }

    await User.findByIdAndDelete(id);
    
    res.json({ success: true, data: { message: 'User deleted successfully', userId: id } });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: { message: error instanceof Error ? error.message : 'Server error', code: 'SERVER_ERROR' } });
  }
};