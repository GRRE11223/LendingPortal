import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DocumentIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

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

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
}

interface DocumentManagerProps {
  documents: Document[];
  onUpload: (file: File, category: string) => Promise<void>;
  onStatusChange: (documentId: string, status: 'approved' | 'rejected') => Promise<void>;
  onAddComment: (documentId: string, comment: string) => Promise<void>;
  categories?: DocumentCategory[];
  onAddCategory?: (category: { name: string; description: string }) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
}

export default function DocumentManager({
  documents,
  onUpload,
  onStatusChange,
  onAddComment,
  categories = [],
  onAddCategory,
  onDeleteCategory
}: DocumentManagerProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);

  const handleFileUpload = async (files: FileList | null, category: string) => {
    if (!files || files.length === 0) return;
    await onUpload(files[0], category);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], category: string) => {
      try {
        if (acceptedFiles.length === 0) return;
        await onUpload(acceptedFiles[0], category);
        setNotifications(prev => [
          { id: Date.now().toString(), message: 'File uploaded successfully' },
          ...prev
        ]);
      } catch (error) {
        console.error('Upload failed:', error);
        setNotifications(prev => [
          { id: Date.now().toString(), message: 'Upload failed' },
          ...prev
        ]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => onDrop(files, selectedDoc?.category || ''),
    disabled: !selectedDoc,
  });

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const handleAddComment = async () => {
    if (selectedDoc && newComment.trim()) {
      await onAddComment(selectedDoc.id, newComment);
      setNewComment('');
      setNotifications(prev => [
        { id: Date.now().toString(), message: 'Comment added successfully' },
        ...prev,
      ]);
    }
  };

  const handleAddCategory = async (category: { name: string; description: string }) => {
    if (!onAddCategory) return;
    try {
      await onAddCategory(category);
      setNotifications(prev => [
        { id: Date.now().toString(), message: 'Category added successfully' },
        ...prev
      ]);
    } catch (error) {
      console.error('Failed to add category:', error);
      setNotifications(prev => [
        { id: Date.now().toString(), message: 'Failed to add category' },
        ...prev
      ]);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!onDeleteCategory) return;
    try {
      await onDeleteCategory(categoryId);
      setNotifications(prev => [
        { id: Date.now().toString(), message: 'Category deleted successfully' },
        ...prev
      ]);
    } catch (error) {
      console.error('Failed to delete category:', error);
      setNotifications(prev => [
        { id: Date.now().toString(), message: 'Failed to delete category' },
        ...prev
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="bg-white shadow-lg rounded-lg p-4 flex items-center space-x-2 animate-slide-in"
          >
            <BellIcon className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-gray-700">{notification.message}</p>
          </div>
        ))}
      </div>

      {/* Categories and Documents */}
      <div className="grid grid-cols-12 gap-6">
        {/* Categories List */}
        <div className="col-span-3 bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Categories</h3>
            {onAddCategory && (
              <button
                onClick={() => setShowAddCategory(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {categories.map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => {
                  const doc = documents.find(d => d.category === category.id);
                  setSelectedDoc(doc || null);
                }}
              >
                <div className="flex items-center space-x-2">
                  <DocumentIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Document Versions and Upload */}
        <div className="col-span-9 bg-white rounded-lg p-4 border border-gray-200">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{selectedDoc.name}</h3>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedDoc.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : selectedDoc.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {selectedDoc.status.charAt(0).toUpperCase() + selectedDoc.status.slice(1)}
                  </span>
                  <button
                    onClick={() => onStatusChange(selectedDoc.id, 'approved')}
                    className="p-1 text-green-600 hover:bg-green-50 rounded-full"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onStatusChange(selectedDoc.id, 'rejected')}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <input {...getInputProps()} />
                <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  {isDragActive
                    ? 'Drop the files here...'
                    : 'Drag and drop files here, or click to select files'}
                </p>
              </div>

              {/* Versions List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Versions</h4>
                {selectedDoc.versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{version.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded on {new Date(version.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreview(version.url)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        Preview
                      </button>
                      <span className="text-xs text-gray-500">Version {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comments Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                <div className="space-y-3 mb-4">
                  {selectedDoc.comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{comment.user}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{comment.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a category to view and manage documents</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddCategory(newCategory)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full h-3/4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Document Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="h-full">
              <iframe src={previewUrl} className="w-full h-full rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 