import mongoose from 'mongoose';
import "dotenv/config";

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Successfully connected to MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Count users
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log('Number of users in database:', userCount);
    
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testConnection();