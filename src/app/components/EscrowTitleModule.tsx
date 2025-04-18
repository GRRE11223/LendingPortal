'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Document, LoanRequest } from '@/types';

interface EscrowTitleModuleProps {
  request: LoanRequest;
  onDocumentUpload: (file: File, category: string, section?: 'escrow' | 'title') => Promise<void>;
  onStatusChange: (documentId: string, status: Document['status'], section?: 'escrow' | 'title') => Promise<void>;
  onAddComment: (documentId: string, comment: string, section?: 'escrow' | 'title') => Promise<void>;
  onInfoUpdate: (info: any, section: 'escrow' | 'title') => Promise<void>;
  onProgressUpdate?: (progress: number, section: 'escrow' | 'title') => void;
}

export default function EscrowTitleModule({
  request,
  onDocumentUpload,
  onStatusChange,
  onAddComment,
  onInfoUpdate,
  onProgressUpdate,
}: EscrowTitleModuleProps) {
  const [activeSection, setActiveSection] = useState<'escrow' | 'title'>('escrow');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [comment, setComment] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const categories = activeSection === 'escrow' ? [
    { id: 'escrow-agreement', name: 'Escrow Agreement', required: true },
    { id: 'preliminary-report', name: 'Preliminary Report', required: true },
    { id: 'closing-statement', name: 'Closing Statement', required: true },
    { id: 'wire-instructions', name: 'Wire Instructions', required: true },
    { id: 'other-escrow', name: 'Other Escrow Documents', required: false },
  ] : [
    { id: 'title-report', name: 'Title Report', required: true },
    { id: 'title-insurance', name: 'Title Insurance', required: true },
    { id: 'ownership-docs', name: 'Ownership Documents', required: true },
    { id: 'lien-docs', name: 'Lien Documents', required: true },
    { id: 'other-title', name: 'Other Title Documents', required: false },
  ];

  // Calculate document completion status
  const documentStatus = useMemo(() => {
    const sectionInfo = activeSection === 'escrow' ? request.escrowInfo : request.titleInfo;
    const documents = sectionInfo?.documents || [];
    
    const requiredCategories = categories.filter(cat => cat.required);
    
    const categoryStatus = categories.map(category => {
      const categoryDocs = documents.filter(doc => doc.category === category.id);
      const hasDocument = categoryDocs.length > 0;
      const isApproved = categoryDocs.some(doc => doc.status === 'approved');
      const isRejected = categoryDocs.some(doc => doc.status === 'rejected');
      const isPending = hasDocument && !isApproved && !isRejected;
      
      return {
        ...category,
        hasDocument,
        isApproved,
        isRejected,
        isPending,
        documents: categoryDocs
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
    const roundedProgress = Math.round(progress);

    // Notify parent component of progress update
    onProgressUpdate?.(roundedProgress, activeSection);

    return {
      categoryStatus,
      progress: roundedProgress,
      totalRequired,
      completedRequired,
    };
  }, [request.escrowInfo, request.titleInfo, categories, activeSection, onProgressUpdate]);

  useEffect(() => {
    // 当切换section时重置选中的类别
    setSelectedCategory('');
  }, [activeSection]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedCategory) return;

    const file = files[0];
    await onDocumentUpload(file, selectedCategory, activeSection);
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
      await onDocumentUpload(files[0], selectedCategory, activeSection);
    }
  };

  const handleApprove = async (docId: string) => {
    await onStatusChange(docId, 'approved', activeSection);
  };

  const handleReject = async (docId: string) => {
    await onStatusChange(docId, 'rejected', activeSection);
  };

  const handleCommentSubmit = async () => {
    if (selectedDoc && comment.trim()) {
      await onAddComment(selectedDoc.id, comment, activeSection);
      setComment('');
      setSelectedDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setActiveSection('escrow');
              setSelectedCategory('');
            }}
            className={`px-4 py-2 rounded-md ${
              activeSection === 'escrow'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Escrow
          </button>
          <button
            onClick={() => {
              setActiveSection('title');
              setSelectedCategory('');
            }}
            className={`px-4 py-2 rounded-md ${
              activeSection === 'title'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Title
          </button>
        </div>
      </div>

      {/* Officer Information */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {activeSection === 'escrow' ? 'Escrow' : 'Title'} Officer Information
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onInfoUpdate(request?.[`${activeSection}Info`], activeSection);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Officer Name</label>
            <p className="mt-1 text-sm text-gray-900">
              {request?.[`${activeSection}Info`]?.officerName || 'Not assigned'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">
              {request?.[`${activeSection}Info`]?.email || 'Not available'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1 text-sm text-gray-900">
              {request?.[`${activeSection}Info`]?.phone || 'Not available'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {activeSection === 'escrow' ? 'Escrow' : 'Title'} Document Checklist Progress
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {documentStatus.completedRequired} of {documentStatus.totalRequired} Required Documents
            </span>
            <span className="text-sm font-medium text-blue-600">
              {documentStatus.progress}%
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${documentStatus.progress}%` }}
          />
        </div>

        {/* Category Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {documentStatus.categoryStatus.map(category => (
            <div
              key={category.id}
              className={`p-3 rounded-lg border ${
                category.hasDocument
                  ? category.isApproved
                    ? 'border-green-200 bg-green-50'
                    : category.isRejected
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                {category.hasDocument ? (
                  category.isApproved ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : category.isRejected ? (
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-yellow-500" />
                  )
                ) : (
                  <DocumentIcon className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  {category.name}
                  {category.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
              <div className="mt-1 text-xs">
                {category.hasDocument ? (
                  category.isApproved ? (
                    <span className="text-green-600">Approved</span>
                  ) : category.isRejected ? (
                    <span className="text-red-600">Rejected</span>
                  ) : (
                    <span className="text-yellow-600">Pending Review</span>
                  )
                ) : (
                  <span className="text-gray-500">Not Uploaded</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Management */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Management</h3>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Categories List */}
          <div className="col-span-3 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Categories</h4>
            </div>
            <div className="space-y-2">
              {documentStatus.categoryStatus.map(category => {
                const docCount = category.documents.length;
                const approvedCount = category.documents.filter(doc => doc.status === 'approved').length;
                const rejectedCount = category.documents.filter(doc => doc.status === 'rejected').length;
                const pendingCount = docCount - approvedCount - rejectedCount;

                return (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer ${
                      selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex-1 flex items-center space-x-2">
                      <DocumentIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">
                        {category.name}
                        {category.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>
                    {docCount > 0 ? (
                      <div className="flex items-center space-x-1">
                        {approvedCount > 0 && (
                          <span className="flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-3 w-3 mr-0.5" />
                            {approvedCount}
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                            <ClipboardDocumentCheckIcon className="h-3 w-3 mr-0.5" />
                            {pendingCount}
                          </span>
                        )}
                        {rejectedCount > 0 && (
                          <span className="flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-800">
                            <ExclamationCircleIcon className="h-3 w-3 mr-0.5" />
                            {rejectedCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No files</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Upload and List */}
          <div className="col-span-9">
            {selectedCategory ? (
              <div className="space-y-4">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
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
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Drag and drop files here, or click to select files
                    </p>
                  </label>
                </div>

                {/* Document List */}
                <div className="divide-y divide-gray-200">
                  {documentStatus.categoryStatus
                    .find(cat => cat.id === selectedCategory)?.documents.map(doc => (
                      <div key={doc.id} className="flex items-center px-4 py-3">
                        <div className="flex-1 flex items-center">
                          <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded {new Date(doc.versions[0].uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="w-32 text-center text-sm text-gray-500">
                          {doc.category}
                        </div>
                        <div className="w-24 text-center">
                          {doc.status === 'pending' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                          {doc.status === 'approved' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          )}
                          {doc.status === 'rejected' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Rejected
                            </span>
                          )}
                        </div>
                        <div className="w-32 flex justify-center space-x-2">
                          <button
                            onClick={() => handlePreview(doc)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Preview"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleApprove(doc.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleReject(doc.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Reject"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Comment"
                          >
                            <ChatBubbleLeftIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a category to view and manage documents</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal - Only for Images */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Image Preview</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewUrl(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewUrl}
                alt="Document Preview"
                className="max-w-full max-h-[600px] mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              Comments for {selectedDoc.name}
            </h3>
            <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
              {selectedDoc.comments?.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{comment.user}</span>
                    <span className="text-gray-500">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                onClick={handleCommentSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add
              </button>
            </div>
            <button
              onClick={() => setSelectedDoc(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 