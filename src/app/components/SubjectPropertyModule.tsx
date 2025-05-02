import { useState } from 'react';
import { DocumentUpload, Document } from './DocumentUpload';
import { HomeIcon, DocumentTextIcon, PhotoIcon, DocumentDuplicateIcon, DocumentCheckIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface SubjectPropertyModuleProps {
  loanId: string;
}

export const SubjectPropertyModule = ({ loanId }: SubjectPropertyModuleProps) => {
  const [activeTab, setActiveTab] = useState<'eoi' | 'rce' | 'invoice' | 'appraisal' | 'photos' | 'other'>('eoi');
  const [documents, setDocuments] = useState<{
    eoi: Document[];
    rce: Document[];
    invoice: Document[];
    appraisal: Document[];
    photos: Document[];
    other: Document[];
  }>({
    eoi: [],
    rce: [],
    invoice: [],
    appraisal: [],
    photos: [],
    other: []
  });

  const handleUpload = async (files: File[], type: keyof typeof documents) => {
    try {
      // TODO: Implement actual file upload logic
      const newDocs: Document[] = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9), // Temporary ID generation
        name: file.name,
        uploadDate: new Date(),
        status: 'pending',
        type: file.type,
        size: file.size
      }));

      setDocuments(prev => ({
        ...prev,
        [type]: [...prev[type], ...newDocs]
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
      // TODO: Implement error handling
    }
  };

  const handleDelete = async (documentId: string, type: keyof typeof documents) => {
    try {
      // TODO: Implement actual delete logic
      setDocuments(prev => ({
        ...prev,
        [type]: prev[type].filter(doc => doc.id !== documentId)
      }));
    } catch (error) {
      console.error('Error deleting file:', error);
      // TODO: Implement error handling
    }
  };

  const tabs = [
    { 
      id: 'eoi' as const, 
      name: 'Evidence of Insurance',
      icon: DocumentCheckIcon,
      description: 'Upload insurance evidence documents',
      acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'] as string[]
    },
    { 
      id: 'rce' as const, 
      name: 'Request for Certificate',
      icon: DocumentTextIcon,
      description: 'Submit certificate requests',
      acceptedTypes: ['.pdf', '.doc', '.docx'] as string[]
    },
    { 
      id: 'invoice' as const, 
      name: 'Insurance Invoice',
      icon: DocumentDuplicateIcon,
      description: 'Upload insurance invoices and receipts',
      acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'] as string[]
    },
    {
      id: 'appraisal' as const,
      name: 'Appraisal Report',
      icon: HomeIcon,
      description: 'Upload property appraisal documents',
      acceptedTypes: ['.pdf'] as string[]
    },
    {
      id: 'photos' as const,
      name: 'Property Photos',
      icon: PhotoIcon,
      description: 'Upload property images and photos',
      acceptedTypes: ['.jpg', '.jpeg', '.png', '.heic'] as string[]
    },
    {
      id: 'other' as const,
      name: 'Other Documents',
      icon: DocumentIcon,
      description: 'Upload additional property documents',
      acceptedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'] as string[]
    }
  ] as const;

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50/50">
        <div className="flex overflow-x-auto py-2 px-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg mr-2 whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? 'block' : 'hidden'}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{tab.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{tab.description}</p>
            </div>
            
            <DocumentUpload
              documents={documents[tab.id]}
              onUpload={(files: File[]) => handleUpload(files, tab.id)}
              onDelete={(id: string) => handleDelete(id, tab.id)}
              acceptedFileTypes={tab.acceptedTypes}
              maxFiles={10}
            />
          </div>
        ))}
      </div>
    </div>
  );
}; 