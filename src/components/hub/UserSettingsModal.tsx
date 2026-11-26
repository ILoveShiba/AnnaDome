import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  HardDrive,
  Cloud,
  FolderOpen,
  RotateCcw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGuideStore } from '../../store/useGuideStore';
import {
  bindLocalBackupFolder,
  writeAllUserProjectsToLocalFolder,
  restoreProjectsFromLocalFolder,
} from '../../services/localFolderSync';
import {
  pushEntireHubToFirebase,
  pullEntireHubFromFirebase,
} from '../../services/hubCloudSync';

export const UserSettingsModal: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useAuthStore((s) => s.settings);
  const isOpen = useAuthStore((s) => s.isSettingsModalOpen);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const setSettingsModalOpen = useAuthStore((s) => s.setSettingsModalOpen);

  const projects = useGuideStore((s) => s.projects);
  const getProjectDataById = useGuideStore((s) => s.getProjectDataById);
  const importProjectToHubFromJSON = useGuideStore((s) => s.importProjectToHubFromJSON);
  const replaceAllProjectsFromCloud = useGuideStore((s) => s.replaceAllProjectsFromCloud);

  const [mode, setMode] = useState<'local' | 'firebase'>(settings.storageMode);
  const [fbUrl, setFbUrl] = useState(settings.firebaseDbUrl);
  const [statusMsg, setStatusMsg] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(settings.storageMode);
      setFbUrl(settings.firebaseDbUrl);
      setStatusMsg('');
    }
  }, [isOpen, settings]);

  if (!isOpen || !currentUser) return null;

  const handleSaveSettings = () => {
    updateSettings({
      storageMode: mode,
      firebaseDbUrl: fbUrl.trim(),
    });
    // 同步將全域 Firebase URL 套用至當前開啟的專案
    useGuideStore.getState().syncGlobalSettingsToCurrentProject();
    setStatusMsg('✅ 全域儲存設定已儲存！所有旅遊專案將自動引用此設定檔。');
  };

  const handleBindLocalFolder = async () => {
    setIsBusy(true);
    const res = await bindLocalBackupFolder(currentUser.userId);
    if (res.ok) {
      updateSettings({
        storageMode: 'local',
        localFolderName: res.folderName,
      });
      setMode('local');
      // 綁定成功後立即執行一次全專案實體寫入
      await writeAllUserProjectsToLocalFolder(
        currentUser.userId,
        currentUser.username,
        projects,
        getProjectDataById
      );
    }
    setStatusMsg(res.message);
    setIsBusy(false);
  };

  const handleBackupAllToLocalFolder = async () => {
    setIsBusy(true);
    const res = await writeAllUserProjectsToLocalFolder(
      currentUser.userId,
      currentUser.username,
      projects,
      getProjectDataById
    );
    setStatusMsg(res.message);
    setIsBusy(false);
  };

  const handleRestoreFromLocalFolder = async () => {
    setIsBusy(true);
    const res = await restoreProjectsFromLocalFolder(currentUser.userId);
    if (res.ok && res.restoredGuides.length > 0) {
      res.restoredGuides.forEach((guide) => {
        importProjectToHubFromJSON(guide, guide.guideTitle || '還原的旅程');
      });
    }
    setStatusMsg(res.message);
    setIsBusy(false);
  };

  const handlePushHubToFirebase = async () => {
    const targetUrl = fbUrl.trim();
    if (!targetUrl) {
      setStatusMsg('⚠️ 請先填寫 Firebase Realtime Database 網址！');
      return;
    }
    setIsBusy(true);
    updateSettings({ storageMode: 'firebase', firebaseDbUrl: targetUrl });
    const res = await pushEntireHubToFirebase(
      targetUrl,
      currentUser.userId,
      currentUser.username,
      projects,
      getProjectDataById
    );
    setStatusMsg(res.message);
    setIsBusy(false);
  };

  const handlePullHubFromFirebase = async () => {
    const targetUrl = fbUrl.trim();
    if (!targetUrl) {
      setStatusMsg('⚠️ 請先填寫 Firebase Realtime Database 網址！');
      return;
    }
    setIsBusy(true);
    updateSettings({ storageMode: 'firebase', firebaseDbUrl: targetUrl });
    const res = await pullEntireHubFromFirebase(targetUrl, currentUser.username);
    if (res.ok && res.payload) {
      replaceAllProjectsFromCloud(res.payload.projects, res.payload.guidesMap || {});
    }
    setStatusMsg(res.message);
    setIsBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                ⚙️ 資料儲存設定
              </h2>
              <p className="text-xs text-slate-500">
                帳號：<span className="font-bold text-blue-600">{currentUser.username}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Mode Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            選擇預設資料儲存位置：
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('local')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                mode === 'local'
                  ? 'border-blue-600 bg-blue-50/60'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
                <span>💾 1. 本機儲存</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                儲存於瀏覽器，可綁定電腦資料夾自動同步 <code className="bg-slate-100 px-1 rounded">.json</code> 備份。
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('firebase')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                mode === 'firebase'
                  ? 'border-blue-600 bg-blue-50/60'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
                <span>☁️ 2. Firebase 雲端同步</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                綁定個人 Firebase 網址，支援跨裝置自動同步所有旅遊專案。
              </p>
            </button>
          </div>
        </div>

        {/* Mode 1: Local Storage & Folder Sync Details */}
        {mode === 'local' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                📂 本機資料夾自動備份
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  settings.localFolderName
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {settings.localFolderName
                  ? `🟢 已綁定：${settings.localFolderName}`
                  : '⚪ 尚未綁定'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              綁定電腦上的資料夾（例如 <code className="bg-white px-1 rounded border">D:\旅遊備份</code> 或 Google Drive / OneDrive 同步資料夾）後，每次編輯行程都會自動在該資料夾更新實體備份檔。
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={handleBindLocalFolder}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>📂 綁定備份資料夾</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={handleBackupAllToLocalFolder}
                className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>💾 立即寫入資料夾</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={handleRestoreFromLocalFolder}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔄 從資料夾還原</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Global Firebase Settings Details */}
        {mode === 'firebase' && (
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">
                🌐 Firebase Realtime Database 網址：
              </label>
              <input
                type="text"
                value={fbUrl}
                onChange={(e) => setFbUrl(e.target.value)}
                placeholder="例：https://your-trip-db-default-rtdb.firebaseio.com/"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={isBusy}
                onClick={handlePushHubToFirebase}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>☁️ 推播全部專案至雲端</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={handlePullHubFromFirebase}
                className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>📲 從雲端拉取全部專案</span>
              </button>
            </div>
          </div>
        )}

        {statusMsg && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
            {statusMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            關閉
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs"
          >
            💾 儲存全域設定
          </button>
        </div>
      </div>
    </div>
  );
};
