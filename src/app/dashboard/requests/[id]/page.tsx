'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  DocumentIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ArrowUpTrayIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BorrowerModule from '../../../components/BorrowerModule';
import EscrowTitleModule from '../../../components/EscrowTitleModule';
import UnderwritingModule from '../../../components/UnderwritingModule';
import PreFundingModule from '../../../components/PreFundingModule';
import PostFundingModule from '../../../components/PostFundingModule';
import DocumentPreviewModal from '@/app/components/DocumentPreviewModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Document, LoanRequest } from '@/types';

export default function LoanRequestDetail() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<LoanRequest | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeModule, setActiveModule] = useState('borrower');
  const [loading, setLoading] = useState(true);
  const [borrowerProgress, setBorrowerProgress] = useState(0);
  const [escrowProgress, setEscrowProgress] = useState(0);
  const [titleProgress, setTitleProgress] = useState(0);
  const [underwritingProgress, setUnderwritingProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<'escrow' | 'title'>('escrow');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOriginalRequest, setShowOriginalRequest] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; fileName: string } | null>(null);

  useEffect(() => {
    const fetchRequest = () => {
      const storedRequest = localStorage.getItem(`request_${params.id}`);
      if (storedRequest) {
        setRequest(JSON.parse(storedRequest));
      }
      setLoading(false);
    };

    fetchRequest();
  }, [params.id]);

  useEffect(() => {
    if (request) {
      // Load initial progress from localStorage
      const storedRequests = localStorage.getItem('loanRequests');
      if (storedRequests) {
        const parsedRequests = JSON.parse(storedRequests);
        const currentRequest = parsedRequests.find((r: LoanRequest) => r.id === request.id);
        
        // Only update progress if it exists in localStorage
        if (currentRequest?.progress?.borrower !== undefined) {
          setBorrowerProgress(currentRequest.progress.borrower);
        }
        if (currentRequest?.progress?.escrow !== undefined) {
          setEscrowProgress(currentRequest.progress.escrow);
        }
        if (currentRequest?.progress?.title !== undefined) {
          setTitleProgress(currentRequest.progress.title);
        }
        if (currentRequest?.progress?.underwriting !== undefined) {
          setUnderwritingProgress(currentRequest.progress.underwriting);
        }
      }
    }
  }, [request]);

  const handleDocumentUpload = async (file: File, category: string, section?: 'escrow' | 'title') => {
    if (!request) return;

    const newDoc: Document = {
      id: Math.random().toString(36).substring(7),
      category,
      name: file.name,
      fileName: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
      versions: [{
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User',
        fileName: file.name,
        size: file.size,
        type: file.type
      }],
      comments: []
    };

    const updatedRequest: LoanRequest = {
      ...request,
    };

    if (section === 'escrow') {
      updatedRequest.escrowInfo = {
        ...request.escrowInfo,
        documents: [...(request.escrowInfo?.documents || []), newDoc]
      };
    } else if (section === 'title') {
      updatedRequest.titleInfo = {
        ...request.titleInfo,
        documents: [...(request.titleInfo?.documents || []), newDoc]
      };
    } else {
      updatedRequest.documents = [...(request.documents || []), newDoc];
    }

    setRequest(updatedRequest);
    localStorage.setItem(`request_${params.id}`, JSON.stringify(updatedRequest));
  };

  const handleStatusChange = async (documentId: string, status: Document['status'], section?: 'escrow' | 'title') => {
    if (!request) return;

    const updatedRequest: LoanRequest = {
      ...request,
    };

    if (section === 'escrow') {
      updatedRequest.escrowInfo = {
        ...request.escrowInfo,
        documents: (request.escrowInfo?.documents || []).map(doc =>
          doc.id === documentId ? { ...doc, status } : doc
        )
      };
    } else if (section === 'title') {
      updatedRequest.titleInfo = {
        ...request.titleInfo,
        documents: (request.titleInfo?.documents || []).map(doc =>
          doc.id === documentId ? { ...doc, status } : doc
        )
      };
    } else {
      updatedRequest.documents = (request.documents || []).map(doc =>
        doc.id === documentId ? { ...doc, status } : doc
      );
    }

    setRequest(updatedRequest);
    localStorage.setItem(`request_${params.id}`, JSON.stringify(updatedRequest));
  };

  const handleAddComment = async (documentId: string, content: string, section?: 'escrow' | 'title') => {
    if (!request) return;

    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      user: 'Current User',
      content,
      timestamp: new Date().toISOString()
    };

    const updatedRequest: LoanRequest = {
      ...request,
    };

    if (section === 'escrow') {
      updatedRequest.escrowInfo = {
        ...request.escrowInfo,
        documents: (request.escrowInfo?.documents || []).map(doc =>
          doc.id === documentId
            ? { ...doc, comments: [...(doc.comments || []), newComment] }
            : doc
        )
      };
    } else if (section === 'title') {
      updatedRequest.titleInfo = {
        ...request.titleInfo,
        documents: (request.titleInfo?.documents || []).map(doc =>
          doc.id === documentId
            ? { ...doc, comments: [...(doc.comments || []), newComment] }
            : doc
        )
      };
    } else {
      updatedRequest.documents = (request.documents || []).map(doc =>
        doc.id === documentId
          ? { ...doc, comments: [...(doc.comments || []), newComment] }
          : doc
      );
    }

    setRequest(updatedRequest);
    localStorage.setItem(`request_${params.id}`, JSON.stringify(updatedRequest));
  };

  const handleBorrowerInfoUpdate = async (info: any) => {
    // Implementation of handleBorrowerInfoUpdate
  };

  const handleProgressUpdate = (progress: number, section?: 'escrow' | 'title' | 'underwriting') => {
    if (!request) return;

    // Update local state
    if (section === 'escrow') {
      setEscrowProgress(progress);
    } else if (section === 'title') {
      setTitleProgress(progress);
    } else if (section === 'underwriting') {
      setUnderwritingProgress(progress);
    } else {
      setBorrowerProgress(progress);
    }

    // Update progress in localStorage
    const storedRequests = localStorage.getItem('loanRequests');
    if (storedRequests) {
      const parsedRequests = JSON.parse(storedRequests);
      const updatedRequests = parsedRequests.map((r: LoanRequest) => {
        if (r.id === request.id) {
          return {
            ...r,
            progress: {
              ...r.progress,
              ...(section === 'escrow' ? { escrow: progress } :
                 section === 'title' ? { title: progress } :
                 section === 'underwriting' ? { underwriting: progress } :
                 { borrower: progress })
            }
          };
        }
        return r;
      });
      localStorage.setItem('loanRequests', JSON.stringify(updatedRequests));
    }
  };

  const handleInfoUpdate = async (type: 'escrow' | 'title', data: any) => {
    console.log('Updating info:', type, data);
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleDelete = () => {
    if (!request) return;

    // Get current items in trash
    const trashStr = localStorage.getItem('trashLoanRequests');
    const trashLoans = trashStr ? JSON.parse(trashStr) : [];

    // Add current loan to trash with metadata
    const trashLoan = {
      ...request,
      deletedAt: new Date().toISOString(),
      originalId: request.id,
      canRestore: true
    };
    trashLoans.push(trashLoan);
    localStorage.setItem('trashLoanRequests', JSON.stringify(trashLoans));

    // Remove from active loan requests
    const storedRequests = localStorage.getItem('loanRequests');
    if (storedRequests) {
      const requests = JSON.parse(storedRequests);
      const updatedRequests = requests.filter((r: any) => r.id !== request.id);
      localStorage.setItem('loanRequests', JSON.stringify(updatedRequests));
    }

    // Remove individual request details
    localStorage.removeItem(`request_${params.id}`);

    // Redirect to dashboard
    router.push('/dashboard');
  };

  const handleFolderClick = (folder: string) => {
    setActiveFolder(activeFolder === folder ? null : folder);
  };

  const handleFileClick = (file: any) => {
    if (file.url) {
      setSelectedFile(file);
      setShowFilePreview(true);
    } else {
      console.error('File URL not found');
    }
  };

  const handlePreviewDocument = (document: { url: string; fileName: string }) => {
    setSelectedDocument(document);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          <p className="mt-2 text-gray-600">Please wait while we fetch the loan details.</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Request Not Found</h2>
          <p className="mt-2 text-gray-600">The requested loan could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Loan Request Details
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowOriginalRequest(true)}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center space-x-2"
          >
            <EyeIcon className="h-5 w-5" />
            <span>View Original Request</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-600 hover:text-red-800 flex items-center space-x-2"
          >
            <TrashIcon className="h-5 w-5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Original Request Modal */}
      {showOriginalRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-2xl font-semibold text-gray-800">Original Loan Request</h3>
              <button
                onClick={() => setShowOriginalRequest(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon className="h-7 w-7" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-5rem)]">
              {/* Borrower Information */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-800">Borrower Information</h4>
                </div>
                <div className="grid grid-cols-3 gap-6 bg-gray-50 rounded-xl p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Legal Name</p>
                    <p className="text-base font-medium text-gray-900">{request.borrowerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <p className="text-base font-medium text-gray-900">{request.borrowerInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                    <p className="text-base font-medium text-gray-900">{request.borrowerInfo.phone}</p>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-800">Loan Information</h4>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Property Address</p>
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-base font-medium text-gray-900">
                          {request?.propertyAddress?.fullAddress || 'Address not available'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Property Type</p>
                      <p className="text-base font-medium text-gray-900 capitalize">{request.loan.propertyType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 bg-gray-50 rounded-xl p-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Property Value</p>
                      <p className="text-base font-medium text-gray-900">${request.loan.propertyValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Loan Amount</p>
                      <p className="text-base font-medium text-gray-900">${request.loan.loanAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">LTV</p>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-gray-900">{request.loan.ltv}%</span>
                        <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full" 
                            style={{ width: `${request.loan.ltv}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 bg-gray-50 rounded-xl p-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Loan Purpose</p>
                      <p className="text-base font-medium text-gray-900 capitalize">{request.loan.loanPurpose}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Loan Program</p>
                      <p className="text-base font-medium text-gray-900 capitalize">{request.loan.loanProgram}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Target Funding Date</p>
                      <p className="text-base font-medium text-gray-900">{request.loan.targetFundingDate}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Loan Intention</p>
                    <p className="text-base font-medium text-gray-900">{request.loan.loanIntention}</p>
                  </div>
                </div>
              </div>

              {/* Other Information */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <DocumentIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-800">Other Information</h4>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Escrow Email</p>
                      <p className="text-base font-medium text-gray-900">
                        {request.escrowInfo?.email || 'TBD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Insurance Email</p>
                      <p className="text-base font-medium text-gray-900">
                        {request.escrowInfo?.insuranceEmail || 'TBD'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Originator Information */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-800">Originator Information</h4>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Originator</p>
                    <p className="text-base font-medium text-gray-900">{request.loan?.originator || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Created At</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Initial File Submission */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <PaperClipIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-800">Initial File Submission</h4>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* Folders List */}
                  <div className="col-span-4 bg-gray-50 rounded-xl p-6">
                    <div className="text-sm font-medium text-gray-700 mb-4">Folders</div>
                    <div className="space-y-4">
                      <div 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${activeFolder === 'id' ? 'bg-gray-100' : ''}`}
                        onClick={() => handleFolderClick('id')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">📄</span>
                          <span className="text-sm text-gray-600">ID</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {request.escrow?.initialFileSubmission?.filter(file => file.folder === 'id').length || 0}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${activeFolder === 'bankStatement' ? 'bg-gray-100' : ''}`}
                        onClick={() => handleFolderClick('bankStatement')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">🏦</span>
                          <span className="text-sm text-gray-600">Bank Statement</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {request.escrow?.initialFileSubmission?.filter(file => file.folder === 'bankStatement').length || 0}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${activeFolder === 'loanApplication' ? 'bg-gray-100' : ''}`}
                        onClick={() => handleFolderClick('loanApplication')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">📝</span>
                          <span className="text-sm text-gray-600">Loan Application</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {request.escrow?.initialFileSubmission?.filter(file => file.folder === 'loanApplication').length || 0}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${activeFolder === 'creditReport' ? 'bg-gray-100' : ''}`}
                        onClick={() => handleFolderClick('creditReport')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">📊</span>
                          <span className="text-sm text-gray-600">Credit Report</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {request.escrow?.initialFileSubmission?.filter(file => file.folder === 'creditReport').length || 0}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${activeFolder === 'insurance' ? 'bg-gray-100' : ''}`}
                        onClick={() => handleFolderClick('insurance')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">🔒</span>
                          <span className="text-sm text-gray-600">Insurance</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {request.escrow?.initialFileSubmission?.filter(file => file.folder === 'insurance').length || 0}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${activeFolder === 'existingMortgage' ? 'bg-gray-100' : ''}`}
                        onClick={() => handleFolderClick('existingMortgage')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">🏠</span>
                          <span className="text-sm text-gray-600">Existing Mortgage Statement</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {request.escrow?.initialFileSubmission?.filter(file => file.folder === 'existingMortgage').length || 0}
                        </span>
                      </div>

                      <div 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${activeFolder === 'others' ? 'bg-gray-100' : ''}`}
                        onClick={() => handleFolderClick('others')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">📁</span>
                          <span className="text-sm text-gray-600">Others</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {request.escrow?.initialFileSubmission?.filter(file => file.folder === 'others').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document List */}
                  <div className="col-span-8">
                    {request.escrow?.initialFileSubmission && request.escrow.initialFileSubmission.length > 0 ? (
                      <div className="bg-white rounded-xl border border-gray-200">
                        <div className="divide-y divide-gray-100">
                          {request.escrow.initialFileSubmission
                            .filter(file => !activeFolder || file.folder === activeFolder)
                            .map((file) => (
                              <div 
                                key={file.name} 
                                className="p-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleFileClick(file)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                      <p className="text-xs text-gray-500">{file.folder}</p>
                                    </div>
                                  </div>
                                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl p-8">
                        <DocumentIcon className="h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900">No documents</h3>
                        <p className="text-sm text-gray-500 text-center mt-1">
                          {activeFolder ? 'No documents in this folder' : 'No documents have been uploaded yet'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* File Preview Modal */}
              {showFilePreview && selectedFile && (
                <DocumentPreviewModal
                  document={{
                    url: selectedFile.url,
                    fileName: selectedFile.name
                  }}
                  onClose={() => setShowFilePreview(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-6">
              This loan request will be moved to the trash. You can restore or permanently delete it later from the trash.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className="bg-white rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Loan Request Progress</h2>
        <div className="grid grid-cols-4 gap-6">
          {/* Borrower Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Borrower</span>
              <span className="text-sm font-medium text-blue-600">{borrowerProgress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${borrowerProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-end space-x-1">
              {borrowerProgress === 0 ? (
                <>
                  <ExclamationCircleIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Not Started</span>
                </>
              ) : borrowerProgress === 100 ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-gray-500">Complete</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentCheckIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-gray-500">In Progress</span>
                </>
              )}
            </div>
          </div>

          {/* Escrow & Title Progress */}
          <div className="space-y-4">
            {/* Escrow Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Escrow</span>
                <span className="text-sm font-medium text-blue-600">{escrowProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${escrowProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-end space-x-1">
                {escrowProgress === 0 ? (
                  <>
                    <ExclamationCircleIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Not Started</span>
                  </>
                ) : escrowProgress === 100 ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-gray-500">Complete</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-gray-500">In Progress</span>
                  </>
                )}
              </div>
            </div>

            {/* Title Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Title</span>
                <span className="text-sm font-medium text-blue-600">{titleProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${titleProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-end space-x-1">
                {titleProgress === 0 ? (
                  <>
                    <ExclamationCircleIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Not Started</span>
                  </>
                ) : titleProgress === 100 ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-gray-500">Complete</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-gray-500">In Progress</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Underwriting Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Underwriting</span>
              <span className="text-sm font-medium text-blue-600">{underwritingProgress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${underwritingProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-end space-x-1">
              {underwritingProgress === 0 ? (
                <>
                  <ExclamationCircleIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Not Started</span>
                </>
              ) : underwritingProgress === 100 ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-gray-500">Complete</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentCheckIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-gray-500">In Progress</span>
                </>
              )}
            </div>
          </div>

          {/* Post Funding Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Post Funding</span>
              <span className="text-sm font-medium text-blue-600">0%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `0%` }}
              />
            </div>
            <div className="flex items-center justify-end space-x-1">
              <ExclamationCircleIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Not Started</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="borrower">
        <TabsList>
          <TabsTrigger value="borrower">Borrower</TabsTrigger>
          <TabsTrigger value="escrow-title">Escrow & Title</TabsTrigger>
          <TabsTrigger value="underwriting">Underwriting</TabsTrigger>
          <TabsTrigger value="post-funding">Post Funding</TabsTrigger>
        </TabsList>
        <TabsContent value="borrower">
          <BorrowerModule
            request={request}
            onDocumentUpload={handleDocumentUpload}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
            onInfoUpdate={handleBorrowerInfoUpdate}
            onProgressUpdate={(progress) => handleProgressUpdate(progress)}
          />
        </TabsContent>
        <TabsContent value="escrow-title">
          <EscrowTitleModule
            request={request}
            onDocumentUpload={handleDocumentUpload}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
            onInfoUpdate={(info, section) => handleInfoUpdate(section, info)}
            onProgressUpdate={(progress, section) => handleProgressUpdate(progress, section)}
          />
        </TabsContent>
        <TabsContent value="underwriting">
          <UnderwritingModule
            request={request}
            onDocumentUpload={handleDocumentUpload}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
            onProgressUpdate={(progress) => handleProgressUpdate(progress, 'underwriting')}
          />
        </TabsContent>
        <TabsContent value="post-funding">
          <PostFundingModule
            request={request}
            onDocumentUpload={handleDocumentUpload}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
          />
        </TabsContent>
      </Tabs>

      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
} 