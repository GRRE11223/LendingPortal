'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface UserContextType {
  user: User | null;
  updateUser: (userData: Partial<User>) => void;
}

const defaultUser: User = {
  id: 'guest',
  name: 'Guest User',
  email: '',
  avatar: null
};

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  updateUser: () => {}
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);

  useEffect(() => {
    // 初始化时从 localStorage 读取用户数据
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      const updated = { ...prev, ...userData };
      // 更新 localStorage
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    updateUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 