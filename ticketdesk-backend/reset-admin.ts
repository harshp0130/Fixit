import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

async function resetAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Delete existing admin user
    await User.deleteOne({ email: 'superadmin@fixit.com' });
    console.log('Deleted existing admin user');

    // Create new admin user with correct password
    const adminUser = new User({
      name: 'Super Admin',
      email: 'superadmin@fixit.com',
      password: 'harsh123', // Will be hashed by the User model
      role: 'super_admin',
      department: 'Administration'
    });

    await adminUser.save();
    console.log('Created new admin user with correct credentials');

    console.log('Admin user reset successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin user:', error);
    process.exit(1);
  }
}

resetAdminUser();