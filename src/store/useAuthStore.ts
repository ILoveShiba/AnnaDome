import { create } from 'zustand';

export interface UserAccount {
  userId: string;
  username: string;
  passwordHash: string;
  role?: 'admin' | 'member' | 'guest';
  guestRoomId?: string;
  createdAt: string;
}

export interface UserStorageSettings {
  storageMode: 'local' | 'firebase';
  firebaseDbUrl: string;
  localFolderName: string;
}

const USERS_LIST_KEY = 'travel_auth_users';
const CURRENT_USER_KEY = 'travel_auth_current_user';
const SETTINGS_PREFIX = 'user_settings_';

export const ADMIN_USER_ID = 'u_admin';
export const ADMIN_USERNAME = 'admin';
export const ADMIN_DEFAULT_FIREBASE_DB_URL =
  'https://travel-handbook-241bb-default-rtdb.firebaseio.com/';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch {}
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function simpleHash(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'h_' + (h >>> 0).toString(16);
}

const ADMIN_ACCOUNT: UserAccount = {
  userId: ADMIN_USER_ID,
  username: ADMIN_USERNAME,
  passwordHash: simpleHash('wanghome0830'),
  role: 'admin',
  createdAt: '2026-11-21T00:00:00.000Z',
};

/**
 * 載入所有使用者帳號清單，並確保內建管理者帳號 (admin / wanghome0830) 永遠存在，
 * 同時完整保留所有其他已註冊的一般使用者帳號。
 */
function loadUsers(): UserAccount[] {
  const raw = safeGet(USERS_LIST_KEY);
  let users: UserAccount[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        users = parsed;
      }
    } catch {}
  }

  // 若 localStorage 中有先前已建立過專案的舊帳號（如 u_charles_...），但因先前覆寫不在清單中，自動幫其補回帳號紀錄避免遺失
  const adminIdx = users.findIndex(
    (u) => u.username.toLowerCase() === ADMIN_USERNAME
  );
  if (adminIdx !== -1) {
    users[adminIdx] = {
      ...users[adminIdx],
      userId: ADMIN_USER_ID,
      username: ADMIN_USERNAME,
      passwordHash: ADMIN_ACCOUNT.passwordHash,
      role: 'admin',
    };
  } else {
    users.unshift(ADMIN_ACCOUNT);
  }

  safeSet(USERS_LIST_KEY, JSON.stringify(users));
  return users;
}

export function loadUserSettings(userId: string): UserStorageSettings {
  const isAdmin = userId === ADMIN_USER_ID;
  const raw = safeGet(SETTINGS_PREFIX + userId);
  const defaults: UserStorageSettings = {
    storageMode: isAdmin ? 'firebase' : 'local',
    firebaseDbUrl: isAdmin ? ADMIN_DEFAULT_FIREBASE_DB_URL : '',
    localFolderName: '',
  };
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      // 僅管理者 admin 帳號在未填寫時自動帶入專屬 Firebase 網址；其他一般使用者維持空白不共用
      firebaseDbUrl:
        (parsed.firebaseDbUrl && String(parsed.firebaseDbUrl).trim()) ||
        (isAdmin ? ADMIN_DEFAULT_FIREBASE_DB_URL : ''),
    };
  } catch {
    return defaults;
  }
}

export interface AuthState {
  currentUser: UserAccount | null;
  settings: UserStorageSettings;
  isSettingsModalOpen: boolean;

  login: (username: string, password: string) => { ok: boolean; message: string };
  register: (username: string, password: string) => { ok: boolean; message: string };
  loginAsGuest: (guestName: string, roomId: string) => { ok: boolean; message: string };
  logout: () => void;
  updateSettings: (partial: Partial<UserStorageSettings>) => void;
  setSettingsModalOpen: (open: boolean) => void;
}

function getInitialUser(): UserAccount | null {
  const users = loadUsers();
  const savedUserId = safeGet(CURRENT_USER_KEY);
  if (!savedUserId) return null;
  return users.find((u) => u.userId === savedUserId) || null;
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const initUser = getInitialUser();
  const initSettings = initUser
    ? loadUserSettings(initUser.userId)
    : {
        storageMode: 'local' as const,
        firebaseDbUrl: '',
        localFolderName: '',
      };

  return {
    currentUser: initUser,
    settings: initSettings,
    isSettingsModalOpen: false,

    login: (username, password) => {
      const cleanName = username.trim();
      if (!cleanName || !password) {
        return { ok: false, message: '請輸入帳號與密碼！' };
      }

      const users = loadUsers();
      const target = users.find(
        (u) => u.username.toLowerCase() === cleanName.toLowerCase()
      );
      if (!target) {
        return { ok: false, message: '找不到此帳號，請先切換至「註冊新帳號」！' };
      }
      if (target.passwordHash !== simpleHash(password)) {
        return { ok: false, message: '密碼不正確，請重新輸入！' };
      }

      safeSet(CURRENT_USER_KEY, target.userId);
      const userSettings = loadUserSettings(target.userId);
      set({ currentUser: target, settings: userSettings });
      return { ok: true, message: '登入成功！' };
    },

    register: (username, password) => {
      const cleanName = username.trim();
      if (!cleanName || !password) {
        return { ok: false, message: '請輸入要註冊的帳號與密碼！' };
      }
      if (cleanName.length < 2) {
        return { ok: false, message: '帳號長度至少需 2 個字元！' };
      }
      if (cleanName.toLowerCase() === ADMIN_USERNAME) {
        return {
          ok: false,
          message: '「admin」為系統內建管理者帳號，請直接切換至「會員登入」輸入密碼登入！',
        };
      }

      const users = loadUsers();
      const exists = users.some(
        (u) => u.username.toLowerCase() === cleanName.toLowerCase()
      );
      if (exists) {
        return { ok: false, message: '此帳號名稱已被註冊，請直接登入或更換名稱！' };
      }

      // 若先前該帳號曾在本機建立過專案清單 (例如 travel_projects_list_u_charles_...)，自動找回原 userId 以便無縫接回原本的專案
      let recoveredUserId = '';
      try {
        const prefix = `travel_projects_list_u_${cleanName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')}_`;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            recoveredUserId = k.slice('travel_projects_list_'.length);
            break;
          }
        }
      } catch {}

      const userId =
        recoveredUserId ||
        'u_' +
          cleanName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_') +
          '_' +
          Date.now().toString(36);

      const newUser: UserAccount = {
        userId,
        username: cleanName,
        passwordHash: simpleHash(password),
        role: 'member',
        createdAt: new Date().toISOString(),
      };

      const nextUsers = [...users, newUser];
      safeSet(USERS_LIST_KEY, JSON.stringify(nextUsers));
      safeSet(CURRENT_USER_KEY, newUser.userId);

      const defaultSettings = loadUserSettings(newUser.userId);
      safeSet(SETTINGS_PREFIX + newUser.userId, JSON.stringify(defaultSettings));

      set({ currentUser: newUser, settings: defaultSettings });
      return { ok: true, message: '註冊並登入成功！' };
    },

    loginAsGuest: (guestName, roomId) => {
      const cleanName = guestName.trim();
      const cleanRoom = roomId.trim();
      if (!cleanName) {
        return { ok: false, message: '請輸入您的訪客名稱（例如：阿明）！' };
      }
      if (!cleanRoom) {
        return { ok: false, message: '無效的共編房間連結！' };
      }

      const guestUser: UserAccount = {
        userId: 'guest_' + cleanName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_'),
        username: cleanName,
        passwordHash: '',
        role: 'guest',
        guestRoomId: cleanRoom,
        createdAt: new Date().toISOString(),
      };

      const guestSettings: UserStorageSettings = {
        storageMode: 'local',
        firebaseDbUrl: '',
        localFolderName: '',
      };

      set({
        currentUser: guestUser,
        settings: guestSettings,
        isSettingsModalOpen: false,
      });
      return { ok: true, message: `歡迎訪客「${cleanName}」進入共編！` };
    },

    logout: () => {
      safeRemove(CURRENT_USER_KEY);
      // 若網址上帶有 ?room=xxx，登出時一併清除網址上的 room 參數以免卡在單一房間
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('room')) {
          url.searchParams.delete('room');
          window.history.replaceState({}, '', url.toString());
        }
      } catch {}
      set({
        currentUser: null,
        isSettingsModalOpen: false,
      });
    },

    updateSettings: (partial) => {
      const user = get().currentUser;
      const nextSettings: UserStorageSettings = {
        ...get().settings,
        ...partial,
      };
      if (user) {
        safeSet(SETTINGS_PREFIX + user.userId, JSON.stringify(nextSettings));
      }
      set({ settings: nextSettings });
    },

    setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
  };
});
