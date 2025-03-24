'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

interface MenuItem {
    menu_id: number;
    menu_name: string;
    menu_url: string;
    parent_menu_id: number | null;
    order_index: number;
}

export default function Menu() {
    const { user } = useAuthStore();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMenuItems = async () => {
        try {
            const response = await api.get('/rpc/menu_tree');
            const homeMenuItem: MenuItem = {
                menu_id: 0,
                menu_name: 'Home',
                menu_url: '/',
                parent_menu_id: null,
                order_index: 0
            };
            setMenuItems([homeMenuItem, ...response.data]);
        } catch (error) {
            console.error('Failed to load menu items:', error);
            toast.error("Failed to load menu items");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMenuItems();
        }
    }, [user]);

    const renderMenuItems = (parentId: number | null = null) => {
        const filteredItems = menuItems
            .filter(item => item.parent_menu_id === parentId)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

        return (
            <div className="space-y-1">
                {filteredItems.map((item) => (
                    <div key={item.menu_id}>
                        <Link 
                            href={item.menu_url} 
                            className="flex items-center py-2 px-4 hover:bg-gray-700 rounded text-white"
                        >
                            <span className="flex-1">{item.menu_name}</span>
                        </Link>
                        <div className="ml-4">
                            {renderMenuItems(item.menu_id)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (!user || isLoading) return null;

    return (
        <nav className="bg-gray-800 text-white w-64">
            <div className="p-4">
                {renderMenuItems(null)}
            </div>
        </nav>
    );
}
