'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue,
    SelectGroup 
} from '@/components/ui/select';
import api from '@/lib/postgrest';  // Updated from @/lib/api
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MenuItem {
    menu_id: number;
    menu_name: string;
    menu_url: string;
    parent_menu_id: number | null;
    order_index: number;
    created_at?: string;
    updated_at?: string;
}

interface MenuDesignerProps {
    items: MenuItem[];
    onChange: (items: MenuItem[]) => void;
    onSave: (items: MenuItem[]) => Promise<void>;
    fetchMenuItems: () => Promise<void>;
}

export default function MenuDesigner({ items, onChange, onSave, fetchMenuItems }: MenuDesignerProps) {
    const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<MenuItem>({
        defaultValues: {
            menu_name: '',
            menu_url: '',
            parent_menu_id: null,
            order_index: 1
        }
    });

    const onSubmit = async (data: MenuItem) => {
        try {
            const formattedData = {
                menu_name: data.menu_name.trim(),
                menu_url: data.menu_url.trim(),
                parent_menu_id: data.parent_menu_id,
                order_index: data.order_index || 1
            };

            if (editingMenu) {
                await api.patch(`/menus?menu_id=eq.${editingMenu.menu_id}`, formattedData);
                toast.success('Menu updated successfully');
            } else {
                await api.post('/menus', formattedData);
                toast.success('Menu created successfully');
            }
            
            await fetchMenuItems();
            handleCancel();
        } catch (error: any) {
            console.error('API Error:', error);
            toast.error(error.response?.data?.message || 'Failed to save menu');
        }
    };

    const handleEdit = (menu: MenuItem) => {
        setEditingMenu(menu);
        reset({
            menu_name: menu.menu_name,
            menu_url: menu.menu_url,
            parent_menu_id: menu.parent_menu_id,
            order_index: menu.order_index
        });
    };

    const handleDelete = async (menuId: number) => {
        try {
            await api.delete(`/menus?menu_id=eq.${menuId}`);
            await fetchMenuItems();
            toast.success("Menu item deleted successfully");
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error("Failed to delete menu item");
        }
    };

    const handleCancel = () => {
        setEditingMenu(null);
        reset({
            menu_name: '',
            menu_url: '',
            parent_menu_id: null,
            order_index: 1
        });
    };

    const handleParentMenuChange = (value: string) => {
        setValue('parent_menu_id', value === 'null' ? null : parseInt(value, 10));
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Menu Name
                        </label>
                        <Input 
                            {...register('menu_name')} 
                            placeholder="Enter menu name"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Menu URL
                        </label>
                        <Input 
                            {...register('menu_url')} 
                            placeholder="Enter menu URL"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Parent Menu
                        </label>
                        <Select 
                            onValueChange={handleParentMenuChange}
                            defaultValue="null"
                        >
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                <SelectValue placeholder="Select parent menu" />
                            </SelectTrigger>
                            <SelectContent 
                                className="dark:bg-gray-800 dark:border-gray-700"
                                avoidCollisions={false}
                            >
                                <SelectGroup>
                                    <SelectItem value="null" className="dark:text-gray-200">None</SelectItem>
                                    {items.map((menu) => (
                                        <SelectItem 
                                            key={menu.menu_id} 
                                            value={menu.menu_id.toString()}
                                            disabled={editingMenu?.menu_id === menu.menu_id}
                                            className="relative z-[99999] dark:text-gray-200"
                                        >
                                            {menu.menu_name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Order Index
                        </label>
                        <Input 
                            {...register('order_index')} 
                            placeholder="Enter display order number" 
                            type="number"
                            defaultValue={1}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>
                </div>

                <div className="flex space-x-2">
                    <Button type="submit">
                        {editingMenu ? 'Update Menu' : 'Add Menu'}
                    </Button>
                    {editingMenu && (
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                    )}
                </div>
            </form>

            <div className="border rounded-lg p-4 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Menu Items</h3>
                <div className="space-y-2">
                    {items.map((menu) => (
                        <div key={menu.menu_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div>
                                <span className="font-medium dark:text-gray-200">{menu.menu_name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{menu.menu_url}</span>
                                {menu.parent_menu_id && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                        (Parent: {items.find(m => m.menu_id === menu.parent_menu_id)?.menu_name})
                                    </span>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEdit(menu)}
                                    className="dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Edit
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDelete(menu.menu_id)}
                                    className="text-red-600 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600"
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






















