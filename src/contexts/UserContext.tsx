'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as DBUser } from '@/types';

type User = DBUser;

interface UserContextType {
  user: User | null;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  updateUser: async () => {}
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // 获取用户详细信息
        const { data: userData, error } = await supabase
          .from('users')
          .select('*, roles(*)')
          .eq('id', session.user.id)
          .single();

        if (!error && userData) {
          setUser(userData as User);
        } else {
          console.error('Failed to fetch user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    // 初始化时检查当前会话
    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*, roles(*)')
        .eq('id', session.user.id)
        .single();

      if (!error && userData) {
        setUser(userData as User);
      }
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update user:', error);
      throw error;
    }

    setUser(prev => prev ? { ...prev, ...userData } : null);
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