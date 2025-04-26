export interface Document {
  id: string;
  url: string;
  fileName: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  category: string;
  name: string;
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
  loanAmount: number;
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
    propertyAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      fullAddress: string;
    };
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

export interface BrokerCompany {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  customRoles?: Role[];  // 经纪公司的自定义角色
  createdAt: string;
  updatedAt: string;
}

export const PERMISSIONS = {
  'Manage Users': 'manage_users',
  'Manage Roles': 'manage_roles',
  'View Loan Requests': 'view_loan_requests',
  'Create Loan Requests': 'create_loan_requests',
  'Edit Loan Requests': 'edit_loan_requests',
  'Delete Loan Requests': 'delete_loan_requests',
  'Manage Documents': 'manage_documents',
  'View Reports': 'view_reports',
  'Manage System Settings': 'manage_system_settings',
} as const;

export type Permission = 
  | 'manage_users'
  | 'manage_roles'
  | 'view_users'
  | 'create_loan_requests'
  | 'view_loan_requests'
  | 'edit_loan_requests'
  | 'delete_loan_requests'
  | 'manage_documents'
  | 'manage_settings'
  | 'view_analytics'
  | 'view_reports'
  | 'manage_system_settings';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  scope: 'admin' | 'agent';
  brokerId?: string; // For agent roles, references the broker they belong to
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: 'active' | 'inactive' | 'pending';
  brokerCompany?: BrokerCompany;  // Admin 用户可以不属于任何 Broker
  isAdmin: boolean;  // 用于快速判断是否是管理员系统用户
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access',
    permissions: [
      'manage_users',
      'manage_roles',
      'view_users',
      'view_loan_requests',
      'create_loan_requests',
      'edit_loan_requests',
      'delete_loan_requests',
      'manage_documents',
      'manage_settings',
      'view_analytics',
      'view_reports',
      'manage_system_settings'
    ],
    scope: 'admin',
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'agent',
    name: 'Agent',
    description: 'Basic loan agent access',
    permissions: [
      'view_loan_requests',
      'create_loan_requests',
      'edit_loan_requests',
      'manage_documents'
    ],
    scope: 'agent',
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 