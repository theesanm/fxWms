'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/postgrest';
import { toast } from 'sonner';
import { Role } from '@/types/role';

export default function RoleManager() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const { register, handleSubmit, reset, setValue } = useForm<Role>();
    const [isLoading, setIsLoading] = useState(true);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const onSubmit = async (data: Role) => {
        try {
            if (editingRole) {
                await api.patch(`/roles?role_id=eq.${editingRole.role_id}`, data);
                toast.success('Role updated successfully');
            } else {
                await api.post('/roles', data);
                toast.success('Role created successfully');
            }
            fetchRoles();
            handleCancel();
        } catch (error) {
            toast.error('Failed to save role');
            console.error('Error saving role:', error);
        }
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        Object.keys(role).forEach((key) => {
            setValue(key as keyof Role, role[key as keyof Role]);
        });
    };

    const handleDelete = async (roleId: number) => {
        if (!confirm('Are you sure you want to delete this role?')) return;

        try {
            await api.delete(`/roles?role_id=eq.${roleId}`);
            toast.success('Role deleted successfully');
            fetchRoles();
        } catch (error) {
            toast.error('Failed to delete role');
            console.error('Error deleting role:', error);
        }
    };

    const handleCancel = () => {
        setEditingRole(null);
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
        <div className="container mx-auto p-6 dark:bg-gray-900">
            {/* Form Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-secondary-medium dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Add New Role</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Role Name
                        </label>
                        <Input
                            {...register('role_name')}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <Textarea
                            {...register('description')}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">
                            {editingRole ? 'Update' : 'Create'}
                        </Button>
                        {editingRole && (
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            {/* Roles List Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-secondary-medium dark:border-gray-700 p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Roles</h2>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {roles.map((role) => (
                        <div 
                            key={role.role_id}
                            className="py-4 flex items-center justify-between"
                        >
                            <div>
                                <h3 className="text-lg font-medium dark:text-gray-200">
                                    {role.role_name}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {role.description}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => handleEdit(role)}
                                    variant="outline"
                                    size="sm"
                                >
                                    Edit
                                </Button>
                                <Button 
                                    onClick={() => handleDelete(role.role_id)}
                                    variant="danger"
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











