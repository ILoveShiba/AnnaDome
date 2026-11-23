import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LoginView } from './components/auth/LoginView';
import { ProjectHubView } from './components/hub/ProjectHubView';
import { UserSettingsModal } from './components/hub/UserSettingsModal';
import { HeaderBar } from './components/studio/HeaderBar';
import { CloudConfigSection } from './components/studio/CloudConfigSection';
import { BasicInfoSection } from './components/studio/BasicInfoSection';
import { CompanionSection } from './components/studio/CompanionSection';
import { FlightSection } from './components/studio/FlightSection';
import { HotelManager } from './components/studio/HotelManager';
import { DayCard } from './components/studio/ItineraryPlanner/DayCard';
import { ShoppingManager } from './components/studio/ShoppingManager';
import { CouponManager } from './components/studio/CouponManager';
import { DocManager } from './components/studio/DocManager';
import { NoteManager } from './components/studio/NoteManager';
import { GuideContainer } from './components/guide-view/GuideContainer';
import { PreviewModal } from './components/guide-view/PreviewModal';
import { setAllAccordionsOpen } from './services/pdfExport';
import { usePreviewSync } from './services/previewSync';
import { useGuideStore } from './store/useGuideStore';
import { useAuthStore } from './store/useAuthStore';
import { useAutoSave } from './hooks/useAutoSave';
import { useCloudSync } from './hooks/useCloudSync';

export const App: React.FC = () => {
  const [dragDayIdx, setDragDayIdx] = useState<number | null>(null);
  const [invitedRoomId, setInvitedRoomId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('room');
    } catch {
      return null;
    }
  });

  const currentUser = useAuthStore((s) => s.currentUser);
  const reloadProjectsForUser = useGuideStore((s) => s.reloadProjectsForUser);
  const joinSharedRoomProject = useGuideStore((s) => s.joinSharedRoomProject);

  const activeView = useGuideStore((s) => s.activeView);
  const showInlinePreview = useGuideStore((s) => s.showInlinePreview);
  const days = useGuideStore((s) => s.days);
  const addDay = useGuideStore((s) => s.addDay);
  const reorderDays = useGuideStore((s) => s.reorderDays);
  const buildTime = useGuideStore((s) => s.buildTime);

  const previewSectionRef = useRef<HTMLDivElement>(null);

  const initialBuildTime = useMemo(() => buildTime || new Date().toISOString(), []);
  const { lastSavedAt } = useAutoSave();
  const { status, message, lastSyncedAt, syncWithCloud, pushToCloud } =
    useCloudSync(initialBuildTime);

  // 啟用左側表單與右側即時預覽的雙欄自動同步對位
  usePreviewSync(activeView);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'guest' && currentUser.guestRoomId) {
      joinSharedRoomProject(currentUser.guestRoomId, true);
      return;
    }
    reloadProjectsForUser(currentUser.userId);
    if (invitedRoomId && invitedRoomId.trim()) {
      const targetRoom = invitedRoomId.trim();
      joinSharedRoomProject(targetRoom, false).then(() => {
        setInvitedRoomId(null);
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('room');
          window.history.replaceState({}, '', url.toString());
        } catch {}
      });
    }
  }, [currentUser?.userId]);

  useEffect(() => {
    if (activeView === 'generator') {
      // 進入雙欄編輯模式時，右側即時預覽預設全部展開
      setAllAccordionsOpen(true);
      if (showInlinePreview) {
        setTimeout(() => {
          previewSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      } else {
        window.scrollTo({ top: 0 });
      }
    }
  }, [activeView, showInlinePreview]);

  // 未登入時顯示會員／訪客共編登入／註冊畫面
  if (!currentUser) {
    return (
      <LoginView
        invitedRoomId={invitedRoomId}
        onAuthSuccess={(userId, isGuest) => {
          if (isGuest && invitedRoomId) {
            joinSharedRoomProject(invitedRoomId, true);
          } else {
            reloadProjectsForUser(userId);
            if (invitedRoomId) {
              joinSharedRoomProject(invitedRoomId, false);
              setInvitedRoomId(null);
            }
          }
        }}
      />
    );
  }

  return (
    <div id="app-shell" className="min-h-screen bg-[#f4f6f8] text-slate-800">
      {/* 全域會員儲存設定中心彈窗 */}
      <UserSettingsModal />

      {/* 手冊即時預覽唯讀開窗（可由大廳「📖 翻閱手冊」或產生器頂部「👁️ 即時預覽」開啟，內建下載 PDF 與下載網頁） */}
      <PreviewModal />

      {/* ==================== 狀態一：專案大廳模式 (#hub-view) ==================== */}
      <div
        style={{ display: activeView === 'hub' ? 'block' : 'none' }}
        className="no-print"
      >
        <ProjectHubView />
      </div>

      {/* ==================== 狀態二：手冊編輯／建立模式 (#generator-view) ==================== */}
      <div
        id="generator-view"
        style={{ display: activeView === 'generator' ? 'block' : 'none' }}
        className="pb-16"
      >
        <HeaderBar lastSavedAt={lastSavedAt} />

        <main id="app-main" className="mx-auto px-3 max-w-7xl">
          <div
            id="app-grid"
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
          >
            {/* 左側：產生器表單區 (#studio-panel) */}
            <div id="studio-panel" className="lg:col-span-6 no-print">
              <form id="guideForm" onSubmit={(e) => e.preventDefault()}>
                <CloudConfigSection
                  syncStatus={status}
                  syncMessage={message}
                  lastSyncedAt={lastSyncedAt}
                  onSyncNow={syncWithCloud}
                  onPushNow={pushToCloud}
                />

                <BasicInfoSection />
                <CompanionSection />
                <FlightSection />
                <HotelManager />

                {/* 4. 每日行程與景點規劃 */}
                <section
                  data-sync-section
                  data-sync-id="sync-days"
                  className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
                >
                  <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-2.5">
                    🗓️ 4. 每日行程與景點規劃
                  </div>

                  <div id="daysContainer">
                    {days.map((day, idx) => (
                      <DayCard
                        key={day.id}
                        day={day}
                        dayIndex={idx}
                        totalDays={days.length}
                        onDragStartDay={(fromIdx) => setDragDayIdx(fromIdx)}
                        onDragOverDay={(toIdx) => {
                          if (dragDayIdx !== null && dragDayIdx !== toIdx) {
                            reorderDays(dragDayIdx, toIdx);
                            setDragDayIdx(toIdx);
                          }
                        }}
                        onDragEndDay={() => setDragDayIdx(null)}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    id="btnAddDay"
                    onClick={addDay}
                    className="bg-[#c86d51] hover:bg-[#b55e43] text-white px-3 py-2 rounded-md text-[13px] font-bold cursor-pointer"
                  >
                    + 新增天數
                  </button>
                </section>

                <ShoppingManager />
                <CouponManager />
                <DocManager />
                <NoteManager />
              </form>
            </div>

            {/* 右側：唯讀即時預覽與手冊檢視區 (#guide-panel) */}
            <div
              id="guide-panel"
              ref={previewSectionRef}
              className="lg:col-span-6 lg:sticky lg:top-[136px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1a2a3a] text-white px-4 py-2.5 rounded-xl text-xs font-semibold mb-3 no-print">
                <div className="flex items-center gap-2">
                  <span>👁️ 手冊即時預覽</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAllAccordionsOpen(true)}
                    className="bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded text-[11px] cursor-pointer"
                  >
                    📂 全部展開
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllAccordionsOpen(false)}
                    className="bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded text-[11px] cursor-pointer"
                  >
                    📁 全部收合
                  </button>
                </div>
              </div>

              <div
                id="guide-scroll-viewport"
                className="lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto pr-1 scroll-smooth"
              >
                <GuideContainer isEditable={false} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
