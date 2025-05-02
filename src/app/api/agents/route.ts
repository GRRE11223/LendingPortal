import { NextResponse } from 'next/server';
import { agentStore } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('brokerId');
    const userId = searchParams.get('userId');

    let agents;
    if (brokerId) {
      agents = await agentStore.getByBroker(brokerId);
    } else if (userId) {
      agents = await agentStore.getByUser(userId);
    } else {
      agents = await agentStore.list();
    }

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const agent = await agentStore.createAgent(data);
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
} 