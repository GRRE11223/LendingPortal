import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 验证必要字段
    if (!data.email || !data.firstName || !data.lastName || !data.brokerId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // 验证 broker 是否存在
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select()
      .eq('id', data.brokerId)
      .single();

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker not found' 
      }, { status: 404 });
    }

    // 检查邮箱是否已被使用
    const { data: existingAgent } = await supabase
      .from('agents')
      .select()
      .eq('email', data.email)
      .single();

    if (existingAgent) {
      return NextResponse.json({ 
        error: 'Email already in use' 
      }, { status: 400 });
    }

    // 生成注册令牌
    const registrationToken = crypto.randomBytes(32).toString('hex');

    // 创建新的 Agent
    const { data: newAgent, error: createError } = await supabase
      .from('agents')
      .insert({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        broker_id: data.brokerId,
        role: data.role || 'agent',
        status: 'pending',
        registration_token: registrationToken,
        last_invite_sent: new Date().toISOString(),
        phone: data.phone,
        permissions: data.permissions || []
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating agent:', createError);
      return NextResponse.json({ 
        error: 'Failed to create agent' 
      }, { status: 500 });
    }

    // 发送邀请邮件
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${registrationToken}`;
    await sendInvitationEmail({
      to: data.email,
      firstName: data.firstName,
      inviteLink,
      brokerName: broker.company_name
    });

    // 返回创建的用户信息（不包含敏感数据）
    const { registration_token, ...agentResponse } = newAgent;
    
    return NextResponse.json({
      message: 'Agent created successfully',
      agent: agentResponse
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ 
      error: 'Failed to create agent' 
    }, { status: 500 });
  }
} 