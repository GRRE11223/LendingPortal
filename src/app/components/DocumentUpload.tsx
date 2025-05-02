'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export interface Document {
  id: string;
  name: string;
  uploadDate: Date;
  status: 'approved' | 'rejected' | 'pending';
  type?: string;
  size?: number;
}

export interface DocumentUploadProps {
  documents: Document[];
  onUpload: (files: File[]) => void;
  onDelete: (documentId: string) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  onUpload,
  onDelete,
  acceptedFileTypes = ['application/pdf', 'image/*'],
  maxFiles = 10,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}),
    maxFiles,
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop files here, or click to select files'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Accepted files: {acceptedFileTypes.join(', ')}
        </p>
      </div>

      {documents.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Uploaded Documents</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded on {formatDate(doc.uploadDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-medium ${getStatusColor(doc.status)}`}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 