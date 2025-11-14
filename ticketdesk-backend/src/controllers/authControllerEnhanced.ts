import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import LoginAttempt from '../models/LoginAttempt';
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
    {
      expiresIn: '24h',  // Increase token lifetime
      algorithm: 'HS256'
    }
  );

  return {
    token,
    expiresIn: 86400 // 24 hours in seconds
  };
};

// Helper function to get client IP address
const getClientIP = (req: AuthRequest): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
         (req.headers['x-real-ip'] as string) ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
};

// Helper function to check if account is locked due to too many failed attempts
const checkAccountLock = async (email: string): Promise<boolean> => {
  const recentAttempts = await LoginAttempt.find({
    email: email.toLowerCase(),
    successful: false,
    timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
  });

  return recentAttempts.length >= 5; // Lock after 5 failed attempts
};

// Helper function to log login attempt
const logLoginAttempt = async (
  email: string,
  ipAddress: string,
  userAgent: string,
  successful: boolean,
  failureReason?: string
) => {
  try {
    await LoginAttempt.create({
      email: email.toLowerCase(),
      ipAddress,
      userAgent,
      successful,
      failureReason
    });
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
};

const validateEmail = (email: string, role: string): boolean => {
  if (role === 'student' || role === 'faculty') {
    return email.endsWith('@paruluniversity.ac.in');
  }
  return true; // For admin roles, any valid email is acceptable
};

export const registerUser = async (req: AuthRequest, res: Response) => {
  const { name, email, password, role, department } = req.body;

  console.log('Registration attempt:', { name, email, role, department }); // Debug log

  // Validate required fields
  if (!email || !password || !role) {
    console.log('Missing required fields');
    return res.status(400).json({
      success: false,
      error: {
        message: 'Please provide all required fields: email, password, and role',
        code: 'MISSING_FIELDS'
      }
    });
  }

  if (!validateEmail(email, role)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Students and faculty must use an @paruluniversity.ac.in email address',
        code: 'INVALID_EMAIL_DOMAIN'
      }
    });
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        code: 'WEAK_PASSWORD'
      }
    });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'User already exists with this email',
          code: 'USER_ALREADY_EXISTS'
        }
      });
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

    // Return success in a consistent ApiResponse shape
    res.status(201).json({
      success: true,
      data: {
        message: 'User registered successfully. Please login to continue.',
        email: savedUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error during registration' } });
  }
};

export const verifyToken = async (req: AuthRequest, res: Response) => {
  // The auth middleware already verified the token and attached the user
  const user = req.user!;

  // Respond with ApiResponse shape
  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    }
  });
};

export const loginUser = async (req: AuthRequest, res: Response) => {
  const { email, password, role } = req.body;
  const ipAddress = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  console.log('Login attempt:', { email, role }); // Debug log

  // Validate required fields
  if (!email || !password) {
    console.log('Missing email or password');
    await logLoginAttempt(email || 'unknown', ipAddress, userAgent, false, 'Missing credentials');
    return res.status(400).json({
      success: false,
      error: { message: 'Please provide both email and password' }
    });
  }

  try {
    // Check if account is locked due to too many failed attempts
    const isLocked = await checkAccountLock(email);
    if (isLocked) {
      await logLoginAttempt(email, ipAddress, userAgent, false, 'Account locked due to too many failed attempts');
      return res.status(429).json({
        success: false,
        error: {
          message: 'Account temporarily locked due to too many failed login attempts. Please try again later.',
          code: 'ACCOUNT_LOCKED'
        }
      });
    }

    console.log('Attempting to find user:', { email, role });
    // Find user by email
    const user = await User.findOne({ email }) as (IUser & { _id: mongoose.Types.ObjectId });
    console.log('Database query result:', {
      found: !!user,
      userRole: user?.role,
      requestedRole: role
    });

    if (!user) {
      console.log('No user found with email:', { email });
      await logLoginAttempt(email, ipAddress, userAgent, false, 'User not found');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Check if role matches if one was provided
    if (role && user.role !== role) {
      console.log('Role mismatch:', { expected: role, actual: user.role }); // Debug log
      await logLoginAttempt(email, ipAddress, userAgent, false, 'Role mismatch');
      return res.status(400).json({ success: false, error: { message: 'Invalid role for this user', code: 'INVALID_ROLE' } });
    }

    // Verify password
    try {
      const isMatch = await bcrypt.compare(password, user.password!);
      console.log('Password comparison result:', isMatch);

      if (!isMatch) {
        await logLoginAttempt(email, ipAddress, userAgent, false, 'Invalid password');
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }
    } catch (error) {
      console.error('Password comparison error:', error);
      await logLoginAttempt(email, ipAddress, userAgent, false, 'Password verification error');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Error verifying credentials',
          code: 'PASSWORD_VERIFICATION_ERROR'
        }
      });
    }

    // Log successful login
    await logLoginAttempt(email, ipAddress, userAgent, true);

    // Generate token
    const { token, expiresIn } = generateToken(user);

    // Return success with user details and token in ApiResponse shape
    res.json({
      success: true,
      data: {
        token,
        expiresIn,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    await logLoginAttempt(email, ipAddress, userAgent, false, 'Server error');
    res.status(500).json({ success: false, error: { message: 'Server error during login' } });
  }
};
