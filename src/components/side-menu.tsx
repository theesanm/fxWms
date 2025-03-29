import { useState, useEffect } from 'react';
import { Icons } from './icons';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/postgrest';  // Changed from @/lib/api to @/lib/postgrest
import { toast } from 'sonner';

interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_url: string;
  parent_menu_id: number | null;
  order_index: number;
  icon?: string;
}

interface HoveredItem {
  item: MenuItem;
  children: MenuItem[];
  level: number;
  rect?: DOMRect;
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
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);

  const getIcon = (iconName: string | undefined) => {
    switch (iconName) {
      case 'home':
        return <Icons.home className="h-5 w-5" />;
      case 'admin':
        return <Icons.admin className="h-5 w-5" />;
      case 'product':
        return <Icons.product className="h-5 w-5" />;
      case 'warehouse':
        return <Icons.warehouse className="h-5 w-5" />;
      case 'zone':
        return <Icons.zone className="h-5 w-5" />;
      case 'users':
        return <Icons.users className="h-5 w-5" />;
      case 'roles':
        return <Icons.roles className="h-5 w-5" />;
      case 'permissions':
        return <Icons.permissions className="h-5 w-5" />;
      case 'location':
        return <Icons.mapPin className="h-5 w-5" />; // Add location icon
      default:
        return null;
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/rpc/menu_tree');
      const homeMenuItem: MenuItem = {
        menu_id: 0,
        menu_name: 'Home',
        menu_url: '/',
        parent_menu_id: null,
        order_index: 0,
        icon: 'home'
      };

      // Add icons to top-level menu items
      const menuItemsWithIcons = response.data.map((item: MenuItem) => {
        if (!item.parent_menu_id) {  // Only for top-level items
          switch (item.menu_name.toLowerCase()) {
            case 'admin':
              return { ...item, icon: 'admin' };
            case 'product':
              return { ...item, icon: 'product' };
            case 'warehouse':
              return { ...item, icon: 'warehouse' };
            case 'zone':
              return { ...item, icon: 'zone' };
            case 'location':
              return { ...item, icon: 'location' };
            default:
              return item;
          }
        }
        return item;
      });

      setMenuItems([homeMenuItem, ...menuItemsWithIcons]);
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
      const childItems = menuItems.filter(child => child.parent_menu_id === item.menu_id);
      const icon = getIcon(item.icon);

      return (
        <div key={item.menu_id} className="relative">
          <Link
            href={item.menu_url}
            className={cn(
              "flex items-center px-3 py-2 rounded-md transition-colors",
              isActive 
                ? 'bg-primary text-white' 
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
              isCollapsed ? "justify-center" : "",
              level > 0 && !isCollapsed && "ml-4"
            )}
            onClick={(e) => {
              if (hasChildren && !isCollapsed) {
                e.preventDefault();
                toggleExpand(item.menu_id);
              }
            }}
            onMouseEnter={(e) => {
              if (isCollapsed) {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredItem({ item, children: childItems, level, rect });
              }
            }}
            onMouseLeave={(e) => {
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (!relatedTarget?.closest('[data-hover-menu]')) {
                setHoveredItem(null);
              }
            }}
          >
            <span className={cn(
              "flex items-center w-full",
              isCollapsed ? "justify-center" : ""
            )}>
              {icon && (
                <span className={cn(
                  "inline-flex",
                  !isCollapsed && "mr-2"
                )}>
                  {icon}
                </span>
              )}
              {hasChildren && !isCollapsed && (
                <Icons.chevronRight
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

  const renderHoverMenuItem = (item: MenuItem, level: number = 0) => {
    const children = menuItems.filter(child => child.parent_menu_id === item.menu_id);
    const hasChildren = children.length > 0;
    const icon = getIcon(item.icon);

    return (
      <div
        key={item.menu_id}
        className="relative group"
        onMouseEnter={(e) => {
          if (hasChildren) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredItem({ item, children, level, rect });
          }
        }}
      >
        <Link
          href={item.menu_url}
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
        >
          {icon && <span className="mr-2">{icon}</span>}
          <span className="flex-1">{item.menu_name}</span>
          {hasChildren && (
            <Icons.chevronRight className="h-4 w-4 ml-2" />
          )}
        </Link>

        {hasChildren && hoveredItem?.item.menu_id === item.menu_id && (
          <div
            className="absolute left-full top-0 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg py-2 min-w-[200px]"
            style={{ zIndex: 9999 }}
          >
            {children.map(child => renderHoverMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav className={cn(
        "h-screen transition-all duration-300",
        "bg-white border-r border-secondary-medium",
        "dark:bg-gray-800 dark:border-gray-700",
        isCollapsed ? "w-16" : "w-64",
        "relative"
      )}>
        <button
          onClick={() => onCollapse(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-secondary-medium dark:border-gray-700 rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isCollapsed ? (
            <Icons.chevronRight className="h-4 w-4" />
          ) : (
            <Icons.chevronLeft className="h-4 w-4" />
          )}
        </button>

        <div className={cn(
          "space-y-1 overflow-y-auto",
          "h-[calc(100vh-3rem)]",
          "pt-8"
        )}>
          {renderMenuItems(null)}
        </div>
      </nav>

      {hoveredItem && isCollapsed && typeof window !== 'undefined' && createPortal(
        <div
          data-hover-menu
          className={cn(
            "fixed bg-white dark:bg-gray-800",
            "border dark:border-gray-700 rounded-md shadow-lg",
            "py-2"
          )}
          style={{
            left: (hoveredItem.rect?.right || 0) + 8,
            top: Math.max(hoveredItem.rect?.top || 0, 40),
            minWidth: '200px',
            zIndex: 9999
          }}
          onMouseEnter={() => {/* Keep menu visible */}}
          onMouseLeave={() => {
            setHoveredItem(null);
          }}
        >
          <div className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
            {hoveredItem.item.menu_name}
          </div>
          <div className="mt-1">
            {hoveredItem.children.map(child => renderHoverMenuItem(child))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}



























