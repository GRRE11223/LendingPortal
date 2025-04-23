export interface Document {
  id: string;
  category: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  section?: 'escrow' | 'title';
  versions: {
    id: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    fileName: string;
    size: number;
    type: string;
  }[];
  comments: {
    id: string;
    user: string;
    content: string;
    timestamp: string;
  }[];
}

export interface BorrowerInfo {
  email: string;
  phone: string;
  creditScore: number;
  annualIncome: number;
  documents: Document[];
  employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'retired';
  employerName?: string;
  employmentLength?: string;
}

export interface LoanRequest {
  id: string;
  borrowerName: string;
  borrowerInfo: BorrowerInfo;
  status: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  loan: {
    amount: number;
    term: number;
    rate: number;
    purpose: string;
    type: string;
    propertyType: string;
    propertyValue: number;
    loanAmount: number;
    ltv: number;
    loanPurpose: string;
    loanProgram: string;
    targetFundingDate: string;
    loanIntention: string;
    originator?: string;
  };
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
  escrow: {
    initialFileSubmission: Array<{
      name: string;
      folder: string;
      url: string;
    }>;
  };
  escrowInfo: {
    officerName: string;
    email: string;
    phone: string;
    insuranceEmail?: string;
    documents: Document[];
  };
  titleInfo: {
    officerName: string;
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
    postFunding: number;
  };
  lastMessage?: string;
  fundingDate?: string;
  wireReference?: string;
  documents: Document[];
} 