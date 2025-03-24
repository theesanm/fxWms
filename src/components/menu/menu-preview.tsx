'use client';
import { useState } from 'react';

interface PreviewMenuItem {
    menu_id: number;
    menu_name: string;
    menu_url: string;
    parent_menu_id: number | null;
    level: number;
}

interface MenuPreviewProps {
    items: PreviewMenuItem[];
}

export default function MenuPreview({ items }: MenuPreviewProps) {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    const toggleItem = (menuId: number) => {
        const newExpanded = new Set(expandedItems);
        if (expandedItems.has(menuId)) {
            newExpanded.delete(menuId);
        } else {
            newExpanded.add(menuId);
        }
        setExpandedItems(newExpanded);
    };

    const buildMenuTree = (parentId: number | null = null, level: number = 0): PreviewMenuItem[] => {
        return items
            .filter(item => item.parent_menu_id === parentId)
            .map(item => ({
                ...item,
                level
            }));
    };

    const renderMenuItem = (item: PreviewMenuItem) => {
        const hasChildren = items.some(child => child.parent_menu_id === item.menu_id);
        const isExpanded = expandedItems.has(item.menu_id);
        const children = hasChildren ? buildMenuTree(item.menu_id, item.level + 1) : [];

        return (
            <div key={item.menu_id} className="menu-item">
                <div 
                    className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer`}
                    style={{ paddingLeft: `${item.level * 1.5 + 0.5}rem` }}
                    onClick={() => toggleItem(item.menu_id)}
                >
                    {hasChildren && (
                        <span className="mr-2">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    )}
                    <span className="text-gray-600">{item.menu_name}</span>
                </div>
                
                {isExpanded && hasChildren && (
                    <div className="ml-4">
                        {children.map(child => renderMenuItem(child))}
                    </div>
                )}
            </div>
        );
    };

    const rootItems = buildMenuTree(null);

    return (
        <div className="menu-preview border rounded-lg p-4">
            {rootItems.map(item => renderMenuItem(item))}
        </div>
    );
}


