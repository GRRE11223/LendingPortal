import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  console.log('Starting login process...');
  
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    console.log('Login attempt for email:', email);

    // 使用 Supabase Auth 进行登录
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('Authentication failed:', authError.message);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 获取用户详细信息
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        *,
        brokers (
          id,
          company_name
        )
      `)
      .eq('email', email)
      .single();

    if (agentError || !agent) {
      console.error('Error fetching user details:', agentError);
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
    }

    // 检查用户状态
    if (agent.status !== 'active') {
      console.log('User account is not active');
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    console.log('Login successful for user:', JSON.stringify(agent, null, 2));

    // 创建会话数据
    const sessionData = {
      user: {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        role: agent.role,
        status: agent.status,
        broker: agent.brokers
      },
      token: authData.session?.access_token
    };

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
} 