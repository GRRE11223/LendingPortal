'use client';

import { useState } from 'react';
import { Document } from '@/types';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface LoanRequest {
  id: string;
  borrowerName: string;
  loanAmount: number;
  loan: {
    propertyAddress: {
      fullAddress: string;
    };
    underwriting: {
      loanTerms: {
        rate: number;
        term: number;
      };
      propertyDetails: {
        value: number;
      };
    };
  };
  progress: {
    borrower: number;
    escrow: number;
    title: number;
    underwriting: number;
    postFunding: number;
  };
}

interface PreFundingModuleProps {
  request: LoanRequest;
  onDocumentUpload: (file: File, category: string, section?: 'escrow' | 'title') => void;
  onStatusChange: (documentId: string, status: Document['status'], section?: 'escrow' | 'title') => Promise<void>;
  onAddComment: (documentId: string, content: string, section?: 'escrow' | 'title') => Promise<void>;
}

export default function PreFundingModule({ request, onDocumentUpload, onStatusChange, onAddComment }: PreFundingModuleProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const requiredDocs = [
    { id: 'finalMess', name: 'Final MESS', type: 'generate', status: 'pending' },
    { id: 'tracking', name: 'Tracking', type: 'generate', status: 'pending' },
    { id: 'wireInstruction', name: "Title's Wire Instruction", type: 'upload', status: 'pending' },
    { id: 'closingFund', name: "Receipt of Buyer's Closing Fund", type: 'upload', status: 'pending' },
    { id: 'signedLoanDoc', name: 'Signed Loan Doc', type: 'upload', status: 'pending' },
    { id: 'confirmWire', name: 'Confirm Wire Amount with Escrow', type: 'confirm', status: 'pending' },
  ];

  const handleDocumentGenerate = async (type: string) => {
    setIsGenerating(true);
    try {
      // 在这里处理文档生成逻辑
      console.log(`Generating document of type: ${type}`);
    } catch (error) {
      console.error('Error generating document:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loan Summary */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Borrower</p>
            <p className="text-sm font-medium">{request?.borrowerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Loan Amount</p>
            <p className="text-sm font-medium">${request?.loanAmount?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Interest Rate</p>
            <p className="text-sm font-medium">{request?.loan?.underwriting?.loanTerms?.rate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Term</p>
            <p className="text-sm font-medium">{request?.loan?.underwriting?.loanTerms?.term} months</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Property</p>
            <p className="text-sm font-medium">{request?.loan?.propertyAddress?.fullAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">LTV</p>
            <p className="text-sm font-medium">
              {(((request?.loanAmount || 0) / (request?.loan?.underwriting?.propertyDetails?.value || 1)) * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Required Documents */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
        <div className="space-y-4">
          {requiredDocs.map((doc) => (
            <div key={doc.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-4">
                <DocumentIcon className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {doc.type === 'generate'
                      ? 'System generated document'
                      : doc.type === 'upload'
                      ? 'Requires upload'
                      : 'Requires confirmation'}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        doc.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : doc.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {doc.type === 'generate' ? (
                  <button
                    onClick={() => handleDocumentGenerate(doc.id)}
                    disabled={isGenerating}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isGenerating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                ) : doc.type === 'upload' ? (
                  <label className="cursor-pointer px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
                    <input type="file" className="hidden" />
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </label>
                ) : (
                  <button className="px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100">
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                )}
                {doc.status !== 'pending' && (
                  <>
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-md">
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-md">
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fund Button */}
      <div className="flex justify-end">
        <button
          disabled={requiredDocs.some((doc) => doc.status !== 'completed')}
          className={`px-6 py-3 rounded-md text-sm font-medium ${
            requiredDocs.some((doc) => doc.status !== 'completed')
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Fund Loan
        </button>
      </div>
    </div>
  );
} 