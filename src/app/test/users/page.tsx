'use client';

import { useEffect, useState } from 'react';
import { updatedTestUsers } from '@/app/api/complete-registration/route';
import Link from 'next/link';

export default function TestUsers() {
  const [users, setUsers] = useState(updatedTestUsers);

  // 每秒更新一次用户列表以显示最新状态
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers([...updatedTestUsers]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Test Users Status</h1>
            <Link
              href="/test/register"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Go to Registration Page
            </Link>
          </div>
          
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Email: {user.email}</p>
                    <p className="text-sm text-gray-500">
                      Role: {user.role?.name || 'Unknown'} 
                      {user.role?.permissions && (
                        <span className="text-xs ml-2">
                          ({user.role.permissions.join(', ')})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: <span className={user.status === 'active' ? 'text-green-600' : 'text-yellow-600'}>
                        {user.status}
                      </span>
                    </p>
                    {user.registrationToken && (
                      <p className="text-sm text-gray-500 break-all">
                        Registration Token: {user.registrationToken}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(user.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Updated: {new Date(user.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.status === 'active' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Registered
                      </span>
                    ) : (
                      <Link
                        href={`/register?token=${user.registrationToken}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Register
                      </Link>
                    )}
                  </div>
                </div>
                {user.passwordHash && (
                  <p className="text-xs text-gray-400 mt-2 break-all">
                    Password hash: {user.passwordHash}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 