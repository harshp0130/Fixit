import { useNavigate } from 'react-router-dom';

export const useLogout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all auth-related storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedRole');
    sessionStorage.clear();

    // Navigate to login page
    navigate('/login', { replace: true });
  };

  return handleLogout;
};