'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface LoanRequest {
  id: string;
  status: 'In Process (Consultant)';
  createdAt: string;
  type: 'New loan';
  borrowerName: string;
  borrowerInfo: {
    email: string;
    phone: string;
    creditScore: number;
    annualIncome: number;
    documents: any[];
  };
  loan: {
    propertyValue: number;
    loanAmount: number;
    ltv: number;
    propertyAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      fullAddress: string;
    };
    loanPurpose: string;
    propertyType: string;
    loanProgram: string;
    targetFundingDate: string;
    loanIntention: string;
    originator: string;
  };
  escrow: {
    email: string;
    insuranceEmail: string;
    initialFileSubmission: {
      name: string;
      url: string;
      folder: string;
      type: string;
      size: number;
    }[];
    documents: any[];
    isTbdEscrowEmail: boolean;
    isTbdInsuranceEmail: boolean;
  };
  progress: {
    borrower: number;
    escrow: number;
    title: number;
    underwriting: number;
    postFunding: number;
  };
  documents: any[];
}

interface FileWithFolder {
  file: File;
  name: string;
  url: string;
  folder: string;
  type: string;
  size: number;
}

interface FormData {
  borrower: {
    legalName: string;
    email: string;
    contactNumber: string;
  };
  loan: {
    propertyValue: string;
    loanAmount: string;
    ltv: string;
    propertyAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      fullAddress: string;
    };
    loanPurpose: string;
    propertyType: string;
    loanProgram: string;
    targetFundingDate: string;
    loanIntention: string;
    originator: string;
  };
  escrow: {
    email: string;
    insuranceEmail: string;
    initialFileSubmission: FileWithFolder[];
    isTbdEscrowEmail: boolean;
    isTbdInsuranceEmail: boolean;
  };
}

export default function NewRequest() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [ltvError, setLtvError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    contactNumber: '',
    escrowEmail: '',
    insuranceEmail: ''
  });
  const [formData, setFormData] = useState<FormData>({
    borrower: {
      legalName: '',
      email: '',
      contactNumber: ''
    },
    loan: {
      propertyValue: '',
      loanAmount: '',
      ltv: '',
      propertyAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        fullAddress: ''
      },
      loanPurpose: 'purchase',
      propertyType: 'residential',
      loanProgram: 'standard',
      targetFundingDate: '',
      loanIntention: '',
      originator: ''
    },
    escrow: {
      email: '',
      insuranceEmail: '',
      initialFileSubmission: [],
      isTbdEscrowEmail: false,
      isTbdInsuranceEmail: false
    }
  });

  const [isFolderListExpanded, setIsFolderListExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

  const folders = [
    { id: 'id', name: 'ID', icon: '📄' },
    { id: 'bankStatement', name: 'Bank Statement', icon: '🏦' },
    { id: 'loanApplication', name: 'Loan Application', icon: '📝' },
    { id: 'creditReport', name: 'Credit Report', icon: '📊' },
    { id: 'insurance', name: 'Insurance', icon: '🔒' },
    { id: 'existingMortgage', name: 'Existing Mortgage Statement', icon: '🏠' },
    { id: 'others', name: 'Others', icon: '📁' }
  ];

  const [draggedFile, setDraggedFile] = useState<number | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const parseNumber = (val: string) => parseFloat(val.toString().replace(/,/g, '')) || 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');

    if (section === 'loan') {
      if (field === 'propertyValue') {
        // When property value changes, reset loan amount and LTV
        setLtvError('');
        setFormData(prev => ({
          ...prev,
          loan: {
            ...prev.loan,
            propertyValue: value,
            loanAmount: '',
            ltv: ''
          }
        }));
      } 
      else if (field === 'loanAmount') {
        const loan = parseNumber(value);
        const pv = parseNumber(formData.loan.propertyValue);
        
        if (pv > 0) {
          const calculatedLtv = (loan / pv) * 100;
          if (calculatedLtv > 100) {
            setLtvError('LTV cannot exceed 100%');
            return;
          }
          setLtvError('');
        }

        setFormData(prev => ({
          ...prev,
          loan: {
            ...prev.loan,
            loanAmount: value,
            ...(pv > 0 ? { ltv: formatter.format((loan / pv) * 100) } : {})
          }
        }));
      }
      else if (field === 'ltv') {
        const ltv = parseNumber(value);
        const pv = parseNumber(formData.loan.propertyValue);
        
        if (ltv > 100) {
          setLtvError('LTV cannot exceed 100%');
          return;
        }
        setLtvError('');
        
        setFormData(prev => ({
          ...prev,
          loan: {
            ...prev.loan,
            ltv: value,
            ...(pv > 0 ? { loanAmount: formatter.format((pv * ltv) / 100) } : {})
          }
        }));
      }
      else {
        setFormData(prev => ({
          ...prev,
          loan: {
            ...prev.loan,
            [field]: value
          }
        }));
      }
    }
    else if (section === 'borrower' && field && section in formData) {
      let newValue = value;
      let error = '';

      if (field === 'email') {
        error = validateEmail(value);
        setValidationErrors(prev => ({ ...prev, email: error }));
      } else if (field === 'contactNumber') {
        newValue = formatPhoneNumber(value);
        error = validatePhoneNumber(newValue);
        setValidationErrors(prev => ({ ...prev, contactNumber: error }));
      }

      setFormData(prev => ({
        ...prev,
        borrower: {
          ...prev.borrower,
          [field]: newValue
        }
      }));
    }
    else if (section === 'escrow' && field && section in formData) {
      let error = '';
      
      if (field === 'email' && !formData.escrow.isTbdEscrowEmail) {
        error = validateEmail(value);
        setValidationErrors(prev => ({ ...prev, escrowEmail: error }));
      } else if (field === 'insuranceEmail' && !formData.escrow.isTbdInsuranceEmail) {
        error = validateEmail(value);
        setValidationErrors(prev => ({ ...prev, insuranceEmail: error }));
      }

      setFormData(prev => ({
        ...prev,
        escrow: {
          ...prev.escrow,
          [field]: value
        }
      }));
    }
    else if (section && field && section in formData) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof FormData],
          [field]: value
        }
      }));
    }
  };

  const handlePropertyValueBlur = () => {
    const pv = parseNumber(formData.loan.propertyValue);
    setFormData(prev => ({
      ...prev,
      loan: {
        ...prev.loan,
        propertyValue: formatter.format(pv)
      }
    }));
  };

  const handleLoanAmountBlur = () => {
    const loan = parseNumber(formData.loan.loanAmount);
    const pv = parseNumber(formData.loan.propertyValue);
    
    if (pv > 0) {
      const calculatedLtv = (loan / pv) * 100;
      if (calculatedLtv > 100) {
        setLtvError('LTV cannot exceed 100%');
        setFormData(prev => ({
          ...prev,
          loan: {
            ...prev.loan,
            loanAmount: formatter.format(pv),
            ltv: '100.00'
          }
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      loan: {
        ...prev.loan,
        loanAmount: formatter.format(loan)
      }
    }));
  };

  const handleLtvBlur = () => {
    const ltv = parseNumber(formData.loan.ltv);
    if (ltv > 100) {
      setLtvError('LTV cannot exceed 100%');
      setFormData(prev => ({
        ...prev,
        loan: {
          ...prev.loan,
          ltv: '100.00'
        }
      }));
    } else {
      setLtvError('');
      setFormData(prev => ({
        ...prev,
        loan: {
          ...prev.loan,
          ltv: formatter.format(ltv)
        }
      }));
    }
  };

  // Function to parse address
  const parseAddress = (fullAddress: string) => {
    // Basic address parsing using regex
    const addressRegex = /^(.*?),?\s*(?:,\s*)?([^,]+?)(?:,\s*)?([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i;
    const match = fullAddress.match(addressRegex);

    if (match) {
      const [_, street, city, state, zipCode] = match;
      return {
        street: street?.trim() || '',
        city: city?.trim() || '',
        state: state?.trim().toUpperCase() || '',
        zipCode: zipCode?.trim() || '',
        fullAddress
      };
    }
    return null;
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'fullAddress') {
      const parsedAddress = parseAddress(value);
      if (parsedAddress) {
        setFormData(prev => ({
          ...prev,
          loan: {
            ...prev.loan,
            propertyAddress: parsedAddress
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          loan: {
            ...prev.loan,
            propertyAddress: {
              ...prev.loan.propertyAddress,
              fullAddress: value,
              street: '',
              city: '',
              state: '',
              zipCode: ''
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        loan: {
          ...prev.loan,
          propertyAddress: {
            ...prev.loan.propertyAddress,
            [name]: value,
            fullAddress: `${prev.loan.propertyAddress.street}, ${prev.loan.propertyAddress.city}, ${prev.loan.propertyAddress.state} ${prev.loan.propertyAddress.zipCode}`
          }
        }
      }));
    }
  };

  // Add validation functions
  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const invalidChars = /[^a-zA-Z0-9@._-]/g;
    if (invalidChars.test(email)) {
      return 'Invalid character in email address';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return 'Contact number is required';
    // Remove all non-digits for validation
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      return 'Phone number must be 10 digits';
    }
    return '';
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (cleaned.length >= 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6,10)}`;
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields before submission
    const emailError = validateEmail(formData.borrower.email);
    const phoneError = validatePhoneNumber(formData.borrower.contactNumber);
    const escrowEmailError = !formData.escrow.isTbdEscrowEmail ? validateEmail(formData.escrow.email) : '';
    const insuranceEmailError = !formData.escrow.isTbdInsuranceEmail ? validateEmail(formData.escrow.insuranceEmail) : '';

    setValidationErrors({
      email: emailError,
      contactNumber: phoneError,
      escrowEmail: escrowEmailError,
      insuranceEmail: insuranceEmailError
    });

    // Check if there are any validation errors
    if (emailError || phoneError || escrowEmailError || insuranceEmailError) {
      return; // Stop form submission if there are errors
    }

    setIsLoading(true);

    try {
      const newRequest: LoanRequest = {
        id: Math.random().toString(36).substring(7),
        status: 'In Process (Consultant)',
        createdAt: new Date().toISOString(),
        type: 'New loan',
        borrowerName: formData.borrower.legalName,
        borrowerInfo: {
          email: formData.borrower.email,
          phone: formData.borrower.contactNumber,
          creditScore: 0,
          annualIncome: 0,
          documents: []
        },
        loan: {
          propertyValue: parseFloat(formData.loan.propertyValue.replace(/,/g, '')),
          loanAmount: parseFloat(formData.loan.loanAmount.replace(/,/g, '')),
          ltv: parseFloat(formData.loan.ltv.replace(/,/g, '')),
          propertyAddress: formData.loan.propertyAddress,
          loanPurpose: formData.loan.loanPurpose,
          propertyType: formData.loan.propertyType,
          loanProgram: formData.loan.loanProgram,
          targetFundingDate: formData.loan.targetFundingDate,
          loanIntention: formData.loan.loanIntention,
          originator: formData.loan.originator
        },
        escrow: {
          email: formData.escrow.email,
          insuranceEmail: formData.escrow.insuranceEmail,
          initialFileSubmission: formData.escrow.initialFileSubmission.map(file => ({
            name: file.name,
            url: file.url,
            folder: file.folder,
            type: file.type,
            size: file.size
          })),
          documents: [],
          isTbdEscrowEmail: formData.escrow.isTbdEscrowEmail,
          isTbdInsuranceEmail: formData.escrow.isTbdInsuranceEmail
        },
        progress: {
          borrower: 0,
          escrow: 0,
          title: 0,
          underwriting: 0,
          postFunding: 0
        },
        documents: []
      };

      const existingRequests = localStorage.getItem('loanRequests');
      const requests = existingRequests ? JSON.parse(existingRequests) : [];
      requests.push(newRequest);
      localStorage.setItem('loanRequests', JSON.stringify(requests));
      localStorage.setItem(`request_${newRequest.id}`, JSON.stringify(newRequest));

      router.push(`/dashboard/requests/${newRequest.id}`);
    } catch (error) {
      console.error('Failed to create loan request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.getElementById('address-popup');
      const button = document.getElementById('address-detail-button');
      if (popup && button && 
          !popup.contains(event.target as Node) && 
          !button.contains(event.target as Node)) {
        setShowAddressPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: FileWithFolder[] = files.map(file => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      folder: 'others', // Default folder
      type: file.type,
      size: file.size
    }));
    
    setFormData(prev => ({
      ...prev,
      escrow: {
        ...prev.escrow,
        initialFileSubmission: [...prev.escrow.initialFileSubmission, ...newFiles]
      }
    }));
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newFiles: FileWithFolder[] = files.map(file => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      folder: 'others', // Default folder
      type: file.type,
      size: file.size
    }));
    
    setFormData(prev => ({
      ...prev,
      escrow: {
        ...prev.escrow,
        initialFileSubmission: [...prev.escrow.initialFileSubmission, ...newFiles]
      }
    }));
  };

  const handleFileDragStart = (index: number) => {
    setDraggedFile(index);
  };

  const handleFolderDragEnter = (folderId: string) => {
    setDragOverFolder(folderId);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleFolderDrop = (folderId: string) => {
    if (draggedFile !== null) {
      setFormData(prev => ({
        ...prev,
        escrow: {
          ...prev.escrow,
          initialFileSubmission: prev.escrow.initialFileSubmission.map((item, index) =>
            index === draggedFile ? { ...item, folder: folderId } : item
          )
        }
      }));
    }
    setDraggedFile(null);
    setDragOverFolder(null);
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      escrow: {
        ...prev.escrow,
        initialFileSubmission: prev.escrow.initialFileSubmission.filter((_, i) => i !== index)
      }
    }));
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const getFilesInFolder = (folderId: string) => {
    return formData.escrow.initialFileSubmission.filter(f => f.folder === folderId);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const [section, field] = name.split('.');
    
    setFormData(prev => ({
      ...prev,
      escrow: {
        ...prev.escrow,
        [field]: checked,
        ...(field === 'isTbdEscrowEmail' ? { email: checked ? 'TBD' : '' } : {}),
        ...(field === 'isTbdInsuranceEmail' ? { insuranceEmail: checked ? 'TBD' : '' } : {})
      }
    }));

    // Clear validation errors when TBD is checked
    if (field === 'isTbdEscrowEmail') {
      setValidationErrors(prev => ({ ...prev, escrowEmail: '' }));
    } else if (field === 'isTbdInsuranceEmail') {
      setValidationErrors(prev => ({ ...prev, insuranceEmail: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="px-8 py-8 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative">
              <h2 className="text-3xl font-bold text-white text-center mb-2">New Loan Request</h2>
              <p className="text-blue-100 text-center text-sm">Please fill in the details below to create a new loan request</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Borrower Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-200 transition-colors duration-300 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 shadow-sm">1</span>
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Borrower Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      name="borrower.legalName"
                      value={formData.borrower.legalName}
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                      placeholder="Enter legal name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="borrower.email"
                      value={formData.borrower.email}
                      onChange={handleChange}
                      required
                      className={`block w-full px-4 py-3 bg-gray-50 rounded-lg border ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 ${
                        validationErrors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                      } focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white`}
                      placeholder="Enter email address"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="borrower.contactNumber"
                      value={formData.borrower.contactNumber}
                      onChange={handleChange}
                      required
                      className={`block w-full px-4 py-3 bg-gray-50 rounded-lg border ${
                        validationErrors.contactNumber ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 ${
                        validationErrors.contactNumber ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                      } focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white`}
                      placeholder="(123) 456-7890"
                    />
                    {validationErrors.contactNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.contactNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Loan Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-200 transition-colors duration-300 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 shadow-sm">2</span>
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Loan Information</span>
                </h3>
                <div className="space-y-8">
                  {/* Property Address */}
                  <div className="relative space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Property Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="fullAddress"
                        value={formData.loan.propertyAddress.fullAddress}
                        onChange={handleAddressChange}
                        className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                        placeholder="Enter complete property address (e.g. Street, City, State ZipCode)"
                        required
                      />
                      <button
                        type="button"
                        id="address-detail-button"
                        onClick={() => setShowAddressPopup(!showAddressPopup)}
                        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Address Detail Popup */}
                    {showAddressPopup && (
                      <div 
                        id="address-popup"
                        className="absolute z-10 mt-2 p-6 bg-white rounded-xl shadow-xl border border-gray-200 w-full"
                      >
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Street
                            </label>
                            <input
                              type="text"
                              name="street"
                              value={formData.loan.propertyAddress.street}
                              onChange={handleAddressChange}
                              className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                              placeholder="Street address"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={formData.loan.propertyAddress.city}
                                onChange={handleAddressChange}
                                className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                                placeholder="City"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  State
                                </label>
                                <input
                                  type="text"
                                  name="state"
                                  value={formData.loan.propertyAddress.state}
                                  onChange={handleAddressChange}
                                  className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white uppercase"
                                  placeholder="ST"
                                  maxLength={2}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  ZIP Code
                                </label>
                                <input
                                  type="text"
                                  name="zipCode"
                                  value={formData.loan.propertyAddress.zipCode}
                                  onChange={handleAddressChange}
                                  className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                                  placeholder="12345"
                                  maxLength={10}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end mt-2">
                            <button
                              type="button"
                              onClick={() => setShowAddressPopup(false)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Property Value, Loan Amount, LTV */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Property Value
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="text"
                          name="loan.propertyValue"
                          value={formData.loan.propertyValue}
                          onChange={handleChange}
                          onBlur={handlePropertyValueBlur}
                          required
                          className="block w-full pl-8 pr-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                          placeholder="Enter property value"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Loan Amount
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="text"
                          name="loan.loanAmount"
                          value={formData.loan.loanAmount}
                          onChange={handleChange}
                          onBlur={handleLoanAmountBlur}
                          className="block w-full pl-8 pr-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                          placeholder="Enter loan amount"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        LTV
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="loan.ltv"
                          value={formData.loan.ltv}
                          onChange={handleChange}
                          onBlur={handleLtvBlur}
                          className={`block w-full px-4 py-3 bg-gray-50 rounded-lg border ${ltvError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 ${ltvError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white pr-8`}
                          placeholder="Enter LTV"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                      </div>
                      {ltvError && (
                        <p className="mt-1 text-sm text-red-600">
                          {ltvError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Loan Purpose, Property Type, Loan Program */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Loan Purpose
                      </label>
                      <select
                        name="loan.loanPurpose"
                        value={formData.loan.loanPurpose}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white appearance-none"
                      >
                        <option value="purchase">Purchase</option>
                        <option value="refinance">Refinance</option>
                        <option value="construction">Construction</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Property Type
                      </label>
                      <select
                        name="loan.propertyType"
                        value={formData.loan.propertyType}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white appearance-none"
                      >
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Loan Program
                      </label>
                      <select
                        name="loan.loanProgram"
                        value={formData.loan.loanProgram}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white appearance-none"
                      >
                        <option value="standard">Standard</option>
                        <option value="bridgeToRefinance">Bridge To Refinance</option>
                        <option value="fixAndFlip">Fix & Flip</option>
                        <option value="2ndLien">2nd Lien</option>
                        <option value="commericalBridge">Commerical Bridge</option>
                      </select>
                    </div>
                  </div>

                  {/* Target Funding Date, Loan Intention, Originator */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Initial Target Funding Date
                      </label>
                      <input
                        type="date"
                        name="loan.targetFundingDate"
                        value={formData.loan.targetFundingDate}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Originator
                      </label>
                      <input
                        type="text"
                        name="loan.originator"
                        value={formData.loan.originator}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white"
                        placeholder="Enter originator name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Loan Intention
                    </label>
                    <textarea
                      name="loan.loanIntention"
                      value={formData.loan.loanIntention}
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm hover:bg-white resize-none"
                      placeholder="Describe the loan intention"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Other Information Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-200 transition-colors duration-300 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 shadow-sm">3</span>
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Other Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Escrow Email
                    </label>
                    <div>
                      <input
                        type="email"
                        name="escrow.email"
                        value={formData.escrow.email}
                        onChange={handleChange}
                        disabled={formData.escrow.isTbdEscrowEmail}
                        required={!formData.escrow.isTbdEscrowEmail}
                        className={`block w-full px-4 py-2.5 bg-gray-50 rounded-lg border ${
                          validationErrors.escrowEmail ? 'border-red-300 bg-red-50' : 'border-gray-100'
                        } focus:outline-none focus:ring-1 ${
                          validationErrors.escrowEmail ? 'focus:ring-red-200 focus:border-red-300' : 'focus:ring-blue-100 focus:border-blue-200'
                        } transition-all duration-200 text-gray-700 text-sm placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500`}
                        placeholder="Enter escrow email"
                      />
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          id="escrow.isTbdEscrowEmail"
                          name="escrow.isTbdEscrowEmail"
                          checked={formData.escrow.isTbdEscrowEmail}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="escrow.isTbdEscrowEmail" className="ml-2 text-sm text-gray-500">
                          TBD
                        </label>
                      </div>
                      {validationErrors.escrowEmail && !formData.escrow.isTbdEscrowEmail && (
                        <p className="mt-1 text-xs text-red-500">
                          Please enter a valid email address
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Insurance Email
                    </label>
                    <div>
                      <input
                        type="email"
                        name="escrow.insuranceEmail"
                        value={formData.escrow.insuranceEmail}
                        onChange={handleChange}
                        disabled={formData.escrow.isTbdInsuranceEmail}
                        required={!formData.escrow.isTbdInsuranceEmail}
                        className={`block w-full px-4 py-2.5 bg-gray-50 rounded-lg border ${
                          validationErrors.insuranceEmail ? 'border-red-300 bg-red-50' : 'border-gray-100'
                        } focus:outline-none focus:ring-1 ${
                          validationErrors.insuranceEmail ? 'focus:ring-red-200 focus:border-red-300' : 'focus:ring-blue-100 focus:border-blue-200'
                        } transition-all duration-200 text-gray-700 text-sm placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500`}
                        placeholder="Enter insurance email"
                      />
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          id="escrow.isTbdInsuranceEmail"
                          name="escrow.isTbdInsuranceEmail"
                          checked={formData.escrow.isTbdInsuranceEmail}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="escrow.isTbdInsuranceEmail" className="ml-2 text-sm text-gray-500">
                          TBD
                        </label>
                      </div>
                      {validationErrors.insuranceEmail && !formData.escrow.isTbdInsuranceEmail && (
                        <p className="mt-1 text-xs text-red-500">
                          Please enter a valid email address
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Initial File Submission
                  </label>
                  <div className="grid grid-cols-12 gap-6">
                    {/* Folders List */}
                    <div className="col-span-4 bg-white">
                      <div className="py-2">
                        <div className="text-sm font-medium text-gray-700 px-4 mb-2">Folders</div>
                        {folders.map((folder, index) => {
                          const filesInFolder = getFilesInFolder(folder.id);
                          const isExpanded = expandedFolders[folder.id];
                          return (
                            <div key={folder.id}>
                              <div
                                onClick={() => toggleFolder(folder.id)}
                                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                                  dragOverFolder === folder.id ? 'bg-blue-50' : ''
                                }`}
                                onDragEnter={() => handleFolderDragEnter(folder.id)}
                                onDragLeave={handleFolderDragLeave}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleFolderDrop(folder.id)}
                              >
                                <span className="text-lg w-5 mr-3 opacity-70">{folder.icon}</span>
                                <span className="text-sm text-gray-600 flex-1">{folder.name}</span>
                                {filesInFolder.length > 0 && (
                                  <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5">
                                    {filesInFolder.length}
                                  </span>
                                )}
                              </div>
                              {isExpanded && filesInFolder.length > 0 && (
                                <div className="pl-8 pr-4 py-1">
                                  {filesInFolder.map((fileData, fileIndex) => (
                                    <div
                                      key={fileIndex}
                                      className="text-xs text-gray-500 py-1 truncate"
                                    >
                                      {fileData.file.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Upload and Preview Area - adjust width */}
                    <div className="col-span-8">
                      <div
                        className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors duration-200"
                        onDrop={handleFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload files</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                multiple
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX up to 10MB each</p>
                        </div>
                      </div>

                      {/* File Preview */}
                      {formData.escrow.initialFileSubmission.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                          <div className="grid grid-cols-1 gap-3">
                            {formData.escrow.initialFileSubmission.map((fileData, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${
                                  draggedFile === index ? 'opacity-50' : ''
                                }`}
                                draggable
                                onDragStart={() => handleFileDragStart(index)}
                              >
                                <div className="flex items-center space-x-3">
                                  <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm text-gray-900 truncate max-w-xs">
                                    {fileData.file.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({(fileData.file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                                    {folders.find(f => f.id === fileData.folder)?.name || 'Others'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 focus:outline-none"
                                >
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 