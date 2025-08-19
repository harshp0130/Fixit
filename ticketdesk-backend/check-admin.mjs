import mongoose from "mongoose";
import "dotenv/config";

const checkAdmin = async () => {
  try {
    // Connect to the same database as your app
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/fixit";
    console.log(`Connecting to: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    
    // Check if super admin exists
    const User = mongoose.model("User", new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      department: String
    }));
    
    const admin = await User.findOne({ email: "superadmin@system.com", role: "super_admin" });
    
    if (admin) {
      console.log("✅ Super admin found:", {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department
      });
    } else {
      console.log("❌ Super admin NOT found in this database");
      
      // List all users to see what's available
      const allUsers = await User.find({}, { password: 0 });
      console.log("Available users:", allUsers);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
  }
};

checkAdmin();
