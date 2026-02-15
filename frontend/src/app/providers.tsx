'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import Header from '@/components/layout/Header';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Header />
        <main>{children}</main>
      </NotificationProvider>
    </AuthProvider>
  );
}
