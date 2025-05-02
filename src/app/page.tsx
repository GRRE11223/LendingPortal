'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// 默认管理员账户
const ADMIN_USER = {
  id: 'admin',
  email: 'admin@example.com',
  password: 'admin123',
  name: 'Admin',
  role: 'admin',
  avatar: null
};

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    setIsLoading(true);
    setError('');

    try {
      console.log('Checking credentials:', { email, password });
      
      // 检查是否是管理员账户
      if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
        console.log('Admin login successful');
        localStorage.setItem('user', JSON.stringify(ADMIN_USER));
        router.push('/dashboard');
        return;
      }

      // 检查注册用户
      let registeredUsers = [];
      try {
        const registeredUsersStr = localStorage.getItem('registeredUsers');
        console.log('Registered users from localStorage:', registeredUsersStr);
        
        if (registeredUsersStr) {
          registeredUsers = JSON.parse(registeredUsersStr);
          console.log('Parsed registered users:', registeredUsers);
        }
      } catch (e) {
        console.error('Error parsing registered users:', e);
        setError('An error occurred while retrieving user data');
        setIsLoading(false);
        return;
      }

      if (!Array.isArray(registeredUsers) || registeredUsers.length === 0) {
        console.log('No registered users found');
        setError('No registered users found. Please register first.');
        setIsLoading(false);
        return;
      }

      const user = registeredUsers.find((u: any) => u.email === email);
      console.log('Found user:', user);
      
      if (!user) {
        setError('Email or password is incorrect');
        setIsLoading(false);
        return;
      }

      if (user.password !== password) {
        setError('Email or password is incorrect');
        setIsLoading(false);
        return;
      }

      console.log('Login successful, redirecting to dashboard');
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Image
            className="mx-auto w-auto"
            src="/logo.png"
            alt="Company Logo"
            width={200}
            height={50}
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
          <form className="space-y-6" onSubmit={handleSubmit} method="POST">
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

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className={`flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/register"
                className={`flex w-full justify-center rounded-md border border-transparent bg-gray-100 py-2 px-4 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isLoading ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 