'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  timestamp: string;
  type: 'text' | 'image';
  imageUrl?: string;
}

interface ChatBoxProps {
  loanId: string;
  onClose: () => void;
}

// 初始化 IndexedDB
const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('ChatDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'loanId' });
      }
    };
  });
};

// 从 IndexedDB 加载消息
const loadMessagesFromDB = async (loanId: string): Promise<Message[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.get(loanId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.messages : []);
      };
    });
  } catch (error) {
    console.error('Failed to load messages from DB:', error);
    return [];
  }
};

// 保存消息到 IndexedDB
const saveMessagesToDB = async (loanId: string, messages: Message[]) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.put({ loanId, messages: messages.slice(-50) });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Failed to save messages to DB:', error);
  }
};

// 压缩图片URL
const compressImageUrl = (imageUrl: string): string => {
  if (!imageUrl.startsWith('data:image')) return imageUrl;
  if (imageUrl.length <= 100 * 1024) return imageUrl;
  return '[Image URL too large]';
};

// 清理消息数据
const cleanMessages = (messages: Message[]): Message[] => {
  // 只保留最新的50条消息
  const recentMessages = messages.slice(-50);
  
  // 压缩消息中的图片数据
  return recentMessages.map(msg => ({
    ...msg,
    imageUrl: msg.type === 'image' ? compressImageUrl(msg.imageUrl || '') : undefined
  }));
};

export default function ChatBox({ loanId, onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载用户信息
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  // 加载聊天记录
  useEffect(() => {
    const loadMessages = async () => {
      const savedMessages = await loadMessagesFromDB(loanId);
      setMessages(savedMessages);
    };
    loadMessages();
  }, [loanId]);

  // 保存消息
  const saveMessages = async (messagesToSave: Message[]) => {
    try {
      await saveMessagesToDB(loanId, messagesToSave);
      setMessages(messagesToSave);
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  // 发送消息
  const handleSend = (type: 'text' | 'image' = 'text', imageUrl?: string) => {
    if (!user) {
      alert('Please sign in to send messages');
      return;
    }

    if (type === 'text' && !newMessage.trim()) {
      return;
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      content: type === 'text' ? newMessage : 'Sent an image',
      sender: {
        id: user.id || Date.now().toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      timestamp: new Date().toISOString(),
      type,
      ...(type === 'image' && { imageUrl })
    };

    const updatedMessages = [...messages, newMsg];
    saveMessages(updatedMessages);

    if (type === 'text') {
      setNewMessage('');
    }
  };

  // 当消息更新时滚动到底部
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // 限制图片大小为 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        // 压缩图片数据
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 设置最大尺寸
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          } else if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 压缩后的图片数据
          const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.6);
          handleSend('image', compressedImageUrl);
          setIsUploading(false);
        };
        img.src = imageUrl;
      };
      reader.onerror = () => {
        alert('Failed to upload image');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Failed to upload image');
      setIsUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border z-[9999]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-500 text-white rounded-t-lg">
        <h3 className="font-semibold">Loan Chat - {loanId}</h3>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender?.email === user?.email;
            return (
              <div
                key={message.id}
                className={`mb-4 flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-2' : 'mr-2'}`}>
                  {message.sender?.avatar ? (
                    <Image
                      src={message.sender.avatar}
                      alt={message.sender?.name || 'User'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                      {(message.sender?.name || 'User').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-gray-700">
                      {message.sender?.name || 'User'}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    {message.type === 'text' ? (
                      <div className="break-words">{message.content}</div>
                    ) : message.type === 'image' && message.imageUrl ? (
                      <div className="mt-2 relative group">
                        <img 
                          src={message.imageUrl} 
                          alt="Uploaded content"
                          className="max-w-full rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                          onClick={() => window.open(message.imageUrl, '_blank')}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            Click to view
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="w-full border rounded-lg p-2 pr-24 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
            disabled={isUploading}
          />
          <div className="absolute right-2 bottom-2 flex space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`${
                isUploading 
                  ? 'bg-gray-200 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200'
              } text-gray-600 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              disabled={isUploading}
              title="Upload image"
            >
              <PhotoIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={isUploading}
              className={`${
                isUploading
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
        </div>
      </div>
    </div>
  );
} 