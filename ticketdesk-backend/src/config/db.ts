import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    // Prefer MONGODB_URI (Atlas SRV), fall back to MONGO_URI for legacy usage, then local.
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/fixit';

    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
      console.warn('No MONGODB_URI/MONGO_URI found. Falling back to local MongoDB at mongodb://localhost:27017/fixit');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    // Provide clear error and non-zero exit to avoid continuing without DB.
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;