'use client';

import { useState } from 'react';
import { ChartBarIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface LoanRequest {
  id: string;
  type: string;
  status: string;
  createdAt: string;
}

const initialRequests: LoanRequest[] = [
  {
    id: '1',
    type: 'New loan',
    status: 'Waiting for a Banker',
    createdAt: 'Mar 16 2023 at 11:31 AM',
  },
  {
    id: '2',
    type: 'New loan',
    status: 'In Process (Consultant)',
    createdAt: 'Mar 16 2023 at 11:29 AM',
  },
  {
    id: '3',
    type: 'New loan',
    status: 'Accepted',
    createdAt: 'Mar 16 2023 at 11:18 AM',
  },
];

export default function RequestList() {
  const [requests] = useState<LoanRequest[]>(initialRequests);

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <span className="font-medium text-gray-900">{request.type}</span>
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {request.status}
              </span>
              <p className="text-sm text-gray-500">Created on {request.createdAt}</p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-500">
            <ChartBarIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
} 