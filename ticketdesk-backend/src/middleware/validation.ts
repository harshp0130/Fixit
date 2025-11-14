import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }
  next();
};

// Validation rules for user registration
export const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]*$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('role')
    .isIn(['student', 'faculty', 'sub_admin', 'super_admin'])
    .withMessage('Invalid role specified'),

  body('department')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Department cannot be empty if provided'),

  handleValidationErrors
];

// Validation rules for user login
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  body('role')
    .isIn(['student', 'faculty', 'sub_admin', 'super_admin'])
    .withMessage('Invalid role specified'),

  handleValidationErrors
];

// Validation rules for ticket creation
export const validateTicketCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('institute')
    .trim()
    .notEmpty()
    .withMessage('Institute is required'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),

  body('roomNumber')
    .trim()
    .notEmpty()
    .withMessage('Room number is required'),

  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),

  body('priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),

  handleValidationErrors
];

// Validation rules for ticket status update
export const validateTicketStatusUpdate = [
  body('newStatus')
    .isIn(['pending', 'in-progress', 'resolved'])
    .withMessage('Status must be pending, in-progress, or resolved'),

  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),

  handleValidationErrors
];

// Validation rules for ticket priority update
export const validateTicketPriorityUpdate = [
  body('newPriority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),

  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),

  handleValidationErrors
];

// Validation rules for user management
export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]*$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('role')
    .optional()
    .isIn(['student', 'faculty', 'sub_admin', 'super_admin'])
    .withMessage('Invalid role specified'),

  body('department')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Department cannot be empty if provided'),

  handleValidationErrors
];
