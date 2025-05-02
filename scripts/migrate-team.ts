import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  try {
    console.log('Starting migration...');

    // 创建 brokers 表
    console.log('Creating brokers table...');
    const { error: brokersError } = await supabase
      .from('brokers')
      .insert([
        {
          name: 'Test Broker',
          email: 'test@example.com',
          phone: '1234567890',
          address: '123 Test St',
          website: 'https://test.com',
          status: 'active'
        }
      ])
      .select();

    if (brokersError) {
      console.log('Broker already exists or error:', brokersError);
    } else {
      console.log('Test broker created successfully');
    }

    // 创建 custom_roles 表
    console.log('Creating custom roles...');
    const { error: rolesError } = await supabase
      .from('custom_roles')
      .insert([
        {
          name: 'Admin',
          description: 'System administrator with full access',
          permissions: ['all'],
          broker_id: null // 系统级角色
        },
        {
          name: 'Agent',
          description: 'Regular agent with basic access',
          permissions: ['read', 'write']
          // broker_id will be set when creating broker-specific roles
        }
      ])
      .select();

    if (rolesError) {
      console.log('Roles already exist or error:', rolesError);
    } else {
      console.log('Default roles created successfully');
    }

    // 创建测试用户
    console.log('Creating test user...');
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'hashed_password', // 实际应用中需要正确的密码哈希
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ])
      .select();

    if (userError) {
      console.log('User already exists or error:', userError);
    } else {
      console.log('Test user created successfully');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate(); 