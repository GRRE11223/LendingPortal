'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NotificationDropdown from '../components/NotificationDropdown';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Documents', href: '/dashboard/documents', icon: DocumentTextIcon },
  { name: 'Team', href: '/dashboard/team', icon: UsersIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Trash', href: '/dashboard/trash', icon: TrashIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // 从 localStorage 获取用户信息
    const loadUserInfo = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.replace('/');
        return;
      }
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        router.replace('/');
      }
    };

    loadUserInfo();

    // 添加 storage 事件监听器
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          router.replace('/');
        }
      }
    };

    // 添加自定义事件监听器
    const handleUserInfoUpdate = (e: CustomEvent) => {
      setUser(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener);
    };
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    router.replace('/');
  };

  if (!user) {
    return null; // 或者显示加载状态
  }

  return (
    <div className="min-h-screen bg-[#f3f6fa] flex">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/95 backdrop-blur-sm px-6 pb-4 ring-1 ring-white/10">
                  <div className="flex items-center py-6">
                    <Image
                      className="max-h-32 w-auto"
                      src="/logo.png"
                      alt="Company Logo"
                      width={480}
                      height={160}
                      priority
                    />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={classNames(
                                  pathname === item.href
                                    ? 'bg-blue-50/50 text-blue-600'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50',
                                  'group flex gap-x-3 rounded-xl p-2 text-sm leading-6 font-semibold transition-all duration-200'
                                )}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <item.icon
                                  className={classNames(
                                    pathname === item.href
                                      ? 'text-blue-600'
                                      : 'text-gray-400 group-hover:text-blue-600',
                                    'h-6 w-6 shrink-0 transition-colors duration-200'
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className={`hidden lg:flex flex-col gap-y-5 p-6 m-4 ${collapsed ? 'w-20' : 'w-56'} h-[calc(100vh-2rem)] transition-all duration-300`}>
        <div className="flex items-center py-6 justify-between">
          <Image
            className="max-h-32 w-auto"
            src="/logo.png"
            alt="Company Logo"
            width={collapsed ? 40 : 120}
            height={collapsed ? 40 : 48}
            priority
          />
          <button onClick={() => setCollapsed(!collapsed)} className="ml-2 p-1 rounded hover:bg-gray-200 transition-all">
            {collapsed ? <span>&#9654;</span> : <span>&#9664;</span>}
          </button>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'bg-white/60 text-blue-600 shadow rounded-xl'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-white/40 hover:shadow rounded-xl',
                        'group flex gap-x-3 p-2 text-sm leading-6 font-semibold transition-all duration-200',
                        collapsed ? 'justify-center' : ''
                      )}
                    >
                      <item.icon
                        className={classNames(
                          pathname === item.href
                            ? 'text-blue-600'
                            : 'text-gray-400 group-hover:text-blue-600',
                          'h-6 w-6 shrink-0 transition-colors duration-200'
                        )}
                        aria-hidden="true"
                      />
                      {!collapsed && item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {/* 顶部栏 */}
        <div className="sticky top-0 z-40 flex h-16 items-center bg-white/60 backdrop-blur-md rounded-2xl shadow-lg px-6 m-4">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <NotificationDropdown />
              
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Open user menu</span>
                  {user.avatar ? (
                    <Image
                      className="h-8 w-8 rounded-full bg-gray-50"
                      src={user.avatar}
                      alt=""
                      width={32}
                      height={32}
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  )}
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                      {user.name}
                    </span>
                  </span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-xl bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/dashboard/settings"
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block px-3 py-1 text-sm leading-6 text-gray-900'
                          )}
                        >
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSignOut}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900'
                          )}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <main className="flex-1 py px-6 bg-transparent">
          <div className="p-8 w-full min-h-[calc(100vh-5rem)] bg-transparent">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 