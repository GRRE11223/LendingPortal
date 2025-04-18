'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: Record<string, string[]>;
}

export default function FileUpload({ onUpload, accept }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        拖放文件到此处，或点击选择文件
      </p>
      <p className="mt-1 text-xs text-gray-500">
        支持 PDF、PNG、JPG 格式
      </p>
    </div>
  );
} 