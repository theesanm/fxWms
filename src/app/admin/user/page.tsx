'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserMainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <Link href="/admin/user/createUser">
            <Button>Create User</Button>
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Welcome to the user management section. Here you can manage user accounts,
          their roles, and permissions across the system.
        </p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">User Management Features:</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>Role Assignment</li>
            <li>Permission Management</li>
            <li>User Access Control</li>
            <li>Role-Permission Mapping</li>
          </ul>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Available Actions:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2 dark:text-gray-200">Role Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure and manage user roles</p>
            </div>
            <div className="p-4 border dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2 dark:text-gray-200">Permission Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Set up and modify permissions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
