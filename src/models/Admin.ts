import { Schema, model, models } from 'mongoose';

export interface IAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  status: 'pending' | 'active' | 'inactive';
  registrationToken?: string;
  lastInviteSent?: Date;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  passwordHash: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  registrationToken: { type: String },
  lastInviteSent: { type: Date },
  permissions: [{ type: String }],
}, {
  timestamps: true
});

// 如果模型已存在则使用现有模型，否则创建新模型
export const Admin = models.Admin || model('Admin', adminSchema); 