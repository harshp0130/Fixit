import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

const testLogin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ticketdesk";
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    
    // Define User schema
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      department: String
    });
    
    const User = mongoose.model("User", UserSchema);
    
    // Test sub admin login
    const testEmail = "cs.subadmin@system.com";
    const testPassword = "harsh123";
    const testRole = "sub_admin";
    
    console.log("Testing login for:", { email: testEmail, role: testRole });
    
    // Find user
    const user = await User.findOne({ email: testEmail, role: testRole });
    console.log("User found:", user ? "Yes" : "No");
    
    if (user) {
      console.log("User details:", {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      });
      
      // Test password
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log("Password match:", isMatch);
    } else {
      console.log("No user found with email and role combination");
      
      // List all users
      const allUsers = await User.find({}, { password: 0 });
      console.log("All users in database:");
      allUsers.forEach(u => {
        console.log(`- ${u.name} (${u.email}) - ${u.role} - ${u.department}`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
  }
};

testLogin();
