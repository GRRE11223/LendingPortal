import { XMarkIcon } from '@heroicons/react/24/outline';

interface DocumentPreviewModalProps {
  document: {
    url: string;
    fileName: string;
  };
  onClose: () => void;
}

export default function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  const isPDF = document.fileName.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(document.fileName);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{document.fileName}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          {isPDF ? (
            <iframe
              src={document.url}
              className="w-full h-[70vh] rounded-lg"
              title={document.fileName}
            />
          ) : isImage ? (
            <img
              src={document.url}
              alt={document.fileName}
              className="max-w-full max-h-[70vh] mx-auto object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-[70vh] bg-gray-100 rounded-lg">
              <p className="text-gray-500">Preview not available for this file type</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <a
            href={document.url}
            download={document.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
} 