import { ProjectMeta, TravelGuideData } from '../types/guide';

/**
 * 瀏覽器原生 File System Access API 本機資料夾直連自動備份服務
 * - 即使部署在 GitHub Pages 公開靜態網站，也能經使用者授權後直接讀寫電腦指定資料夾內的實體 .json 檔
 * - 使用 IndexedDB 保存 FileSystemDirectoryHandle，重開瀏覽器可快速恢復連結
 */
const IDB_NAME = 'travel_local_folder_db';
const IDB_STORE = 'handles';
let activeDirHandle: any = null;

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToIdb(userId: string, handle: any): Promise<void> {
  try {
    const db = await openHandleDb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, 'dir_' + userId);
  } catch {}
}

export async function getSavedHandleFromIdb(userId: string): Promise<any | null> {
  try {
    const db = await openHandleDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get('dir_' + userId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function bindLocalBackupFolder(
  userId: string
): Promise<{ ok: boolean; folderName: string; message: string }> {
  if (!isFileSystemAccessSupported()) {
    return {
      ok: false,
      folderName: '',
      message: '此瀏覽器不支援直接綁定資料夾（建議使用 Chrome 或 Edge 桌面版）。',
    };
  }
  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
    });
    activeDirHandle = handle;
    await saveHandleToIdb(userId, handle);
    return {
      ok: true,
      folderName: handle.name || '已綁定資料夾',
      message: `已成功綁定本機資料夾「${handle.name}」！後續修改將自動同步寫入實體 JSON 檔。`,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, folderName: '', message: '已取消選擇資料夾。' };
    }
    return { ok: false, folderName: '', message: '綁定本機資料夾失敗。' };
  }
}

async function ensureActiveHandle(userId: string, requestPermission = false): Promise<any | null> {
  if (!activeDirHandle) {
    activeDirHandle = await getSavedHandleFromIdb(userId);
  }
  if (!activeDirHandle) return null;

  try {
    if (activeDirHandle.queryPermission) {
      const perm = await activeDirHandle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') return activeDirHandle;
      if (requestPermission && activeDirHandle.requestPermission) {
        const reqPerm = await activeDirHandle.requestPermission({ mode: 'readwrite' });
        if (reqPerm === 'granted') return activeDirHandle;
      }
      return null;
    }
    return activeDirHandle;
  } catch {
    return null;
  }
}

async function writeJsonFileToDir(dirHandle: any, fileName: string, data: unknown): Promise<boolean> {
  try {
    const safeName = fileName.replace(/[\\/:*?"<>|]/g, '_');
    const fileHandle = await dirHandle.getFileHandle(safeName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

const SAMPLE_FILE_IDS = ['_tokyo-2026.json', '_sapporo-2026.json', '_hcmc-2026.json'];
const SAMPLE_PROJECT_IDS = new Set(['tokyo-2026', 'sapporo-2026', 'hcmc-2026']);
const TRASH_RETENTION_MS = 10 * 24 * 60 * 60 * 1000; // 10 天自動清除期限

// 偵測標題是否帶有尚未選字完成的注音符號 (ㄅ~ㄦ 及聲調符號)
const BOPYMOFO_REGEX = /[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/;

export function hasUnfinishedBopomofo(text?: string): boolean {
  if (!text) return false;
  return BOPYMOFO_REGEX.test(text);
}

/**
 * 當寫入某個 projectId 的最新檔案時，自動掃描資料夾並刪除同一個 projectId 先前因為改名或打字產生的舊檔名，
 * 同時清理過往殘留含有注音符號的半成品檔案，確保每個專案在資料夾內永遠只有最後完整檔名的唯一 1 個檔案。
 */
async function removeStaleProjectFilesFromDir(
  dirHandle: any,
  cleanUser: string,
  projectId: string,
  latestFileName: string
): Promise<void> {
  if (typeof dirHandle.removeEntry !== 'function') return;
  const safeLatest = latestFileName.replace(/[\\/:*?"<>|]/g, '_');
  const idSuffix = `_${projectId}.json`;

  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind !== 'file' || !entry.name.endsWith('.json')) continue;
      // 1. 同一使用者、同一個 projectId，但檔名與最新完整檔名不同 -> 刪除舊名檔
      if (
        entry.name.startsWith(`guide_${cleanUser}_`) &&
        entry.name.endsWith(idSuffix) &&
        entry.name !== safeLatest
      ) {
        await dirHandle.removeEntry(entry.name).catch(() => {});
      } else if (
        // 2. 清理先前殘留檔名中含有注音符號 (ㄅ~ㄦ) 的半成品 JSON 檔
        entry.name.startsWith('guide_') &&
        hasUnfinishedBopomofo(entry.name)
      ) {
        await dirHandle.removeEntry(entry.name).catch(() => {});
      }
    }
  } catch {}
}

/**
 * 將刪除的專案實體檔案移入本機資料夾內的「_刪除暫存區_10天自動清理」子資料夾，
 * 並自動清理該子資料夾內超過 10 天的過期暫存檔。
 */
export async function moveProjectFileToLocalTrash(
  userId: string,
  username: string,
  projectId: string,
  guideData?: TravelGuideData | null,
  deletedAtIso?: string
): Promise<void> {
  const dirHandle = await ensureActiveHandle(userId, false);
  if (!dirHandle) return;

  const cleanUser = username.replace(/[\\/:*?"<>|]/g, '_');
  const idSuffix = `_${projectId}.json`;

  try {
    // 1. 建立或取得「_刪除暫存區_10天自動清理」子資料夾
    let trashDir: any = null;
    if (typeof dirHandle.getDirectoryHandle === 'function') {
      trashDir = await dirHandle.getDirectoryHandle('_刪除暫存區_10天自動清理', {
        create: true,
      });
    }

    // 2. 將專案寫入暫存區（附上 deletedAt 與 expiresAt）
    if (trashDir && guideData) {
      const delTime = deletedAtIso ? new Date(deletedAtIso).getTime() : Date.now();
      const cleanTitle = (guideData.guideTitle || '未命名').replace(/[\\/:*?"<>|]/g, '_');
      await writeJsonFileToDir(
        trashDir,
        `trash_${cleanUser}_${cleanTitle}_${projectId}.json`,
        {
          deletedAt: new Date(delTime).toISOString(),
          expiresAt: new Date(delTime + TRASH_RETENTION_MS).toISOString(),
          guideData,
        }
      );
    }

    // 3. 從主資料夾移除該專案的正式檔案
    if (typeof dirHandle.removeEntry === 'function') {
      for await (const entry of dirHandle.values()) {
        if (
          entry.kind === 'file' &&
          entry.name.startsWith(`guide_${cleanUser}_`) &&
          entry.name.endsWith(idSuffix)
        ) {
          await dirHandle.removeEntry(entry.name).catch(() => {});
        }
      }
    }

    // 4. 自動掃描暫存區，將超過 10 天的暫存檔永久刪除
    if (trashDir) {
      await purgeExpiredFilesInTrashDir(trashDir);
    }
  } catch {}
}

/**
 * 當使用者從「刪除暫存區」還原或永久刪除某專案時，同步清理本機暫存子資料夾內的對應檔案
 */
export async function removeProjectFileFromLocalTrash(
  userId: string,
  username: string,
  projectId: string
): Promise<void> {
  const dirHandle = await ensureActiveHandle(userId, false);
  if (!dirHandle || typeof dirHandle.getDirectoryHandle !== 'function') return;

  const cleanUser = username.replace(/[\\/:*?"<>|]/g, '_');
  const idSuffix = `_${projectId}.json`;

  try {
    const trashDir = await dirHandle.getDirectoryHandle('_刪除暫存區_10天自動清理', {
      create: false,
    });
    if (!trashDir || typeof trashDir.removeEntry !== 'function') return;
    for await (const entry of trashDir.values()) {
      if (
        entry.kind === 'file' &&
        (projectId === '*'
          ? entry.name.startsWith(`trash_${cleanUser}_`)
          : entry.name.startsWith(`trash_${cleanUser}_`) && entry.name.endsWith(idSuffix))
      ) {
        await trashDir.removeEntry(entry.name).catch(() => {});
      }
    }
  } catch {}
}

async function purgeExpiredFilesInTrashDir(trashDir: any): Promise<void> {
  if (!trashDir || typeof trashDir.removeEntry !== 'function') return;
  const now = Date.now();
  try {
    for await (const entry of trashDir.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        const file = await entry.getFile();
        const text = await file.text();
        let shouldDelete = false;
        try {
          const parsed = JSON.parse(text);
          const exp = parsed?.expiresAt ? new Date(parsed.expiresAt).getTime() : 0;
          const del = parsed?.deletedAt ? new Date(parsed.deletedAt).getTime() : 0;
          if ((exp && now >= exp) || (del && now - del >= TRASH_RETENTION_MS)) {
            shouldDelete = true;
          }
        } catch {
          if (now - file.lastModified >= TRASH_RETENTION_MS) {
            shouldDelete = true;
          }
        }
        if (shouldDelete) {
          await trashDir.removeEntry(entry.name).catch(() => {});
        }
      }
    }
  } catch {}
}

async function removeSampleFilesFromDirIfCustomExists(
  dirHandle: any,
  cleanUser: string,
  projects: ProjectMeta[]
): Promise<void> {
  const hasCustom = projects.some((p) => !SAMPLE_PROJECT_IDS.has(p.id));
  if (!hasCustom || typeof dirHandle.removeEntry !== 'function') return;

  try {
    for await (const entry of dirHandle.values()) {
      if (
        entry.kind === 'file' &&
        entry.name.startsWith(`guide_${cleanUser}_`) &&
        SAMPLE_FILE_IDS.some((suffix) => entry.name.endsWith(suffix))
      ) {
        await dirHandle.removeEntry(entry.name).catch(() => {});
      }
    }
  } catch {}
}

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 實際執行本機資料夾寫入（內部函式）
 */
async function executeSyncProjectToLocalFolder(
  userId: string,
  username: string,
  projects: ProjectMeta[],
  currentProjectId?: string | null,
  currentGuideData?: TravelGuideData | null
): Promise<boolean> {
  const dirHandle = await ensureActiveHandle(userId, false);
  if (!dirHandle) return false;

  const cleanUser = username.replace(/[\\/:*?"<>|]/g, '_');
  // 順便檢查並清理「_刪除暫存區_10天自動清理」中超過 10 天的過期檔案
  if (typeof dirHandle.getDirectoryHandle === 'function') {
    try {
      const trashDir = await dirHandle.getDirectoryHandle('_刪除暫存區_10天自動清理', {
        create: false,
      });
      await purgeExpiredFilesInTrashDir(trashDir);
    } catch {}
  }

  await writeJsonFileToDir(dirHandle, `travel_projects_list_${cleanUser}.json`, {
    userId,
    username,
    updatedAt: new Date().toISOString(),
    projects,
  });

  if (currentProjectId && currentGuideData) {
    const rawTitle = (currentGuideData.guideTitle || '').trim();
    // 若標題正在輸入注音符號尚未完成選字，暫不以半成品注音建立新檔名
    if (hasUnfinishedBopomofo(rawTitle)) {
      return false;
    }
    const cleanTitle = (rawTitle || '未命名').replace(/[\\/:*?"<>|]/g, '_');
    const targetFileName = `guide_${cleanUser}_${cleanTitle}_${currentProjectId}.json`;

    // 先刪除同一個 projectId 先前舊名稱的檔案（以及任何殘留的注音半成品檔案），再寫入最新完整檔名
    await removeStaleProjectFilesFromDir(
      dirHandle,
      cleanUser,
      currentProjectId,
      targetFileName
    );
    await writeJsonFileToDir(dirHandle, targetFileName, currentGuideData);
  }
  return true;
}

/**
 * 當使用者修改專案或返回大廳時，自動將該會員的專案總表與當前專案明細寫入本機綁定資料夾
 * - 預設啟用 900ms 防抖延遲 (Debounce) 與注音組字過濾，避免每打一個字或注音就產生新檔案
 * - 若傳入 immediate = true（例如點擊「儲存專案至大廳」或「返回專案大廳」），則立即寫入並清除舊檔名
 */
export async function syncProjectToLocalFolder(
  userId: string,
  username: string,
  projects: ProjectMeta[],
  currentProjectId?: string | null,
  currentGuideData?: TravelGuideData | null,
  immediate = false
): Promise<boolean> {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }

  if (immediate) {
    return executeSyncProjectToLocalFolder(
      userId,
      username,
      projects,
      currentProjectId,
      currentGuideData
    );
  }

  return new Promise((resolve) => {
    syncDebounceTimer = setTimeout(async () => {
      syncDebounceTimer = null;
      const ok = await executeSyncProjectToLocalFolder(
        userId,
        username,
        projects,
        currentProjectId,
        currentGuideData
      );
      resolve(ok);
    }, 900);
  });
}

/**
 * 手動立即將帳號下全部專案匯出寫入本機綁定資料夾
 */
export async function writeAllUserProjectsToLocalFolder(
  userId: string,
  username: string,
  projects: ProjectMeta[],
  getProjectDataById: (id: string) => TravelGuideData | null
): Promise<{ ok: boolean; count: number; message: string }> {
  let dirHandle = await ensureActiveHandle(userId, true);
  if (!dirHandle) {
    const bindRes = await bindLocalBackupFolder(userId);
    if (!bindRes.ok) {
      return { ok: false, count: 0, message: bindRes.message };
    }
    dirHandle = activeDirHandle;
  }

  const cleanUser = username.replace(/[\\/:*?"<>|]/g, '_');
  // 順便檢查並清理「_刪除暫存區_10天自動清理」中超過 10 天的過期檔案
  if (typeof dirHandle.getDirectoryHandle === 'function') {
    try {
      const trashDir = await dirHandle.getDirectoryHandle('_刪除暫存區_10天自動清理', {
        create: false,
      });
      await purgeExpiredFilesInTrashDir(trashDir);
    } catch {}
  }

  await writeJsonFileToDir(dirHandle, `travel_projects_list_${cleanUser}.json`, {
    userId,
    username,
    updatedAt: new Date().toISOString(),
    projects,
  });

  let count = 0;
  for (const p of projects) {
    const gData = getProjectDataById(p.id);
    if (gData) {
      const cleanTitle = (p.title || '未命名').replace(/[\\/:*?"<>|]/g, '_');
      const targetFileName = `guide_${cleanUser}_${cleanTitle}_${p.id}.json`;
      await removeStaleProjectFilesFromDir(dirHandle, cleanUser, p.id, targetFileName);
      const ok = await writeJsonFileToDir(dirHandle, targetFileName, gData);
      if (ok) count++;
    }
  }

  return {
    ok: true,
    count,
    message: `已成功將 ${count} 筆旅遊專案實體備份寫入本機資料夾「${dirHandle.name}」！`,
  };
}

/**
 * 從本機綁定資料夾一鍵讀取並還原所有 .json 旅遊專案
 */
export async function restoreProjectsFromLocalFolder(
  userId: string
): Promise<{
  ok: boolean;
  restoredGuides: TravelGuideData[];
  message: string;
}> {
  let dirHandle = await ensureActiveHandle(userId, true);
  if (!dirHandle) {
    const bindRes = await bindLocalBackupFolder(userId);
    if (!bindRes.ok) {
      return { ok: false, restoredGuides: [], message: bindRes.message };
    }
    dirHandle = activeDirHandle;
  }

  // 用 Map 以專案 ID (firebaseRoomId) 去重，若資料夾內有同 ID 的舊檔案，只取最後修改時間最新的那一筆
  const guideByIdMap = new Map<string, { data: TravelGuideData; lastModified: number }>();
  try {
    for await (const entry of dirHandle.values()) {
      if (
        entry.kind === 'file' &&
        entry.name.endsWith('.json') &&
        !entry.name.startsWith('travel_projects_list_') &&
        !entry.name.startsWith('trash_') &&
        !hasUnfinishedBopomofo(entry.name)
      ) {
        const file = await entry.getFile();
        const text = await file.text();
        try {
          const parsed: TravelGuideData = JSON.parse(text);
          if (parsed && (parsed.guideTitle !== undefined || parsed.days !== undefined)) {
            const key = parsed.firebaseRoomId || entry.name;
            const prev = guideByIdMap.get(key);
            if (!prev || file.lastModified >= prev.lastModified) {
              guideByIdMap.set(key, { data: parsed, lastModified: file.lastModified });
            }
          }
        } catch {}
      }
    }

    const restoredGuides: TravelGuideData[] = Array.from(guideByIdMap.values()).map(
      (v) => v.data
    );

    if (restoredGuides.length === 0) {
      return {
        ok: false,
        restoredGuides: [],
        message: `在資料夾「${dirHandle.name}」中未找到符合格式的旅遊專案 JSON 檔案。`,
      };
    }

    return {
      ok: true,
      restoredGuides,
      message: `已從本機資料夾「${dirHandle.name}」成功還原 ${restoredGuides.length} 筆旅遊專案！`,
    };
  } catch {
    return {
      ok: false,
      restoredGuides: [],
      message: '讀取本機資料夾時發生權限或格式錯誤。',
    };
  }
}
