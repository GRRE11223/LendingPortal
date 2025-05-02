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
} from '@heroicons/react/24/outline';
import { User, Role, BrokerCompany, DEFAULT_ROLES, Permission, PERMISSIONS } from '@/types';

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
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

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

  // 从 localStorage 加载数据
  useEffect(() => {
    const storedUsers = localStorage.getItem('users');
    const storedBrokers = localStorage.getItem('brokerCompanies');
    
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
    
    if (storedBrokers) {
      setBrokerCompanies(JSON.parse(storedBrokers));
    }
  }, []);

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

  // 添加用户
  const handleAddUser = async () => {
    const roles = getRoles(selectedTab === 'admin' ? undefined : selectedBroker || newUser.brokerId);
    const selectedRole = roles.find(role => role.id === newUser.roleId);

    if (!selectedRole) {
      console.error('Selected role not found');
      return;
    }

    let brokerCompany: BrokerCompany | undefined = undefined;
    if (selectedRole.scope === 'agent') {
      brokerCompany = brokerCompanies.find(broker => broker.id === (selectedBroker || newUser.brokerId));
      if (!brokerCompany) {
        console.error('Broker company not found');
        return;
      }
    }

    // 生成一个唯一的注册令牌
    const registrationToken = Math.random().toString(36).substr(2, 15);

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: selectedRole,
      status: 'pending',  // 初始状态为 pending
      brokerCompany,
      isAdmin: selectedRole.scope === 'admin',
      phoneNumber: newUser.phoneNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      registrationToken,
    };

    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);

    setShowAddUser(false);
    setNewUser({
      email: '',
      firstName: '',
      lastName: '',
      roleId: '',
      brokerId: '',
      phoneNumber: '',
    });
    toast.success('User added successfully');
  };

  // 发送邀请邮件
  const handleSendInvitation = async (user: User) => {
    setSendingInvite(user.id);
    try {
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          registrationToken: user.registrationToken,
          brokerName: user.brokerCompany?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation email');
      }

      // 更新用户的邀请发送状态
      const updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            lastInviteSent: new Date().toISOString(),
          };
        }
        return u;
      });
      saveUsers(updatedUsers);
      toast.success('Invitation sent successfully');
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation email');
    } finally {
      setSendingInvite(null);
    }
  };

  // 添加经纪公司
  const handleAddBroker = () => {
    const broker: BrokerCompany = {
      id: Math.random().toString(36).substr(2, 9),
      name: newBroker.name,
      status: 'active',
      email: newBroker.email,
      phone: newBroker.phone,
      address: newBroker.address,
      website: newBroker.website,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedBrokers = [...brokerCompanies, broker];
    setBrokerCompanies(updatedBrokers);
    localStorage.setItem('brokerCompanies', JSON.stringify(updatedBrokers));
    setShowAddBroker(false);
    setNewBroker({
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
    });
    toast.success('Broker company added successfully');
  };

  // 删除用户
  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter(user => user.id !== userId);
    saveUsers(updatedUsers);
    toast.success('User deleted successfully');
  };

  // 删除经纪公司
  const handleDeleteBroker = (brokerId: string) => {
    const updatedBrokers = brokerCompanies.filter(broker => broker.id !== brokerId);
    setBrokerCompanies(updatedBrokers);
    localStorage.setItem('brokerCompanies', JSON.stringify(updatedBrokers));
    
    // 同时更新相关用户
    const updatedUsers = users.map(user => {
      if (user.brokerCompany?.id === brokerId) {
        return { ...user, status: 'inactive' as const };
      }
      return user;
    });
    saveUsers(updatedUsers);
  };

  // 获取特定经纪公司的用户
  const getBrokerUsers = (brokerId: string) => {
    return users.filter(user => user.brokerCompany?.id === brokerId);
  };

  // 获取管理员用户
  const getAdminUsers = () => {
    return users.filter(user => user.isAdmin);
  };

  // 获取角色列表
  const getRoles = (brokerId?: string) => {
    if (brokerId) {
      // Get broker's agent roles
      const broker = brokerCompanies.find(b => b.id === brokerId);
      const agentRole = DEFAULT_ROLES.find(role => role.scope === 'agent');
      const brokerCustomRoles = broker?.customRoles || [];
      
      // Filter custom roles to only include those belonging to this broker
      const storedRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
      const brokerStoredRoles = storedRoles.filter((role: Role) => role.brokerId === brokerId);
      
      return [
        { ...agentRole!, brokerId }, // Add brokerId to the default agent role
        ...brokerCustomRoles,
        ...brokerStoredRoles
      ];
    } else {
      // Get admin roles
      const adminRole = DEFAULT_ROLES.find(role => role.scope === 'admin');
      const storedRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
      const adminStoredRoles = storedRoles.filter((role: Role) => role.scope === 'admin');
      
      return [adminRole!, ...adminStoredRoles];
    }
  };

  // 添加自定义角色
  const handleAddRole = () => {
    const role: Role = {
      id: Math.random().toString(36).substr(2, 9),
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions as Permission[],
      scope: selectedTab === 'admin' ? 'admin' : 'agent',
      brokerId: selectedBrokerForRoles || undefined,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const storedRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
    const updatedRoles = [...storedRoles, role];
    localStorage.setItem('customRoles', JSON.stringify(updatedRoles));

    setShowAddRole(false);
    setNewRole({
      name: '',
      description: '',
      permissions: [],
    });
    toast.success('Custom role added successfully');
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
  const handleEditBroker = () => {
    if (!editingBroker) return;
    
    const updatedBrokers = brokerCompanies.map(broker => 
      broker.id === editingBroker.id ? editingBroker : broker
    );
    
    setBrokerCompanies(updatedBrokers);
    localStorage.setItem('brokerCompanies', JSON.stringify(updatedBrokers));
    setEditingBroker(null);
    toast.success('Broker company updated successfully');
  };

  // 渲染角色管理模态框
  const renderRolesModal = () => {
    const roles = getRoles(selectedBrokerForRoles || undefined);
    const title = selectedBrokerForRoles 
      ? `Manage ${brokerCompanies.find(b => b.id === selectedBrokerForRoles)?.name} Roles`
      : 'Manage System Roles';

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
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
            {roles.map(role => (
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
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
    );
  };

  // Update broker header render function
  const renderBrokerHeader = (broker: BrokerCompany) => (
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
      <button
        onClick={() => handleDeleteBroker(broker.id)}
        className="text-red-400 hover:text-red-500"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

  // 在 Admin Tab 中添加角色管理按钮
  const renderAdminHeader = () => (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => {
          setSelectedBrokerForRoles(null);
          setShowRoles(true);
        }}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <ShieldCheckIcon className="h-5 w-5 mr-2" />
        Manage System Roles
      </button>
      <button
        onClick={() => handleDeleteUser(getAdminUsers()[0].id)}
        className="text-red-400 hover:text-red-500"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

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
              {brokerCompanies.map(broker => (
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
                      {renderBrokerHeader(broker)}
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

                    <ul className="divide-y divide-gray-200">
                      {getBrokerUsers(broker.id).map(user => (
                        <li key={user.id} className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-gray-500" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                {user.lastInviteSent && (
                                  <div className="text-xs text-gray-400">
                                    Invited: {new Date(user.lastInviteSent).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-xs font-medium text-blue-600">
                                {user.role.name}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' :
                                user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </span>
                              {user.status === 'pending' && (
                                <button
                                  onClick={() => handleSendInvitation(user)}
                                  disabled={sendingInvite === user.id}
                                  className={`text-blue-400 hover:text-blue-500 disabled:opacity-50 flex items-center`}
                                  title={user.lastInviteSent ? "Resend Invitation" : "Send Invitation"}
                                >
                                  {sendingInvite === user.id ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <EnvelopeIcon className="h-4 w-4" />
                                  )}
                                  {user.lastInviteSent && (
                                    <span className="ml-1 text-xs">Resend</span>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-400 hover:text-red-500"
                                title="Delete User"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {selectedTab === 'admin' && (
          <div>
            <div className="mb-6">
              {renderAdminHeader()}
            </div>

            {/* Admin Users List */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <ul className="divide-y divide-gray-200">
                {getAdminUsers().map(user => (
                  <li key={user.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <ShieldCheckIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-blue-600 mt-1">
                            {user.role.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedTab === 'admin' ? 'Add Administrator' : 'Add Team Member'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {selectedTab === 'brokers' && !selectedBroker && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Broker Company</label>
                    <select
                      value={newUser.brokerId}
                      onChange={(e) => setNewUser({ ...newUser, brokerId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a broker company</option>
                      {brokerCompanies.map(broker => (
                        <option key={broker.id} value={broker.id}>{broker.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select a role</option>
                    {(selectedTab === 'admin' 
                      ? DEFAULT_ROLES.filter(role => role.scope === 'admin')
                      : DEFAULT_ROLES.filter(role => role.scope === 'agent')
                    ).map((role: Role) => (
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
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setSelectedBroker(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Broker Modal */}
        {showAddBroker && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Broker Company</h3>
              <div className="space-y-4">
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
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddBroker(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBroker}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Broker
                </button>
              </div>
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
        {showRoles && renderRolesModal()}

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
      </div>
    </div>
  );
} 