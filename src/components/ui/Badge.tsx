import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  label?: string;  // Accessible label for screen readers
  role?: 'status' | 'alert' | undefined;  // For dynamic content that needs to be announced
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  label,
  role
}) => {
  const variantClasses = {
    default: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300',
    success: 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300',
    warning: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300',
    danger: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
  };

  // Semantic status roles based on variant
  const defaultRole = variant === 'danger' ? 'alert' : variant === 'warning' ? 'status' : undefined;

  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${variantClasses[variant]}`}
      role={role || defaultRole}
      aria-label={label}
    >
      {children}
    </span>
  );
};