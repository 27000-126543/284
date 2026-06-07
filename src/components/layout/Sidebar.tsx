import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Thermometer,
  Cpu,
  Route,
  Bell,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '首页大屏', icon: LayoutDashboard },
  { path: '/zone/list', label: '分区管理', icon: MapPin, roles: ['leader', 'control', 'admin'] },
  { path: '/environment/realtime', label: '环境监测', icon: Thermometer },
  { path: '/device/list', label: '设备管理', icon: Cpu, roles: ['leader', 'control', 'admin'] },
  { path: '/inspection/tasks', label: '巡检管理', icon: Route },
  { path: '/alarm/realtime', label: '报警管理', icon: Bell },
  { path: '/workorder/list', label: '工单管理', icon: ClipboardList },
  { path: '/report/operation', label: '报表中心', icon: BarChart3, roles: ['control', 'admin'] },
  { path: '/system/user', label: '系统管理', icon: Settings, roles: ['admin'] },
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { currentUser } = usePermission();

  const hasAccess = (roles?: string[]): boolean => {
    if (!roles || roles.length === 0) return true;
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  const filteredMenuItems = menuItems.filter((item) => hasAccess(item.roles));

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-dark-bg2 border-r border-dark-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gradient text-lg">管廊智慧平台</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center mx-auto">
            <MapPin className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-dark-bg3 text-dark-text3 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-accent-400/20 to-primary-500/10 text-accent-400 border-l-2 border-accent-400'
                  : 'text-dark-text2 hover:text-dark-text hover:bg-dark-bg3',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-accent-400')} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-dark-border">
        {!collapsed && currentUser && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center text-white text-sm font-medium">
              {currentUser.realName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-dark-text truncate">
                {currentUser.realName}
              </div>
              <div className="text-xs text-dark-text3">{currentUser.roleLabel}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
