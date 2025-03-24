'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from '@/lib/api';  // Change this import to use the PostgREST client
import { toast } from 'sonner';
import { RolePermission, Role, Permission } from '@/types/role-permission';

export default function RolePermissionManager() {
    const [rolePermissions, setRolePermissions] = useState<Array<RolePermission & { role_name: string; permission_name: string }>>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { handleSubmit, reset } = useForm<RolePermission>();
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedPermission, setSelectedPermission] = useState<string>('');

    const fetchRolePermissions = async () => {
        try {
            const response = await api.get('/role_permissions?select=role_id,permission_id,roles(role_name),permissions(permission_name)');
            const formattedData = response.data.map((item: any) => ({
                role_id: item.role_id,
                permission_id: item.permission_id,
                role_name: item.roles.role_name,
                permission_name: item.permissions.permission_name
            }));
            setRolePermissions(formattedData);
        } catch (error) {
            console.error('Error fetching role permissions:', error);
            toast.error('Failed to load role permissions');
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/permissions');
            setPermissions(response.data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Failed to load permissions');
        }
    };

    useEffect(() => {
        Promise.all([
            fetchRolePermissions(),
            fetchRoles(),
            fetchPermissions()
        ]).finally(() => setIsLoading(false));
    }, []);

    const onSubmit = async () => {
        if (!selectedRole || !selectedPermission) {
            toast.error('Please select both role and permission');
            return;
        }

        const newRolePermission = {
            role_id: parseInt(selectedRole),
            permission_id: parseInt(selectedPermission)
        };

        try {
            await api.post('/role_permissions', newRolePermission);
            toast.success('Role permission assigned successfully');
            fetchRolePermissions();
            reset();
            setSelectedRole('');
            setSelectedPermission('');
        } catch (error) {
            toast.error('Failed to assign role permission');
            console.error('Error saving role permission:', error);
        }
    };

    const handleDelete = async (roleId: number, permissionId: number) => {
        if (!confirm('Are you sure you want to remove this role permission?')) return;

        try {
            await api.delete(`/role_permissions?role_id=eq.${roleId}&permission_id=eq.${permissionId}`);
            toast.success('Role permission removed successfully');
            fetchRolePermissions();
        } catch (error) {
            toast.error('Failed to remove role permission');
            console.error('Error deleting role permission:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Form Section */}
            <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Assign Permission to Role</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem 
                                            key={role.role_id} 
                                            value={role.role_id.toString()}
                                        >
                                            {role.role_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Permission
                            </label>
                            <Select
                                value={selectedPermission}
                                onValueChange={setSelectedPermission}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a permission" />
                                </SelectTrigger>
                                <SelectContent>
                                    {permissions.map((permission) => (
                                        <SelectItem 
                                            key={permission.permission_id} 
                                            value={permission.permission_id.toString()}
                                        >
                                            {permission.permission_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        <Button type="submit" variant="default">
                            Assign Permission
                        </Button>
                    </div>
                </form>
            </div>

            {/* Role Permissions List Section */}
            <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Role Permissions</h2>
                <div className="divide-y divide-gray-200">
                    {rolePermissions.map((rp) => (
                        <div 
                            key={`${rp.role_id}-${rp.permission_id}`}
                            className="py-4 flex items-center justify-between"
                        >
                            <div>
                                <h3 className="text-lg font-medium">
                                    {rp.role_name}
                                </h3>
                                <p className="text-gray-600">
                                    {rp.permission_name}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => handleDelete(rp.role_id, rp.permission_id)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}