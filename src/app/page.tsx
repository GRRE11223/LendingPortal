'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { User, Role } from '@/types';

// 预设管理员账号
const ADMIN_CREDENTIALS = {
  email: 'geri@bluebono.com',
  password: 'admin123'
};

const defaultAdminRole: Role = {
  id: 'admin',
  name: 'Administrator',
  description: 'System Administrator',
  permissions: ['manage_users', 'manage_roles', 'manage_system_settings'],
  scope: 'admin',
  isCustom: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 先检查是否是预设管理员账号
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const adminUser: User = {
          id: 'admin',
          email: ADMIN_CREDENTIALS.email,
          firstName: 'Admin',
          lastName: 'User',
          role: defaultAdminRole,
          roleId: defaultAdminRole.id,
          status: 'active',
          isAdmin: true,
          brokerCompany: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('user', JSON.stringify(adminUser));
        router.push('/dashboard');
        return;
      }

      // 如果不是预设账号，则使用 Supabase 进行身份验证
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (user) {
        // 获取用户详细信息
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, roles(*)')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Image
            className="mx-auto w-auto"
            src="/logo.png"
            alt="Company Logo"
            width={400}
            height={100}
            priority
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Lending Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your lending dashboard
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 