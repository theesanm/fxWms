'use client';

export default function AdminMainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Administration Dashboard</h1>
        <p className="text-gray-600 mb-4">
          Welcome to the administration section. Here you can manage system settings, 
          user permissions, roles, and other administrative tasks.
        </p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Administrative Functions:</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>User Management</li>
            <li>Role and Permission Configuration</li>
            <li>Menu Management</li>
            <li>System Settings</li>
            <li>Access Control</li>
          </ul>
        </div>
        <div className="mt-8 p-4 bg-secondary-light rounded-md">
          <p className="text-sm text-secondary-dark">
            <strong>Note:</strong> This area is restricted to administrators only. 
            All actions performed here are logged for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
}