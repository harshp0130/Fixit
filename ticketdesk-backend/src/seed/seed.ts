import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Ticket from '../models/Ticket';
import bcrypt from 'bcryptjs';

dotenv.config();

const users = [
  {
    name: 'Super Admin',
    email: 'superadmin@fixit.com',
    password: 'admin123',
    role: 'super_admin',
    department: 'Administration'
  },
  {
    name: 'Sub Admin',
    email: 'subadmin@fixit.com',
    password: 'admin123',
    role: 'sub_admin',
    department: 'IT'
  },
  {
    name: 'Faculty Member',
    email: 'faculty@fixit.com',
    password: 'faculty123',
    role: 'faculty',
    department: 'Computer Science'
  },
  {
    name: 'Student',
    email: 'student@fixit.com',
    password: 'student001',
    role: 'student',
    department: 'Computer Science'
  }
];

const tickets = [
  {
    title: 'Broken AC',
    description: 'The air conditioning unit in room CS-101 is not working properly.',
    department: 'Maintenance',
    institute: 'School of Engineering',
    location: 'Main Building',
    roomNumber: 'CS-101',
    priority: 'high',
    status: 'pending'
  },
  {
    title: 'Projector Issue',
    description: 'The projector in room EE-201 is showing distorted images.',
    department: 'IT Support',
    institute: 'School of Engineering',
    location: 'Engineering Block',
    roomNumber: 'EE-201',
    priority: 'medium',
    status: 'in-progress'
  },
  {
    title: 'Broken Chair',
    description: 'Three chairs in room ME-301 need repair.',
    department: 'Facilities',
    institute: 'School of Engineering',
    location: 'Mechanical Block',
    roomNumber: 'ME-301',
    priority: 'low',
    status: 'pending'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Cleared existing data');

    // Create users with properly hashed passwords
    const salt = await bcrypt.genSalt(10);
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        // Log the user being created
        console.log(`Creating user: ${user.email} with role: ${user.role}`);
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        // Create the user
        const createdUser = await User.create({
          ...user,
          password: hashedPassword
        });
        
        console.log(`Successfully created user: ${user.email}`);
        return createdUser;
      })
    );
    console.log('Created users');

    // Create tickets with references to users
    const studentUser = createdUsers.find(user => user.role === 'student');
    const subAdminUser = createdUsers.find(user => user.role === 'sub_admin');

    await Promise.all(
      tickets.map(async (ticket, index) => {
        return Ticket.create({
          ...ticket,
          submittedBy: studentUser?._id,
          updates: [{
            message: 'Ticket created',
            status: ticket.status,
            priority: ticket.priority,
            timestamp: new Date(),
            updatedBy: studentUser?._id
          }]
        });
      })
    );
    console.log('Created tickets');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
