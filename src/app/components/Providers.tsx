'use client';

import { ReactNode } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { UserProvider } from '@/contexts/UserContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </UserProvider>
  );
} 