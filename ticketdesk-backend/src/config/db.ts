import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    // Use MONGODB_URI, fall back to MONGO_URI (package.json/env inconsistency),
    // and finally to a local default for developer convenience.
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/fixit';

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully to', mongoUri);
  } catch (err) {
    // Log error but don't force-exit here so developer can see the server errors in the
    // running process and fix env issues without the process closing immediately.
    console.error('MongoDB connection error:', err);
  }
};

export default connectDB;