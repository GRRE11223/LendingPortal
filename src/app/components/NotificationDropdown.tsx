'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';
import Link from 'next/link';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function NotificationDropdown() {
  const { state, dispatch } = useNotifications();
  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notificationId: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: notificationId });
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
        <span className="sr-only">View notifications</span>
        <div className="relative">
          <BellIcon className="h-6 w-6" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
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
        <Menu.Items className="absolute right-0 z-10 mt-2.5 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {state.notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              state.notifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <div
                      onClick={() => handleNotificationClick(notification.id)}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        !notification.read ? 'bg-blue-50' : '',
                        'px-4 py-3 cursor-pointer'
                      )}
                    >
                      {notification.link ? (
                        <Link href={notification.link}>
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                              })}
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Menu.Item>
              ))
            )}
          </div>
          {state.notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200">
              <button
                onClick={() => dispatch({ type: 'CLEAR_ALL' })}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 