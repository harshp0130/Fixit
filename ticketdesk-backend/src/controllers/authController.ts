import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { TokenData, JWTPayload } from '../types/auth';

// Helper function to generate JWT token
const generateToken = (user: IUser & { _id: mongoose.Types.ObjectId }): TokenData => {
  const payload: JWTPayload = {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  return {
    token,
    expiresIn: 3600 // 1 hour in seconds
  };
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role, department } = req.body;
  
  console.log('Registration attempt:', { name, email, role, department }); // Debug log

  // Validate required fields
  if (!name || !email || !password || !role) {
    console.log('Missing required fields');
    return res.status(400).json({ 
      message: 'Please provide all required fields: name, email, password, and role' 
    });
  }

  // Validate email format and domain
  const emailRegex = /^[^\s@]+@paruluniversity\.ac\.in$/;
  if (!emailRegex.test(email) && (role === 'student' || role === 'faculty')) {
    console.log('Invalid email domain');
    return res.status(400).json({ 
      message: 'Please use your university email address (@paruluniversity.ac.in)'
    });
  } else if (role === 'super_admin' || role === 'sub_admin') {
    // For admin roles, just validate basic email format
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(email)) {
      console.log('Invalid email format');
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      department: department || 'Not Specified'
    });

    // Save user to database
    const savedUser = await user.save() as (IUser & { _id: mongoose.Types.ObjectId });

    // Generate token
    const { token, expiresIn } = generateToken(savedUser);

    // Return success message only, no token (user must login separately)
    res.status(201).json({
      message: 'User registered successfully. Please login to continue.',
      email: savedUser.email // Send back email for convenience
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  // The auth middleware already verified the token and attached the user
  const user = req.user!;
  
  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  console.log('Login attempt:', { email, role }); // Debug log

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email }) as (IUser & { _id: mongoose.Types.ObjectId });
    console.log('Found user:', user ? 'Yes' : 'No'); // Debug log

    if (!user) {
      console.log('No user found with email:', { email }); // Debug log
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if role matches if one was provided
    if (role && user.role !== role) {
      console.log('Role mismatch:', { expected: role, actual: user.role }); // Debug log
      return res.status(400).json({ message: 'Invalid role for this user' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password!);
    console.log('Password match:', isMatch); // Debug log

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate token
    const { token, expiresIn } = generateToken(user);

    // Return success with user details and token
    res.json({
      message: 'Login successful',
      token,
      expiresIn,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};