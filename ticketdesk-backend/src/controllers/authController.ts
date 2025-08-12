import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role, department } = req.body;
  if (role === 'sub_admin' || role === 'super_admin') {
    return res.status(403).json({ message: 'Admins cannot self-register.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password, role, department });
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ token, role: user.role });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }) as IUser;
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.id, role: user.role, department: user.department } };
    jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};