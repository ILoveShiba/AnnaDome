import { ProjectMeta, TravelGuideData } from '../types/guide';

export interface CloudWorkspacePayload {
  userId: string;
  username: string;
  updatedAt: string;
  projects: ProjectMeta[];
  guidesMap: Record<string, TravelGuideData>;
}

function buildUserWorkspaceEndpoint(firebaseDbUrl: string, username: string): string | null {
  const trimmed = (firebaseDbUrl || '').trim();
  if (!trimmed) return null;
  let base = trimmed;
  if (!base.endsWith('/')) base += '/';
  const safeUserKey = encodeURIComponent(username.trim().toLowerCase());
  return `${base}user_workspaces/${safeUserKey}.json`;
}

/**
 * 將該會員的「專案大廳卡片清單」與「所有子專案完整明細」一鍵推播備份至 Firebase 雲端
 */
export async function pushEntireHubToFirebase(
  firebaseDbUrl: string,
  userId: string,
  username: string,
  projects: ProjectMeta[],
  getProjectDataById: (id: string) => TravelGuideData | null
): Promise<{ ok: boolean; message: string }> {
  const endpoint = buildUserWorkspaceEndpoint(firebaseDbUrl, username);
  if (!endpoint) {
    return { ok: false, message: '請先在設定中填寫有效的 Firebase Realtime Database 網址！' };
  }

  try {
    const guidesMap: Record<string, TravelGuideData> = {};
    for (const p of projects) {
      const data = getProjectDataById(p.id);
      if (data) {
        guidesMap[p.id] = data;
      }
    }

    const payload: CloudWorkspacePayload = {
      userId,
      username,
      updatedAt: new Date().toISOString(),
      projects,
      guidesMap,
    };

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return {
      ok: true,
      message: `已成功將帳號「${username}」的大廳與全部 ${projects.length} 筆旅遊專案同步至 Firebase 雲端！`,
    };
  } catch (err) {
    console.warn('Firebase Hub Push Error:', err);
    return {
      ok: false,
      message: '無法連線至 Firebase 雲端資料庫，請確認網址與資料庫讀寫權限 (Rules)。',
    };
  }
}

/**
 * 從 Firebase 雲端拉取該會員帳號下的所有專案大廳卡片與行程明細
 */
export async function pullEntireHubFromFirebase(
  firebaseDbUrl: string,
  username: string
): Promise<{
  ok: boolean;
  payload?: CloudWorkspacePayload;
  message: string;
}> {
  const endpoint = buildUserWorkspaceEndpoint(firebaseDbUrl, username);
  if (!endpoint) {
    return { ok: false, message: '請先在設定中填寫有效的 Firebase Realtime Database 網址！' };
  }

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data: CloudWorkspacePayload | null = await res.json();
    if (!data || !Array.isArray(data.projects)) {
      return {
        ok: false,
        message: `雲端尚無帳號「${username}」的大廳備份紀錄，請先執行推播備份。`,
      };
    }

    return {
      ok: true,
      payload: data,
      message: `已從 Firebase 雲端成功同步 ${data.projects.length} 筆旅遊專案至本機！`,
    };
  } catch (err) {
    console.warn('Firebase Hub Pull Error:', err);
    return {
      ok: false,
      message: '從 Firebase 拉取資料失敗，請確認網路連線與資料庫網址。',
    };
  }
}
