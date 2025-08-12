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
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  try {
    const packageJsonPath = resolve(__dirname, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    return packageJson.env?.MONGO_URI || "mongodb://localhost:27017/fixit";
  } catch (error) {
    console.error("Error reading package.json:", error);
    return "mongodb://localhost:27017/fixit"; // Fallback
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

    const existingUser = await User.findOne({
      email: "master.admin@system.com",
    });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("password", 10);
      const superAdmin = new User({
        name: "Master Admin",
        email: "master.admin@system.com",
        password: hashedPassword,
        role: "super_admin",
      });
      await superAdmin.save();
      console.log("Super Admin account seeded successfully.");
    } else {
      console.log("Super Admin account already exists.");
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding admin:", error);
    await mongoose.connection.close();
  }
};

seedAdmin();
