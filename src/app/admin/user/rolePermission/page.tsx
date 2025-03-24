import RolePermissionManager from '@/components/role-permission/role-permission-manager';

export default function RolePermissionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Role Permissions Management</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <RolePermissionManager />
      </div>
    </div>
  );
}