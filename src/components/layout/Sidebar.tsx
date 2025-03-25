import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Link, Users, Settings, LogOut, ChevronLeft, ChevronRight, BarChart, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  {
    icon: LayoutGrid,
    label: 'Dashboard',
    path: '/'
  },
  {
    icon: Link,
    label: 'URL Tracking',
    path: '/urls'
  },
  {
    icon: BarChart,
    label: 'Analytics',
    path: '/analytics',
    subItems: [
      {
        label: 'Overview',
        path: '/analytics/overview'
      },
      {
        label: 'Channels',
        path: '/analytics/channels'
      },
      {
        label: 'Videos',
        path: '/analytics/videos'
      }
    ]
  },
  {
    icon: Users,
    label: 'System Options',
    path: '/channels'
  },
  {
    icon: Settings,
    label: 'Account',
    path: '/account'
  }
];

// Create a sidebar context to manage the collapsed state
export const SidebarContext = React.createContext({
  collapsed: false,
  toggleSidebar: () => {},
});

export const useSidebar = () => React.useContext(SidebarContext);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const { signOut } = useAuth();
  
  // Initialize collapsed state based on localStorage or default to collapsed for dashboard
  const [collapsed, setCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      return savedState === 'true';
    }
    return isDashboard; // Default to collapsed on dashboard
  });

  // Track expanded submenu items
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Toggle submenu expansion
  const toggleSubmenu = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path) 
        : [...prev, path]
    );
  };

  // Check if a path or any of its subpaths is active
  const isPathActive = (path: string) => {
    if (location.pathname === path) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsed(prev => !prev);
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      <aside 
        className={cn(
          "h-screen border-r border-border bg-sidebar flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn(
          "p-4 flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && <h1 className="text-xl font-semibold text-foreground">Boring Business</h1>}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-secondary flex items-center justify-center"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.path} className={item.subItems ? "mb-2" : ""}>
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.path)}
                      className={cn(
                        collapsed ? "sidebar-item-collapsed justify-center" : "sidebar-item justify-between",
                        isPathActive(item.path) && "active"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span className="ml-3">{item.label}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItems.includes(item.path) && "transform rotate-180"
                          )}
                        />
                      )}
                    </button>
                    
                    {/* Submenu items */}
                    {(expandedItems.includes(item.path) || isPathActive(item.path)) && !collapsed && (
                      <ul className="pl-10 mt-1 space-y-1">
                        {item.subItems.map(subItem => (
                          <li key={subItem.path}>
                            <NavLink
                              to={subItem.path}
                              className={({isActive}) => cn(
                                "sidebar-subitem",
                                isActive && "active"
                              )}
                            >
                              {subItem.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <NavLink 
                    to={item.path} 
                    className={({isActive}) => cn(
                      collapsed ? "sidebar-item-collapsed" : "sidebar-item", 
                      isActive && "active"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        <div className={cn(
          "border-t border-border mt-auto p-4",
          collapsed && "flex justify-center"
        )}>
          <button 
            onClick={handleLogout}
            className={cn(
              collapsed ? "sidebar-item-collapsed" : "sidebar-item",
              "text-red-500 hover:bg-red-50 hover:text-red-600"
            )}
            title={collapsed ? "Log Out" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
