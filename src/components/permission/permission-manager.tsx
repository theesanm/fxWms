'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';  // Change this import to use the PostgREST client
import { toast } from 'sonner';
import { Permission } from '@/types/permission';

export default function PermissionManager() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
    const { register, handleSubmit, reset, setValue } = useForm<Permission>();
    const [isLoading, setIsLoading] = useState(true);

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/permissions');
            setPermissions(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Failed to load permissions');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const onSubmit = async (data: Permission) => {
        try {
            if (editingPermission) {
                await api.patch(`/permissions?permission_id=eq.${editingPermission.permission_id}`, data);
                toast.success('Permission updated successfully');
            } else {
                await api.post('/permissions', data);
                toast.success('Permission created successfully');
            }
            fetchPermissions();
            handleCancel();
        } catch (error) {
            toast.error('Failed to save permission');
            console.error('Error saving permission:', error);
        }
    };

    const handleEdit = (permission: Permission) => {
        setEditingPermission(permission);
        Object.keys(permission).forEach((key) => {
            setValue(key as keyof Permission, permission[key as keyof Permission]);
        });
    };

    const handleDelete = async (permissionId: number) => {
        if (!confirm('Are you sure you want to delete this permission?')) return;

        try {
            await api.delete(`/permissions?permission_id=eq.${permissionId}`);
            toast.success('Permission deleted successfully');
            fetchPermissions();
        } catch (error) {
            toast.error('Failed to delete permission');
            console.error('Error deleting permission:', error);
        }
    };

    const handleCancel = () => {
        setEditingPermission(null);
        reset();
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
                <h2 className="text-xl font-semibold mb-4">
                    {editingPermission ? 'Edit Permission' : 'Create New Permission'}
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Permission Name
                            </label>
                            <Input
                                {...register('permission_name')}
                                placeholder="Enter permission name"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <Textarea
                                {...register('description')}
                                placeholder="Enter permission description"
                                className="w-full"
                                rows={3}
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        <Button type="submit" variant="default">
                            {editingPermission ? 'Update Permission' : 'Create Permission'}
                        </Button>
                        {editingPermission && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            {/* Permissions List Section */}
            <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Permissions</h2>
                <div className="divide-y divide-gray-200">
                    {permissions.map((permission) => (
                        <div 
                            key={permission.permission_id}
                            className="py-4 flex items-center justify-between"
                        >
                            <div>
                                <h3 className="text-lg font-medium">
                                    {permission.permission_name}
                                </h3>
                                <p className="text-gray-600">
                                    {permission.description}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => handleEdit(permission)}
                                    variant="outline"
                                    size="sm"
                                >
                                    Edit
                                </Button>
                                <Button 
                                    onClick={() => handleDelete(permission.permission_id)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

