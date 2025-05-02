import { Schema, model, models, Types } from 'mongoose';

export interface IAgent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  status: 'pending' | 'active' | 'inactive';
  registrationToken?: string;
  lastInviteSent?: Date;
  broker: Types.ObjectId;  // 关联到 Broker
  role: 'agent' | 'broker_admin';  // 代理角色
  permissions?: string[];  // 特定权限
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgent>({
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
  broker: { 
    type: Schema.Types.ObjectId, 
    ref: 'Broker',
    required: true 
  },
  role: {
    type: String,
    enum: ['agent', 'broker_admin'],
    default: 'agent'
  },
  permissions: [{ type: String }],
  phone: { type: String }
}, {
  timestamps: true
});

// 添加索引以优化查询
agentSchema.index({ broker: 1, email: 1 });
agentSchema.index({ registrationToken: 1 });

// 添加虚拟字段获取全名
agentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// 如果模型已存在则使用现有模型，否则创建新模型
export const Agent = models.Agent || model('Agent', agentSchema); 