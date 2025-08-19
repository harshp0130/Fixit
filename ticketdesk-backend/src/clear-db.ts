import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Ticket from '../models/Ticket';

dotenv.config();

async function clearDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Ticket.deleteMany({});
    
    console.log('Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
