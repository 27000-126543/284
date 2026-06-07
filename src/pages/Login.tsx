import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, MapPin } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { message } from 'antd';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      message.warning('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error('用户名或密码错误');
      }
    } catch {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg bg-grid">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="card-gradient-border p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center glow-blue">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient mb-2">管廊智慧管理平台</h1>
            <p className="text-dark-text3 text-sm">城市地下综合管廊智能运维系统</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-dark-text2 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 bg-dark-bg3 border border-dark-border rounded-lg text-dark-text placeholder-dark-text3 focus:outline-none focus:border-accent-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-dark-text2 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-10 py-3 bg-dark-bg3 border border-dark-border rounded-lg text-dark-text placeholder-dark-text3 focus:outline-none focus:border-accent-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text3 hover:text-dark-text transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-dark-text3">
                <input type="checkbox" className="rounded border-dark-border bg-dark-bg3 text-accent-400 focus:ring-accent-400" />
                记住我
              </label>
              <button type="button" className="text-accent-400 hover:text-accent-300 transition-colors">
                忘记密码？
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-accent-400 to-primary-500 text-white rounded-lg font-medium hover:from-accent-300 hover:to-primary-400 transition-all glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-border">
            <p className="text-xs text-dark-text3 text-center">
              测试账号：admin / 123456（管理员）
            </p>
            <p className="text-xs text-dark-text3 text-center mt-1">
              inspector1 / 123456（巡线员）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
