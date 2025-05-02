import { User as UserType, Role, BrokerCompany, Permission, BrokerCompanyRef, Agent, Broker } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

const isClient = typeof window !== 'undefined';

// Singleton store instances for server-side
let serverBrokerStore: Map<string, Broker> | null = null;
let serverUserStore: Map<string, UserType> | null = null;

// Remove the old store object and use class-based implementations only
export class BrokerStore {
  private brokers: Map<string, Broker>;

  constructor() {
    this.brokers = new Map();
    this.loadFromDB();
  }

  private async loadFromDB() {
    try {
      const { data, error } = await supabase
        .from('Broker')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        data.forEach((broker: Broker) => {
          this.brokers.set(broker.id, broker);
        });
      }
    } catch (error) {
      console.error('Failed to load brokers from database:', error);
    }
  }

  private async saveToDB(broker: Broker) {
    try {
      const { data, error } = await supabase
        .from('Broker')
        .upsert({
          id: broker.id,
          name: broker.name,
          email: broker.email,
          phone: broker.phone,
          address: broker.address,
          website: broker.website,
          status: broker.status,
          createdAt: broker.createdAt,
          updatedAt: broker.updatedAt
        })
        .select();
      
      if (error) {
        console.error('Failed to save broker to database:', error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Failed to save broker to database:', error);
      throw error;
    }
  }

  private async deleteFromDB(id: string) {
    try {
      const { error } = await supabase
        .from('Broker')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete broker from database:', error);
      throw error;
    }
  }

  async getAll(): Promise<Broker[]> {
    await this.loadFromDB(); // Refresh from DB
    return Array.from(this.brokers.values());
  }

  async get(id: string): Promise<Broker | undefined> {
    try {
      const { data, error } = await supabase
        .from('Broker')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get broker:', error);
      return undefined;
    }
  }

  async create(input: Omit<Broker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Broker> {
    const now = new Date().toISOString();
    const broker: Broker = {
      ...input,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    const savedBroker = await this.saveToDB(broker);
    if (savedBroker) {
      this.brokers.set(savedBroker.id, savedBroker);
      return savedBroker;
    }
    throw new Error('Failed to create broker');
  }

  async update(id: string, updates: Partial<Broker>): Promise<Broker> {
    const broker = await this.get(id);
    if (!broker) {
      throw new Error(`Broker with id ${id} not found`);
    }

    const updatedBroker = {
      ...broker,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const savedBroker = await this.saveToDB(updatedBroker);
    if (savedBroker) {
      this.brokers.set(id, savedBroker);
      return savedBroker;
    }
    throw new Error('Failed to update broker');
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.deleteFromDB(id);
      const result = this.brokers.delete(id);
      
      // Also delete associated users if any
      if (userStore) {
        const users = await userStore.list();
        for (const user of users) {
          if (user.broker?.id === id) {
            await userStore.deleteUser(user.id);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to delete broker:', error);
      return false;
    }
  }
}

export class UserStore {
  private users: Map<string, UserType>;

  constructor() {
    // Use server-side store if available
    if (!isClient && serverUserStore) {
      this.users = serverUserStore;
      return;
    }

    // Initialize new store
    this.users = new Map();
    
    // Save reference for server-side
    if (!isClient) {
      serverUserStore = this.users;
    }

    // Load from localStorage in client
    if (isClient) {
      try {
        const stored = localStorage.getItem('users');
        if (stored) {
          const data = JSON.parse(stored);
          data.forEach((user: UserType) => {
            this.users.set(user.id, user);
          });
        }
      } catch (error) {
        console.error('Failed to load users from storage:', error);
      }
    }
  }

  private saveToStorage() {
    if (isClient) {
      try {
        localStorage.setItem('users', JSON.stringify(Array.from(this.users.values())));
      } catch (error) {
        console.error('Failed to save users to storage:', error);
      }
    }
  }

  async createUser(user: Partial<UserType>): Promise<UserType | undefined> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select('*, role(*), broker(*)')
      .single();

    if (error) {
      console.error('Failed to create user:', error);
      return undefined;
    }

    if (data) {
      this.users.set(data.id, data);
      return data;
    }

    return undefined;
  }

  async updateUser(id: string, user: Partial<UserType>): Promise<UserType | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', id)
      .select('*, role(*), broker(*)')
      .single();

    if (error) {
      console.error('Failed to update user:', error);
      return undefined;
    }

    if (data) {
      this.users.set(data.id, data);
      return data;
    }

    return undefined;
  }

  async getUser(id: string): Promise<UserType | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*, role(*), broker(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch user:', error);
      return undefined;
    }

    if (data) {
      this.users.set(id, data);
      return data;
    }

    return undefined;
  }

  async list(): Promise<UserType[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role (*),
          broker (*)
        `);
      
      if (error) throw error;
      
      if (data) {
        data.forEach((user: UserType) => {
          this.users.set(user.id, user);
        });
        return data;
      }
      return [];
    } catch (error) {
      console.error('Failed to list users:', error);
      return [];
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return this.users.delete(id);
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }
}

export class AgentStore {
  private agents: Map<string, Agent>;

  constructor() {
    this.agents = new Map();
  }

  async createAgent(agent: Partial<Agent>): Promise<Agent | undefined> {
    try {
      const { data, error } = await supabase
        .from('Agent')
        .insert([agent])
        .select('*, user:User(*), broker:Broker(*)')
        .single();

      if (error) throw error;
      
      if (data) {
        this.agents.set(data.id, data);
        return data;
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
    return undefined;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    try {
      const { data, error } = await supabase
        .from('Agent')
        .update(updates)
        .eq('id', id)
        .select('*, user:User(*), broker:Broker(*)')
        .single();

      if (error) throw error;
      
      if (data) {
        this.agents.set(data.id, data);
        return data;
      }
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
    return undefined;
  }

  async deleteAgent(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Agent')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return this.agents.delete(id);
    } catch (error) {
      console.error('Failed to delete agent:', error);
      return false;
    }
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    try {
      const { data, error } = await supabase
        .from('Agent')
        .select('*, user:User(*), broker:Broker(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        this.agents.set(id, data);
        return data;
      }
    } catch (error) {
      console.error('Failed to get agent:', error);
    }
    return undefined;
  }

  async list(): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from('Agent')
        .select('*, user:User(*), broker:Broker(*)');

      if (error) throw error;
      
      if (data) {
        data.forEach(agent => this.agents.set(agent.id, agent));
        return data;
      }
    } catch (error) {
      console.error('Failed to list agents:', error);
    }
    return [];
  }

  async getByBroker(brokerId: string): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from('Agent')
        .select('*, user:User(*), broker:Broker(*)')
        .eq('brokerId', brokerId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get agents by broker:', error);
      return [];
    }
  }

  async getByUser(userId: string): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from('Agent')
        .select('*, user:User(*), broker:Broker(*)')
        .eq('userId', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get agents by user:', error);
      return [];
    }
  }
}

// Create and export singleton instances
export const brokerStore = new BrokerStore();
export const userStore = new UserStore();
export const agentStore = new AgentStore();

// Export types
export type { UserType as User }; 