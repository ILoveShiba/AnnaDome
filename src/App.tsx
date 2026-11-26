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
import { usePreviewSync, scrollPreviewToSyncId } from './services/previewSync';
import { useGuideStore } from './store/useGuideStore';
import { useAuthStore } from './store/useAuthStore';
import { useAutoSave } from './hooks/useAutoSave';
import { useCloudSync } from './hooks/useCloudSync';

export const App: React.FC = () => {
  const [dragDayIdx, setDragDayIdx] = useState<number | null>(null);
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');
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
        <HeaderBar lastSavedAt={lastSavedAt} onEnableCoEditing={pushToCloud} />

        <main id="app-main" className="mx-auto px-3 max-w-7xl">
          <div
            id="app-grid"
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
          >
            {/* 左側：產生器表單區 (#studio-panel)，含快速章節跳轉錨點列與各章節折疊／展開 */}
            <div
              id="studio-panel"
              className={`lg:col-span-6 no-print ${
                mobilePane === 'preview' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* 快速章節跳轉錨點列（0 ~ 8 章節一鍵跳轉，自動展開該章節並同步對齊右側預覽） */}
              <div className="sticky top-[88px] z-30 bg-[#f4f6f8]/95 backdrop-blur-xs py-1 mb-1.5 border-b border-slate-200/80">
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                  {[
                    { id: 'studio-sec-0', syncId: 'sync-hero', label: '🌟 0.基本' },
                    { id: 'studio-sec-1', syncId: 'sync-companions', label: '👥 1.旅伴' },
                    { id: 'studio-sec-2', syncId: 'sync-flights', label: '✈️ 2.航班' },
                    { id: 'studio-sec-3', syncId: 'sync-hotels', label: '🏨 3.飯店' },
                    { id: 'studio-sec-4', syncId: 'sync-days', label: '🗓️ 4.行程' },
                    { id: 'studio-sec-5', syncId: 'sync-shopping', label: '🛍️ 5.購物' },
                    { id: 'studio-sec-6', syncId: 'sync-extras', label: '🎁 6.優惠券' },
                    { id: 'studio-sec-7', syncId: 'sync-extras', label: '📎 7.票券' },
                    { id: 'studio-sec-8', syncId: 'sync-notes', label: '📝 8.備註' },
                  ].map((navItem) => (
                    <button
                      key={navItem.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(navItem.id) as HTMLDetailsElement | null;
                        if (el) {
                          el.open = true;
                          const headerEl = document.getElementById('sticky-top-header');
                          const headerH = headerEl ? headerEl.getBoundingClientRect().height : 96;
                          const targetY =
                            el.getBoundingClientRect().top + window.scrollY - headerH - 46;
                          window.scrollTo({
                            top: Math.max(0, targetY),
                            behavior: 'smooth',
                          });
                        }
                        scrollPreviewToSyncId(navItem.syncId, true);
                      }}
                      className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-white hover:bg-[#1a2a3a] text-slate-700 hover:text-white border border-slate-300 hover:border-[#1a2a3a] transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                    >
                      {navItem.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const studio = document.getElementById('studio-panel');
                      if (!studio) return;
                      const allDetails = Array.from(
                        studio.querySelectorAll<HTMLDetailsElement>('details[data-sync-section]')
                      );
                      const anyClosed = allDetails.some((d) => !d.open);
                      allDetails.forEach((d) => {
                        d.open = anyClosed;
                      });
                    }}
                    title="一鍵展開或收合左側全部章節"
                    className="px-2 py-1 rounded-full text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0 ml-auto"
                  >
                    ⇅ 展開/收合
                  </button>
                </div>
              </div>

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
                <details
                  id="studio-sec-4"
                  open
                  data-sync-section
                  data-sync-id="sync-days"
                  className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
                >
                  <summary className="list-none cursor-pointer select-none flex items-center justify-between">
                    <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
                      🗓️ 4. 每日行程與景點規劃
                    </div>
                    <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>

                  <div className="mt-1.5">
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
                      className="bg-[#c86d51] hover:bg-[#b55e43] text-white px-2.5 py-1.5 rounded-md text-xs font-bold cursor-pointer"
                    >
                      + 新增天數
                    </button>
                  </div>
                </details>

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
              className={`lg:col-span-6 lg:sticky lg:top-[104px] ${
                mobilePane === 'editor' ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1a2a3a] text-white px-4 py-2 rounded-xl text-xs font-semibold mb-3 no-print">
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
                className="lg:max-h-[calc(100vh-165px)] lg:overflow-y-auto pr-1 scroll-smooth"
              >
                <GuideContainer isEditable={false} />
              </div>
            </div>
          </div>
        </main>

        {/* 手機／平板 (<1024px) 懸浮快速切換膠囊按鈕：[✏️ 編輯表單 | 👁️ 手冊預覽] */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50 no-print">
          <div className="bg-slate-900/95 text-white p-1 rounded-full shadow-xl border border-slate-700 flex items-center gap-1 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setMobilePane('editor')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                mobilePane === 'editor'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              ✏️ 編輯表單
            </button>
            <button
              type="button"
              onClick={() => setMobilePane('preview')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                mobilePane === 'preview'
                  ? 'bg-[#c86d51] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              👁️ 手冊預覽
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
