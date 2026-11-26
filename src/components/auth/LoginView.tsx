import React, { useState, useEffect } from 'react';
import { Compass, Lock, User, LogIn, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export interface LoginViewProps {
  invitedRoomId?: string | null;
  onAuthSuccess: (userId: string, isGuest?: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  invitedRoomId,
  onAuthSuccess,
}) => {
  const hasInvite = Boolean(invitedRoomId && invitedRoomId.trim());
  const [tab, setTab] = useState<'guest' | 'login' | 'register'>(
    hasInvite ? 'guest' : 'login'
  );
  const [guestName, setGuestName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);

  useEffect(() => {
    if (hasInvite) {
      setTab('guest');
    }
  }, [hasInvite]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'guest' && hasInvite && invitedRoomId) {
      const res = loginAsGuest(guestName, invitedRoomId);
      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }
      const user = useAuthStore.getState().currentUser;
      if (user) {
        onAuthSuccess(user.userId, true);
      }
      return;
    }

    const res = tab === 'login' ? login(username, password) : register(username, password);
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    const user = useAuthStore.getState().currentUser;
    if (user) {
      onAuthSuccess(user.userId, false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0d1b2a] to-[#1b263b] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Compass className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {hasInvite ? '✈️ 旅伴行程共編室' : '✈️ 旅遊手冊管理中心'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {hasInvite
              ? '您已受邀共同編輯此旅遊專案，請選擇加入方式'
              : '登入專屬帳號，管理你個人的旅遊專案與全域儲存設定'}
          </p>
        </div>

        {/* 若是透過單一專案「🔗 複製此專案共編連結 (?room=xxx)」進入，顯示醒目共編邀請提示 */}
        {hasInvite && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed">
            <div className="font-bold text-amber-950 mb-0.5">
              🤝 單一專案共編邀請（房間代碼：{invitedRoomId}）
            </div>
            <div>
              可選擇以 <b>「訪客方式（僅需設定名稱）」</b> 直接進入編輯此專案，或以 <b>「帳號登入／註冊帳號」</b> 將此專案加入您的個人大廳！
            </div>
          </div>
        )}

        {/* Mode Switch Tabs */}
        <div
          className={`grid ${
            hasInvite ? 'grid-cols-3' : 'grid-cols-2'
          } gap-1.5 bg-slate-100 p-1 rounded-xl mb-5`}
        >
          {hasInvite && (
            <button
              type="button"
              onClick={() => {
                setTab('guest');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                tab === 'guest'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>訪客共編</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              tab === 'login'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>帳號登入</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              tab === 'register'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>註冊帳號</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'guest' && hasInvite ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                您的訪客名稱（必填，供共編顯示識別）
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="請輸入您的名稱或暱稱（例：阿明）"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                🔒 訪客模式僅會開啟此受邀的單一旅遊專案，不會進入大廳亦無法檢視其他專案。
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2.5 rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm transition-colors cursor-pointer shadow-sm ${
              tab === 'guest' && hasInvite
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {tab === 'guest' && hasInvite
              ? '👋 以訪客身分進入共編此專案'
              : tab === 'login'
                ? hasInvite
                  ? '🚀 登入帳號並加入此共編專案'
                  : '🚀 登入進入我的專案大廳'
                : hasInvite
                  ? '✨ 註冊帳號並加入此共編專案'
                  : '✨ 註冊並建立個人專屬大廳'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <div>
            💡 <b>提示</b>：首次使用的一般旅伴可點選「註冊帳號」建立帳號密碼；若為受邀共編旅伴，亦可直接以「訪客共編」設定名稱後直接編輯該單一專案。
          </div>
          <div>
            🔒 <b>專案權限獨立隔離</b>：每個帳號登入後皆擁有各自獨立的專案大廳；共編連結僅針對該單一特定專案開放共同編輯。
          </div>
        </div>
      </div>
    </div>
  );
};
