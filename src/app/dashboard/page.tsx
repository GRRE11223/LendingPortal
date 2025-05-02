'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
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
  status: 'In Process (Consultant)' | 'Waiting for a Banker' | 'In Process (Banker)' | 'Rejected' | 'Inquiried' | 'Accepted';
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
    inProcessConsultant: 0,
    waitingForBanker: 0,
    inProcessBanker: 0,
    rejected: 0,
    inquiried: 0,
    accepted: 0
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
      inProcessConsultant: currentRequests.filter((r: LoanRequest) => r.status === 'In Process (Consultant)').length,
      waitingForBanker: currentRequests.filter((r: LoanRequest) => r.status === 'Waiting for a Banker').length,
      inProcessBanker: currentRequests.filter((r: LoanRequest) => r.status === 'In Process (Banker)').length,
      rejected: currentRequests.filter((r: LoanRequest) => r.status === 'Rejected').length,
      inquiried: currentRequests.filter((r: LoanRequest) => r.status === 'Inquiried').length,
      accepted: currentRequests.filter((r: LoanRequest) => r.status === 'Accepted').length
    };

    setStats(newStats);
  }, []);

  const statusColors = {
    'In Process (Consultant)': 'bg-purple-100 text-purple-800',
    'Waiting for a Banker': 'bg-orange-100 text-orange-800',
    'In Process (Banker)': 'bg-yellow-100 text-yellow-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Inquiried': 'bg-blue-100 text-blue-800',
    'Accepted': 'bg-emerald-100 text-emerald-800'
  };

  const statusOptions = [
    'In Process (Consultant)',
    'Waiting for a Banker',
    'In Process (Banker)',
    'Rejected',
    'Inquiried',
    'Accepted'
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
      inProcessConsultant: updatedRequests.filter(r => r.status === 'In Process (Consultant)').length,
      waitingForBanker: updatedRequests.filter(r => r.status === 'Waiting for a Banker').length,
      inProcessBanker: updatedRequests.filter(r => r.status === 'In Process (Banker)').length,
      rejected: updatedRequests.filter(r => r.status === 'Rejected').length,
      inquiried: updatedRequests.filter(r => r.status === 'Inquiried').length,
      accepted: updatedRequests.filter(r => r.status === 'Accepted').length
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

  return (
    <>
      <div className="p-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg p-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome <span className="text-blue-500">Front Desk</span>
            </h1>
            <p className="text-gray-600 mt-2">
              This application allows loan requests smooth processing,<br />
              from Consultants to Bankers.
            </p>
            <div className="mt-4 space-x-4">
              <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50">
                My Details
              </button>
              <button 
                onClick={() => router.push('/dashboard/new-request')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                New Request
              </button>
            </div>
          </div>
          <div className="w-1/3">
            <img src="/loan-illustration.svg" alt="Loan Process" className="w-full" />
          </div>
        </div>

        {/* My Report Section */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Report</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-600">All</p>
                <p className="text-sm text-gray-500">All my requests</p>
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-500">{stats.all}</span>
                <div className="ml-2 text-blue-500">📈</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-600">Accepted</p>
                <p className="text-sm text-gray-500">All my accepted requests</p>
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-500">{stats.accepted}</span>
                <div className="ml-2 text-blue-500">📈</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-600">This year</p>
                <p className="text-sm text-gray-500">All my requests of the year</p>
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-500">{stats.all}</span>
                <div className="ml-2 text-blue-500">📈</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Requests Section */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Loan Requests</h2>
          
          {/* Status Cards */}
          <div className="grid grid-cols-7 gap-4 mb-6">
            <div 
              className={`bg-gray-100 rounded-lg p-4 flex flex-col h-[76px] cursor-pointer transition-all hover:shadow-md ${selectedStatus === null ? 'ring-2 ring-gray-400' : ''}`}
              onClick={() => handleStatusFilter(null)}
            >
              <span className="text-2xl font-bold text-gray-900">{stats.all}</span>
              <span className="text-sm text-gray-600">All</span>
            </div>
            <div 
              className={`bg-purple-50 rounded-lg p-4 flex flex-col h-[76px] cursor-pointer transition-all hover:shadow-md ${selectedStatus === 'In Process (Consultant)' ? 'ring-2 ring-purple-400' : ''}`}
              onClick={() => handleStatusFilter('In Process (Consultant)')}
            >
              <span className="text-2xl font-bold text-purple-900">{stats.inProcessConsultant}</span>
              <span className="text-sm text-purple-600">In Process (Consultant)</span>
            </div>
            <div 
              className={`bg-orange-50 rounded-lg p-4 flex flex-col h-[76px] cursor-pointer transition-all hover:shadow-md ${selectedStatus === 'Waiting for a Banker' ? 'ring-2 ring-orange-400' : ''}`}
              onClick={() => handleStatusFilter('Waiting for a Banker')}
            >
              <span className="text-2xl font-bold text-orange-900">{stats.waitingForBanker}</span>
              <span className="text-sm text-orange-600">Waiting for a Banker</span>
            </div>
            <div 
              className={`bg-yellow-50 rounded-lg p-4 flex flex-col h-[76px] cursor-pointer transition-all hover:shadow-md ${selectedStatus === 'In Process (Banker)' ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => handleStatusFilter('In Process (Banker)')}
            >
              <span className="text-2xl font-bold text-yellow-900">{stats.inProcessBanker}</span>
              <span className="text-sm text-yellow-600">In Process (Banker)</span>
            </div>
            <div 
              className={`bg-red-50 rounded-lg p-4 flex flex-col h-[76px] cursor-pointer transition-all hover:shadow-md ${selectedStatus === 'Rejected' ? 'ring-2 ring-red-400' : ''}`}
              onClick={() => handleStatusFilter('Rejected')}
            >
              <span className="text-2xl font-bold text-red-900">{stats.rejected}</span>
              <span className="text-sm text-red-600">Rejected</span>
            </div>
            <div 
              className={`bg-blue-50 rounded-lg p-4 flex flex-col h-[76px] cursor-pointer transition-all hover:shadow-md ${selectedStatus === 'Inquiried' ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => handleStatusFilter('Inquiried')}
            >
              <span className="text-2xl font-bold text-blue-900">{stats.inquiried}</span>
              <span className="text-sm text-blue-600">Inquiried</span>
            </div>
            <div 
              className={`bg-emerald-50 rounded-lg p-4 flex flex-col h-[76px] cursor-pointer transition-all hover:shadow-md ${selectedStatus === 'Accepted' ? 'ring-2 ring-emerald-400' : ''}`}
              onClick={() => handleStatusFilter('Accepted')}
            >
              <span className="text-2xl font-bold text-emerald-900">{stats.accepted}</span>
              <span className="text-sm text-emerald-600">Accepted</span>
            </div>
          </div>

          {/* Request List */}
          <div className="space-y-4 min-h-[400px]">
            {filteredRequests.map((request, index) => (
              <div 
                key={request.id} 
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/requests/${request.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {generateLoanId(index)} - {request.borrowerName} - {request.propertyAddress}
                        </span>
                        <select
                          className={`px-2 py-1 rounded-full text-xs ${statusColors[request.status]}`}
                          value={request.status}
                          onClick={(e) => e.stopPropagation()} // 防止触发父元素的点击事件
                          onChange={(e) => {
                            e.stopPropagation();
                            updateLoanStatus(request.id, e.target.value as LoanRequest['status']);
                          }}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-sm text-gray-500">Created on {new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => router.push(`/dashboard/requests/${request.id}`)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <span>View Details</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Prevent event bubbling
                        e.stopPropagation(); // Prevent triggering parent's click event
                        console.log('Chat button clicked');
                        console.log('Loan ID:', request.id);
                        console.log('Current chat state:', { isChatOpen, activeLoanId });
                        setActiveLoanId(request.id);
                        setIsChatOpen(true);
                        console.log('Updated chat state:', { isChatOpen: true, activeLoanId: request.id });
                      }}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      <span className="text-sm">Chat</span>
                    </button>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {/* Borrower */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Borrower</span>
                      <span className="text-blue-600">{request.progress.borrower}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className="h-1.5 bg-blue-500 rounded-full"
                        style={{ width: `${request.progress.borrower}%` }}
                      />
                    </div>
                    <span className="flex items-center text-xs text-gray-500 mt-1">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {request.progress.borrower > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>

                  {/* Escrow & Title Column */}
                  <div>
                    {/* Escrow */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Escrow</span>
                        <span className="text-blue-600">{request.progress.escrow}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full">
                        <div 
                          className="h-1.5 bg-blue-500 rounded-full"
                          style={{ width: `${request.progress.escrow}%` }}
                        />
                      </div>
                      <span className="flex items-center text-xs text-gray-500 mt-1">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {request.progress.escrow > 0 ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                    {/* Title */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Title</span>
                        <span className="text-blue-600">{request.progress.title}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full">
                        <div 
                          className="h-1.5 bg-blue-500 rounded-full"
                          style={{ width: `${request.progress.title}%` }}
                        />
                      </div>
                      <span className="flex items-center text-xs text-gray-500 mt-1">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {request.progress.title > 0 ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                  </div>

                  {/* Underwriting */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Underwriting</span>
                      <span className="text-blue-600">{request.progress.underwriting}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className="h-1.5 bg-blue-500 rounded-full"
                        style={{ width: `${request.progress.underwriting}%` }}
                      />
                    </div>
                    <span className="flex items-center text-xs text-gray-500 mt-1">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {request.progress.underwriting > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>

                  {/* Post Funding */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Post Funding</span>
                      <span className="text-blue-600">{request.progress.postFunding}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className="h-1.5 bg-blue-500 rounded-full"
                        style={{ width: `${request.progress.postFunding}%` }}
                      />
                    </div>
                    <span className="flex items-center text-xs text-gray-500 mt-1">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {request.progress.postFunding > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 无数据提示 - 调整样式使其垂直居中 */}
            {filteredRequests.length === 0 && (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                No loan requests found for the selected status
              </div>
            )}
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
    </>
  );
}