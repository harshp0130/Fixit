import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import "dotenv/config";

// Get MongoDB URI from package.json or .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get MongoDB URI
const getMongoUri = async () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  try {
    const packageJsonPath = resolve(__dirname, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    return packageJson.env?.MONGO_URI || "mongodb://localhost:27017/ticketdesk";
  } catch (error) {
    console.error("Error reading package.json:", error);
    return "mongodb://localhost:27017/ticketdesk"; // Fallback
  }
};

// Define a simple User schema for seeding
const seedAdmin = async () => {
  try {
    const mongoUri = await getMongoUri();
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Define User schema
    const UserSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: {
        type: String,
        enum: ["student", "faculty", "sub_admin", "super_admin"],
        default: "student",
      },
      department: { type: String },
    });

    // Create User model
    const User = mongoose.model("User", UserSchema);

    // Seed Super Admin
    const superAdminExists = await User.findOne({
      email: "superadmin@system.com",
    });
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash("harsh123", 10);
      const superAdmin = new User({
        name: "Master Admin",
        email: "superadmin@system.com",
        password: hashedPassword,
        role: "super_admin",
      });
      await superAdmin.save();
      console.log("Super Admin account seeded successfully.");
    } else {
      console.log("Super Admin account already exists.");
    }

    // Seed Computer Science Sub Admin
    const csAdminExists = await User.findOne({
      email: "cs.subadmin@system.com",
    });
    if (!csAdminExists) {
      const hashedPassword = await bcrypt.hash("harsh123", 10);
      const csAdmin = new User({
        name: "CS Department Admin",
        email: "cs.subadmin@system.com",
        password: hashedPassword,
        role: "sub_admin",
        department: "Computer Science",
      });
      await csAdmin.save();
      console.log("CS Sub Admin account seeded successfully.");
    } else {
      console.log("CS Sub Admin account already exists.");
    }

    // Seed Mechanical Sub Admin
    const mechAdminExists = await User.findOne({
      email: "mech.subadmin@system.com",
    });
    if (!mechAdminExists) {
      const hashedPassword = await bcrypt.hash("harsh123", 10);
      const mechAdmin = new User({
        name: "Mechanical Department Admin",
        email: "mech.subadmin@system.com",
        password: hashedPassword,
        role: "sub_admin",
        department: "Mechanical",
      });
      await mechAdmin.save();
      console.log("Mechanical Sub Admin account seeded successfully.");
    } else {
      console.log("Mechanical Sub Admin account already exists.");
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding admin:", error);
    await mongoose.connection.close();
  }
};

seedAdmin();
