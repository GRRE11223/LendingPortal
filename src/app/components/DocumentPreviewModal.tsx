import { XMarkIcon } from '@heroicons/react/24/outline';

interface DocumentPreviewModalProps {
  document: string;
  onClose: () => void;
}

export default function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">Document Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          {/* 这里可以根据文档类型显示不同的预览 */}
          <div className="aspect-[8.5/11] bg-gray-100 rounded-lg flex items-center justify-center">
            <iframe
              src={document}
              className="w-full h-full rounded-lg"
              title="Document Preview"
            />
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
} 