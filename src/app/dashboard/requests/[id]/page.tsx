'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  DocumentDuplicateIcon,
  HomeIcon,
  DocumentCheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import BorrowerModule from '../../../components/BorrowerModule';
import EscrowTitleModule from '../../../components/EscrowTitleModule';
import UnderwritingModule from '../../../components/UnderwritingModule';
import PreFundingModule from '../../../components/PreFundingModule';
import PostFundingModule from '../../../components/PostFundingModule';
import { SubjectPropertyModule } from '../../../components/SubjectPropertyModule';
import DocumentPreviewModal from '@/app/components/DocumentPreviewModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import type { Document, LoanRequest, User } from '@/types';
import { useUser } from '@/contexts/UserContext';

interface DragState {
  isDragging: boolean;
  files: File[];
}

interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: {
      id: string;
      name: string;
    };
  };
  timestamp: string;
  attachments?: File[];
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export default function LoanRequestDetail() {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<LoanRequest | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeModule, setActiveModule] = useState('subject-property');
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
  const [preFundingProgress, setPreFundingProgress] = useState(0);
  const [postFundingProgress, setPostFundingProgress] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState([
    { id: 1, user: 'Wei Jie Lai', content: 'Loan amount and it\'s a purchase. I think is safe without an appraisal.', timestamp: '2024-03-14 10:30' },
    { id: 2, user: 'Geri Huang', content: 'Please advise if appraisal needed', timestamp: '2024-03-14 11:00' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [mentionSearch, setMentionSearch] = useState<string>('');
  const [showMentions, setShowMentions] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    files: []
  });
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  });
  const [messageInput, setMessageInput] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);

  const filteredUsers = useMemo(() => {
    if (!mentionSearch) return users;
    const searchTerm = mentionSearch.toLowerCase();
    return users.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm) || 
      user.email.toLowerCase().includes(searchTerm)
    );
  }, [mentionSearch, users]);

  const insertMention = (user: User) => {
    if (!textareaRef.current || cursorPosition === null) return;
    
    const beforeCursor = textareaRef.current.value.slice(0, cursorPosition);
    const afterCursor = textareaRef.current.value.slice(cursorPosition);
    
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    if (lastAtIndex === -1) return;
    
    const newValue = beforeCursor.slice(0, lastAtIndex) + 
      `@${user.firstName} ${user.lastName} ` + 
      afterCursor;
    
    textareaRef.current.value = newValue;
    const newCursorPos = lastAtIndex + user.firstName.length + user.lastName.length + 3; // +3 for @ and space
    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    textareaRef.current.focus();
    setShowMentions(false);
    setMentionSearch('');
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value, selectionStart } = e.target;
    setMessageInput(value);
    setCursorPosition(selectionStart);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@', selectionStart);
    if (lastAtIndex !== -1) {
      const searchTerm = value.slice(lastAtIndex + 1, selectionStart);
      setMentionSearch(searchTerm);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

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

  const handleSendMessage = async () => {
    if (!messageInput.trim() && dragState.files.length === 0 || !currentUser) {
      return;
    }

    try {
      setChatState(prev => ({ ...prev, isLoading: true }));

      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageInput,
        sender: {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          role: {
            id: currentUser.role.id,
            name: currentUser.role.name
          }
        },
        timestamp: new Date().toISOString(),
        attachments: dragState.files
      };

      // Here you would typically send the message to your backend
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanRequestId: params.id,
          message: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        isLoading: false
      }));

      setMessageInput('');
      setDragState(prev => ({ ...prev, files: [] }));
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        error: 'Failed to send message. Please try again.',
        isLoading: false
      }));
    }
  };

  // Load users from database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          <p className="mt-2 text-gray-600">Please wait while we fetch the loan details.</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Request Not Found</h2>
          <p className="mt-2 text-gray-600">The requested loan could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''}`}>
        <div className="w-full px-0 py-8">
          <div className="w-full">
            <div className="w-full px-0 py-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span>Loan Request Details</span>
                    <span className="text-sm font-normal px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                      #{request.id}
                    </span>
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Created on {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowOriginalRequest(true)}
                    className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                  >
                    <EyeIcon className="h-5 w-5" />
                    <span>View Original Request</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Progress Section */}
              <div className="p-2">
                <div className="grid w-full grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Borrower Progress */}
                  <div 
                    onClick={() => setActiveModule('borrower')}
                    className="bg-white/30 backdrop-blur-xl border border-slate-200/60 shadow-xl rounded-2xl p-4 text-sm gap-3 mb-2 w-full transition-all duration-300 cursor-pointer hover:bg-white/50 hover:shadow-2xl hover:scale-105"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-600 bg-opacity-10 rounded-xl p-2.5">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Borrower</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Personal Information</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {borrowerProgress === 100 ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : borrowerProgress > 0 ? (
                            <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-500" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{borrowerProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gray-200/50 w-full rounded-full"></div>
                        <div
                          className="relative h-full bg-gradient-to-r from-blue-400/70 via-blue-500/70 to-blue-600/70 rounded-full transition-all duration-700 ease-out hover:from-blue-400/80 hover:to-blue-600/80"
                          style={{ width: `${borrowerProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        {borrowerProgress === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Not Started
                          </span>
                        ) : borrowerProgress === 100 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Escrow Progress */}
                  <div 
                    onClick={() => setActiveModule('escrow-title')}
                    className="bg-white/30 backdrop-blur-xl border border-slate-200/60 shadow-xl rounded-2xl p-4 text-sm gap-3 mb-2 w-full transition-all duration-300 cursor-pointer hover:bg-white/50 hover:shadow-2xl hover:scale-105"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-purple-600 bg-opacity-10 rounded-xl p-2.5">
                        <DocumentDuplicateIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Escrow</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Documentation</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {escrowProgress === 100 ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : escrowProgress > 0 ? (
                            <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-purple-600">{escrowProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gray-200/50 w-full rounded-full"></div>
                        <div
                          className="relative h-full bg-gradient-to-r from-purple-400/70 via-purple-500/70 to-purple-600/70 rounded-full transition-all duration-700 ease-out hover:from-purple-400/80 hover:to-purple-600/80"
                          style={{ width: `${escrowProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        {escrowProgress === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Not Started
                          </span>
                        ) : escrowProgress === 100 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title Progress */}
                  <div 
                    onClick={() => setActiveModule('escrow-title')}
                    className="bg-white/30 backdrop-blur-xl border border-slate-200/60 shadow-xl rounded-2xl p-4 text-sm gap-3 mb-2 w-full transition-all duration-300 cursor-pointer hover:bg-white/50 hover:shadow-2xl hover:scale-105"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-indigo-600 bg-opacity-10 rounded-xl p-2.5">
                        <DocumentCheckIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Title</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Verification</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {titleProgress === 100 ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : titleProgress > 0 ? (
                            <ClipboardDocumentCheckIcon className="h-5 w-5 text-indigo-500" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-indigo-600">{titleProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gray-200/50 w-full rounded-full"></div>
                        <div
                          className="relative h-full bg-gradient-to-r from-indigo-400/70 via-indigo-500/70 to-indigo-600/70 rounded-full transition-all duration-700 ease-out hover:from-indigo-400/80 hover:to-indigo-600/80"
                          style={{ width: `${titleProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        {titleProgress === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Not Started
                          </span>
                        ) : titleProgress === 100 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Underwriting Progress */}
                  <div 
                    onClick={() => setActiveModule('underwriting')}
                    className="bg-white/30 backdrop-blur-xl border border-slate-200/60 shadow-xl rounded-2xl p-4 text-sm gap-3 mb-2 w-full transition-all duration-300 cursor-pointer hover:bg-white/50 hover:shadow-2xl hover:scale-105"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-emerald-600 bg-opacity-10 rounded-xl p-2.5">
                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Underwriting</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Review & Approval</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {underwritingProgress === 100 ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : underwritingProgress > 0 ? (
                            <ClipboardDocumentCheckIcon className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-600">{underwritingProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gray-200/50 w-full rounded-full"></div>
                        <div
                          className="relative h-full bg-gradient-to-r from-emerald-400/70 via-emerald-500/70 to-emerald-600/70 rounded-full transition-all duration-700 ease-out hover:from-emerald-400/80 hover:to-emerald-600/80"
                          style={{ width: `${underwritingProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        {underwritingProgress === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Not Started
                          </span>
                        ) : underwritingProgress === 100 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pre-Funding Progress */}
                  <div 
                    onClick={() => setActiveModule('pre-funding')}
                    className="bg-white/20 backdrop-blur-2xl border border-slate-100/60 shadow-2xl rounded-2xl p-2 text-xs gap-2 mb-2 w-full transition-all duration-300 cursor-pointer hover:bg-white/40 hover:shadow-3xl hover:scale-105"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-amber-600 bg-opacity-10 rounded-xl p-2.5">
                        <ArrowUpTrayIcon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Pre-Funding</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Final Preparation</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {preFundingProgress === 100 ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : preFundingProgress > 0 ? (
                            <ClipboardDocumentCheckIcon className="h-5 w-5 text-amber-500" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-amber-600">{preFundingProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gray-200/50 w-full rounded-full"></div>
                        <div
                          className="relative h-full bg-gradient-to-r from-amber-400/70 via-amber-500/70 to-amber-600/70 rounded-full transition-all duration-700 ease-out hover:from-amber-400/80 hover:to-amber-600/80"
                          style={{ width: `${preFundingProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        {preFundingProgress === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Not Started
                          </span>
                        ) : preFundingProgress === 100 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post-Funding Progress */}
                  <div 
                    onClick={() => setActiveModule('post-funding')}
                    className="bg-white/20 backdrop-blur-2xl border border-slate-100/60 shadow-2xl rounded-2xl p-2 text-xs gap-2 mb-2 w-full transition-all duration-300 cursor-pointer hover:bg-white/40 hover:shadow-3xl hover:scale-105"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-rose-600 bg-opacity-10 rounded-xl p-2.5">
                        <DocumentIcon className="h-6 w-6 text-rose-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Post-Funding</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Final Steps</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {postFundingProgress === 100 ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : postFundingProgress > 0 ? (
                            <ClipboardDocumentCheckIcon className="h-5 w-5 text-rose-500" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-rose-600">{postFundingProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gray-200/50 w-full rounded-full"></div>
                        <div
                          className="relative h-full bg-gradient-to-r from-rose-400/70 via-rose-500/70 to-rose-600/70 rounded-full transition-all duration-700 ease-out hover:from-rose-400/80 hover:to-rose-600/80"
                          style={{ width: `${postFundingProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        {postFundingProgress === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Not Started
                          </span>
                        ) : postFundingProgress === 100 ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="bg-white rounded-xl shadow-sm">
                <Tabs value={activeModule} onValueChange={setActiveModule} className="w-full">
                  <TabsList className="w-full flex justify-between border-b border-gray-200 px-4">
                    <TabsTrigger 
                      value="subject-property"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                      style={{
                        borderColor: activeModule === 'subject-property' ? '#2563eb' : 'transparent',
                        color: activeModule === 'subject-property' ? '#2563eb' : '#6b7280'
                      }}
                    >
                      <HomeIcon className="h-5 w-5" />
                      Subject Property
                    </TabsTrigger>
                    <TabsTrigger 
                      value="borrower"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                      style={{
                        borderColor: activeModule === 'borrower' ? '#2563eb' : 'transparent',
                        color: activeModule === 'borrower' ? '#2563eb' : '#6b7280'
                      }}
                    >
                      <UserIcon className="h-5 w-5" />
                      Borrower
                    </TabsTrigger>
                    <TabsTrigger 
                      value="escrow-title"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                      style={{
                        borderColor: activeModule === 'escrow-title' ? '#2563eb' : 'transparent',
                        color: activeModule === 'escrow-title' ? '#2563eb' : '#6b7280'
                      }}
                    >
                      <DocumentDuplicateIcon className="h-5 w-5" />
                      Escrow & Title
                    </TabsTrigger>
                    <TabsTrigger 
                      value="underwriting"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                      style={{
                        borderColor: activeModule === 'underwriting' ? '#2563eb' : 'transparent',
                        color: activeModule === 'underwriting' ? '#2563eb' : '#6b7280'
                      }}
                    >
                      <ClipboardDocumentCheckIcon className="h-5 w-5" />
                      Underwriting
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pre-funding"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                      style={{
                        borderColor: activeModule === 'pre-funding' ? '#2563eb' : 'transparent',
                        color: activeModule === 'pre-funding' ? '#2563eb' : '#6b7280'
                      }}
                    >
                      <ArrowUpTrayIcon className="h-5 w-5" />
                      Pre-Funding
                    </TabsTrigger>
                    <TabsTrigger 
                      value="post-funding"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                      style={{
                        borderColor: activeModule === 'post-funding' ? '#2563eb' : 'transparent',
                        color: activeModule === 'post-funding' ? '#2563eb' : '#6b7280'
                      }}
                    >
                      <DocumentIcon className="h-5 w-5" />
                      Post-Funding
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    <TabsContent value="subject-property">
                      <SubjectPropertyModule loanId={params.id as string} />
                    </TabsContent>

                    <TabsContent value="borrower">
                      <BorrowerModule
                        request={request}
                        onInfoUpdate={handleBorrowerInfoUpdate}
                        onProgressUpdate={(progress) => handleProgressUpdate(progress)}
                        onDocumentUpload={handleDocumentUpload}
                        onStatusChange={handleStatusChange}
                        onAddComment={handleAddComment}
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

                    <TabsContent value="pre-funding">
                      <PreFundingModule
                        request={request}
                        onDocumentUpload={handleDocumentUpload}
                        onStatusChange={handleStatusChange}
                        onAddComment={handleAddComment}
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
                  </div>
                </Tabs>
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
                                  {request.loan.propertyAddress.fullAddress || 'Address not available'}
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
            </div>
          </div>
        </div>
      </div>

      {/* Chatbox */}
      <div 
        className={`fixed right-0 top-[120px] h-[calc(100vh-120px)] bg-white/95 backdrop-blur-lg border-l border-gray-200/60 shadow-[0_0_40px_-15px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out transform ${
          isChatOpen ? 'translate-x-0 w-96' : 'translate-x-full w-96'
        } flex flex-col z-20 rounded-l-2xl`}
      >
        {/* Chat Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-5 bg-white/80 backdrop-blur-md border-b border-gray-100 rounded-tl-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 rounded-xl p-2.5">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Team Chat</h3>
              <p className="text-xs text-gray-500 mt-0.5">2 team members</p>
            </div>
          </div>
        </div>

        {/* Toggle Buttons */}
        <button
          onClick={() => setIsChatOpen(false)}
          className={`absolute top-[20px] -left-7 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] border-t border-b border-l border-gray-200/60 rounded-l-full p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out transform hover:-translate-x-0.5 group ${
            !isChatOpen ? 'hidden' : 'block'
          }`}
          aria-label="Close chat"
        >
          <ChevronRightIcon className="h-4 w-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
        </button>

        <button
          onClick={() => setIsChatOpen(true)}
          className={`absolute top-[20px] -left-7 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] border-t border-b border-l border-gray-200/60 rounded-l-full p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out transform hover:-translate-x-0.5 group ${
            isChatOpen ? 'hidden' : 'block'
          }`}
          aria-label="Open chat"
        >
          <ChevronLeftIcon className="h-4 w-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
        </button>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-gray-50/50">
          {chatState.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-[70%] ${
                message.sender.id === currentUser?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              } rounded-lg p-3`}>
                <div className="text-sm font-medium mb-1">
                  {`${message.sender.firstName} ${message.sender.lastName}`}
                </div>
                <div>{message.text}</div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((file, index) => (
                      <div key={index} className="text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs opacity-75 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="px-6 pb-6 pt-3">
          <div className="relative bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:border-gray-300/80 transition-colors duration-200">
            <textarea
              ref={textareaRef}
              value={messageInput}
              className="w-full min-h-[100px] resize-none rounded-2xl px-4 py-3.5 text-[15px] leading-relaxed focus:outline-none bg-transparent placeholder:text-gray-400"
              placeholder="Type your message here... Use @ to mention someone"
              onChange={handleInput}
            />
            
            {/* Mentions Popup */}
            {showMentions && (
              <div className="absolute bottom-full left-4 mb-2 w-72 max-h-60 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors"
                    type="button"
                  >
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        {`${user.firstName[0]}${user.lastName[0]}`}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{`${user.firstName} ${user.lastName}`}</div>
                      <div className="text-xs text-gray-500">{user.role.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  onClick={() => {
                    setShowMentions(true);
                    textareaRef.current?.focus();
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendMessage}
                disabled={chatState.isLoading || (!messageInput.trim() && dragState.files.length === 0)}
              >
                {chatState.isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-gray-400 px-1">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
} 