'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/lib/postgrest';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import MenuDesigner from '@/components/menu/menu-designer';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import MenuPreview from '@/components/menu/menu-preview';
import { Toaster } from 'sonner';

type MenuItem = {
    menu_id: number;
    menu_name: string;
    menu_url: string;
    parent_menu_id: number | null;
    order_index: number;
};

export default function MenuDesignPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMenuItems = async () => {
        try {
            const response = await api.get('/rpc/menu_tree');
            setMenuItems(response.data);
        } catch (error) {
            toast.error("Failed to load menu items");
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (updatedItems: MenuItem[]) => {
        try {
            await Promise.all(updatedItems.map(item => 
                api.patch(`/menus?menu_id=eq.${item.menu_id}`, {
                    parent_menu_id: item.parent_menu_id,
                    menu_name: item.menu_name,
                    menu_url: item.menu_url,
                    order_index: item.order_index
                })
            ));

            toast.success("Menu structure updated successfully");
            fetchMenuItems();
        } catch (error) {
            console.error('Save error:', error);
            toast.error("Failed to update menu structure");
        }
    };

    useEffect(() => {
        fetchMenuItems();
    }, []);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center">
                    <div className="text-lg dark:text-gray-200">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-semibold text-secondary-dark dark:text-gray-100">Menu Designer</h1>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-secondary-medium dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold mb-6 text-secondary-dark dark:text-gray-100">Menu Structure</h2>
                        <MenuDesigner 
                            items={menuItems} 
                            onChange={setMenuItems} 
                            onSave={handleSave}
                            fetchMenuItems={fetchMenuItems}
                        />
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-secondary-medium dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold mb-6 text-secondary-dark dark:text-gray-100">Preview</h2>
                        <MenuPreview items={menuItems.map(item => ({
                            menu_id: item.menu_id,
                            menu_name: item.menu_name,
                            menu_url: item.menu_url,
                            parent_menu_id: item.parent_menu_id,
                            level: 0
                        }))} />
                    </div>
                </div>
            </div>
            <Toaster />
        </DndProvider>
    );
}













