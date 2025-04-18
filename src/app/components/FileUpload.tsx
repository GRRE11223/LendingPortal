'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  accept?: Record<string, string[]>;
}

export default function FileUpload({ onUpload, maxFiles = 5, accept }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files];
    acceptedFiles.forEach(file => {
      if (!files.find(f => f.name === file.name)) {
        newFiles.push(file);
      }
    });
    const finalFiles = newFiles.slice(0, maxFiles);
    setFiles(finalFiles);
    onUpload(finalFiles);
  }, [files, maxFiles, onUpload]);

  const removeFile = (fileName: string) => {
    const newFiles = files.filter(file => file.name !== fileName);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          {isDragActive ? (
            '将文件放在这里...'
          ) : (
            <>
              将文件拖放到此处，或者
              <span className="text-blue-500 hover:text-blue-600"> 点击选择文件</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          最多上传 {maxFiles} 个文件
        </p>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.name} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center">
                  <DocumentIcon className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.name)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 