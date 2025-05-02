import { createClient } from '@/lib/supabase/client';
import type { Broker, Agent, User } from '@/types';

const supabase = createClient();

export interface BrokerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface AgentFormData {
  email: string;
  name: string;
  brokerId: string;
}

export const teamService = {
  // Broker operations
  async listBrokers() {
    const { data, error } = await supabase
      .from('Broker')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createBroker(broker: BrokerFormData) {
    const { data, error } = await supabase
      .from('Broker')
      .insert([{
        ...broker,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBroker(id: string, broker: Partial<BrokerFormData>) {
    const { data, error } = await supabase
      .from('Broker')
      .update({
        ...broker,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBroker(id: string) {
    const { error } = await supabase
      .from('Broker')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Agent operations
  async listAgents() {
    const { data, error } = await supabase
      .from('Agent')
      .select(`
        *,
        broker:Broker(*)
      `)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createAgent(formData: AgentFormData) {
    // First create the Agent record
    const { data: agent, error: agentError } = await supabase
      .from('Agent')
      .insert([{
        email: formData.email,
        name: formData.name,
        brokerId: formData.brokerId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])
      .select()
      .single();

    if (agentError) throw agentError;

    // Then create the User record
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert([{
        email: formData.email,
        name: formData.name,
        role: 'Agent',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])
      .select()
      .single();

    if (userError) throw userError;

    // Update Agent with userId
    const { error: updateError } = await supabase
      .from('Agent')
      .update({ userId: user.id })
      .eq('id', agent.id);

    if (updateError) throw updateError;

    return agent;
  },

  async deleteAgent(id: string) {
    // First get the agent info
    const { data: agent, error: fetchError } = await supabase
      .from('Agent')
      .select('userId')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete the agent
    const { error: agentError } = await supabase
      .from('Agent')
      .delete()
      .eq('id', id);

    if (agentError) throw agentError;

    // Delete the associated user
    if (agent?.userId) {
      const { error: userError } = await supabase
        .from('User')
        .delete()
        .eq('id', agent.userId);

      if (userError) throw userError;
    }
  },

  async updateAgentStatus(id: string, status: 'active' | 'inactive' | 'pending') {
    const { data: agent, error: fetchError } = await supabase
      .from('Agent')
      .select('userId')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update agent status
    const { error: agentError } = await supabase
      .from('Agent')
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (agentError) throw agentError;

    // Update user status
    if (agent?.userId) {
      const { error: userError } = await supabase
        .from('User')
        .update({
          status,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', agent.userId);

      if (userError) throw userError;
    }
  },

  // User operations
  async listUsers() {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },
}; 