import { NextResponse } from 'next/server';
import { brokerStore } from '@/lib/store';
import type { Broker } from '@/types';

export async function GET() {
  try {
    const brokers = await brokerStore.getAll();
    return NextResponse.json(brokers);
  } catch (error) {
    console.error('Error fetching brokers:', error);
    return NextResponse.json({ error: 'Failed to fetch brokers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const broker = await brokerStore.create(data);
    return NextResponse.json(broker);
  } catch (error) {
    console.error('Error creating broker:', error);
    return NextResponse.json({ error: 'Failed to create broker' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const broker = await request.json();
    const updated = await brokerStore.update(broker.id, broker);
    if (!updated) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating broker:', error);
    return NextResponse.json({ error: 'Failed to update broker' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const success = await brokerStore.delete(id);
    if (!success) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting broker:', error);
    return NextResponse.json({ error: 'Failed to delete broker' }, { status: 500 });
  }
} 