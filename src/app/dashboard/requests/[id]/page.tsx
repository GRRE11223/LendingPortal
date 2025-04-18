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
} from '@heroicons/react/24/outline';
import BorrowerModule from '../../../components/BorrowerModule';
import EscrowTitleModule from '../../../components/EscrowTitleModule';
import UnderwritingModule from '../../../components/UnderwritingModule';
import PreFundingModule from '../../../components/PreFundingModule';
import PostFundingModule from '../../../components/PostFundingModule';
import DocumentPreviewModal from '../../../components/DocumentPreviewModal';
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

    // 获取当前回收站中的 loans
    const trashStr = localStorage.getItem('trashLoanRequests');
    const trashLoans = trashStr ? JSON.parse(trashStr) : [];

    // 将当前 loan 添加到回收站
    const trashLoan = {
      ...request,
      deletedAt: new Date().toISOString()
    };
    trashLoans.push(trashLoan);
    localStorage.setItem('trashLoanRequests', JSON.stringify(trashLoans));

    // 从活动 loans 列表中删除
    const storedRequests = localStorage.getItem('loanRequests');
    if (storedRequests) {
      const requests = JSON.parse(storedRequests);
      const updatedRequests = requests.filter((r: any) => r.id !== request.id);
      localStorage.setItem('loanRequests', JSON.stringify(updatedRequests));
    }

    // 删除单独存储的 request 详情
    localStorage.removeItem(`request_${params.id}`);

    // 重定向到 dashboard
    router.push('/dashboard');
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
      {/* 添加删除按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Loan Request Details
        </h1>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 text-red-600 hover:text-red-800 flex items-center space-x-2"
        >
          <TrashIcon className="h-5 w-5" />
          <span>删除</span>
        </button>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-500 mb-6">
              此操作将把该贷款申请移动到回收站。您可以稍后从回收站恢复或永久删除它。
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                删除
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
    </div>
  );
} 