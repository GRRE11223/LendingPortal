'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  DocumentIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import ChatBox from '@/components/ChatBox';

interface Document {
  id: string;
  category: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  versions: {
    id: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    fileName: string;
  }[];
  comments: {
    id: string;
    user: string;
    content: string;
    timestamp: string;
  }[];
}

interface LoanRequest {
  id: string;
  status: 'Inquiried' | 'Open Escrow' | 'Underwriting' | 'Ready to Fund' | 'Funded' | 'Servicing' | 'Completed' | 'Hold' | 'Canceled';
  createdAt: string;
  type: string;
  borrowerName: string;
  loanAmount: number;
  propertyAddress: string;
  borrowerInfo: {
    email: string;
    phone: string;
    creditScore: number;
    annualIncome: number;
    documents: Document[];
  };
  documents: Document[];
  escrowInfo: {
    company: string;
    contact: string;
    email: string;
    phone: string;
    documents: Document[];
  };
  titleInfo: {
    company: string;
    contact: string;
    email: string;
    phone: string;
    documents: Document[];
  };
  underwriting: {
    loanTerms: {
      rate: number;
      term: number;
      maxLtv: number;
    };
    riskAnalysis: {
      score: number;
      factors: string[];
    };
    propertyDetails: {
      type: string;
      value: number;
      location: {
        lat: number;
        lng: number;
      };
    };
    documents: Document[];
  };
  progress: {
    borrower: number;
    escrow: number;
    title: number;
    underwriting: number;
    preFunding: number;
    postFunding: number;
    summary: number;
  };
  lastMessage?: string;
  fundingDate: string;
  wireReference: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LoanRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    all: 0,
    inquiried: 0,
    openEscrow: 0,
    underwriting: 0,
    readyToFund: 0,
    funded: 0,
    servicing: 0,
    completed: 0,
    hold: 0,
    canceled: 0
  });

  // 示例数据
  const sampleRequest = {
    id: '12345',
    status: 'In Process (Consultant)',
    createdAt: new Date().toISOString(),
    type: 'purchase',
    borrowerName: 'John Smith',
    loanAmount: 450000,
    propertyAddress: '123 Main St, Los Angeles, CA 90012',
    borrowerInfo: {
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      creditScore: 720,
      annualIncome: 120000,
      documents: []
    },
    escrowInfo: {
      officerName: 'Sarah Johnson',
      email: 'sarah.j@escrow.com',
      phone: '(555) 987-6543',
      documents: []
    },
    titleInfo: {
      officerName: 'Mike Wilson',
      email: 'mike.w@title.com',
      phone: '(555) 456-7890',
      documents: []
    },
    underwriting: {
      loanTerms: {
        rate: 4.5,
        term: 30,
        maxLtv: 80
      },
      riskAnalysis: {
        score: 85,
        factors: ['Good credit history', 'Stable employment', 'Low DTI ratio']
      },
      propertyDetails: {
        type: 'Single Family Residence',
        value: 550000,
        location: {
          lat: 34.0522,
          lng: -118.2437
        }
      },
      documents: []
    },
    fundingDate: new Date().toISOString(),
    wireReference: 'WIRE123456789',
    documents: [],
    lastMessage: 'Underwriting review in progress',
    progress: {
      borrower: 20,
      escrow: 40,
      title: 60,
      underwriting: 0,
      preFunding: 0,
      postFunding: 0,
      summary: 20
    }
  };

  useEffect(() => {
    // 检查并初始化示例数据
    const storedRequests = localStorage.getItem('loanRequests');
    let currentRequests = [];
    if (!storedRequests) {
      currentRequests = [sampleRequest];
      localStorage.setItem('loanRequests', JSON.stringify(currentRequests));
    } else {
      currentRequests = JSON.parse(storedRequests);
    }
    setRequests(currentRequests);
    setFilteredRequests(currentRequests); // 初始化显示所有请求
    // 计算统计数据
    const newStats = {
      all: currentRequests.length,
      inquiried: currentRequests.filter((r: LoanRequest) => r.status === 'Inquiried').length,
      openEscrow: currentRequests.filter((r: LoanRequest) => r.status === 'Open Escrow').length,
      underwriting: currentRequests.filter((r: LoanRequest) => r.status === 'Underwriting').length,
      readyToFund: currentRequests.filter((r: LoanRequest) => r.status === 'Ready to Fund').length,
      funded: currentRequests.filter((r: LoanRequest) => r.status === 'Funded').length,
      servicing: currentRequests.filter((r: LoanRequest) => r.status === 'Servicing').length,
      completed: currentRequests.filter((r: LoanRequest) => r.status === 'Completed').length,
      hold: currentRequests.filter((r: LoanRequest) => r.status === 'Hold').length,
      canceled: currentRequests.filter((r: LoanRequest) => r.status === 'Canceled').length
    };
    setStats(newStats);
    // 监听localStorage变化，自动刷新loanRequests
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'loanRequests') {
        const updated = localStorage.getItem('loanRequests');
        if (updated) {
          const parsed = JSON.parse(updated);
          setRequests(parsed);
          setFilteredRequests(parsed);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const statusColors = {
    'Inquiried': 'bg-blue-50 text-blue-800',
    'Open Escrow': 'bg-purple-50 text-purple-800',
    'Underwriting': 'bg-indigo-50 text-indigo-800',
    'Ready to Fund': 'bg-emerald-50 text-emerald-800',
    'Funded': 'bg-green-50 text-green-800',
    'Servicing': 'bg-cyan-50 text-cyan-800',
    'Completed': 'bg-teal-50 text-teal-800',
    'Hold': 'bg-amber-50 text-amber-800',
    'Canceled': 'bg-red-50 text-red-800'
  };

  const statusOptions = [
    'Inquiried',
    'Open Escrow',
    'Underwriting',
    'Ready to Fund',
    'Funded',
    'Servicing',
    'Completed',
    'Hold',
    'Canceled'
  ] as const;

  // Generate sequential loan ID
  const generateLoanId = (index: number) => {
    const baseNumber = 30 + index; // Starting from 30
    return `25BE${baseNumber.toString().padStart(4, '0')}`;
  };

  // 更新 loan 状态的函数
  const updateLoanStatus = (loanId: string, newStatus: LoanRequest['status']) => {
    const updatedRequests = requests.map(request => {
      if (request.id === loanId) {
        return {
          ...request, // 保留原有数据
          status: newStatus,
        };
      }
      return request;
    });
    
    setRequests(updatedRequests);
    
    // 根据当前选中的状态更新过滤后的请求列表
    if (selectedStatus) {
      setFilteredRequests(updatedRequests.filter(request => request.status === selectedStatus));
    } else {
      setFilteredRequests(updatedRequests);
    }
    
    localStorage.setItem('loanRequests', JSON.stringify(updatedRequests));
    
    // 更新统计数据
    const newStats = {
      all: updatedRequests.length,
      inquiried: updatedRequests.filter(r => r.status === 'Inquiried').length,
      openEscrow: updatedRequests.filter(r => r.status === 'Open Escrow').length,
      underwriting: updatedRequests.filter(r => r.status === 'Underwriting').length,
      readyToFund: updatedRequests.filter(r => r.status === 'Ready to Fund').length,
      funded: updatedRequests.filter(r => r.status === 'Funded').length,
      servicing: updatedRequests.filter(r => r.status === 'Servicing').length,
      completed: updatedRequests.filter(r => r.status === 'Completed').length,
      hold: updatedRequests.filter(r => r.status === 'Hold').length,
      canceled: updatedRequests.filter(r => r.status === 'Canceled').length
    };
    
    setStats(newStats);
  };

  // 处理状态筛选
  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    if (status === null) {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => request.status === status));
    }
  };

  // 添加一个 useEffect 来监听请求和选中状态的变化
  useEffect(() => {
    if (selectedStatus) {
      setFilteredRequests(requests.filter(request => request.status === selectedStatus));
    } else {
      setFilteredRequests(requests);
    }
  }, [requests, selectedStatus]);

  const handleNewRequest = () => {
    router.push('/dashboard/new-request');
  };

  return (
    <div className="min-h-screen bg-[#f3f6fa]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-0">
        <div className="flex gap-8">
          {/* 左侧主区块（统计+Loan Requests） */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Loan Requests List */}
            <div className="pt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">My Loan Requests</h2>
                <button
                  onClick={handleNewRequest}
                  className="px-6 py-2 bg-black/80 text-white rounded-full hover:bg-black transition-all duration-200 shadow-md backdrop-blur-md"
                >
                  <PlusIcon className="h-5 w-5 mr-2 inline-block" />
                  New Request
                </button>
              </div>
              <div className="space-y-4">
                {filteredRequests.map((request, index) => (
                  <div 
                    key={request.id} 
                    className="flex items-start bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl transition-all duration-200 border border-slate-200/70 hover:bg-white/50 hover:shadow-2xl hover:scale-[1.03] cursor-pointer px-6 py-5 group"
                    onClick={() => router.push(`/dashboard/requests/${request.id}`)}
                  >
                    {/* 左侧头像/首字母圆圈 */}
                    <div className="flex-shrink-0 mr-5">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500 border border-gray-200">
                        {request.borrowerName?.[0] || 'B'}
                      </div>
                    </div>
                    {/* 右侧内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{generateLoanId(index)} - {request.borrowerName}</h3>
                          <p className="text-xs text-gray-400 mt-1">Created on {new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                        <select
                          className={`text-xs px-3 py-1 rounded-full border border-gray-300 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition ${statusColors[request.status]}`}
                          value={request.status}
                          onChange={(e) => updateLoanStatus(request.id, e.target.value as LoanRequest['status'])}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      {/* 进度条 */}
                      <div className="mt-4">
                        <div className="flex flex-1 justify-between gap-4">
                          {['Borrower', 'Escrow', 'Title', 'Underwriting', 'Pre-Funding', 'Post-Funding'].map((stage) => {
                            const progress = request.progress[stage.toLowerCase() as keyof typeof request.progress] || 0;
                            const isActive = progress > 0;
                            const isComplete = progress === 100;
                            return (
                              <div className="flex flex-col items-center flex-1 min-w-0" key={stage}>
                                <div className="flex items-center w-full">
                                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-gray-700' : 'bg-gray-300'}`}></span>
                                  <div className="flex-1 h-0.5 mx-1 bg-gray-200 relative">
                                    <div
                                      className="absolute left-0 top-0 h-full bg-gray-700 rounded-full transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-gray-700' : 'bg-gray-300'}`}></span>
                                </div>
                                <div className="flex justify-between w-full mt-1">
                                  <span className={`text-xs font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{stage}</span>
                                  <span className={`text-xs font-semibold ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>{progress}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* 最后一条消息（如有） */}
                      {request.lastMessage && (
                        <div className="mt-3 text-sm text-gray-500 italic">{request.lastMessage}</div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredRequests.length === 0 && (
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                    <DocumentIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">No loan requests found for the selected status</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 右侧Status Overview */}
          <div className="w-72 pl-8 border-l border-gray-200 flex flex-col bg-transparent">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Overview</h3>
            <div className="space-y-2">
              {/* All */}
              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-slate-100/80 to-white/80
                  ${selectedStatus === null 
                    ? 'from-slate-200/90 to-slate-100/80 shadow-lg ring-1 ring-slate-200/50 scale-[1.02]' 
                    : 'hover:from-slate-100/90 hover:to-slate-50/80'
                  }`}
                onClick={() => handleStatusFilter(null)}
              >
                <span className="text-sm font-medium text-slate-700">All</span>
                <span className="text-lg font-semibold text-slate-900">{stats.all}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-blue-50 to-white
                  ${selectedStatus === 'Inquiried'
                    ? 'from-blue-200 to-blue-100 shadow-lg ring-1 ring-blue-200 scale-[1.02]' 
                    : 'hover:from-blue-100 hover:to-blue-50'
                  }`}
                onClick={() => handleStatusFilter('Inquiried')}
              >
                <span className="text-sm font-medium text-blue-700">Inquiried</span>
                <span className="text-lg font-semibold text-blue-900">{stats.inquiried}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-purple-50 to-white
                  ${selectedStatus === 'Open Escrow'
                    ? 'from-purple-200 to-purple-100 shadow-lg ring-1 ring-purple-200 scale-[1.02]' 
                    : 'hover:from-purple-100 hover:to-purple-50'
                  }`}
                onClick={() => handleStatusFilter('Open Escrow')}
              >
                <span className="text-sm font-medium text-purple-700">Open Escrow</span>
                <span className="text-lg font-semibold text-purple-900">{stats.openEscrow}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-indigo-50 to-white
                  ${selectedStatus === 'Underwriting'
                    ? 'from-indigo-200 to-indigo-100 shadow-lg ring-1 ring-indigo-200 scale-[1.02]' 
                    : 'hover:from-indigo-100 hover:to-indigo-50'
                  }`}
                onClick={() => handleStatusFilter('Underwriting')}
              >
                <span className="text-sm font-medium text-indigo-700">Underwriting</span>
                <span className="text-lg font-semibold text-indigo-900">{stats.underwriting}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-emerald-50 to-white
                  ${selectedStatus === 'Ready to Fund'
                    ? 'from-emerald-200 to-emerald-100 shadow-lg ring-1 ring-emerald-200 scale-[1.02]' 
                    : 'hover:from-emerald-100 hover:to-emerald-50'
                  }`}
                onClick={() => handleStatusFilter('Ready to Fund')}
              >
                <span className="text-sm font-medium text-emerald-700">Ready to Fund</span>
                <span className="text-lg font-semibold text-emerald-900">{stats.readyToFund}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-green-50 to-white
                  ${selectedStatus === 'Funded'
                    ? 'from-green-200 to-green-100 shadow-lg ring-1 ring-green-200 scale-[1.02]' 
                    : 'hover:from-green-100 hover:to-green-50'
                  }`}
                onClick={() => handleStatusFilter('Funded')}
              >
                <span className="text-sm font-medium text-green-700">Funded</span>
                <span className="text-lg font-semibold text-green-900">{stats.funded}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-cyan-50 to-white
                  ${selectedStatus === 'Servicing'
                    ? 'from-cyan-200 to-cyan-100 shadow-lg ring-1 ring-cyan-200 scale-[1.02]' 
                    : 'hover:from-cyan-100 hover:to-cyan-50'
                  }`}
                onClick={() => handleStatusFilter('Servicing')}
              >
                <span className="text-sm font-medium text-cyan-700">Servicing</span>
                <span className="text-lg font-semibold text-cyan-900">{stats.servicing}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-teal-50 to-white
                  ${selectedStatus === 'Completed'
                    ? 'from-teal-200 to-teal-100 shadow-lg ring-1 ring-teal-200 scale-[1.02]' 
                    : 'hover:from-teal-100 hover:to-teal-50'
                  }`}
                onClick={() => handleStatusFilter('Completed')}
              >
                <span className="text-sm font-medium text-teal-700">Completed</span>
                <span className="text-lg font-semibold text-teal-900">{stats.completed}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-amber-50 to-white
                  ${selectedStatus === 'Hold'
                    ? 'from-amber-200 to-amber-100 shadow-lg ring-1 ring-amber-200 scale-[1.02]' 
                    : 'hover:from-amber-100 hover:to-amber-50'
                  }`}
                onClick={() => handleStatusFilter('Hold')}
              >
                <span className="text-sm font-medium text-amber-700">Hold</span>
                <span className="text-lg font-semibold text-amber-900">{stats.hold}</span>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  bg-gradient-to-r from-red-50 to-white
                  ${selectedStatus === 'Canceled'
                    ? 'from-red-200 to-red-100 shadow-lg ring-1 ring-red-200 scale-[1.02]' 
                    : 'hover:from-red-100 hover:to-red-50'
                  }`}
                onClick={() => handleStatusFilter('Canceled')}
              >
                <span className="text-sm font-medium text-red-700">Canceled</span>
                <span className="text-lg font-semibold text-red-900">{stats.canceled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ChatBox */}
        {isChatOpen && activeLoanId && (
          <div className="fixed bottom-4 right-4 z-[9999]">
            <ChatBox
              key={`chat_${activeLoanId}`}
              loanId={activeLoanId}
              onClose={() => {
                setIsChatOpen(false);
                setActiveLoanId(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}