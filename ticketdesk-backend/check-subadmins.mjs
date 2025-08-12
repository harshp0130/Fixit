import mongoose from "mongoose";
import "dotenv/config";

const checkSubAdmins = async () => {
  try {
    // Connect to the same database as your app
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/fixit";
    console.log(`Connecting to: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    
    // Check all users with sub_admin role
    const User = mongoose.model("User", new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      department: String
    }));
    
    const subAdmins = await User.find({ role: "sub_admin" }, { password: 0 });
    
    if (subAdmins.length > 0) {
      console.log("✅ Sub admins found:", subAdmins.length);
      subAdmins.forEach(admin => {
        console.log({
          name: admin.name,
          email: admin.email,
          role: admin.role,
          department: admin.department
        });
      });
    } else {
      console.log("❌ No sub admins found in this database");
      
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

checkSubAdmins();
