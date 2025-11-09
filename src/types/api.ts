import { User, Ticket } from './index';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketResponse {
  ticket: Ticket;
}

export interface UpdateTicketResponse {
  ticket: Ticket;
  message: string;
}

export interface DepartmentListResponse {
  departments: Array<{
    id: string;
    name: string;
    adminId?: string;
  }>;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, string[]>;
  };
}

// Request types
export interface LoginRequest {
  email: string;
  password: string;
  role: User['role'];
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  department?: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  institute: string;
  location: string;
  roomNumber: string;
  department: string;
  priority: Ticket['priority'];
  imageFile?: File;
}

export interface UpdateTicketRequest {
  status?: Ticket['status'];
  message?: string;
  priority?: Ticket['priority'];
}