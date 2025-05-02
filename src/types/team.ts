import { Role, BrokerCompanyRef } from './index';

export interface TeamMemberBase {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role_id: string;
  broker_id?: string;
  phone_number?: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface TeamMember extends TeamMemberBase {
  is_admin?: boolean;
  broker?: BrokerCompanyRef;
}

export interface CustomRole extends Omit<Role, 'scope'> {
  broker_id?: string;
  broker?: BrokerCompanyRef;
  scope: 'internal' | 'broker';
}

export interface User {
  id: string;
  email: string;
  name?: string;
  password: string;
  role: string;
  broker_id?: string;
  role_id?: string;
  broker?: BrokerCompanyRef;
  customRole?: CustomRole;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export const DEFAULT_PERMISSIONS = [
  'all',
  'read',
  'write',
  'delete',
  'manage_users',
  'manage_roles',
  'manage_brokers',
  'manage_loans',
  'manage_documents',
  'view_reports'
] as const;

export const DEFAULT_ROLES = [
  {
    name: 'Admin',
    description: 'System administrator with full access',
    permissions: ['all']
  },
  {
    name: 'Agent',
    description: 'Regular agent with basic access',
    permissions: ['read', 'write']
  }
] as const; 