export type Status = 'active' | 'inactive' | 'pending';

export interface BorrowerInfo {
  email: string;
  phone: string;
  creditScore: number;
  documents?: any[];
  annualIncome: number;
  employmentStatus: 'employed' | 'self-employed' | 'unemployed';
  employerName: string;
  employmentLength: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export interface Broker {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  status: string;
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
  invitationToken: string;
}

export interface Document {
  id: string;
  name: string;
  category: string;
  status: string;
  versions?: {
    url: string;
    fileName: string;
  }[];
  comments?: {
    text: string;
    createdAt: string;
    userId: string;
  }[];
  loanRequestId: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
  fileName?: string;
}

export interface LoanRequest {
  id: string;
  userId: string;
  borrowerName: string;
  borrowerInfo?: BorrowerInfo;
  documents?: Document[];
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

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface BrokerCompany {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  status: string;
  created_at: string;
  updated_at: string;
} 