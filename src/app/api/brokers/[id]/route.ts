import { NextResponse } from 'next/server';
import { brokerStore } from '@/lib/store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const broker = brokerStore.get(params.id);
    if (!broker) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }
    return NextResponse.json(broker);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch broker' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const updated = brokerStore.update(params.id, data);
    if (!updated) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update broker' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = brokerStore.delete(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete broker' }, { status: 500 });
  }
} 