import RoleManager from '@/components/role/role-manager';

export default function RolePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <RoleManager />
      </div>
    </div>
  );
}

