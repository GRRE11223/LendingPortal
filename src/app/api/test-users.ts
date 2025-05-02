import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export interface TestUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  registration_token?: string;
  last_invite_sent?: string;
  password_hash?: string;
  updated_at?: string;
}

// 初始测试用户数据
const initialTestUsers: Omit<TestUser, 'id'>[] = [
  {
    email: 'test1@example.com',
    first_name: 'Test',
    last_name: 'User 1',
    role: 'user',
    status: 'pending',
    registration_token: '8bd1zhelwda',
  },
  {
    email: 'test2@example.com',
    first_name: 'Test',
    last_name: 'User 2',
    role: 'user',
    status: 'pending',
    registration_token: 'abc123xyz',
  },
];

export async function addTestUser(user: Omit<TestUser, 'id'>): Promise<TestUser> {
  const { data, error } = await supabase
    .from('agents')
    .insert(user)
    .select()
    .single();

  if (error) {
    console.error('Error adding test user:', error);
    throw error;
  }

  console.log('Added new test user:', JSON.stringify(data, null, 2));
  return data;
}

export async function findUserByToken(token: string): Promise<TestUser | null> {
  const { data, error } = await supabase
    .from('agents')
    .select()
    .eq('registration_token', token)
    .single();

  if (error) {
    console.error('Error finding user by token:', error);
    return null;
  }

  return data;
}

export async function updateUser(userId: string, updates: Partial<TestUser>): Promise<TestUser | null> {
  const { data, error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  console.log('Updated user data:', JSON.stringify(data, null, 2));
  return data;
}

export async function addUser(user: User): Promise<User> {
  const { data, error } = await supabase
    .from('agents')
    .insert(user)
    .select()
    .single();

  if (error) {
    console.error('Error adding user:', error);
    throw error;
  }

  return data;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('agents')
    .select()
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error finding user by email:', error);
    return null;
  }

  return data;
}

export async function resetUsers(): Promise<void> {
  const { error } = await supabase
    .from('agents')
    .delete()
    .neq('email', 'test1@example.com')
    .neq('email', 'test2@example.com');

  if (error) {
    console.error('Error resetting users:', error);
    throw error;
  }
}

export async function resetTestUsers(): Promise<void> {
  // 先删除所有测试用户
  await resetUsers();

  // 重新插入初始测试用户
  for (const user of initialTestUsers) {
    await addTestUser(user);
  }
}

export async function getCurrentTestUsers(): Promise<TestUser[]> {
  const { data, error } = await supabase
    .from('agents')
    .select()
    .in('email', ['test1@example.com', 'test2@example.com']);

  if (error) {
    console.error('Error getting test users:', error);
    return [];
  }

  console.log('Getting current test users:', JSON.stringify(data, null, 2));
  return data;
} 