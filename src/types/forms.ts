import { UUID } from 'crypto';

export interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  broker_id: string;
  phone_number: string;
}

export interface BrokerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
}

export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  scope: 'internal' | 'broker';
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvitationFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  broker_id: string;
  message: string;
} 