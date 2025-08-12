import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, X, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { institutes, locations, departments } from '../../data/mockData';
import toast from 'react-hot-toast';

export const TicketForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    institute: '',
    location: '',
    roomNumber: '',
    department: '',
    imageFile: null as File | null,
    description: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { user } = useAuth();
  const { createTicket } = useTickets();
  const navigate = useNavigate();

  const handleImageUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload only image files');
      return;
    }
    
    setFormData({ ...formData, imageFile: file });
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageFile: null });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you would upload the image to a server here
      // For demo purposes, we'll use a placeholder URL
      const imageUrl = formData.imageFile ? `https://via.placeholder.com/400x300?text=Uploaded+Image` : undefined;
      
      createTicket({
        ...formData,
        imageUrl,
        priority: formData.priority as 'low' | 'medium' | 'high',
        status: 'pending',
        submittedBy: {
          name: user!.name,
          email: user!.email,
          id: user!.id
        }
      });
      
      toast.success('Ticket submitted successfully!');
      navigate('/tickets');
    } catch (error) {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const instituteOptions = [
    { value: '', label: 'Select Institute' },
    ...institutes.map(inst => ({ value: inst, label: inst }))
  ];
  
  const locationOptions = [
    { value: '', label: 'Select Class/Staff Room/Lab' },
    ...locations.map(loc => ({ value: loc, label: loc }))
  ];
  
  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map(dept => ({ value: dept, label: dept }))
  ];
  
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Submit New Ticket</h1>
        <p className="text-base sm:text-lg text-gray-600">Create a detailed support request for any issues you're experiencing</p>
      </div>
      
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center">
            <div className="p-2 sm:p-3 bg-blue-50 rounded-xl mr-3 sm:mr-4">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            Submit New Ticket
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* 1. Title */}
            <Input
              label="Issue Title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              className="text-base sm:text-lg"
              required
            />
            
            {/* 2. Institute Selection */}
            <Select
              label="Institute"
              options={instituteOptions}
              value={formData.institute}
              onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
              required
            />
            
            {/* 3. Location (Class/Staff Room/Lab) */}
            <Select
              label="Location (Class/Staff Room/Lab)"
              options={locationOptions}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
            
            {/* 4. Room Number */}
            <Input
              label="Room Number"
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              placeholder="Enter room number (e.g., 201, Lab-A, Main Hall)"
              required
            />
            
            {/* 5. Department */}
            <Select
              label="Department"
              options={departmentOptions}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            />
            
            {/* 6. Image Upload */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Upload Image (Optional)
              </label>
              
              {!imagePreview ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-200 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">
                        Drop your image here, or <span className="text-blue-600">browse</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Supports: JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-sm sm:max-w-md h-48 sm:h-64 object-cover rounded-xl border border-gray-200 shadow-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* 7. Description */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Detailed Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base leading-relaxed resize-none"
                placeholder="Please provide a detailed description of the issue, including when it occurred, what you were trying to do, and any error messages you received..."
                required
              />
            </div>
            
            {/* 8. Priority */}
            <Select
              label="Priority Level"
              options={priorityOptions}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              required
            />
            
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/tickets')}
                size="lg"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                size="lg"
                className="w-full sm:w-auto hover:scale-105 transition-transform shadow-lg"
              >
                Submit Ticket
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};