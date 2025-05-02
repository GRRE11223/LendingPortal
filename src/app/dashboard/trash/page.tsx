'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  versions: {
    id: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    fileName: string;
    size: number;
    type: string;
  }[];
  comments: {
    id: string;
    user: string;
    content: string;
    timestamp: string;
  }[];
}

interface TrashLoanRequest {
  id: string;
  originalId: string;
  borrowerName: string;
  deletedAt: string;
  canRestore: boolean;
  documents: Document[];
}

export default function TrashPage() {
  const router = useRouter();
  const [trashItems, setTrashItems] = useState<TrashLoanRequest[]>([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const loadTrashItems = () => {
      const trashStr = localStorage.getItem('trashLoanRequests');
      if (trashStr) {
        const items = JSON.parse(trashStr);
        setTrashItems(items);
      }
    };

    loadTrashItems();
  }, []);

  const handleRestore = (item: TrashLoanRequest) => {
    // Get current active requests
    const storedRequests = localStorage.getItem('loanRequests');
    const activeRequests = storedRequests ? JSON.parse(storedRequests) : [];

    // Restore the item to active requests
    const restoredItem = {
      ...item,
      id: item.originalId
    };
    delete (restoredItem as any).deletedAt;
    delete (restoredItem as any).originalId;
    delete (restoredItem as any).canRestore;

    activeRequests.push(restoredItem);
    localStorage.setItem('loanRequests', JSON.stringify(activeRequests));

    // Remove from trash
    const updatedTrash = trashItems.filter(i => i.originalId !== item.originalId);
    setTrashItems(updatedTrash);
    localStorage.setItem('trashLoanRequests', JSON.stringify(updatedTrash));

    // Restore individual request details
    localStorage.setItem(`request_${item.originalId}`, JSON.stringify(restoredItem));

    setShowRestoreConfirm(null);
  };

  const handlePermanentDelete = (item: TrashLoanRequest) => {
    // Remove from trash
    const updatedTrash = trashItems.filter(i => i.originalId !== item.originalId);
    setTrashItems(updatedTrash);
    localStorage.setItem('trashLoanRequests', JSON.stringify(updatedTrash));

    setShowDeleteConfirm(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
      </div>

      {trashItems.length === 0 ? (
        <div className="text-center py-12">
          <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items in trash</h3>
          <p className="mt-1 text-sm text-gray-500">Deleted loan requests will appear here</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {trashItems.map((item) => (
              <li key={item.originalId}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.borrowerName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Deleted on {new Date(item.deletedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowRestoreConfirm(item.originalId)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(item.originalId)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span>Delete Permanently</span>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Restore</h3>
            <p className="text-gray-500 mb-6">
              This loan request will be restored to your active requests. Do you want to continue?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRestoreConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(trashItems.find(i => i.originalId === showRestoreConfirm)!)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Permanent Delete</h3>
            <p className="text-gray-500 mb-6">
              This loan request will be permanently deleted and cannot be restored. Do you want to continue?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePermanentDelete(trashItems.find(i => i.originalId === showDeleteConfirm)!)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 