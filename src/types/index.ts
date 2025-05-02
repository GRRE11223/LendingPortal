export type Status = 'active' | 'inactive' | 'pending';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface Broker {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  brokerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  name: string;
  invitationSentAt?: string;
}

export interface Document {
  id: string;
  name: string;
  category: string;
  status: string;
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
  loanRequestId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRequest {
  id: string;
  userId: string;
  borrowerName: string;
  borrowerInfo: {
    email: string;
    phone: string;
    creditScore: number;
    annualIncome: number;
    employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'retired';
    employerName?: string;
    employmentLength?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface AgentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export const PERMISSIONS = {
  MANAGE_TEAM: 'manage_team',
  MANAGE_BROKERS: 'manage_brokers',
  MANAGE_AGENTS: 'manage_agents',
  VIEW_TEAM: 'view_team',
} as const;

export type Permission = keyof typeof PERMISSIONS; 