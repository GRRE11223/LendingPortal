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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900">
              Loan Requests
            </h1>
            <p className="text-slate-500 mt-1">
              Manage and track all loan requests in one place
            </p>
          </div>
          <button
            onClick={handleNewRequest}
            className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusIcon className="h-5 w-5 mr-2 inline-block" />
            New Request
          </button>
        </div>

        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Dashboard Overview Section */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Total Loans Card */}
              <div className="bg-gradient-to-br from-slate-50/90 to-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Loans</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      {stats.all}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                    <DocumentIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowRightIcon className="h-4 w-4 text-slate-500 mr-1" />
                  <span className="text-slate-600">Active loans in system</span>
                </div>
              </div>

              {/* In Progress Card */}
              <div className="bg-gradient-to-br from-slate-50/90 to-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">In Progress</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      {stats.inquiried + stats.openEscrow + stats.underwriting + stats.readyToFund}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowRightIcon className="h-4 w-4 text-slate-500 mr-1" />
                  <span className="text-slate-600">Loans under processing</span>
                </div>
              </div>

              {/* Completed Card */}
              <div className="bg-gradient-to-br from-slate-50/90 to-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Completed</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      {stats.funded + stats.servicing + stats.completed}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowRightIcon className="h-4 w-4 text-slate-500 mr-1" />
                  <span className="text-slate-600">Successfully processed loans</span>
                </div>
              </div>
            </div>

            {/* Loan Requests List */}
            <div className="bg-gradient-to-br from-slate-50/90 to-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/30 shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-white/40 border-b border-slate-200/50">
                <h2 className="text-lg font-semibold text-slate-800">My Loan Requests</h2>
              </div>
              <div className="p-5 space-y-4 bg-slate-100/30">
                {filteredRequests.map((request, index) => (
                  <div 
                    key={request.id} 
                    className="relative group bg-gradient-to-br from-slate-50/90 to-white/80 backdrop-blur-sm rounded-xl border border-slate-200/30 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.01]"
                    onClick={() => router.push(`/dashboard/requests/${request.id}`)}
                  >
                    <div className="p-6">
                      {/* Request Header */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                          <div className="h-11 w-11 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                            <EnvelopeIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-[15px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                              {generateLoanId(index)} - {request.borrowerName}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Created on {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <select
                          className={`text-xs px-3.5 py-1.5 rounded-full ${statusColors[request.status]} border border-current/30 backdrop-blur-sm hover:border-current/50 shadow-sm hover:shadow transition-all duration-200`}
                          value={request.status}
                          onChange={(e) => updateLoanStatus(request.id, e.target.value as LoanRequest['status'])}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>

                      {/* Progress Tracking */}
                      <div className="px-1">
                        <div className="relative">
                          {/* Progress Points and Labels */}
                          <div className="flex">
                            {['Borrower', 'Escrow', 'Title', 'Underwriting', 'Pre-Funding', 'Post-Funding'].map((stage, index, array) => {
                              const progress = request.progress[stage.toLowerCase() as keyof typeof request.progress] || 0;
                              const isActive = progress > 0;
                              const width = '16.66%'; // 将宽度平均分配为6等份
                              const isLastStage = index === array.length - 1;
                              
                              return (
                                <div key={stage} className="flex flex-col" style={{ width }}>
                                  {/* Point and Progress Line */}
                                  <div className="flex items-center">
                                    {/* Point */}
                                    <div className="relative flex items-center justify-center">
                                      <div 
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                          isActive 
                                            ? 'bg-slate-700 ring-2 ring-slate-200' 
                                            : 'bg-slate-300 ring-2 ring-slate-100'
                                        }`}
                                      />
                                      {isActive && (
                                        <div className="absolute w-4 h-4 rounded-full border border-slate-300" />
                                      )}
                                    </div>
                                    
                                    {/* Progress Line - 移除对最后一个元素的特殊处理 */}
                                    <div className="h-[1px] flex-1 mx-2">
                                      <div className="h-full bg-slate-200/50">
                                        <div 
                                          className="h-full bg-gradient-to-r from-slate-600 to-slate-700 transition-all duration-300 ease-out"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Label and Percentage */}
                                  <div className="mt-2 ml-[-4px]">
                                    <div className="text-[11px] font-medium text-slate-600 whitespace-nowrap">
                                      {stage}
                                    </div>
                                    <div className={`text-[11px] font-medium ${
                                      isActive ? 'text-slate-700' : 'text-slate-400'
                                    }`}>
                                      {progress}%
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredRequests.length === 0 && (
                  <div className="bg-gradient-to-br from-slate-50/90 to-white/80 backdrop-blur-sm rounded-xl border border-slate-200/30 p-8 text-center shadow-md">
                    <DocumentIcon className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-500">No loan requests found for the selected status</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Filter Sidebar */}
          <div className="w-64">
            <div className="bg-gradient-to-br from-slate-50/90 to-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/30 shadow-lg sticky top-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Status Overview</h3>
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