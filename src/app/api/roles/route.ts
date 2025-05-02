import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/roles
export async function GET() {
  try {
    const { data: roles, error } = await supabase
      .from('custom_roles')
      .select(`
        *,
        broker:broker_id (*)
      `);

    if (error) throw error;

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, permissions, brokerId } = body;

    if (!name || !permissions) {
      return NextResponse.json(
        { error: 'Name and permissions are required' },
        { status: 400 }
      );
    }

    const { data: role, error } = await supabase
      .from('custom_roles')
      .insert([
        {
          name,
          description,
          permissions,
          broker_id: brokerId
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, permissions } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const { data: role, error } = await supabase
      .from('custom_roles')
      .update({
        name,
        description,
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('custom_roles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
} 