import React, { useState } from 'react';
import { Compass, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export interface LoginViewProps {
  onAuthSuccess: (userId: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = tab === 'login' ? login(username, password) : register(username, password);
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    const user = useAuthStore.getState().currentUser;
    if (user) {
      onAuthSuccess(user.userId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0d1b2a] to-[#1b263b] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Compass className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            ✈️ 旅遊手冊管理中心
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            登入專屬帳號，管理你個人的旅遊專案與全域儲存設定
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>會員／管理者登入</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>註冊新帳號</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              帳號 (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入您的帳號名稱"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              登入密碼 (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2.5 rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
          >
            {tab === 'login' ? '🚀 登入進入我的專案大廳' : '✨ 註冊並建立個人專屬大廳'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <div>💡 <b>提示</b>：首次使用的一般旅伴請點選「註冊新帳號」建立您的帳號密碼；管理者請直接於登入分頁輸入管理者帳號與密碼。</div>
          <div>🔒 <b>專案權限獨立隔離</b>：每個帳號（包含管理者與各別使用者）登入後皆擁有各自獨立的專案大廳，僅會顯示並存取該帳號專屬的旅遊專案。</div>
        </div>
      </div>
    </div>
  );
};
