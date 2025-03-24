'use client';

export default function MessageMainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Message Management</h1>
        <p className="text-gray-600 mb-4">
          Welcome to the message management section. Here you can manage system messages,
          notifications, and communication settings.
        </p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Message Features:</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>System Notifications</li>
            <li>User Alerts</li>
            <li>Message Templates</li>
            <li>Communication Logs</li>
          </ul>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Message Categories:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">System Messages</h3>
              <p className="text-sm text-gray-600">Automated notifications and alerts</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">User Notifications</h3>
              <p className="text-sm text-gray-600">Direct communications to users</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}