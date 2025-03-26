import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Link, Users, Settings, LogOut, ChevronLeft, ChevronRight, BarChart, ChevronDown, LineChart, PieChart, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Add icons for submenu items
const analyticsSubItems = [
  {
    label: 'Overview',
    path: '/analytics/overview',
    icon: LineChart
  },
  {
    label: 'Channels',
    path: '/analytics/channels',
    icon: PieChart
  },
  {
    label: 'Videos',
    path: '/analytics/videos',
    icon: BarChart2
  }
];

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
    subItems: analyticsSubItems
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
  collapsed: true, // Default to collapsed
  toggleSidebar: () => {},
});

export const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  
  // Initialize collapsed state to true by default
  const [collapsed, setCollapsed] = useState(true);
  
  // State to track hover
  const [isHovered, setIsHovered] = useState(false);
  
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

  const toggleSidebar = () => {
    setCollapsed(prev => !prev);
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SidebarContext.Provider value={{ collapsed: collapsed && !isHovered, toggleSidebar }}>
      <aside 
        className={cn(
          "h-screen border-r border-border bg-sidebar flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          (collapsed && !isHovered) ? "w-16" : "w-64"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          "p-4 flex items-center",
          (collapsed && !isHovered) ? "justify-center" : "justify-between"
        )}>
          {(!collapsed || isHovered) && <h1 className="text-xl font-semibold text-foreground">Boring Business</h1>}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-secondary flex items-center justify-center"
            aria-label={(collapsed && !isHovered) ? "Expand sidebar" : "Collapse sidebar"}
          >
            {(collapsed && !isHovered) ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 sidebar-nav">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.path} className={item.subItems ? "mb-2" : ""}>
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.path)}
                      className={cn(
                        (collapsed && !isHovered) ? "sidebar-item-collapsed justify-center" : "sidebar-item justify-between",
                        isPathActive(item.path) && "active"
                      )}
                      title={(collapsed && !isHovered) ? item.label : undefined}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5" />
                        {(!collapsed || isHovered) && <span className="ml-3">{item.label}</span>}
                      </div>
                      {(!collapsed || isHovered) && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItems.includes(item.path) && "transform rotate-180"
                          )}
                        />
                      )}
                    </button>
                    
                    {/* Submenu items */}
                    {(expandedItems.includes(item.path) || isPathActive(item.path)) && (
                      <ul className={cn(
                        "pl-2 mt-1 space-y-1",
                        (collapsed && !isHovered) ? "items-center" : ""
                      )}>
                        {item.subItems.map(subItem => (
                          <li key={subItem.path}>
                            <NavLink
                              to={subItem.path}
                              className={({isActive}) => cn(
                                (collapsed && !isHovered) 
                                  ? "flex items-center justify-center p-2 rounded-md hover:bg-secondary" 
                                  : "sidebar-subitem",
                                isActive && "active"
                              )}
                              title={(collapsed && !isHovered) ? subItem.label : undefined}
                            >
                              {(collapsed && !isHovered) ? (
                                <subItem.icon className="h-5 w-5" />
                              ) : (
                                <>
                                  <subItem.icon className="h-5 w-5 mr-2" />
                                  {subItem.label}
                                </>
                              )}
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
                      (collapsed && !isHovered) ? "sidebar-item-collapsed" : "sidebar-item", 
                      isActive && "active"
                    )}
                    title={(collapsed && !isHovered) ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5" />
                    {(!collapsed || isHovered) && <span className="ml-3">{item.label}</span>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        <div className={cn(
          "border-t border-border mt-auto p-4",
          (collapsed && !isHovered) && "flex justify-center"
        )}>
          <button 
            onClick={handleLogout}
            className={cn(
              (collapsed && !isHovered) ? "sidebar-item-collapsed" : "sidebar-item",
              "text-red-500 hover:bg-red-50 hover:text-red-600"
            )}
            title={(collapsed && !isHovered) ? "Log Out" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {(!collapsed || isHovered) && <span className="ml-3">Log Out</span>}
          </button>
        </div>
      </aside>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
