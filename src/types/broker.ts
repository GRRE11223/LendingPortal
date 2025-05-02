export interface BrokerCompanyRef {
  id: string;
  name: string;
  email: string;
}

export interface BrokerCompany extends BrokerCompanyRef {
  phone?: string;
  address?: string;
  website?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
} 