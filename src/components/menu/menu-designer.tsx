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
import api from '@/lib/api';
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Menu Name
                        </label>
                        <Input 
                            {...register('menu_name', { required: 'Menu name is required' })} 
                            placeholder="Enter menu name" 
                        />
                        {errors.menu_name && (
                            <span className="text-red-500 text-sm">{errors.menu_name.message}</span>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Menu URL
                        </label>
                        <Input 
                            {...register('menu_url', { required: 'URL is required' })} 
                            placeholder="Enter menu URL (e.g., /dashboard)" 
                        />
                        {errors.menu_url && (
                            <span className="text-red-500 text-sm">{errors.menu_url.message}</span>
                        )}
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parent Menu
                        </label>
                        <Select 
                            onValueChange={handleParentMenuChange}
                            defaultValue={editingMenu?.parent_menu_id?.toString() || "null"}
                        >
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Select parent menu (optional)" />
                            </SelectTrigger>
                            <SelectContent 
                                position="popper" 
                                side="bottom"
                                align="start"
                                sideOffset={4}
                                className={cn(
                                    "!z-[99999]",
                                    "data-[side=bottom]:slide-in-from-top-2",
                                    "data-[side=top]:slide-in-from-top-2"
                                )}
                                style={{ 
                                    position: 'relative',
                                    zIndex: 99999,
                                }}
                                avoidCollisions={false}
                            >
                                <SelectGroup>
                                    <SelectItem value="null">None</SelectItem>
                                    {items.map((menu) => (
                                        <SelectItem 
                                            key={menu.menu_id} 
                                            value={menu.menu_id.toString()}
                                            disabled={editingMenu?.menu_id === menu.menu_id}
                                            className="relative z-[99999]"
                                        >
                                            {menu.menu_name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Order Index
                        </label>
                        <Input 
                            {...register('order_index')} 
                            placeholder="Enter display order number" 
                            type="number"
                            defaultValue={1}
                        />
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <Button type="submit" variant="default">
                        {editingMenu ? 'Update Menu' : 'Create Menu'}
                    </Button>
                    
                    {editingMenu && (
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                    )}
                </div>
            </form>

            <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Menu Items</h3>
                <div className="space-y-2">
                    {items.map((menu) => (
                        <div key={menu.menu_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                                <span className="font-medium">{menu.menu_name}</span>
                                <span className="text-sm text-gray-500 ml-2">{menu.menu_url}</span>
                                {menu.parent_menu_id && (
                                    <span className="text-sm text-gray-500 ml-2">
                                        (Parent: {items.find(m => m.menu_id === menu.parent_menu_id)?.menu_name})
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(menu)}>
                                    Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(menu.menu_id)}>
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




















