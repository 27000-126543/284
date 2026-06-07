import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  LogOut,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useAlarmStore } from '@/store/useAlarmStore';
import { formatDateTime } from '@/utils/format';
import dayjs from 'dayjs';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useUserStore();
  const { getUnconfirmedCount, alarms } = useAlarmStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlarmPanel, setShowAlarmPanel] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unconfirmedCount = getUnconfirmedCount();
  const recentAlarms = alarms.filter((a) => a.status !== 'resolved').slice(0, 5);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-dark-bg2 border-b border-dark-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-dark-text3">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{currentTime}</span>
        </div>
        <div className="flex items-center gap-2 text-success">
          <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs">实时同步中</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowAlarmPanel(!showAlarmPanel);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-lg hover:bg-dark-bg3 text-dark-text2 hover:text-dark-text transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unconfirmedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center alarm-pulse">
                {unconfirmedCount > 9 ? '9+' : unconfirmedCount}
              </span>
            )}
          </button>

          {showAlarmPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-dark-bg2 border border-dark-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-in-right">
              <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
                <span className="font-medium">实时告警</span>
                <button
                  onClick={() => navigate('/alarm/realtime')}
                  className="text-xs text-accent-400 hover:text-accent-300"
                >
                  查看全部
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentAlarms.length === 0 ? (
                  <div className="p-8 text-center text-dark-text3">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">暂无告警信息</p>
                  </div>
                ) : (
                  recentAlarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className="px-4 py-3 border-b border-dark-border hover:bg-dark-bg3 cursor-pointer transition-colors"
                      onClick={() => navigate('/alarm/realtime')}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            alarm.level === 'urgent'
                              ? 'bg-danger animate-pulse'
                              : alarm.level === 'serious'
                              ? 'bg-warning'
                              : 'bg-info'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-dark-text truncate">{alarm.content}</p>
                          <p className="text-xs text-dark-text3 mt-1">
                            {formatDateTime(alarm.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowAlarmPanel(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-bg3 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center text-white text-sm font-medium">
              {currentUser?.realName.charAt(0)}
            </div>
            <span className="text-sm text-dark-text2">{currentUser?.realName}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-bg2 border border-dark-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-in-right">
              <div className="px-4 py-3 border-b border-dark-border">
                <p className="text-sm font-medium">{currentUser?.realName}</p>
                <p className="text-xs text-dark-text3">{currentUser?.roleLabel}</p>
              </div>
              <div className="py-1">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-dark-text2 hover:bg-dark-bg3 hover:text-dark-text flex items-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4" />
                  个人信息
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-dark-bg3 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
