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
      return res.status(403).json({
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Role-based filtering
    switch (user.role) {
      case 'super_admin':
        // Super admin can see all users
        // No additional query needed
        break;
      
      case 'sub_admin':
        if (!user.department) {
          return res.status(400).json({
            message: 'Sub-admin must be assigned to a department'
          });
        }
        // Sub admin can only see users from their department
        query.department = user.department;
        // And can only see students and faculty
        roleQuery.role = { $in: ['student', 'faculty'] };
        break;
      
      default:
        return res.status(403).json({
          message: 'Access denied'
        });
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

      res.json({
        users,
        departments,
        stats: {
          total: users.length,
          byRole: {
            students: users.filter(u => u.role === 'student').length,
            faculty: users.filter(u => u.role === 'faculty').length,
            subAdmins: users.filter(u => u.role === 'sub_admin').length,
            superAdmins: users.filter(u => u.role === 'super_admin').length
          }
        }
      });
    } else {
      res.json({ 
        users,
        stats: {
          total: users.length,
          students: users.filter(u => u.role === 'student').length,
          faculty: users.filter(u => u.role === 'faculty').length
        }
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addUser = async (req: Request, res: Response) => {
  const { name, email, role, password, department } = req.body;
  const currentUser = req.user!;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Only super_admin and sub_admin can add users
    if (!['super_admin', 'sub_admin'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Role-based permissions and validation
    switch (currentUser.role) {
      case 'super_admin':
        // Super admin can create any type of user except another super_admin
        if (!['student', 'faculty', 'sub_admin'].includes(role)) {
          return res.status(400).json({ 
            message: 'Invalid role specified. Cannot create super_admin directly.' 
          });
        }

        // Validate department for department-specific roles
        if (['sub_admin', 'faculty', 'student'].includes(role) && !department) {
          return res.status(400).json({ 
            message: 'Department is required for this role' 
          });
        }
        break;

      case 'sub_admin':
        // Sub-admin restrictions
        if (!currentUser.department) {
          return res.status(400).json({ 
            message: 'Sub-admin must be assigned to a department' 
          });
        }

        // Can only add students and faculty
        if (!['student', 'faculty'].includes(role)) {
          return res.status(403).json({ 
            message: 'Sub-admins can only add students and faculty members' 
          });
        }
        
        // Can only add to their own department
        if (department !== currentUser.department) {
          return res.status(403).json({ 
            message: 'You can only add users to your own department' 
          });
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
      return res.status(400).json({ 
        message: 'All required fields must be provided' 
      });
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

    res.status(201).json({ 
      message: 'User added successfully',
      user: sanitizedUser
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Server error' 
    });
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
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot update own account through this endpoint
    if (currentUser._id && userToUpdate._id && 
        userToUpdate._id.toString() === currentUser._id.toString()) {
      return res.status(403).json({ 
        message: 'Cannot modify your own account through this endpoint' 
      });
    }

    // Role-based access control
    switch (currentUser.role) {
      case 'super_admin':
        // Super admin restrictions
        if (userToUpdate.role === 'super_admin') {
          return res.status(403).json({ 
            message: 'Cannot modify super admin accounts' 
          });
        }

        // Validate role change
        if (role && !['student', 'faculty', 'sub_admin'].includes(role)) {
          return res.status(400).json({ 
            message: 'Invalid role specified' 
          });
        }

        // Validate department for department-specific roles
        if (role && ['student', 'faculty', 'sub_admin'].includes(role) && !department) {
          return res.status(400).json({ 
            message: 'Department is required for this role' 
          });
        }
        break;

      case 'sub_admin':
        if (!currentUser.department) {
          return res.status(400).json({ 
            message: 'Sub-admin must be assigned to a department' 
          });
        }

        // Can only update students and faculty
        if (!['student', 'faculty'].includes(userToUpdate.role)) {
          return res.status(403).json({ 
            message: 'Sub-admins can only modify students and faculty accounts' 
          });
        }

        // Can only update users in their department
        if (userToUpdate.department !== currentUser.department) {
          return res.status(403).json({ 
            message: 'You can only modify users in your department' 
          });
        }

        // Can only assign student or faculty roles
        if (role && !['student', 'faculty'].includes(role)) {
          return res.status(403).json({ 
            message: 'Sub-admins can only assign student or faculty roles' 
          });
        }

        // Cannot change user's department
        if (department && department !== currentUser.department) {
          return res.status(403).json({ 
            message: 'Cannot assign user to a different department' 
          });
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
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Server error' 
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  try {
    // Cannot delete your own account
    if (currentUser._id && currentUser._id.toString() === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Get the user to be deleted
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Role-based access control
    switch (currentUser.role) {
      case 'super_admin':
        // Super admin cannot delete other super admins
        if (userToDelete.role === 'super_admin') {
          return res.status(403).json({ 
            message: 'Cannot delete super admin accounts' 
          });
        }
        break;

      case 'sub_admin':
        if (!currentUser.department) {
          return res.status(400).json({ 
            message: 'Sub-admin must be assigned to a department' 
          });
        }

        // Can only delete students and faculty
        if (!['student', 'faculty'].includes(userToDelete.role)) {
          return res.status(403).json({ 
            message: 'Sub-admins can only delete student and faculty accounts' 
          });
        }

        // Can only delete users from their department
        if (userToDelete.department !== currentUser.department) {
          return res.status(403).json({ 
            message: 'You can only delete users from your department' 
          });
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
      return res.status(400).json({ 
        message: 'Cannot delete user with associated tickets. Please reassign or close their tickets first.' 
      });
    }

    await User.findByIdAndDelete(id);
    
    res.json({ 
      message: 'User deleted successfully',
      userId: id
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Server error' 
    });
  }
};