import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  console.log('Starting registration completion process...');
  
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      console.log('Missing token or password');
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    console.log('Registration attempt with token:', token);
    
    // 查找用户
    const { data: agent, error: findError } = await supabase
      .from('agents')
      .select(`
        *,
        brokers (
          id,
          company_name
        )
      `)
      .eq('registration_token', token)
      .single();

    if (findError || !agent) {
      console.log('User not found for token:', token);
      return NextResponse.json({ error: 'Invalid registration token' }, { status: 400 });
    }

    console.log('Found user:', JSON.stringify(agent, null, 2));

    // 更新用户数据
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({
        password_hash: password,  // Supabase 会自动处理密码哈希
        status: 'active',
        registration_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', agent.id)
      .select(`
        *,
        brokers (
          id,
          company_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    console.log('Updated user data:', JSON.stringify(updatedAgent, null, 2));

    // 返回用户数据（不包含敏感信息）
    const { password_hash, ...userResponse } = updatedAgent;
    
    return NextResponse.json({ 
      user: userResponse,
      message: 'Registration completed successfully'
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
} 