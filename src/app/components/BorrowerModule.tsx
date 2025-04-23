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
  ChatBubbleLeftEllipsisIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Document, LoanRequest, BorrowerInfo } from '@/types';

interface BorrowerModuleProps {
  request: LoanRequest;
  onDocumentUpload: (file: File, categoryId: string) => Promise<void>;
  onStatusChange: (documentId: string, status: Document['status']) => Promise<void>;
  onAddComment: (documentId: string, comment: string) => Promise<void>;
  onInfoUpdate: (info: BorrowerInfo) => Promise<void>;
  onProgressUpdate: (progress: number) => void;
}

export default function BorrowerModule({
  request,
  onDocumentUpload,
  onInfoUpdate,
  onStatusChange,
  onAddComment,
  onProgressUpdate,
}: BorrowerModuleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [comment, setComment] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    name: request?.borrowerName || '',
    email: request?.borrowerInfo?.email || '',
    phone: request?.borrowerInfo?.phone || '',
    creditScore: request?.borrowerInfo?.creditScore || '',
    annualIncome: request?.borrowerInfo?.annualIncome || '',
    employmentStatus: request?.borrowerInfo?.employmentStatus || 'employed',
    employerName: request?.borrowerInfo?.employerName || '',
    employmentLength: request?.borrowerInfo?.employmentLength || '',
  });

  const categories = [
    { id: 'id', name: 'Identification', required: true },
    { id: 'income', name: 'Income Verification', required: true },
    { id: 'employment', name: 'Employment Verification', required: true },
    { id: 'bank-statements', name: 'Bank Statements', required: true },
    { id: 'tax-returns', name: 'Tax Returns', required: true },
    { id: 'other', name: 'Other Documents', required: false },
  ];

  // Calculate document completion status
  const documentStatus = useMemo(() => {
    const requiredCategories = categories.filter(cat => cat.required);
    const uploadedCategories = new Set(request?.documents?.map(doc => doc.category) || []);
    
    const categoryStatus = categories.map(category => {
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
    const roundedProgress = Math.round(progress);

    // Notify parent component of progress update
    onProgressUpdate(roundedProgress);

    return {
      categoryStatus,
      progress: roundedProgress,
      totalRequired,
      completedRequired,
    };
  }, [request?.documents, categories, request?.id, onProgressUpdate]);

  useEffect(() => {
    if (request) {
      setFormData({
        name: request.borrowerName || '',
        email: request.borrowerInfo?.email || '',
        phone: request.borrowerInfo?.phone || '',
        creditScore: request.borrowerInfo?.creditScore || '',
        annualIncome: request.borrowerInfo?.annualIncome || '',
        employmentStatus: request.borrowerInfo?.employmentStatus || 'employed',
        employerName: request.borrowerInfo?.employerName || '',
        employmentLength: request.borrowerInfo?.employmentLength || '',
      });
    }
  }, [request]);

  const handleInputChange = (field: string, value: string | number) => {
    let formattedValue = value;

    // Format phone number as user types
    if (field === 'phone') {
      // Remove all non-numeric characters
      const numbers = value.toString().replace(/\D/g, '');
      // Format as (XXX) XXX-XXXX
      if (numbers.length <= 10) {
        formattedValue = numbers.replace(/(\d{0,3})(\d{0,3})(\d{0,4})/, (_, p1, p2, p3) => {
          let parts = [];
          if (p1) parts.push(`(${p1}`);
          if (p2) parts.push(`) ${p2}`);
          if (p3) parts.push(`-${p3}`);
          return parts.join('');
        }).trim();
      }
    }

    // Format credit score
    if (field === 'creditScore') {
      formattedValue = value;
    }

    // Format annual income as user types
    if (field === 'annualIncome') {
      // Remove non-numeric characters except decimal point
      const numStr = value.toString().replace(/[^\d.]/g, '');
      // Ensure only one decimal point
      const parts = numStr.split('.');
      if (parts.length > 2) parts.splice(2);
      formattedValue = parts.join('.');
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue,
    }));
  };

  const handleSave = async () => {
    try {
      const updatedInfo: BorrowerInfo = {
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        creditScore: formData.creditScore ? parseInt(formData.creditScore.toString()) : 0,
        documents: request?.borrowerInfo?.documents || [],
        annualIncome: request?.borrowerInfo?.annualIncome || 0,
        employmentStatus: request?.borrowerInfo?.employmentStatus || 'employed',
        employerName: request?.borrowerInfo?.employerName || '',
        employmentLength: request?.borrowerInfo?.employmentLength || ''
      };

      await onInfoUpdate(updatedInfo);
      
      if (request) {
        request.borrowerName = formData.name.trim();
        request.borrowerInfo = updatedInfo;
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update borrower information:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

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

  const handleApprove = async (docId: string) => {
    await onStatusChange(docId, 'approved');
  };

  const handleReject = async (docId: string) => {
    await onStatusChange(docId, 'rejected');
  };

  const handleCommentSubmit = async () => {
    if (selectedDoc && comment.trim()) {
      await onAddComment(selectedDoc.id, comment);
      setComment('');
      setSelectedDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Tracking */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Document Checklist Progress</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {documentStatus.completedRequired} of {documentStatus.totalRequired} Required Documents
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(documentStatus.progress)}%
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

      {/* Borrower Information */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Borrower Information</h3>
            <p className="text-sm text-gray-500 mt-1">Manage borrower's personal details</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all duration-200"
          >
            {isEditing ? (
              <>
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit Details
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Name</div>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-white px-2 py-1 rounded border-gray-200 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter name"
              />
            ) : (
              <div className="text-sm font-medium text-gray-900">
                {request?.borrowerName || 'Not provided'}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Email</div>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-white px-2 py-1 rounded border-gray-200 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email"
              />
            ) : (
              <div className="text-sm font-medium text-gray-900">
                {request?.borrowerInfo?.email || 'Not provided'}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Phone</div>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full bg-white px-2 py-1 rounded border-gray-200 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(XXX) XXX-XXXX"
              />
            ) : (
              <div className="text-sm font-medium text-gray-900">
                {request?.borrowerInfo?.phone || 'Not provided'}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Credit Score</div>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.creditScore}
                  onChange={(e) => handleInputChange('creditScore', e.target.value)}
                  className={`w-full bg-white px-2 py-1 rounded border-gray-200 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    formData.creditScore && (!isNaN(Number(formData.creditScore)) && (Number(formData.creditScore) < 300 || Number(formData.creditScore) > 850)) 
                    ? 'border-red-300' 
                    : ''
                  }`}
                  placeholder="300-850"
                />
                {formData.creditScore && (!isNaN(Number(formData.creditScore)) && (Number(formData.creditScore) < 300 || Number(formData.creditScore) > 850)) && (
                  <div className="text-xs text-red-500 mt-1">Score must be 300-850</div>
                )}
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-900">
                {request?.borrowerInfo?.creditScore || 'Not provided'}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-600 hover:bg-blue-100 transition-all duration-200"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Save Changes
            </button>
          </div>
        )}
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
                <div className="mt-6">
                  <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-500">Document Name</span>
                    </div>
                    <div className="w-32 text-center">
                      <span className="text-sm font-medium text-gray-500">Category</span>
                    </div>
                    <div className="w-24 text-center">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                    </div>
                    <div className="w-32 text-center">
                      <span className="text-sm font-medium text-gray-500">Actions</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {request?.documents
                      ?.filter(doc => doc.category === selectedCategory)
                      .map(document => (
                        <div key={document.id} className="flex items-center px-4 py-3">
                          <div className="flex-1 flex items-center">
                            <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{document.name}</p>
                              <p className="text-xs text-gray-500">
                                Uploaded {new Date(document.versions[0].uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="w-32 text-center text-sm text-gray-500">
                            {document.category}
                          </div>
                          <div className="w-24 text-center">
                            {document.status === 'pending' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                            {document.status === 'approved' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Approved
                              </span>
                            )}
                            {document.status === 'rejected' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Rejected
                              </span>
                            )}
                          </div>
                          <div className="w-32 flex justify-center space-x-2">
                            <button
                              onClick={() => handlePreview(document)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Preview"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleApprove(document.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(document.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setSelectedDoc(document)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Comment"
                            >
                              <ChatBubbleLeftIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDownload(document)}
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