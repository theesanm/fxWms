'use client';

export default function UserMainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">User Management</h1>
        <p className="text-gray-600 mb-4">
          Welcome to the user management section. Here you can manage user accounts,
          their roles, and permissions across the system.
        </p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">User Management Features:</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Role Assignment</li>
            <li>Permission Management</li>
            <li>User Access Control</li>
            <li>Role-Permission Mapping</li>
          </ul>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Available Actions:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Role Management</h3>
              <p className="text-sm text-gray-600">Configure and manage user roles</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Permission Settings</h3>
              <p className="text-sm text-gray-600">Set up and modify permissions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}