'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ChatBubbleLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Document {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: Comment[];
  uploadedBy: string;
  uploadedAt: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

const categories = [
  { id: 'borrower', name: 'Borrower', description: 'Identity, income, and credit documents' },
  { id: 'property', name: 'Property', description: 'Property details and appraisal' },
  { id: 'escrow', name: 'Escrow', description: 'Escrow and title documents' },
  { id: 'insurance', name: 'Insurance', description: 'Insurance certificates and policies' },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [commentText, setCommentText] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const newDocs = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      category: selectedCategory,
      status: 'pending' as const,
      comments: [],
      uploadedBy: 'Current User',
      uploadedAt: new Date().toISOString(),
    }));
    setDocuments([...documents, ...newDocs]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleStatusChange = (docId: string, status: 'approved' | 'rejected') => {
    setDocuments(docs =>
      docs.map(doc =>
        doc.id === docId ? { ...doc, status } : doc
      )
    );
  };

  const addComment = (docId: string) => {
    if (!commentText.trim()) return;

    setDocuments(docs =>
      docs.map(doc =>
        doc.id === docId
          ? {
              ...doc,
              comments: [
                ...doc.comments,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  text: commentText,
                  author: 'Current User',
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : doc
      )
    );
    setCommentText('');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Document Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Upload and manage loan documents by category
          </p>
        </div>
      </div>

      <div className="mt-8 flex">
        {/* Categories sidebar */}
        <div className="w-64 pr-4">
          <nav className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Upload zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag and drop files here, or click to select files'}
            </p>
          </div>

          {/* Document list */}
          <div className="mt-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Document Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {documents
                    .filter((doc) => doc.category === selectedCategory)
                    .map((document) => (
                      <tr key={document.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                          {document.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {categories.find((c) => c.id === document.category)?.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              document.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : document.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStatusChange(document.id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(document.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setSelectedDocument(document)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <ChatBubbleLeftIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Comment sidebar */}
        {selectedDocument && (
          <div className="w-96 pl-4 border-l">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {selectedDocument.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">{comment.author}</span>
                      <span className="text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{comment.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  rows={3}
                />
                <button
                  onClick={() => addComment(selectedDocument.id)}
                  className="mt-2 w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 