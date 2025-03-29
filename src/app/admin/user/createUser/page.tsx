'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from '@/lib/postgrest';
import { toast } from 'sonner';
import { hash } from '@/lib/crypto';
import { Role } from '@/types/role';
import { Search } from 'lucide-react';

const userSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password_hash: z.string().min(6, 'Password must be at least 6 characters'),
    role_id: z.string().min(1, 'Role is required')
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
    user_id: number;
    username: string;
    email: string;
    role_id: number;
    created_at?: string;
    updated_at?: string;
}

export default function CreateUserPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema)
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles?select=role_id,role_name');
            if (response.data) {
                setRoles(response.data);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
        }
    };

    const onUserSubmit = async (data: UserFormData) => {
        setIsSubmitting(true);
        try {
            const userData: {
                username: string;
                email: string;
                role_id: number;
                updated_at: string;
                password_hash?: string;
            } = {
                username: data.username,
                email: data.email,
                role_id: parseInt(data.role_id),
                updated_at: new Date().toISOString()
            };

            // Hash the password before sending
            if (data.password_hash?.trim()) {
                userData.password_hash = data.password_hash;
            }

            let response;
            if (editingUser) {
                // Update existing user
                response = await fetch(`/api/user?user_id=${editingUser.user_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                });
            } else {
                // Create new user
                response = await fetch('/api/user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...userData,
                        created_at: new Date().toISOString()
                    }),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save user');
            }

            const responseData = await response.json();
            toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
            reset();
            setSelectedRole('');
            setEditingUser(null);
        } catch (error: any) {
            console.error('Submission error details:', error);
            toast.error(error.message || 'Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleChange = (value: string) => {
        setSelectedRole(value);
        setValue('role_id', value);
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            toast.info('Please enter a search term');
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get(`/users?username=ilike.*${searchTerm}*`);
            setSearchResults(response.data);
            if (response.data.length === 0) {
                toast.info('No users found');
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search users');
        } finally {
            setIsSearching(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setSelectedRole(user.role_id.toString());
        reset({
            username: user.username,
            email: user.email,
            password_hash: '', // Clear password field for security
            role_id: user.role_id.toString()
        });
        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            await api.delete(`/users?user_id=eq.${userId}`);
            toast.success('User deleted successfully');
            // Remove from search results
            setSearchResults(prev => prev.filter(user => user.user_id !== userId));
            // If this was the editing user, reset form
            if (editingUser?.user_id === userId) {
                setEditingUser(null);
                reset();
                setSelectedRole('');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete user');
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 dark:bg-gray-800 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 dark:text-white">
                            {editingUser ? 'Edit User' : 'Create User'}
                        </h2>
                        <form onSubmit={handleSubmit(onUserSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Username
                                </label>
                                <Input
                                    {...register('username')}
                                    placeholder="Enter username"
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Email Address
                                </label>
                                <Input
                                    {...register('email')}
                                    type="email"
                                    placeholder="Enter email address"
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Password
                                </label>
                                <Input
                                    {...register('password_hash')}
                                    type="password"
                                    placeholder="Enter password (min. 6 characters)"
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                />
                                {errors.password_hash && (
                                    <p className="text-sm text-red-500 mt-1">{errors.password_hash.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Role
                                </label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={handleRoleChange}
                                >
                                    <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                        {roles.map((role) => (
                                            <SelectItem 
                                                key={role.role_id} 
                                                value={role.role_id.toString()}
                                                className="dark:text-gray-200 dark:focus:bg-gray-700"
                                            >
                                                {role.role_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role_id && (
                                    <p className="text-sm text-red-500 mt-1">{errors.role_id.message}</p>
                                )}
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full dark:bg-primary dark:hover:bg-primary-dark"
                            >
                                {isSubmitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                            </Button>
                        </form>
                    </div>
                </div>
                
                {/* Role descriptions */}
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 dark:bg-gray-800 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 dark:text-white">Available Roles</h2>
                        <div className="space-y-3 text-sm dark:text-gray-300">
                            {roles.map((role) => (
                                <div key={role.role_id} className="border-b dark:border-gray-700 pb-2 last:border-0">
                                    <p className="font-medium">{role.role_name}</p>
                                    <p className="text-gray-600 dark:text-gray-400">{role.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add new search section */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Search Users</h2>
                
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search users by username..."
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button 
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="dark:bg-primary dark:hover:bg-primary-dark"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                </div>

                <div className="space-y-4">
                    {searchResults.map((user) => (
                        <div 
                            key={user.user_id}
                            className="flex justify-between items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {user.username}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {user.email}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Role: {roles.find(r => r.role_id === user.role_id)?.role_name || 'Unknown'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline"
                                    onClick={() => handleEditUser(user)}
                                    className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    Edit
                                </Button>
                                <Button 
                                    variant="danger"
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    className="dark:bg-red-900 dark:hover:bg-red-800"
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









