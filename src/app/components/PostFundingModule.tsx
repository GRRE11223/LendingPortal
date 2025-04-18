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

  const categories = [
    { id: 'funding-confirmation', name: 'Funding Confirmation', required: true },
    { id: 'wire-transfer', name: 'Wire Transfer', required: true },
    { id: 'closing-statement', name: 'Final Closing Statement', required: true },
    { id: 'recorded-documents', name: 'Recorded Documents', required: true },
    { id: 'insurance-policies', name: 'Insurance Policies', required: true },
    { id: 'other-post-funding', name: 'Other Post-Funding Documents', required: false },
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
  }, [request?.documents, categories, request?.id]);

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
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Funding Date</p>
            <p className="text-sm font-medium">
              {request.fundingDate ? new Date(request.fundingDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Funded Amount</p>
            <p className="text-sm font-medium">${request.loanAmount?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Wire Reference</p>
            <p className="text-sm font-medium">{request.wireReference || 'Not available'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Escrow Officer</p>
            <p className="text-sm font-medium">{request.escrowInfo?.officerName || 'Not assigned'}</p>
          </div>
        </div>
      </div>

      <DocumentManager
        documents={request.documents}
        onUpload={onDocumentUpload}
        onStatusChange={onStatusChange}
        onAddComment={onAddComment}
      />
    </div>
  );
} 