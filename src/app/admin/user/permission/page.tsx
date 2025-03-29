import { PermissionManager } from '@/components/permission/permission-manager';

export default function PermissionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Permission Management</h1>
      </div>
      
      <div className="card">
        <PermissionManager />
      </div>
    </div>
  );
}


