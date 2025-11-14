import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserCheck,
  Mail,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDepartments } from '../../contexts/DepartmentContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api';

// Types
interface User {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface Department {
  name: string;
  total: number;
  students: number;
  faculty: number;
  subAdmins: number;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const { departments } = useDepartments();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string>('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    department: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchUsers();
        await fetchDepartments();
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load initial data');
        if (err instanceof Error && err.message === 'Access denied') {
          toast.error('Access denied. Please make sure you have the right permissions.');
        } else {
          toast.error('Failed to load user data. Please try again.');
        }
      }
    };
    loadData();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request<{ users: User[] }>('GET', '/users');
      if (response.success && response.data) {
        setUsers(response.data.users);
        setError('');
      } else {
        throw new Error(response.error?.message || 'Failed to load users');
      }
    } catch (error: unknown) {
      const message = (error instanceof Error && error.message) ? error.message : 'Failed to load users';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.request<{ departments: Department[] }>('GET', '/departments');
      if (response.success && response.data) {
        // Departments fetch for reference (not stored locally currently)
        return response.data.departments;
      } else {
        throw new Error(response.error?.message || 'Failed to load departments');
      }
    } catch (error: unknown) {
      const message = (error instanceof Error && error.message) ? error.message : 'Failed to load departments';
      toast.error(message);
      throw error;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async () => {
    try {
      // Enforce department requirement for specific roles
      const roleNeedsDept = ['student', 'faculty', 'sub_admin'].includes(newUser.role);
      const payload = { ...newUser };

      // If current user is sub_admin, lock department to their own
      if (currentUser?.role === 'sub_admin') {
        payload.department = currentUser.department || '';
      }

      if (roleNeedsDept && !payload.department) {
        toast.error('Department is required for the selected role');
        return;
      }

      const response = await apiClient.request<{ user: User }>('POST', '/users', payload);
      if (response.success && response.data) {
        const createdUser = response.data.user;
        setUsers([...users, createdUser]);
        setNewUser({ name: '', email: '', role: 'student', password: '', department: '' });
        setIsAddModalOpen(false);
        toast.success('User added successfully!');
      } else {
        throw new Error(response.error?.message || 'Failed to add user');
      }
    } catch (error: unknown) {
      const message = (error instanceof Error && error.message) ? error.message : 'Failed to add user';
      toast.error(message);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const userId = selectedUser._id || selectedUser.id;
      const response = await apiClient.request<{ user: User }>(
        'PUT',
        `/users/${userId}`,
        selectedUser
      );

      if (response.success && response.data && response.data.user) {
        setUsers(users.map(u => (u._id || u.id) === userId ? (response.data?.user || u) : u));
        setIsEditModalOpen(false);
        setSelectedUser(null);
        toast.success('User updated successfully!');
      } else {
        throw new Error(response.error?.message || 'Failed to update user');
      }
    } catch (error: unknown) {
      const message = (error instanceof Error && error.message) ? error.message : 'Failed to update user';
      toast.error(message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === (currentUser?._id || currentUser?.id)) {
      toast.error('Cannot delete your own account!');
      return;
    }

    try {
      const response = await apiClient.request<void>('DELETE', `/users/${userId}`);
      
      if (response.success) {
        setUsers(users.filter(u => (u._id || u.id) !== userId));
        toast.success('User deleted successfully!');
      } else {
        throw new Error(response.error?.message || 'Failed to delete user');
      }
    } catch (error: unknown) {
      const message = (error instanceof Error && error.message) ? error.message : 'Failed to delete user';
      toast.error(message);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser({ ...user });
    setIsEditModalOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'danger';
      case 'sub_admin': return 'warning';
      case 'faculty': return 'warning';
      case 'student': return 'default';
      default: return 'default';
    }
  };

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'sub_admin', label: 'Sub Admin' },
    { value: 'super_admin', label: 'Super Admin (Master)' }
  ];

  const newUserRoleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'sub_admin', label: 'Sub Admin (Department)' }
  ];

  // Only Super Admin can create other Super Admins
  const allRoleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'sub_admin', label: 'Sub Admin (Department)' },
    { value: 'super_admin', label: 'Super Admin (Master)' }
  ];

  const availableRoleOptions = currentUser?.role === 'super_admin' ? allRoleOptions : newUserRoleOptions;

  const getUserStats = () => {
    const total = users.length;
    const students = users.filter(u => u.role === 'student').length;
    const faculty = users.filter(u => u.role === 'faculty').length;
    const subAdmins = users.filter(u => u.role === 'sub_admin').length;
    const superAdmins = users.filter(u => u.role === 'super_admin').length;
    return { total, students, faculty, subAdmins, superAdmins };
  };

  const stats = getUserStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-8 py-12 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Users className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">User Management</h1>
                <p className="text-emerald-100 text-lg font-medium">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    Total Users
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-50 rounded-xl">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    Students
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.students}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <UserCheck className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    Faculty
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.faculty}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    Sub Admins
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.subAdmins}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-red-50 rounded-xl">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-gray-600 truncate">
                    Master Admins
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.superAdmins}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="px-8 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter & Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-xl overflow-hidden rounded-2xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                          <span className="text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {user.name}
                          {user.department && (
                            <span className="text-xs text-gray-500 block">
                              {user.department}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user._id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getRoleColor(user.role)}>
                      {user.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        className="hover:scale-105 transition-transform"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {user._id !== currentUser?._id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id)}
                          className="hover:scale-105 transition-transform"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Enter full name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Enter email address"
            required
          />
          <Select
            label="Role"
            options={availableRoleOptions}
            value={newUser.role}
            onChange={(e) => {
              const role = e.target.value;
              // If current user is sub_admin, keep department locked to their own
              const lockedDept = currentUser?.role === 'sub_admin' ? (currentUser.department || '') : newUser.department;
              setNewUser({ ...newUser, role, department: lockedDept });
            }}
            required
          />
          {['student','faculty','sub_admin'].includes(newUser.role) && (
            <Select
              label="Department"
              options={([
                { value: '', label: 'Select Department' },
                ...((departments && departments.length > 0 ? departments : [
                  { name: 'Computer Science' },
                  { name: 'Electrical' },
                  { name: 'Mechanical' },
                  { name: 'Civil' }
                ]).map(d => ({ value: d.name, label: d.name })))
              ])}
              value={currentUser?.role === 'sub_admin' ? (currentUser.department || '') : (newUser.department || '')}
              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              required
              disabled={currentUser?.role === 'sub_admin'}
            />
          )}
          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Enter password"
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              Add User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={selectedUser.name}
              onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={selectedUser.email}
              onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
            <Select
              label="Role"
              options={newUserRoleOptions}
              value={selectedUser.role}
              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
              required
            />
            {['student','faculty','sub_admin'].includes(selectedUser.role) && (
              <Select
                label="Department"
                options={([
                  { value: '', label: 'Select Department' },
                  ...((departments && departments.length > 0 ? departments : [
                    { name: 'Computer Science' },
                    { name: 'Electrical' },
                    { name: 'Mechanical' },
                    { name: 'Civil' }
                  ]).map(d => ({ value: d.name, label: d.name })))
                ])}
                value={selectedUser.department || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                required
                disabled={currentUser?.role === 'sub_admin'}
              />
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditUser}>
                Update User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};