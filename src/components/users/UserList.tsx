'use client';

import { useEffect, useState } from 'react';
import { UserService } from '@/lib/services/user.service';
import { User } from '@/types';

export default function UserList() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await UserService.getUsers();
                setUsers(data);
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        };
        loadUsers();
    }, []);

    const handleDelete = async (userId: number) => {
        try {
            await UserService.deleteUser(userId);
            setUsers(users.filter(user => user.user_id !== userId));
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const handleUpdate = async (userId: number, data: Partial<User>) => {
        try {
            const updated = await UserService.updateUser(userId, data);
            setUsers(users.map(user => 
                user.user_id === userId ? updated : user
            ));
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    return (
        <div>
            {users.map(user => (
                <div key={user.user_id}>
                    <span>{user.username}</span>
                    <button onClick={() => handleDelete(user.user_id)}>Delete</button>
                    <button onClick={() => handleUpdate(user.user_id, { active: !user.active })}>
                        Toggle Active
                    </button>
                </div>
            ))}
        </div>
    );
}

