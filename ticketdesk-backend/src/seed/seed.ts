import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Ticket from '../models/Ticket';
// Removed unused import bcrypt

dotenv.config();

// Departments for which we'll create sub-admins
const departmentsList = [
  'Computer Science',
  'Mechanical',
  'Food Tech',
  'Biotech'
];

const users = [
  {
    name: 'Super Admin',
    email: 'superadmin@fixit.com',
    password: 'harsh123',
    role: 'super_admin',
    department: 'Administration'
  }
];

// Add one sub_admin per department
for (const dept of departmentsList) {
  users.push({
    name: `${dept} Sub Admin`,
    email: `${dept.toLowerCase().replace(/\s+/g, '')}.subadmin@fixit.com`,
    password: 'harsh123',
    role: 'sub_admin',
    department: dept
  });
}

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
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        // Log the user being created
        console.log(`Creating user: ${user.email} with role: ${user.role}`);
        
        // Let the User model handle password hashing
        const createdUser = await User.create(user);
        
        console.log(`Successfully created user: ${user.email}`);
        return createdUser;
      })
    );
    console.log('Created users');

    // Create tickets with references to users
  const studentUser = createdUsers.find(user => user.role === 'student');

    await Promise.all(
      tickets.map(async (ticket) => {
        const submitter = studentUser || createdUsers[0];
        const submitterObj = submitter ? {
          id: (submitter._id && typeof submitter._id === 'object' && typeof (submitter._id as { toHexString?: () => string }).toHexString === 'function')
            ? (submitter._id as { toHexString: () => string }).toHexString()
            : String(submitter._id),
          name: submitter.name,
          email: submitter.email,
          role: submitter.role,
          department: submitter.department
        } : undefined;

        const updaterObj = submitter ? {
          id: (submitter._id && typeof submitter._id === 'object' && typeof (submitter._id as { toHexString?: () => string }).toHexString === 'function')
            ? (submitter._id as { toHexString: () => string }).toHexString()
            : String(submitter._id),
          name: submitter.name,
          role: submitter.role
        } : undefined;

        return Ticket.create({
          ...ticket,
          submittedBy: submitterObj,
          updates: [{
            message: 'Ticket created',
            status: ticket.status,
            priority: ticket.priority,
            timestamp: new Date(),
            updatedBy: updaterObj
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
