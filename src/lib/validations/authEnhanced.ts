import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;

// Base schemas without refinements
const baseLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  role: z.enum(['student', 'faculty', 'sub_admin', 'super_admin'])
});

const baseRegisterSchema = z.object({
  ...baseLoginSchema.shape,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
  confirmPassword: z.string()
});

// Enhanced password validation with strength requirements
const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Add refinements after base schemas are defined
export const loginSchema = baseLoginSchema.refine(
  (data) => {
    if (data.role === 'student' || data.role === 'faculty') {
      return data.email.endsWith('@paruluniversity.ac.in');
    }
    return true;
  },
  {
    message: 'Please use your university email address (@paruluniversity.ac.in)',
    path: ['email']
  }
);

export const registerSchema = baseRegisterSchema.refine(
  (data) => {
    if (data.role === 'student' || data.role === 'faculty') {
      return data.email.endsWith('@paruluniversity.ac.in');
    }
    return true;
  },
  {
    message: 'Please use your university email address (@paruluniversity.ac.in)',
    path: ['email']
  }
).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
).refine(
  (data) => strongPasswordSchema.safeParse(data.password).success,
  {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    path: ['password']
  }
);

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
