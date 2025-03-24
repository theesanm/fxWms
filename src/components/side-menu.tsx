'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';

interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_url: string;
  parent_menu_id: number | null;
  order_index: number;
}

interface SideMenuProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function SideMenu({ isCollapsed, onCollapse }: SideMenuProps) {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { user } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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
    }
  };

  useEffect(() => {
    if (user) {
      fetchMenuItems();
    }
  }, [user]);

  const toggleExpand = (menuId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const renderMenuItems = (parentId: number | null = null, level: number = 0) => {
    const items = menuItems
      .filter(item => item.parent_menu_id === parentId)
      .sort((a, b) => a.order_index - b.order_index);

    return items.map((item) => {
      const hasChildren = menuItems.some(child => child.parent_menu_id === item.menu_id);
      const isExpanded = expandedItems.has(item.menu_id);
      const isActive = pathname === item.menu_url;

      return (
        <div key={item.menu_id} className="relative">
          <Link
            href={item.menu_url}
            className={cn(
              "flex items-center px-3 py-2 rounded-md transition-colors relative group",
              isActive ? 'bg-primary text-white' : 'text-secondary-dark hover:bg-secondary-light',
              isCollapsed ? "justify-center" : "",
              level > 0 && !isCollapsed && "ml-4"
            )}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault();
                toggleExpand(item.menu_id);
              }
            }}
          >
            <span className={cn(
              "flex items-center w-full",
              isCollapsed ? "justify-center" : ""
            )}>
              {hasChildren && !isCollapsed && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform mr-2",
                    isExpanded && "transform rotate-90"
                  )}
                />
              )}
              <span className={cn(
                isCollapsed ? "sr-only" : "flex-1",
                "whitespace-nowrap"
              )}>
                {item.menu_name}
              </span>
            </span>

            {isCollapsed && (
              <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-white border rounded-md shadow-lg z-50 min-w-[200px] py-2">
                <span className="block px-4 py-2 font-medium text-sm text-gray-500">
                  {item.menu_name}
                </span>
                {hasChildren && renderMenuItems(item.menu_id, 0)}
              </div>
            )}
          </Link>

          {!isCollapsed && hasChildren && isExpanded && (
            <div className="ml-4 mt-1">
              {renderMenuItems(item.menu_id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <nav className={cn(
      "relative h-full bg-white border-r border-secondary-medium transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <button
        onClick={() => onCollapse(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-secondary-medium rounded-full p-1.5 hover:bg-secondary-light"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="p-4 space-y-1">
        {renderMenuItems(null)}
      </div>
    </nav>
  );
}





