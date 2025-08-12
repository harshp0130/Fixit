import { User, Ticket, TicketUpdate } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@student.edu', role: 'student' },
  { id: '2', name: 'Jane Smith', email: 'jane@faculty.edu', role: 'faculty' },
  { id: '3', name: 'CS Sub Admin', email: 'cs.subadmin@system.com', role: 'sub_admin', department: 'Computer Science' },
  { id: '4', name: 'Mechanical Sub Admin', email: 'mech.subadmin@system.com', role: 'sub_admin', department: 'Mechanical' },
  { id: '5', name: 'Master Admin', email: 'master.admin@system.com', role: 'super_admin' },
];

export const mockTickets: Ticket[] = [
  {
    id: 'TCK-001',
    title: 'Broken Projector in Room 201',
    description: 'The projector in classroom 201 is not working. It shows a blue screen when connected to laptop.',
    institute: 'Engineering College',
    location: 'Classroom',
    roomNumber: '201',
    department: 'Computer Science',
    priority: 'high',
    status: 'pending',
    submittedBy: {
      name: 'John Doe',
      email: 'john@student.edu',
      id: '1'
    },
    submissionDate: '2024-01-15T10:30:00Z',
    updates: [
      {
        id: 'UPD-001',
        message: 'Ticket submitted successfully',
        timestamp: '2024-01-15T10:30:00Z',
        updatedBy: { name: 'System', role: 'system' }
      }
    ]
  },
  {
    id: 'TCK-002',
    title: 'WiFi Connection Issues in Library',
    description: 'Students are experiencing intermittent WiFi connectivity issues in the main library building.',
    institute: 'Central Library',
    location: 'Library',
    roomNumber: 'Main Hall',
    department: 'IT Services',
    priority: 'medium',
    status: 'in-progress',
    submittedBy: {
      name: 'Jane Smith',
      email: 'jane@faculty.edu',
      id: '2'
    },
    submissionDate: '2024-01-14T14:15:00Z',
    updates: [
      {
        id: 'UPD-002',
        message: 'Ticket submitted successfully',
        timestamp: '2024-01-14T14:15:00Z',
        updatedBy: { name: 'System', role: 'system' }
      },
      {
        id: 'UPD-003',
        message: 'Investigation started. IT team dispatched to check network equipment.',
        timestamp: '2024-01-14T16:00:00Z',
        updatedBy: { name: 'Admin User', role: 'admin' },
        status: 'in-progress'
      }
    ]
  },
  {
    id: 'TCK-003',
    title: 'Damaged Furniture in Cafeteria',
    description: 'Several tables and chairs in the cafeteria are damaged and need replacement.',
    institute: 'Student Center',
    location: 'Cafeteria',
    roomNumber: 'Ground Floor',
    department: 'Facilities Management',
    priority: 'low',
    status: 'resolved',
    submittedBy: {
      name: 'John Doe',
      email: 'john@student.edu',
      id: '1'
    },
    submissionDate: '2024-01-12T09:00:00Z',
    updates: [
      {
        id: 'UPD-004',
        message: 'Ticket submitted successfully',
        timestamp: '2024-01-12T09:00:00Z',
        updatedBy: { name: 'System', role: 'system' }
      },
      {
        id: 'UPD-005',
        message: 'Maintenance team notified',
        timestamp: '2024-01-12T11:30:00Z',
        updatedBy: { name: 'Admin User', role: 'admin' },
        status: 'in-progress'
      },
      {
        id: 'UPD-006',
        message: 'Furniture has been replaced. Issue resolved.',
        timestamp: '2024-01-13T15:45:00Z',
        updatedBy: { name: 'Admin User', role: 'admin' },
        status: 'resolved'
      }
    ]
  },
  {
    id: 'TCK-004',
    title: 'Air Conditioning Not Working',
    description: 'The AC unit in Room 305 is not functioning properly. Room temperature is too high.',
    institute: 'Engineering College',
    location: 'Classroom',
    roomNumber: '305',
    department: 'Mechanical Engineering',
    priority: 'high',
    status: 'pending',
    submittedBy: {
      name: 'Jane Smith',
      email: 'jane@faculty.edu',
      id: '2'
    },
    submissionDate: '2024-01-16T08:45:00Z',
    updates: [
      {
        id: 'UPD-007',
        message: 'Ticket submitted successfully',
        timestamp: '2024-01-16T08:45:00Z',
        updatedBy: { name: 'System', role: 'system' }
      }
    ]
  },
  {
    id: 'TCK-005',
    title: 'Parking Lot Light Out',
    description: 'Several lights in parking lot section B are not working, making it unsafe during evening hours.',
    institute: 'Campus Facilities',
    location: 'Parking Area',
    roomNumber: 'Section B',
    department: 'Electrical Maintenance',
    priority: 'medium',
    status: 'in-progress',
    submittedBy: {
      name: 'John Doe',
      email: 'john@student.edu',
      id: '1'
    },
    submissionDate: '2024-01-15T19:20:00Z',
    updates: [
      {
        id: 'UPD-008',
        message: 'Ticket submitted successfully',
        timestamp: '2024-01-15T19:20:00Z',
        updatedBy: { name: 'System', role: 'system' }
      },
      {
        id: 'UPD-009',
        message: 'Electrical team scheduled for tomorrow morning',
        timestamp: '2024-01-16T07:00:00Z',
        updatedBy: { name: 'Admin User', role: 'admin' },
        status: 'in-progress'
      }
    ]
  }
];

export const institutes = [
  'Engineering College',
  'Medical College',
  'Arts & Science College',
  'Business School',
  'Central Library',
  'Student Center',
  'Campus Facilities',
  'Administrative Building'
];

export const locations = [
  'Classroom',
  'Laboratory',
  'Staff Room',
  'Library',
  'Cafeteria',
  'Auditorium',
  'Parking Area',
  'Hostel',
  'Sports Complex',
  'Administrative Office'
];

export const departments = [
  'Computer Science',
  'Mechanical',
  'Food Tech',
  'Biotech'
];