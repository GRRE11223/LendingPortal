'use client';

import { useState, useMemo } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { Document, LoanRequest } from '@/types';
import DocumentManager from './DocumentManager';

interface PostFundingModuleProps {
  request: LoanRequest;
  onDocumentUpload: (file: File, category: string) => Promise<void>;
  onStatusChange: (documentId: string, status: Document['status']) => Promise<void>;
  onAddComment: (documentId: string, comment: string) => Promise<void>;
}

export default function PostFundingModule({
  request,
  onDocumentUpload,
  onStatusChange,
  onAddComment,
}: PostFundingModuleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [comment, setComment] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
  const [draggedFile, setDraggedFile] = useState<number | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const folders = [
    { id: 'funding-confirmation', name: 'Funding Confirmation', icon: '💰', required: true },
    { id: 'wire-transfer', name: 'Wire Transfer', icon: '🏦', required: true },
    { id: 'closing-statement', name: 'Final Closing Statement', icon: '📄', required: true },
    { id: 'recorded-documents', name: 'Recorded Documents', icon: '📋', required: true },
    { id: 'insurance-policies', name: 'Insurance Policies', icon: '🔒', required: true },
    { id: 'other-post-funding', name: 'Other Documents', icon: '📁', required: false },
  ];

  const getFilesInFolder = (folderId: string) => {
    return request?.documents?.filter(doc => doc.category === folderId) || [];
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleFolderDragEnter = (folderId: string) => {
    setDragOverFolder(folderId);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleFolderDrop = (folderId: string) => {
    setDraggedFile(null);
    setDragOverFolder(null);
    setSelectedCategory(folderId);
  };

  // Calculate document completion status
  const documentStatus = useMemo(() => {
    const requiredCategories = folders.filter(cat => cat.required);
    const uploadedCategories = new Set(request?.documents?.map(doc => doc.category) || []);
    
    const categoryStatus = folders.map(category => {
      const documents = request?.documents?.filter(doc => doc.category === category.id) || [];
      const hasDocument = documents.length > 0;
      const isApproved = documents.some(doc => doc.status === 'approved');
      const isRejected = documents.some(doc => doc.status === 'rejected');
      const isPending = hasDocument && !isApproved && !isRejected;
      
      return {
        ...category,
        hasDocument,
        isApproved,
        isRejected,
        isPending,
        documents
      };
    });

    const totalRequired = requiredCategories.length;
    const completedRequired = categoryStatus
      .filter(cat => cat.required)
      .filter(cat => {
        const docs = cat.documents;
        return docs.length > 0 && docs.some(doc => doc.status === 'approved');
      })
      .length;

    const progress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

    // Update the request's progress in localStorage
    const storedRequests = localStorage.getItem('loanRequests');
    if (storedRequests && request) {
      const parsedRequests = JSON.parse(storedRequests);
      const updatedRequests = parsedRequests.map((r: LoanRequest) => {
        if (r.id === request.id) {
          return {
            ...r,
            progress: {
              ...r.progress,
              postFunding: Math.round(progress)
            }
          };
        }
        return r;
      });
      localStorage.setItem('loanRequests', JSON.stringify(updatedRequests));
    }

    return {
      categoryStatus,
      progress,
      totalRequired,
      completedRequired,
    };
  }, [request?.documents, folders, request?.id]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedCategory) return;

    const file = files[0];
    await onDocumentUpload(file, selectedCategory);
    // Clear the input
    event.target.value = '';
  };

  const handlePreview = (document: Document) => {
    const latestVersion = document.versions[document.versions.length - 1];
    if (latestVersion?.url) {
      // For PDFs, we'll open in a new tab as it's more reliable
      if (latestVersion.fileName.toLowerCase().endsWith('.pdf')) {
        window.open(latestVersion.url, '_blank');
      } else {
        // For images, we'll show in the modal
        setPreviewUrl(latestVersion.url);
        setShowPreview(true);
      }
    }
  };

  const handleDownload = async (document: Document) => {
    const latestVersion = document.versions[document.versions.length - 1];
    if (!latestVersion?.url) return;

    try {
      const response = await fetch(latestVersion.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = latestVersion.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.length && selectedCategory) {
      await onDocumentUpload(files[0], selectedCategory);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Post Funding Documents</h2>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Folders List */}
          <div className="col-span-3 bg-gray-50 rounded-xl">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Document Folders</h3>
              <div className="space-y-1">
                {folders.map((folder) => {
                  const filesInFolder = getFilesInFolder(folder.id);
                  const isExpanded = expandedFolders[folder.id];
                  const isSelected = selectedCategory === folder.id;
                  
                  return (
                    <div key={folder.id} className="select-none">
                      <div
                        onClick={() => {
                          toggleFolder(folder.id);
                          setSelectedCategory(folder.id);
                        }}
                        onDragEnter={() => handleFolderDragEnter(folder.id)}
                        onDragLeave={handleFolderDragLeave}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleFolderDrop(folder.id)}
                        className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors
                          ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}
                          ${dragOverFolder === folder.id ? 'bg-blue-50 border-2 border-blue-200' : ''}`}
                      >
                        <span className="text-lg mr-2">{folder.icon}</span>
                        <span className="text-sm flex-1">{folder.name}</span>
                        {folder.required && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">Required</span>
                        )}
                        {filesInFolder.length > 0 && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {filesInFolder.length}
                          </span>
                        )}
                      </div>
                      
                      {isExpanded && filesInFolder.length > 0 && (
                        <div className="ml-8 mt-1 space-y-1">
                          {filesInFolder.map((doc, index) => (
                            <div
                              key={doc.id}
                              className="text-xs text-gray-600 py-1 px-2 rounded hover:bg-gray-100"
                            >
                              {doc.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="col-span-9">
            {selectedCategory ? (
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all
                    ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <ArrowUpTrayIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {dragActive ? 'Drop your files here' : 'Upload files'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Drag and drop files here, or click to select
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Supported formats: PDF, DOC, DOCX, JPG, PNG (up to 10MB)
                    </p>
                  </label>
                </div>

                {/* Document List */}
                {request?.documents?.filter(doc => doc.category === selectedCategory).length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="divide-y divide-gray-100">
                      {request.documents
                        .filter(doc => doc.category === selectedCategory)
                        .map((document) => (
                          <div key={document.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <DocumentIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{document.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded {new Date(document.versions[0].uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {document.status === 'approved' && (
                                  <span className="flex items-center text-green-700 text-xs">
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Approved
                                  </span>
                                )}
                                {document.status === 'rejected' && (
                                  <span className="flex items-center text-red-700 text-xs">
                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                    Rejected
                                  </span>
                                )}
                                {document.status === 'pending' && (
                                  <span className="flex items-center text-yellow-700 text-xs">
                                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                                    Pending
                                  </span>
                                )}
                                <button
                                  onClick={() => handlePreview(document)}
                                  className="text-gray-400 hover:text-gray-500"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No documents uploaded yet
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No folder selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please select a folder from the left to upload or view documents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Document Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="Document preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 