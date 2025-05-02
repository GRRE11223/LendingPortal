'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { User, Broker, Agent } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

// Form schemas
const brokerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type BrokerFormData = z.infer<typeof brokerFormSchema>;
type AgentFormData = z.infer<typeof agentFormSchema>;

interface DeleteButtonProps {
  onDelete: (id: string) => Promise<void>;
  id: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete, id }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const handleConfirm = async () => {
    try {
      await onDelete(id);
      setShowConfirm(false);
    } catch (error) {
      console.error('Delete operation failed:', error);
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-900 transition-colors duration-200"
        type="button"
      >
        <TrashIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-white p-6 rounded-lg shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-gray-900">
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 mt-2">
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel 
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const BrokerForm = ({ onSubmit, onCancel, initialData }: { onSubmit: (data: BrokerFormData) => void, onCancel: () => void, initialData?: BrokerFormData }) => {
  const form = useForm<BrokerFormData>({
    resolver: zodResolver(brokerFormSchema),
    defaultValues: initialData || {
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Company Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Email</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email" 
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="company@example.com"
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Phone</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="tel" 
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="(555) 555-5555"
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Address</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Enter company address"
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Website</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="url" 
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="bg-white hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {initialData ? 'Update Broker' : 'Add Broker'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const AgentForm = ({ onSubmit, onCancel, brokerName }: { onSubmit: (data: AgentFormData) => void, onCancel: () => void, brokerName: string | undefined }) => {
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
    name: '',
    email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Full Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Email</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email" 
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="agent@example.com"
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="bg-white hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Team Member
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Add this helper function at the top level of the file
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function TeamManagement() {
  const [selectedTab, setSelectedTab] = useState('brokers');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [showEditBroker, setShowEditBroker] = useState(false);
  const [brokerToEdit, setBrokerToEdit] = useState<Broker | null>(null);
  const [brokerToDelete, setBrokerToDelete] = useState<Broker | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  
  const supabase = createClient();

  // Add loading state for send invitation button
  const [sendingInvitations, setSendingInvitations] = useState<Record<string, boolean>>({});

  // Add new state for tracking invitation status
  const [invitationStatus, setInvitationStatus] = useState<Record<string, { 
    status: 'none' | 'sending' | 'sent' | 'error',
    lastSentAt?: string,
    error?: string 
  }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const brokersResult = await supabase
        .from('Broker')
        .select('*')
        .order('createdAt', { ascending: false });

      if (brokersResult.error) {
        throw new Error(`Failed to fetch brokers: ${brokersResult.error.message}`);
      }

      const agentsResult = await supabase
        .from('Agent')
        .select('*, user:User(*)')
        .order('createdAt', { ascending: false });

      if (agentsResult.error) {
        throw new Error(`Failed to fetch agents: ${agentsResult.error.message}`);
      }

      const usersResult = await supabase
        .from('User')
        .select('*')
        .order('createdAt', { ascending: false });

      if (usersResult.error) {
        throw new Error(`Failed to fetch users: ${usersResult.error.message}`);
      }

      setBrokers(brokersResult.data || []);
      setAgents(agentsResult.data || []);
      setUsers(usersResult.data || []);
    } catch (err) {
      console.error('Error in fetchData:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBroker = async (data: BrokerFormData) => {
    try {
      const { data: newBroker, error } = await supabase
        .from('Broker')
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setBrokers(prev => [newBroker, ...prev]);
      setShowAddBroker(false);
      toast.success('Broker added successfully');
    } catch (err) {
      toast.error('Failed to add broker');
    }
  };

  const handleDeleteBroker = async (id: string) => {
    try {
      const { error } = await supabase
        .from('Broker')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBrokers(prev => prev.filter(b => b.id !== id));
      toast.success('Broker deleted successfully');
    } catch (err) {
      toast.error('Failed to delete broker');
    }
  };

  const handleAddAgent = async (data: AgentFormData) => {
    if (!selectedBroker) {
      toast.error('Please select a broker first');
      return;
    }

    try {
      // Only create the Agent record initially
      const { data: newAgent, error: agentError } = await supabase
        .from('Agent')
        .insert([{
          email: data.email,
          name: data.name,
          brokerId: selectedBroker.id,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (agentError) {
        console.error('Failed to create agent:', agentError);
        throw agentError;
      }

      setAgents(prev => [newAgent, ...prev]);
      setShowAddMember(false);
      toast.success('Team member added successfully');
    } catch (err) {
      console.error('Error in handleAddAgent:', err);
      toast.error('Failed to add team member');
    }
  };

  const handleSendInvite = async (agentId: string) => {
    console.log('Starting handleSendInvite for agent:', agentId);
    
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      console.error('Agent not found:', agentId);
      toast.error('Agent not found');
      return;
    }

    try {
      setSendingInvitations(prev => ({ ...prev, [agentId]: true }));
      console.log('Processing invitation for agent:', agent.email);

      let userId = agent.userId;

      // 只在用户不存在时创建新用户
      if (!userId) {
        console.log('Creating new user record for agent:', agent.email);
        const { data: newUser, error: userError } = await supabase
          .from('User')
          .insert([{
            id: crypto.randomUUID(),
            email: agent.email,
            name: agent.name,
            role: 'Agent',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }])
          .select()
          .single();

        if (userError) {
          console.error('Failed to create user:', userError);
          throw new Error(`Failed to create user: ${userError.message}`);
        }

        console.log('User created successfully:', newUser);
        userId = newUser.id;
      } else {
        console.log('User already exists, updating status');
        const { error: updateUserError } = await supabase
          .from('User')
          .update({
            status: 'pending',
            updatedAt: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateUserError) {
          console.error('Failed to update user:', updateUserError);
          throw new Error(`Failed to update user: ${updateUserError.message}`);
        }
      }

      // 更新 Agent 状态
      const now = new Date().toISOString();
      console.log('Updating agent with userId:', userId);
      
      const { error: updateError } = await supabase
        .from('Agent')
        .update({ 
          userId: userId,
          status: 'pending',
          invitationSentAt: now,
          updatedAt: now
        })
        .eq('id', agentId);

      if (updateError) {
        console.error('Failed to update agent:', updateError);
        throw new Error(`Failed to update agent: ${updateError.message}`);
      }

      console.log('Agent updated successfully');

      // 发送邀请邮件
      console.log('Sending invitation email');
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: agent.email,
          name: agent.name,
          role: 'Agent'
        })
      });

      const responseData = await response.json();
      console.log('Email API response:', responseData);

      if (!response.ok) {
        throw new Error(`Failed to send invitation email: ${responseData.error || 'Unknown error'}`);
      }

      // 更新本地状态
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { 
              ...a, 
              userId: userId,
              status: 'pending',
              invitationSentAt: now 
            }
          : a
      ));

      console.log('Invitation process completed successfully');
      toast.success('Invitation sent successfully');
    } catch (err) {
      console.error('Error in handleSendInvite:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSendingInvitations(prev => ({ ...prev, [agentId]: false }));
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      const agent = agents.find(a => a.id === id);
      if (!agent) return;

      // Delete the agent
      const { error: agentError } = await supabase
        .from('Agent')
        .delete()
        .eq('id', id);
      
      if (agentError) throw agentError;

      // Delete the associated user
      if (agent.userId) {
        const { error: userError } = await supabase
          .from('User')
          .delete()
          .eq('id', agent.userId);
        
        if (userError) throw userError;
      }

      setAgents(prev => prev.filter(a => a.id !== id));
      toast.success('Team member removed successfully');
    } catch (err) {
      toast.error('Failed to remove team member');
    }
  };

  const handleEditBroker = async (data: BrokerFormData) => {
    if (!brokerToEdit) return;

    try {
      const { data: updatedBroker, error } = await supabase
        .from('Broker')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
      updatedAt: new Date().toISOString()
        })
        .eq('id', brokerToEdit.id)
        .select()
        .single();

      if (error) throw error;

      setBrokers(prev => prev.map(b => 
        b.id === brokerToEdit.id ? updatedBroker : b
      ));
      setShowEditBroker(false);
      setBrokerToEdit(null);
      toast.success('Broker updated successfully');
    } catch (err) {
      toast.error('Failed to update broker');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!brokerToDelete) return;
    
    try {
      const { error } = await supabase
        .from('Broker')
        .delete()
        .eq('id', brokerToDelete.id);

      if (error) throw error;

      setBrokers(prev => prev.filter(b => b.id !== brokerToDelete.id));
      setBrokerToDelete(null);
      toast.success('Broker deleted successfully');
    } catch (err) {
      toast.error('Failed to delete broker');
    }
  };

  const renderBrokers = () => {
    if (!brokers.length) {
      return (
        <div className="text-center text-gray-500 mt-8">
          No brokers found. Add your first broker to get started.
        </div>
      );
    }

    return brokers.map((broker) => {
      const brokerAgents = agents.filter((a) => a.brokerId === broker.id);

      return (
        <div key={broker.id} className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold">{broker.name}</h3>
              <p className="text-gray-600">{broker.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBrokerToEdit(broker);
                  setShowEditBroker(true);
                }}
                className="px-4 py-2 text-sm bg-white text-blue-600 rounded-full border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
              <DeleteButton onDelete={handleDeleteBroker} id={broker.id} />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium">Team Members</h4>
              <button
                onClick={() => {
                  setSelectedBroker(broker);
                  setShowAddMember(true);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-full flex items-center gap-2 hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <UserPlusIcon className="h-5 w-5" />
                Add Team Member
              </button>
            </div>

            {brokerAgents.length > 0 ? (
              <div className="grid gap-4">
                {brokerAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex justify-between items-center p-6 border border-gray-200 rounded-xl transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        <Badge variant="outline" className={`px-3 py-0.5 rounded-full text-xs font-medium border ${
                          agent.status === 'pending' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                          agent.status === 'active' ? 'border-green-200 bg-green-50 text-green-700' :
                          'border-gray-200 bg-gray-50 text-gray-700'
                        }`}>
                          {agent.status === 'draft' ? 'Draft' :
                           agent.status === 'pending' ? 'Pending' :
                           agent.status === 'active' ? 'Active' : agent.status}
                        </Badge>
                      </div>
                      <div className="text-gray-500 text-sm mt-1">{agent.email}</div>
                      {agent.invitationSentAt && (
                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-2">
                          <ClockIcon className="h-3.5 w-3.5" />
                          Invitation sent: {formatDate(agent.invitationSentAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {agent.status !== 'active' && (
                        <button
                          onClick={() => handleSendInvite(agent.id)}
                          disabled={sendingInvitations[agent.id]}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                            ${agent.status === 'pending' 
                              ? 'bg-white text-yellow-600 border border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300' 
                              : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:-translate-y-0.5'}
                            ${sendingInvitations[agent.id] ? 'opacity-75 cursor-not-allowed' : ''}
                            shadow-sm hover:shadow
                          `}
                        >
                          {sendingInvitations[agent.id] ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              <EnvelopeIcon className="h-4 w-4" />
                              {agent.invitationSentAt ? 'Resend Invite' : 'Send Invite'}
                            </>
                          )}
                        </button>
                      )}
                      <DeleteButton onDelete={handleDeleteAgent} id={agent.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No team members yet. Add your first team member to get started.
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const renderUsers = () => {
    return users.map(user => (
      <Card 
        key={user.id} 
        className="backdrop-blur-sm bg-white/30 border border-white/20 mb-4 hover:shadow-lg hover:bg-white/40 transition-all duration-300"
      >
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-lg text-gray-900">{user.name}</CardTitle>
            <div className="text-sm text-gray-600 mt-1">
              {user.email}
                </div>
            </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/50 text-gray-700">{user.role}</Badge>
            {user.status === 'pending' && (
              <Badge variant="warning" className="bg-yellow-500/10 text-yellow-700">Pending</Badge>
            )}
          </div>
        </CardHeader>
      </Card>
    ));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="relative">
        <div className="w-12 h-12">
          <div className="absolute w-12 h-12 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="mt-4 text-sm text-blue-500 font-medium">Loading...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <XMarkIcon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">Error Occurred</h3>
        <p className="text-center text-gray-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex justify-between items-center mb-8">
            <TabsList className="flex gap-2 p-1">
              <TabsTrigger 
                value="brokers" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-50 data-[state=inactive]:text-gray-600 rounded-lg px-6 py-2.5 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <BuildingOfficeIcon className="h-4 w-4" />
                Brokers
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-50 data-[state=inactive]:text-gray-600 rounded-lg px-6 py-2.5 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <UserIcon className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>
            {selectedTab === 'brokers' && (
              <Button
                onClick={() => setShowAddBroker(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <BuildingOfficeIcon className="h-5 w-5" />
                Add Broker
              </Button>
            )}
          </div>

          <TabsContent value="brokers" className="mt-0 space-y-6">
            {brokers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <BuildingOfficeIcon className="h-16 w-16 mx-auto text-gray-400" />
                <h3 className="mt-6 text-xl font-medium text-gray-900">No brokers yet</h3>
                <p className="mt-2 text-gray-500">Get started by adding your first broker.</p>
                <Button
                  onClick={() => setShowAddBroker(true)}
                  className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all duration-200"
                >
                  Add Broker
                </Button>
              </div>
            ) : (
              <div className="grid gap-8">
                {brokers.map((broker) => {
                  const brokerAgents = agents.filter((a) => a.brokerId === broker.id);
                  return (
                    <div key={broker.id} className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-2xl font-semibold text-gray-900">{broker.name}</h3>
                          <p className="text-gray-500 mt-1">{broker.email}</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setBrokerToEdit(broker);
                              setShowEditBroker(true);
                            }}
                            className="px-4 py-2 text-sm bg-white text-blue-600 rounded-full border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center gap-2 shadow-sm"
                          >
                            <PencilIcon className="h-4 w-4" />
                            Edit
                          </button>
                          <DeleteButton onDelete={handleDeleteBroker} id={broker.id} />
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-xl font-medium text-gray-900">Team Members</h4>
                          <button
                            onClick={() => {
                              setSelectedBroker(broker);
                              setShowAddMember(true);
                            }}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-full flex items-center gap-2 hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <UserPlusIcon className="h-5 w-5" />
                            Add Team Member
                          </button>
                        </div>

                        {brokerAgents.length > 0 ? (
                          <div className="grid gap-4">
                            {brokerAgents.map((agent) => (
                              <div
                                key={agent.id}
                                className="flex justify-between items-center p-6 bg-gray-50 rounded-xl border border-gray-100 transition-all duration-200 hover:shadow-md"
                              >
                                <div className="flex-grow">
                                  <div className="flex items-center gap-3">
                                    <div className="font-medium text-gray-900">{agent.name}</div>
                                    <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      agent.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                      agent.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                                      'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}>
                                      {agent.status === 'draft' ? 'Draft' :
                                       agent.status === 'pending' ? 'Pending' :
                                       agent.status === 'active' ? 'Active' : agent.status}
                                    </Badge>
                                  </div>
                                  <div className="text-gray-500 text-sm mt-1">{agent.email}</div>
                                  {agent.invitationSentAt && (
                                    <div className="text-gray-400 text-xs mt-2">
                                      Invitation sent: {formatDate(agent.invitationSentAt)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  {agent.status !== 'active' && (
                                    <button
                                      onClick={() => handleSendInvite(agent.id)}
                                      disabled={sendingInvitations[agent.id]}
                                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                                        ${agent.status === 'pending' 
                                          ? 'bg-white text-yellow-600 border border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300' 
                                          : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:-translate-y-0.5'}
                                        ${sendingInvitations[agent.id] ? 'opacity-75 cursor-not-allowed' : ''}
                                        shadow-sm hover:shadow
                                      `}
                                    >
                                      {sendingInvitations[agent.id] ? (
                                        <>
                                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                          </svg>
                                          Sending...
                                        </>
                                      ) : (
                                        <>
                                          <EnvelopeIcon className="h-4 w-4" />
                                          {agent.invitationSentAt ? 'Resend Invite' : 'Send Invite'}
                                        </>
                                      )}
                                    </button>
                                  )}
                                  <DeleteButton onDelete={handleDeleteAgent} id={agent.id} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <UserPlusIcon className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="mt-4 text-gray-500">No team members yet. Add your first team member to get started.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            {users.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <UserIcon className="h-16 w-16 mx-auto text-gray-400" />
                <h3 className="mt-6 text-xl font-medium text-gray-900">No users yet</h3>
                <p className="mt-2 text-gray-500">Users will appear here when team members are added.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map(user => (
                  <Card 
                    key={user.id} 
                    className="bg-white border border-gray-100 hover:shadow-lg transition-all duration-200"
                  >
                    <CardHeader className="flex flex-row items-center justify-between py-6">
                      <div>
                        <CardTitle className="text-xl text-gray-900">{user.name}</CardTitle>
                        <div className="text-gray-500 mt-1">
                          {user.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 rounded-full">
                          {user.role}
                        </Badge>
                        {user.status === 'pending' && (
                          <Badge variant="warning" className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1 rounded-full">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showAddBroker} onOpenChange={setShowAddBroker}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Add Broker</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Enter the broker's information below.
              </p>
            </DialogHeader>
            <BrokerForm 
              onSubmit={handleAddBroker} 
              onCancel={() => setShowAddBroker(false)} 
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Add Team Member</DialogTitle>
              {selectedBroker && (
                <p className="text-sm text-gray-500 mt-1">
                  Adding team member to {selectedBroker.name}
                </p>
              )}
            </DialogHeader>
            <AgentForm 
              onSubmit={handleAddAgent}
              onCancel={() => setShowAddMember(false)}
              brokerName={selectedBroker?.name}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showEditBroker} onOpenChange={setShowEditBroker}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Edit Broker</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Update the broker's information below.
              </p>
            </DialogHeader>
            <BrokerForm 
              onSubmit={handleEditBroker}
              onCancel={() => {
                setShowEditBroker(false);
                setBrokerToEdit(null);
              }}
              initialData={brokerToEdit || undefined}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog 
          open={!!brokerToDelete} 
          onOpenChange={(open) => !open && setBrokerToDelete(null)}
        >
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">Delete Broker</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 mt-2">
                Are you sure you want to delete {brokerToDelete?.name}? This action cannot be undone.
                All associated team members will also be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-full px-5 py-2.5 transition-all duration-200">
                    Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5 py-2.5 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ml-3"
                onClick={handleDeleteConfirm}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 