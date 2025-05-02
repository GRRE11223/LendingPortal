'use client';

import { useState, useEffect, FormEvent, MouseEvent } from 'react';
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
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { Role, User, BrokerCompanyRef, DEFAULT_ROLES, PERMISSIONS } from '@/types';
import { supabase } from '@/lib/supabase';

interface Invitation {
  id: string;
  email: string;
  roleId: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  brokerId?: string;
  firstName?: string;
  lastName?: string;
  lastSentAt?: string;
}

interface FormData {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  brokerId?: string;
  phoneNumber?: string;
}

// Type guards
const hasRole = (user: Partial<User>): user is User & { role: Role } => {
  return user.role !== undefined;
};

const hasStatus = (user: Partial<User>): user is User & { status: string } => {
  return user.status !== undefined;
};

// Helper functions
const createDefaultUser = (): Partial<User> => ({
  email: '',
  firstName: '',
  lastName: '',
  roleId: '',
  status: 'active',
  isAdmin: false,
  phoneNumber: '',
});

// Helper functions with type guards
const getUserRole = (user: User): string => {
  return hasRole(user) ? user.role.name : 'Unknown Role';
};

const getUserStatus = (user: User): string => {
  return hasStatus(user) ? user.status : 'Active';
};

const getRoleId = (user: User): string => {
  return hasRole(user) ? user.role.id : '';
};

// Update interfaces for proper type definitions
interface BaseTeamMember {
  id: string;
  email: string;
  role: Role;
  createdAt?: string;
}

interface UserTeamMember extends BaseTeamMember {
  type: 'user';
  firstName: string;
  lastName: string;
  status: string;
  roleId: string;
  brokerId?: string;
  brokerCompany?: BrokerCompanyRef;
  phoneNumber?: string;
  isAdmin: boolean;
  updatedAt?: string;
}

interface InvitationTeamMember extends BaseTeamMember {
  type: 'invitation';
  token: string;
  roleId: string;
  firstName?: string;
  lastName?: string;
  status: 'pending' | 'active';
  lastSentAt?: string;
}

type TeamMember = UserTeamMember | InvitationTeamMember;

interface BrokerCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  customRoles: Role[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DeleteButtonProps {
  onDelete: (id: string) => Promise<void>;
  id: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete, id }) => {
  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Delete operation failed:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-red-600 hover:text-red-900"
      type="button"
    >
      <TrashIcon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};

export default function TeamManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [brokerCompanies, setBrokerCompanies] = useState<BrokerCompany[]>([]);
  const [selectedTab, setSelectedTab] = useState<'brokers' | 'admin'>('brokers');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [showRoles, setShowRoles] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedBrokerForRoles, setSelectedBrokerForRoles] = useState<string | null>(null);

  // 新用户表单状态
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    brokerId: '',
    phoneNumber: '',
  });

  // 新经纪公司表单状态
  const [newBroker, setNewBroker] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
  });

  // 新角色表单状态
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  // Add new state for edit mode
  const [editingBroker, setEditingBroker] = useState<BrokerCompany | null>(null);

  // Add new state for invitation
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [invitation, setInvitation] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    brokerId: '',
    message: ''
  });

  // Add invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  // Add new state for editing user
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // Add state for tracking which broker is being deleted
  const [deletingBrokerId, setDeletingBrokerId] = useState<string | null>(null);

  // Add state for confirmation dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    broker: BrokerCompany | null;
  }>({
    show: false,
    broker: null
  });

  // Add new state for broker management
  const [brokers, setBrokers] = useState<BrokerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/brokers');
      if (!response.ok) {
        throw new Error('Failed to fetch brokers');
      }
      const data = await response.json();
      setBrokers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching brokers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleAddBroker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const broker: BrokerCompany = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      website: formData.get('website') as string,
      customRoles: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setLoading(true);
      const response = await fetch('/api/brokers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(broker),
      });

      if (!response.ok) {
        throw new Error('Failed to create broker');
      }

      const newBroker = await response.json();
      setBrokers(prev => [...prev, newBroker]);
      toast.success('Broker added successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add broker');
      toast.error('Failed to add broker');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBroker = async (broker: BrokerCompany) => {
    try {
      setLoading(true);
      const response = await fetch('/api/brokers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(broker),
      });

      if (!response.ok) {
        throw new Error('Failed to update broker');
      }

      const updatedBroker = await response.json();
      setBrokers(prev => prev.map(b => b.id === broker.id ? updatedBroker : b));
      toast.success('Broker updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update broker');
      toast.error('Failed to update broker');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBroker = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('/api/brokers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete broker');
      }

      setBrokers(prev => prev.filter(b => b.id !== id));
      toast.success('Broker deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete broker');
      toast.error('Failed to delete broker');
    } finally {
      setLoading(false);
    }
  };

  // 保存用户数据到 localStorage
  const saveUsers = (updatedUsers: User[]) => {
    try {
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Failed to save users:', error);
      toast.error('Failed to save users');
    }
  };

  // Add function to fetch invitations
  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to fetch invitations');
    }
  };

  // 在创建用户对象时转换 BrokerCompany 为 BrokerCompanyRef
  const brokerCompanyToRef = (company?: BrokerCompany): BrokerCompanyRef => {
    if (!company) {
      return {
        id: '',
        name: 'Unassigned'
      };
    }
    return {
      id: company.id,
      name: company.name
    };
  };

  // 添加用户
  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.roleId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      toast.loading('Creating user...');

      const selectedRole = DEFAULT_ROLES.find(role => role.id === newUser.roleId);
      if (!selectedRole) {
        throw new Error('Invalid role selected');
      }

      const selectedBrokerCompany = brokerCompanies.find(company => company.id === newUser.brokerId);
      const brokerCompanyRef = selectedBrokerCompany ? {
        id: selectedBrokerCompany.id,
        name: selectedBrokerCompany.name
      } : null;

      const userData = {
        email: newUser.email,
        firstName: newUser.firstName || '',
        lastName: newUser.lastName || '',
        role: selectedRole,
        roleId: selectedRole.id,
        brokerId: newUser.brokerId,
        brokerCompany: brokerCompanyRef,
        phoneNumber: newUser.phoneNumber || '',
        status: 'pending',
        isAdmin: selectedRole.scope === 'admin'
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const createdUser = await response.json();
      setUsers(prevUsers => [...prevUsers, createdUser]);
      
      toast.dismiss();
      toast.success('User created successfully');
      
      // Reset form
      setShowAddUser(false);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        roleId: '',
        brokerId: '',
        phoneNumber: '',
      });

    } catch (error) {
      console.error('Error creating user:', error);
      toast.dismiss();
      toast.error('Failed to create user');
    }
  };

  // 发送邀请邮件
  const handleSendInvitation = async (user: User) => {
    try {
      toast.loading('Sending invitation...');

      const invitation = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        brokerId: user.brokerId,
        status: 'pending',
        token: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitation),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      const newInvitation = await response.json();
      setInvitations(prev => [...prev, newInvitation]);
      
      toast.dismiss();
      toast.success('Invitation sent successfully');
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.dismiss();
      toast.error('Failed to send invitation');
    }
  };

  const handleDeleteUser = async (id: string): Promise<void> => {
    try {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      setUsers(users.filter(user => user.id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // 更新用户信息
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingUser,
          ...newUser,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === editingUser.id ? updatedUser : user)
      );

      setShowAddUser(false);
      setEditingUser(null);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        roleId: '',
        brokerId: '',
        phoneNumber: '',
      });

      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // 更新用户编辑处理函数
  const handleUserEdit = (user: User) => {
    setEditingUser(user);
    setNewUser({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId || user.role.id,
      brokerId: user.brokerId || user.brokerCompany?.id || '',
      phoneNumber: user.phoneNumber || ''
    });
    setShowAddUser(true);
  };

  // 获取特定经纪公司的用户
  const getBrokerUsers = (brokerId: string) => {
    return users.filter(user => user.brokerCompany && user.brokerCompany.id === brokerId);
  };

  // 获取管理员用户
  const getAdminUsers = () => {
    return users.filter(user => user.isAdmin);
  };

  // 获取角色列表
  const getRoles = (brokerId?: string): Role[] => {
    if (brokerId) {
      const broker = brokerCompanies.find(b => b.id === brokerId);
      const agentRole = DEFAULT_ROLES.find(role => role.scope === 'agent');
      return [
        ...(agentRole ? [agentRole] : []),
        ...(broker?.customRoles || [])
      ];
    } else {
      return DEFAULT_ROLES.filter(role => role.scope === 'admin');
    }
  };

  // 添加自定义角色
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add role logic here
      toast.success('Role added successfully');
      setShowAddRole(false);
      setNewRole({
        name: '',
        description: '',
        permissions: [],
      });
    } catch (error) {
      toast.error('Failed to add role');
    }
  };

  // 删除自定义角色
  const handleDeleteRole = (roleId: string, brokerId?: string) => {
    if (brokerId) {
      // 删除经纪公司的自定义角色
      const updatedBrokers = brokerCompanies.map(broker => {
        if (broker.id === brokerId) {
          return {
            ...broker,
            customRoles: broker.customRoles?.filter(role => role.id !== roleId) || [],
          };
        }
        return broker;
      });
      setBrokerCompanies(updatedBrokers);
      localStorage.setItem('brokerCompanies', JSON.stringify(updatedBrokers));
    } else {
      // 删除系统自定义角色
      const storedRoles = localStorage.getItem('customRoles') || '[]';
      const customRoles = JSON.parse(storedRoles);
      const updatedRoles = customRoles.filter((role: Role) => role.id !== roleId);
      localStorage.setItem('customRoles', JSON.stringify(updatedRoles));
    }
    toast.success('Custom role deleted successfully');
  };

  // Add edit broker function
  const handleEditBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBroker) return;

    try {
      // Edit broker logic here
      toast.success('Broker updated successfully');
      setEditingBroker(null);
    } catch (error) {
      toast.error('Failed to update broker');
    }
  };

  // Add invitation handler
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          roleId: invitation.role,
          brokerId: invitation.brokerId,
          message: invitation.message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      toast.success('Invitation sent successfully');
      setShowInviteUser(false);
      setInvitation({
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        brokerId: '',
        message: '',
      });
      
      // Refresh invitations list
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    }
  };

  // Add new function for resending invitation
  const handleResendInvitation = async (email: string) => {
    try {
      const response = await fetch('/api/invitations/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      toast.success('Invitation resent successfully');
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  // Update the renderTeamMembers function
  const renderTeamMembers = (users: User[], pendingInvites: Invitation[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => handleUserEdit(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <DeleteButton onDelete={() => onDeleteUser(user.id)} id={user.id} />
                  </div>
                </td>
              </tr>
            ))}
            {pendingInvites.map((invite) => (
              <tr key={invite.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => handleResendInvitation(invite.email)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <DeleteButton onDelete={() => onDeleteInvitation(invite.id)} id={invite.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Update role parameter type in functions
  const getRoleName = (role: Role): string => {
    return DEFAULT_ROLES.find(r => r.id === role.id)?.name || role.name;
  };

  const getRoleDescription = (role: Role): string => {
    return DEFAULT_ROLES.find(r => r.id === role.id)?.description || role.description;
  };

  function createDefaultRole(): Role {
    return {
      id: '',
      name: '',
      description: '',
      permissions: [],
      scope: 'agent',
      isCustom: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function createDefaultUser(): User {
    const defaultRole = createDefaultRole();
    return {
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      role: defaultRole,
      roleId: defaultRole.id,
      status: 'pending',
      brokerCompany: null,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Update user deletion confirmation
  const confirmDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await handleDeleteUser(id);
    }
  };

  // Update broker deletion confirmation
  const confirmDeleteBroker = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirmDelete.broker) return;
    
    try {
      setDeletingBrokerId(confirmDelete.broker.id);
      await handleDeleteBroker(confirmDelete.broker.id);
      setConfirmDelete({ show: false, broker: null });
      toast.success('Broker deleted successfully');
    } catch (error) {
      console.error('Error deleting broker:', error);
      toast.error('Failed to delete broker');
    } finally {
      setDeletingBrokerId(null);
    }
  };

  // Update invitation deletion confirmation
  const confirmDeleteInvitation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      await handleDeleteInvitation(id);
    }
  };

  // Add handleDeleteInvitation function
  const handleDeleteInvitation = async (id: string): Promise<void> => {
    try {
      await supabase
        .from('invitations')
        .delete()
        .eq('id', id);
      
      toast.success('Invitation deleted successfully');
      await fetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to delete invitation');
    }
  };

  // Update event handler types for delete buttons
  const onDeleteUser = async (id: string) => {
    await confirmDeleteUser(id);
  };

  const onDeleteBroker = async (id: string) => {
    const broker = brokerCompanies.find(b => b.id === id);
    if (broker) {
      setConfirmDelete({ show: true, broker });
    }
  };

  const onDeleteInvitation = async (id: string) => {
    await confirmDeleteInvitation(id);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage brokers and system administrators
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('brokers')}
                className={`${
                  selectedTab === 'brokers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Broker Companies
              </button>
              <button
                onClick={() => setSelectedTab('admin')}
                className={`${
                  selectedTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                System Administrators
              </button>
            </nav>
          </div>
        </div>

        {/* Broker Companies Tab */}
        {selectedTab === 'brokers' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <button
                onClick={() => setShowAddBroker(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Add Broker Company
              </button>
            </div>

            {/* Broker Companies List */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : brokerCompanies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No broker companies found
                </div>
              ) : (
                brokerCompanies.map(broker => (
                  <div key={broker.id} className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Broker Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium text-gray-900">{broker.name}</h3>
                          <div className="text-sm text-gray-500 space-y-1">
                            {broker.email && (
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {broker.email}
                              </div>
                            )}
                            {broker.phone && (
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {broker.phone}
                              </div>
                            )}
                            {broker.address && (
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {broker.address}
                              </div>
                            )}
                            {broker.website && (
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <a href={broker.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                  {broker.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBrokerForRoles(broker.id);
                              setShowRoles(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <ShieldCheckIcon className="h-4 w-4 mr-1" />
                            Manage Roles
                          </button>
                          <button
                            onClick={() => setEditingBroker(broker)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <DeleteButton onDelete={onDeleteBroker} id={broker.id} />
                        </div>
                      </div>
                    </div>

                    {/* Broker Team Members */}
                    <div className="px-6 py-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Team Members</h4>
                        <button
                          onClick={() => {
                            setSelectedBroker(broker.id);
                            setShowAddUser(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <UserPlusIcon className="h-4 w-4 mr-1" />
                          Add Member
                        </button>
                      </div>

                      {renderTeamMembers(
                        getBrokerUsers(broker.id),
                        invitations.filter(inv => inv.brokerId === broker.id)
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {selectedTab === 'admin' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowAddUser(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Add Administrator
                </button>
                <button
                  onClick={() => setShowInviteUser(true)}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Invite User
                </button>
              </div>
            </div>

            {/* Admin Users List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">System Administrators</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Users with full system access and management capabilities
                </p>
              </div>
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {getAdminUsers().map(user => (
                    <li key={user.id} className="px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="mt-1 flex items-center">
                              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                {user.role.name}
                              </span>
                              {user.phoneNumber && (
                                <span className="ml-2 text-xs text-gray-500">{user.phoneNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            user.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {user.status || 'N/A'}
                          </td>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUserEdit(user)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <DeleteButton onDelete={() => onDeleteUser(user.id)} id={user.id} />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingUser ? 'Edit Team Member' : 'Add Team Member'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {editingUser 
                      ? 'Update team member information' 
                      : 'Send an invitation to add a new team member'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setEditingUser(null);
                    setNewUser({
                      email: '',
                      firstName: '',
                      lastName: '',
                      roleId: '',
                      brokerId: '',
                      phoneNumber: '',
                    });
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter email address"
                    disabled={editingUser !== null}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    required
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select a role</option>
                    {(selectedTab === 'admin' 
                      ? DEFAULT_ROLES.filter(role => role.scope === 'admin')
                      : DEFAULT_ROLES.filter(role => role.scope === 'agent')
                    ).map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={newUser.phoneNumber}
                    onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUser(false);
                      setEditingUser(null);
                      setNewUser({
                        email: '',
                        firstName: '',
                        lastName: '',
                        roleId: '',
                        brokerId: '',
                        phoneNumber: '',
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingUser ? 'Save Changes' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Broker Modal */}
        {showAddBroker && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Broker Company</h3>
              <form onSubmit={handleAddBroker} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={newBroker.name}
                    onChange={(e) => setNewBroker({ ...newBroker, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newBroker.email}
                    onChange={(e) => setNewBroker({ ...newBroker, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={newBroker.phone}
                    onChange={(e) => setNewBroker({ ...newBroker, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={newBroker.address}
                    onChange={(e) => setNewBroker({ ...newBroker, address: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    value={newBroker.website}
                    onChange={(e) => setNewBroker({ ...newBroker, website: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBroker(false);
                      setNewBroker({
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        website: '',
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Broker
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Role Modal */}
        {showAddRole && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Custom Role</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(Object.entries(PERMISSIONS) as [string, string][]).map(([key, value]) => (
                      <label key={value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newRole.permissions.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRole({
                                ...newRole,
                                permissions: [...newRole.permissions, value],
                              });
                            } else {
                              setNewRole({
                                ...newRole,
                                permissions: newRole.permissions.filter(p => p !== value),
                              });
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">{key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddRole(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roles Management Modal */}
        {showRoles && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedBrokerForRoles 
                    ? `Manage ${brokerCompanies.find(b => b.id === selectedBrokerForRoles)?.name} Roles`
                    : 'Manage System Roles'}
                </h3>
                <button
                  onClick={() => {
                    setShowRoles(false);
                    setSelectedBrokerForRoles(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => setShowAddRole(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Add Custom Role
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {getRoles(selectedBrokerForRoles || undefined).map((role: Role) => (
                  <div
                    key={role.id}
                    className="bg-white border rounded-lg shadow-sm p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 flex items-center">
                          {role.name}
                          {!role.isCustom && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Default
                            </span>
                          )}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                      </div>
                      {role.isCustom && (
                        <button
                          onClick={() => handleDeleteRole(role.id, selectedBrokerForRoles || undefined)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Permissions</h5>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission: string) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Edit Broker Modal */}
        {editingBroker && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Broker Company</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={editingBroker.name}
                    onChange={(e) => setEditingBroker({ ...editingBroker, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editingBroker.email || ''}
                    onChange={(e) => setEditingBroker({ ...editingBroker, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={editingBroker.phone || ''}
                    onChange={(e) => setEditingBroker({ ...editingBroker, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={editingBroker.address || ''}
                    onChange={(e) => setEditingBroker({ ...editingBroker, address: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    value={editingBroker.website || ''}
                    onChange={(e) => setEditingBroker({ ...editingBroker, website: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingBroker(null)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditBroker}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invitation Modal */}
        {showInviteUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Invite Team Member</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Send an invitation email to add a new team member.
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteUser(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={invitation.email}
                    onChange={(e) => setInvitation({ ...invitation, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={invitation.firstName}
                    onChange={(e) => setInvitation({ ...invitation, firstName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={invitation.lastName}
                    onChange={(e) => setInvitation({ ...invitation, lastName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    required
                    value={invitation.role}
                    onChange={(e) => setInvitation({ ...invitation, role: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select a role</option>
                    {DEFAULT_ROLES.filter(role => role.scope === 'agent').map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Personal Message (Optional)</label>
                  <textarea
                    value={invitation.message}
                    onChange={(e) => setInvitation({ ...invitation, message: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Add a personal message to the invitation email"
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteUser(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDelete.show && confirmDelete.broker && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Broker Company
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete <span className="font-medium text-gray-900">{confirmDelete.broker.name}</span>? 
                This action cannot be undone and will also remove all associated team members.
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDelete({ show: false, broker: null })}
                  disabled={deletingBrokerId === confirmDelete.broker.id}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteBroker}
                  disabled={deletingBrokerId === confirmDelete.broker.id}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
                    ${deletingBrokerId === confirmDelete.broker.id 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'} 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  {deletingBrokerId === confirmDelete.broker.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add loading overlay for delete operation */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 