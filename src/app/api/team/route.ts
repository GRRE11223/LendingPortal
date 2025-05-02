import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/team
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        broker:broker_id (*),
        role:role_id (*)
      `);

    if (error) throw error;

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/team
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, role, brokerId, roleId } = body;

    // 验证必填字段
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password and role are required' },
        { status: 400 }
      );
    }

    // 创建新用户
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          password, // 注意：实际应用中需要对密码进行哈希处理
          role,
          broker_id: brokerId,
          role_id: roleId,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}

// PUT /api/team
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, email, name, role, brokerId, roleId, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        email,
        name,
        role,
        broker_id: brokerId,
        role_id: roleId,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE /api/team
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
} 