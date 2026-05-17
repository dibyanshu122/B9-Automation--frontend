import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useApi } from './useApi';

export const useAuth = () => {
  const { user, token, setUser, setToken, logout } = useAuthStore();
  const router = useRouter();
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    if (token) {
      try {
        const response = await get('/api/auth/me');
        setUser(response.data);
      } catch {
        logout();
        router.push('/login');
      }
    }
    setLoading(false);
  };

  const loginUser = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const response = await useApi().post('/api/auth/login', { email, password });
      const { token, user_id, email: userEmail, name, plan, subscription_status } = response.data;
      setUser({
        id: user_id,
        email: userEmail,
        name,
        plan,
        subscription_status,
      });
      setToken(token);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signupUser = async (name: string, email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const response = await useApi().post('/api/auth/signup', {
        name,
        email,
        password,
      });
      const {
        token,
        user_id,
        email: userEmail,
        name: userName,
        plan,
        subscription_status,
      } = response.data;
      setUser({
        id: user_id,
        email: userEmail,
        name: userName,
        plan,
        subscription_status,
      });
      setToken(token);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logoutUser = () => {
    logout();
    router.push('/');
  };

  return {
    user,
    token,
    loading,
    isAuthenticating,
    isAuthenticated: !!user && !!token,
    loginUser,
    signupUser,
    logoutUser,
  };
};
