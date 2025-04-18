'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoanRequest {
  id: string;
  status: 'In Process (Consultant)';
  createdAt: string;
  type: 'New loan';
  borrowerName: string;
  loanAmount: number;
  propertyValue: number;
  ltv: number;
  propertyAddress: string;
  loanPurpose: string;
  propertyType: string;
  documents: any[];
  borrower: {
    info: {
      name: string;
    };
    documents: any[];
  };
  escrow: {
    info: any;
    documents: any[];
  };
  title: {
    info: any;
    documents: any[];
  };
  underwriting: {
    documents: any[];
  };
  progress: {
    borrower: number;
    escrow: number;
    title: number;
    underwriting: number;
    postFunding: number;
  };
}

export default function NewRequest() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    borrowerName: '',
    propertyValue: '',
    loanAmount: '',
    ltv: '',
    propertyAddress: '',
    loanPurpose: 'purchase',
    propertyType: 'residential',
  });

  // Format number with commas and two decimal places
  const formatNumber = (value: string) => {
    if (!value) return '';
    const number = parseFloat(value);
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse formatted number back to plain number
  const parseFormattedNumber = (value: string) => {
    if (!value) return '';
    return value.replace(/,/g, '');
  };

  // Handle LTV and Loan Amount calculations
  useEffect(() => {
    if (formData.propertyValue) {
      const propertyValue = parseFloat(parseFormattedNumber(formData.propertyValue));
      
      if (formData.loanAmount && !formData.ltv) {
        // Calculate LTV from Loan Amount
        const loanAmount = parseFloat(parseFormattedNumber(formData.loanAmount));
        const calculatedLtv = ((loanAmount / propertyValue) * 100).toFixed(1);
        setFormData(prev => ({ ...prev, ltv: calculatedLtv }));
      } else if (formData.ltv && !formData.loanAmount) {
        // Calculate Loan Amount from LTV
        const ltv = parseFloat(formData.ltv);
        const calculatedLoanAmount = ((propertyValue * ltv) / 100).toFixed(2);
        setFormData(prev => ({ ...prev, loanAmount: calculatedLoanAmount }));
      }
    }
  }, [formData.propertyValue, formData.loanAmount, formData.ltv]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'propertyValue' || name === 'loanAmount') {
      const plainNumber = value.replace(/[^\d.]/g, '');
      if (plainNumber === '' || /^\d*\.?\d*$/.test(plainNumber)) {
        if (name === 'loanAmount') {
          setFormData(prev => ({ 
            ...prev, 
            [name]: plainNumber,
            ltv: '' 
          }));
        } else {
          setFormData(prev => ({ ...prev, [name]: plainNumber }));
        }
      }
    } else if (name === 'ltv') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          loanAmount: '' 
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newRequest: LoanRequest = {
        id: Date.now().toString(),
        status: 'In Process (Consultant)',
        createdAt: new Date().toLocaleString(),
        type: 'New loan',
        borrowerName: formData.borrowerName,
        loanAmount: parseFloat(parseFormattedNumber(formData.loanAmount)),
        propertyValue: parseFloat(parseFormattedNumber(formData.propertyValue)),
        ltv: parseFloat(formData.ltv),
        propertyAddress: formData.propertyAddress,
        loanPurpose: formData.loanPurpose,
        propertyType: formData.propertyType,
        documents: [],
        borrower: {
          info: {
            name: formData.borrowerName,
          },
          documents: []
        },
        escrow: {
          info: {},
          documents: []
        },
        title: {
          info: {},
          documents: []
        },
        underwriting: {
          documents: []
        },
        progress: {
          borrower: 0,
          escrow: 0,
          title: 0,
          underwriting: 0,
          postFunding: 0
        }
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">New Loan Request</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Borrower Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Borrower Name
                    </label>
                    <input
                      type="text"
                      name="borrowerName"
                      value={formData.borrowerName}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-sm"
                      placeholder="Enter borrower's full name"
                    />
                  </div>

                  {/* Property Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Value
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        name="propertyValue"
                        value={formData.propertyValue ? formatNumber(formData.propertyValue) : ''}
                        onChange={handleChange}
                        required
                        className="pl-7 block w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-sm"
                        placeholder="Enter property value"
                      />
                    </div>
                  </div>

                  {/* Loan Amount and LTV in a grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loan Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="text"
                          name="loanAmount"
                          value={formData.loanAmount ? formatNumber(formData.loanAmount) : ''}
                          onChange={handleChange}
                          className="pl-7 block w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-sm"
                          placeholder="Enter loan amount"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LTV
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="ltv"
                          value={formData.ltv}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.1"
                          className="block w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-sm pr-8"
                          placeholder="Enter LTV"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Address
                    </label>
                    <input
                      type="text"
                      name="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-sm"
                      placeholder="Enter complete property address (e.g., Street, City, State, Zip)"
                    />
                  </div>

                  {/* Loan Purpose and Property Type in a grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loan Purpose
                      </label>
                      <select
                        name="loanPurpose"
                        value={formData.loanPurpose}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-sm"
                      >
                        <option value="purchase">Purchase</option>
                        <option value="refinance">Refinance</option>
                        <option value="construction">Construction</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Type
                      </label>
                      <select
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-sm"
                      >
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="text-sm font-medium text-gray-700 hover:text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || (!formData.loanAmount && !formData.ltv)}
                      className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        (isLoading || (!formData.loanAmount && !formData.ltv)) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? 'Creating...' : 'Create Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 