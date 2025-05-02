'use client';

import { useEffect, useState } from 'react';
import { getCurrentTestUsers } from '@/app/api/test-users';
import type { TestUser } from '@/app/api/test-users';

export default function TestPage() {
  const [users, setUsers] = useState<TestUser[]>([]);

  useEffect(() => {
    setUsers(getCurrentTestUsers());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Users</h1>
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
              <p className="text-sm text-gray-600">Status: {user.status}</p>
              {user.registrationToken && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Registration Link:</p>
                  <a
                    href={`/register?token=${user.registrationToken}`}
                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    /register?token={user.registrationToken}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 