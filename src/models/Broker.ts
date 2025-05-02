import { Schema, model, models, Types } from 'mongoose';

export interface IBroker {
  id: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'active' | 'inactive';
  logo?: string;
  website?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const brokerSchema = new Schema<IBroker>({
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String }
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'],
    default: 'active'
  },
  logo: { type: String },
  website: { type: String },
  description: { type: String }
}, {
  timestamps: true
});

export const Broker = models.Broker || model('Broker', brokerSchema); 