export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'sub_admin' | 'super_admin';
  department?: string; // For dept_admin users
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  institute: string;
  location: string;
  roomNumber: string;
  department: string;
  imageUrl?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved';
  submittedBy: {
    name: string;
    email: string;
    id: string;
  };
  submissionDate: string;
  updates: TicketUpdate[];
}

export interface TicketUpdate {
  id: string;
  message: string;
  timestamp: string;
  updatedBy: {
    name: string;
    role: string;
  };
  status?: 'pending' | 'in-progress' | 'resolved';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}