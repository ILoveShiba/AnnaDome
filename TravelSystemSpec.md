# ✈️ 旅遊手冊管理中心 & 旅行手冊一鍵產生器 — React 技術規格與修正紀錄

本規格書記錄使用 **React 18+ / TypeScript / Vite / Tailwind CSS / Zustand** 建構「✈️ 旅遊手冊管理中心 & 旅行手冊一鍵產生器」之完整系統架構、資料模型、元件階層以及所有最新修正紀錄。

---

## 1. 系統核心架構 (Architecture & Design Patterns)

1. **雙模狀態驅動架構 (`activeView: 'hub' | 'generator'`)**：
   * **旅遊手冊管理中心 (`#hub-view`)**：依日期自動將專案分類為「🧳 籌備與進行中專案（含 `✈️ 旅行中` 與 `籌備中`）」與「📜 典藏回憶｜已完成專案（`已完結`）」，並支援排序下拉選單、自訂更換封面圖片、「🗑️ 刪除」切換模式與 10 天自動清理暫存區。
   * **雙欄同步產生器模式 (`#generator-view`)**：上方導覽列與標題工具列常駐置頂 (`#sticky-top-header`)；左欄為 `0 ~ 8` 結構化表單編輯區 (`#studio-panel`)，右欄為預設全展開之唯讀即時預覽區 (`#guide-panel`)，點擊或捲動左欄任一區塊時右欄自動平滑對齊。
2. **頂部「👁️ 即時預覽」唯讀開窗與雙格式匯出 ([PreviewModal.tsx](file:///d:/AnnaDome/src/components/guide-view/PreviewModal.tsx))**：
   * 點擊大廳卡片的「📖 翻閱手冊」或產生器頂部「👁️ 即時預覽」即可彈出唯讀預覽視窗（右上角附精簡版「✏️ 編輯手冊」按鈕，下方固定提供「📄 下載 PDF」與「💾 下載網頁」兩顆按鈕）。
3. **會員／管理者權限隔離與 `/shared_rooms/` 單一專案旅伴／訪客共編系統**：
   * 內建管理者帳號 `admin`（密碼：`wanghome0830`，預設自動綁定專屬 Firebase 雲端資料庫），一般使用者則預設本機儲存且隱藏管理者 Firebase 網址。
   * 單一專案內僅提供 **「`🔗 複製此專案共編連結`」** 單一按鈕，透過 `/shared_rooms/<房間ID>.json` 進行單一專案共編；受邀旅伴點開連結可選擇 **「👋 訪客共編（僅需設定名稱，直接開啟該單一專案編輯）」**、**「🔐 帳號登入」** 或 **「✨ 註冊帳號」**。

---

## 2. 核心資料模型 ([src/types/guide.ts](file:///d:/AnnaDome/src/types/guide.ts))

```typescript
export interface ProjectMeta {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD (自動連動去程航班日期)
  endDate: string;   // YYYY-MM-DD (自動連動回程航班日期)
  cover: string;     // 圖片 URL 或壓縮後之 Base64 Data URL
  updatedAt?: string;
}

export interface TrashProjectEntry {
  project: ProjectMeta;
  guideData: TravelGuideData;
  deletedAt: string; // 移入暫存區時間
  expiresAt: string; // 10 天後自動永久刪除時間
}

export interface FlightItem {
  id: string;
  direction?: 'outbound' | 'inbound'; // 去程 ('outbound') 或 回程 ('inbound')
  type: string;
  date?: string;     // YYYY-MM-DD (日曆開窗選取)
  depTime?: string;  // HH:mm (起飛時間選取)
  arrTime?: string;  // HH:mm (抵達時間選取)
  time: string;      // 自動組合之顯示字串
  flightNo: string;
  dep: string;
  arr: string;
}

export interface TravelGuideData {
  firebaseDbUrl: string;
  firebaseRoomId: string;
  guideTitle: string;
  guideSubtitle: string;
  guideSummary: string;
  companions?: string;   // 👥 1. 旅行夥伴
  startDate?: string;    // 唯讀，自動串聯去程航班日期
  endDate?: string;      // 唯讀，自動串聯回程航班日期
  coverUrl?: string;     // 封面圖片（連動大廳卡片與手冊頂部 Hero Banner 底圖）
  flights: FlightItem[]; // ✈️ 2. 航班時間資訊（去程／回程兩大區塊）
  hotels: HotelInfo[];   // 🏨 3. 飯店資訊
  days: DayPlan[];       // 🗓️ 4. 每日行程與景點規劃
  shopping: ShoppingItem[]; // 🛍️ 5. 購物採買清單
  coupons: CouponItem[]; // 🎁 6. 電子優惠券設定
  docs: DocItem[];       // 📎 7. 電子票券與重要文件 (超連結)
  generalNote?: string;  // 📝 8. 備註（純文字章節）
  buildTime?: string;
}
```

---

## 3. 專案目錄結構 (`src/`)

```text
d:\AnnaDome\
├── index.html                        # 預編譯完成之獨立可執行首頁（供 GitHub Pages 直接部署）
├── TravelGuideStudio.html            # 預編譯完成之單一檔案版本
├── ProjectChecklist.md               # 開發進度與功能規格核對清單
├── TravelSystemSpec.md               # 系統技術規格與最新修正紀錄
└── src/
    ├── components/
    │   ├── auth/
    │   │   └── LoginView.tsx         # 會員／管理者登入、註冊新帳號、以及受邀「👋 訪客共編」三合一介面
    │   ├── hub/
    │   │   ├── ProjectHubView.tsx    # 旅遊手冊管理中心（含排序、更換封面彈窗、刪除模式切換、10天暫存區）
    │   │   └── UserSettingsModal.tsx # 全域儲存設定中心（本機資料夾直連 / Firebase 雲端設定）
    │   ├── studio/
    │   │   ├── HeaderBar.tsx         # 常駐置頂導覽列與標題工具列（含訪客模式權限鎖定與「👁️ 即時預覽」按鈕）
    │   │   ├── CloudConfigSection.tsx# 單一專案共編設定（僅提供「🔗 複製此專案共編連結」單一分享按鈕）
    │   │   ├── BasicInfoSection.tsx  # 🌟 0. 命名、副標題、唯讀出發/結束日期、封面網址與本機照片上傳預覽
    │   │   ├── CompanionSection.tsx  # 👥 1. 旅行夥伴（文字框章節）
    │   │   ├── FlightSection.tsx     # ✈️ 2. 航班時間資訊（去程／回程分區＋日期與時間點選器）
    │   │   ├── HotelManager.tsx      # 🏨 3. 飯店資訊
    │   │   ├── ItineraryPlanner/     # 🗓️ 4. 每日行程與景點規劃（DayCard.tsx & SpotCard.tsx）
    │   │   ├── ShoppingManager.tsx   # 🛍️ 5. 購物採買清單
    │   │   ├── CouponManager.tsx     # 🎁 6. 電子優惠券設定
    │   │   ├── DocManager.tsx        # 📎 7. 電子票券與重要文件 (超連結)
    │   │   └── NoteManager.tsx       # 📝 8. 備註（純文字章節）
    │   └── guide-view/
    │       ├── GuideContainer.tsx    # 右側唯讀即時預覽容器
    │       ├── HeroBannerView.tsx    # 手冊頂部橫幅（底圖自動連動專案封面圖片＋漸層遮罩＋旅行夥伴顯示）
    │       ├── PreviewModal.tsx      # 唯讀手冊預覽彈窗（右上角附「✏️ 編輯手冊」，下方附「📄 下載 PDF / 💾 下載網頁」）
    │       ├── FlightView.tsx
    │       ├── HotelView.tsx
    │       ├── ItineraryView.tsx
    │       └── ShoppingView.tsx
    ├── hooks/
    │   ├── useAutoSave.ts
    │   └── useCloudSync.ts           # /shared_rooms/<roomId>.json 雙向同步引擎（含雲端空間瘦身保護）
    ├── services/
    │   ├── imageUtils.ts             # 本機照片 Canvas 壓縮轉 Base64 與 14 張通用純圖片精選封面庫
    │   ├── localFolderSync.ts        # File System Access API 本機資料夾備份（防注音半成品生檔＋10天暫存子資料夾）
    │   ├── hubCloudSync.ts           # 大廳全專案 Firebase 同步服務
    │   ├── previewSync.ts            # 左欄編輯與右欄預覽自動捲動對齊引擎
    │   ├── pdfExport.ts              # 無痕全展開 PDF 列印服務
    │   └── singleFileCompiler.ts     # 單檔離線 HTML 編譯器
    └── store/
        ├── useAuthStore.ts           # 帳號認證與管理者專屬預設 Firebase 分流設定
        └── useGuideStore.ts          # 多專案隔離儲存、共編房間掛載與 10 天暫存區管理
```

---

## 4. 最新架構與功能修正紀錄彙整（2026-11-21 ~ 2026-11-24）

### 4.1 會員／內建管理者權限隔離與雲端設定分流
1. **共用登入畫面與個人專案隔離**（[useAuthStore.ts](file:///d:/AnnaDome/src/store/useAuthStore.ts)、[LoginView.tsx](file:///d:/AnnaDome/src/components/auth/LoginView.tsx)）：
   * 內建管理者專屬帳號 `admin`（密碼：`wanghome0830`），同時保留一般使用者「註冊帳號」與「帳號登入」功能；每位使用者登入後僅能檢視與管理自己帳號下的旅遊專案。
   * **管理者專屬預設雲端綁定（方案 A）**：僅 `admin` 帳號預設自動綁定 `https://travel-handbook-241bb-default-rtdb.firebaseio.com/` 進行跨裝置（電腦／手機）大廳自動同步；其他一般使用者帳號預設為「本機儲存」且「⚙️ 設定」中的 Firebase 網址欄位預設為空白，不共用亦不暴露管理者雲端網址（一般使用者仍可自行填入自己的 Firebase 網址）。
2. **三大範例專案保留與 `(範例)` 標示**（[useGuideStore.ts](file:///d:/AnnaDome/src/store/useGuideStore.ts)）：
   * 內建 `(範例) 東京 5 日風格隨身手冊`、`(範例) 北海道秋日散策`、`(範例) 胡志明市城市漫遊`，統一於標題前方加上 `(範例)` 前綴，並取消新增自建專案時自動清除範例專案之行為。

### 4.2 單一專案「🔗 複製共編連結」、`/shared_rooms/` 共編系統與房間權限／大廳分區控管
1. **預設隱藏共編資訊與頂部「🤝 開啟共同編輯」按鈕**（[HeaderBar.tsx](file:///d:/AnnaDome/src/components/studio/HeaderBar.tsx)、[CloudConfigSection.tsx](file:///d:/AnnaDome/src/components/studio/CloudConfigSection.tsx)）：
   * 尚未進行共編的專案（`isCoEditing !== true`），在點擊「✏️ 編輯行程」進入產生器時預設隱藏共編設定區塊。
   * 在頂部標頭 **【`👁️ 即時預覽`】** 左側新增 **【`🤝 開啟共同編輯`】** 按鈕，點擊後才開啟共編設定區塊（已開啟時按鈕切換顯示為 **【`👥 共同編輯開啟中`】**）。
2. **共編設定介面文案精簡、短代碼編碼 (`trip` + 4 碼大寫英數) 與房間 ID 唯讀權限鎖定**（[CloudConfigSection.tsx](file:///d:/AnnaDome/src/components/studio/CloudConfigSection.tsx)、[useGuideStore.ts](file:///d:/AnnaDome/src/store/useGuideStore.ts)）：
   * 標題改為 **【`共編設定`】**、分享按鈕改為 **【`🔗 複製共編連結`】**、欄位標籤改為 **【`共編房間 ID（英文或數字代碼）：`】**。
   * **短代碼編碼規則 (`generateShortTripCode`)**：採用 `trip` 固定開頭 ＋ 4 碼高辨識度大寫英數短代碼（字元集 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`，剔除易混淆的 `0/O/1/I/L`，例如 `tripK8M3`）；建立新專案或舊長代碼專案點擊「🤝 開啟共同編輯」時自動轉換配發。
   * **共編房間 ID 權限鎖定**：僅共編房間的原始主人（Owner）可編輯「共編房間 ID」；透過登入、註冊或訪客方式進入共編房間的旅伴，該欄位一律鎖定為唯讀（`readOnly`）並顯示 `🔒 唯讀（僅房間主人可修改）`。
3. **專案大廳區分「個人專案」與「🤝 共編專案」，主人端呈現【共編中】提醒小視窗，並精簡「🗑️ 刪除暫存區」標題**（[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)）：
   * **受邀共編者端大廳**：在「🧳 籌備與進行中專案」下方獨立出 **「`🤝 共編專案`」** 區塊，並於卡片上醒目標示藍紫色 **「`👤 擁有者：${project.ownerName}`」** 提醒標籤；最下方刪除暫存區標題精簡為 **「`🗑️ 刪除暫存區`」**。
   * **共編房間主人端大廳**：已開啟共編的個人專案卡片上，自動呈現翠綠色 **「`【共編中】旅伴共同編輯已開啟（ID: ...）`」** 提醒小視窗。
4. **手冊編輯區「大廳卡片封面圖片（網址或本機上傳）：」移至下一行**（[BasicInfoSection.tsx](file:///d:/AnnaDome/src/components/studio/BasicInfoSection.tsx)）：
   * 於 `🌟 0. 旅遊手冊命名與副標題` 中，「出發日期」與「結束日期」並排為同一列（2 欄），並將 **「`大廳卡片封面圖片（網址或本機上傳）：`」** 往下一行獨立成完整寬度的一列。
5. **共編者三選一進入模式與雲端空間瘦身保護**（[LoginView.tsx](file:///d:/AnnaDome/src/components/auth/LoginView.tsx)、[useCloudSync.ts](file:///d:/AnnaDome/src/hooks/useCloudSync.ts)）：
   * 受邀者點開 `?room=<房間ID>` 連結可選擇 **「👋 訪客共編（只需設定名稱）」**、**「🔐 帳號登入」** 或 **「✨ 註冊帳號」**；非 `admin` 帳號於公共 `/shared_rooms/` 共編時自動剔除大型 Base64 圖片，單一共編房間僅占約 `4KB`。
6. **專案主人刪除／永久刪除共編專案之雙向聯動清理機制**（[useGuideStore.ts](file:///d:/AnnaDome/src/store/useGuideStore.ts)、[useCloudSync.ts](file:///d:/AnnaDome/src/hooks/useCloudSync.ts)、[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)）：
   * **情境 A（主人移至刪除暫存區）**：當刪除者為該專案主人（`!project.isSharedWithMe`）且該專案曾開啟共編，立即向 Firebase `/shared_rooms/<roomId>.json` 寫入 `{ deletedByOwner: true, deletedAt, ownerId, ownerName }`。
   * **情境 B（主人從暫存區還原）**：主人點擊「↩️ 還原專案」時，自動將共編專案資料重新推播恢復至 `/shared_rooms/<roomId>.json`。
   * **情境 C（主人永久刪除／清空暫存區／10天到期）**：直接對 `/shared_rooms/<roomId>.json` 發送 `HTTP DELETE` 徹底清除雲端節點。
   * **受邀共編者端自動同步移除**：受邀共編者於大廳（登入、返回大廳、視窗聚焦、每 15 秒背景巡檢 `pruneDeletedSharedProjectsForCollaborator`）或編輯器內同步時，一旦偵測到雲端房間為 `deletedByOwner === true` 或 `null`，立即自動從受邀者大廳的「🤝 共編專案」清單與本機快取中移除該專案（並禁止受邀者端將舊資料推回雲端）。

### 4.5 版面精簡、左欄章節可折疊與 5 大 UX 體驗升級
1. **大廳無共編專案時自動隱藏區塊**（[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)）：當 `sharedWithMeProjects.length === 0` 時自動隱藏「🤝 共編專案」區塊，減少空白虛線框。
2. **頂部常駐列雙層瘦身與「⋯ 更多工具」收納選單**（[HeaderBar.tsx](file:///d:/AnnaDome/src/components/studio/HeaderBar.tsx)）：將自動儲存狀態移入第一層導覽列，並將「📥 資料備份 / 📤 資料匯入 / 🗑️ 清空本專案內容」收納入「`⋯ 更多工具`」下拉選單，釋放約 35% 頂部垂直高度。
3. **左欄 `0 ~ 8` 章節全面支援點擊折疊／展開 ＋ 頂部「快速章節跳轉錨點列」**（[BasicInfoSection.tsx](file:///d:/AnnaDome/src/components/studio/BasicInfoSection.tsx) ~ [NoteManager.tsx](file:///d:/AnnaDome/src/components/studio/NoteManager.tsx) & [App.tsx](file:///d:/AnnaDome/src/App.tsx)）：左側表單所有章節皆支援點擊標題列收合／展開，並於左欄頂部常駐 `[🌟 0.基本] ~ [📝 8.備註]` 快速跳轉錨點列（附 `⇅ 展開/收合` 全章節開關），點擊任一膠囊自動展開該章節、平滑捲動至定位並同步對齊右側預覽。
4. **大廳卡片顯示「天數標籤（如 `5天4夜`）」與「👥 旅伴」**（[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)、[useGuideStore.ts](file:///d:/AnnaDome/src/store/useGuideStore.ts)）：自動計算天數與夜數，並同步在卡片上呈現 `👥 旅伴` 名單。
5. **手機／平板 RWD 懸浮快速切換膠囊與全系統文案精簡**（[App.tsx](file:///d:/AnnaDome/src/App.tsx)）：螢幕小於 `1024px` 時於右下角提供 `[✏️ 編輯表單 | 👁️ 手冊預覽]` 一鍵切換鈕，並全面精簡各表單欄位與彈窗的冗長括號說明。
6. **專案主人專屬「👥 共編人清單（僅於編輯器內預設收合不占版面）」與共編者移除機制**（[CloudConfigSection.tsx](file:///d:/AnnaDome/src/components/studio/CloudConfigSection.tsx)、[useGuideStore.ts](file:///d:/AnnaDome/src/store/useGuideStore.ts)、[useCloudSync.ts](file:///d:/AnnaDome/src/hooks/useCloudSync.ts)）：
   * **自動登記 (`upsertCollaboratorEntry`)**：受邀旅伴透過共編連結以「訪客共編」或「會員帳號」進入或編輯時，自動登記至 `collaborators`（含名稱、`👋 訪客 / 👤 會員` 標籤與最後活躍時間，自動去重且排除主人自己）。
   * **編輯器內隱藏式收納設計**：僅在編輯器【共編設定】標題列旁提供 **`👥 共編人清單 (N) ▼`** 膠囊按鈕（大廳卡片維持單純的 `【共編中】 ID: ...` 提醒，不在大廳展開清單），平時完全收起不占版面，點擊才展開名單面板。
   * **移除共編者 (`removeCollaboratorByOwner`)**：主人可在名單中點擊 **`✕ 移除`** 將特定共編人移出房間（被移除者下次同步時會自動從其大廳移除該專案或退出訪客模式）。
7. **共編連結登入頁專屬標題（方案 C）、手冊編輯區行距收緊、封面建議尺寸提示與 GitHub Actions v4 升級**：
   * **共編連結登入標題**（[LoginView.tsx](file:///d:/AnnaDome/src/components/auth/LoginView.tsx)）：當網址帶有 `?room=<房間ID>` 時，登入卡片標題自動顯示為 **`✈️ 旅伴行程共編室`**（一般登入則維持 `✈️ 旅遊手冊管理中心`）。
   * **手冊編輯區 (`#studio-panel`) 行距與間距收緊**：章節卡片間距收緊為 `mb-2 px-2.5 py-2`、大標與內容距離收緊為 `mt-1.5`、小標與輸入框距離收緊為 `mb-0.5 leading-tight`、輸入框高度收緊為 `py-1 px-2 text-[13.5px]`；同時保留飯店中文名稱地圖連結提示、`🏨 住宿飯店設定`、`📎 票券 / 文件項目`、備註說明文字與本機資料夾備份說明。
   * **封面圖片防裁切尺寸建議**（[BasicInfoSection.tsx](file:///d:/AnnaDome/src/components/studio/BasicInfoSection.tsx)、[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)）：標註建議使用橫向寬幅照片（**比例 `16:9` 或 `5:2`，如 `1200×480 px`，主體置中避免上下被裁切**）。
   * **GitHub Pages 自動部署腳本升級**（[.github/workflows/deploy.yml](file:///d:/AnnaDome/.github/workflows/deploy.yml)）：將 `actions/upload-pages-artifact` 升級至 `@v4` 並設定 `configure-pages@v5` (`enablement: true`)。

### 4.3 本機資料夾防注音重複生檔、「🗑️ 刪除」切換模式與 10 天刪除暫存區
1. **防注音半成品檔名與同 ID 舊檔清理**（[localFolderSync.ts](file:///d:/AnnaDome/src/services/localFolderSync.ts)）：
   * 本機資料夾寫入啟用 `900ms` 防抖延遲（Debounce），過濾未完成選字的注音符號（`ㄅ~ㄦ`），並於寫入完整檔名時自動清除同專案 ID 先前產生的舊檔名與注音殘留檔。
2. **「🗑️ 刪除」切換模式與 10 天自動清理暫存區**（[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)）：
   * 專案卡片預設隱藏 `✕`，點擊大廳右上角「🗑️ 刪除」按鈕後各專案才顯示可點選的 `✕`；點選後跳出防誤刪提醒視窗，確認後移入「🗑️ 刪除暫存區（`_刪除暫存區_10天自動清理`）」保留 10 天（期間可一鍵還原），滿 10 天後自動永久刪除。

### 4.4 大廳與產生器 UI/UX 全面升級
1. **系統正名與章節編號順延 (`0 ~ 8`)**：
   * 系統名稱統一改為 **「✈️ 旅遊手冊管理中心」**。
   * 於 `🌟 0. 旅遊手冊命名與副標題`（含唯讀出發／結束日期自動連動去回程航班日期）後方新增 **「`👥 1. 旅行夥伴`」** 文字框章節（[CompanionSection.tsx](file:///d:/AnnaDome/src/components/studio/CompanionSection.tsx)），後續章節依序順延為 `✈️ 2. 航班時間資訊（去程／回程分區＋日期時間點選器）`、`🏨 3. 飯店資訊`、`🗓️ 4. 每日行程與景點規劃`、`🛍️ 5. 購物採買清單`、`🎁 6. 電子優惠券設定`、`📎 7. 電子票券與重要文件`、`📝 8. 備註（純文字章節）`。
2. **專案封面更換與手冊頂部橫幅底圖連動**（[imageUtils.ts](file:///d:/AnnaDome/src/services/imageUtils.ts)、[HeroBannerView.tsx](file:///d:/AnnaDome/src/components/guide-view/HeroBannerView.tsx)）：
   * 每張大廳卡片左上角皆提供 **「`🖼️ 更換封面`」** 按鈕，支援「📁 選擇本機照片上傳（Canvas 自動壓縮轉 Base64 同步 JSON 與 Firebase）」、「🔗 貼上網路圖片網址」及「🎨 14 張無地名限制、無文字遮罩之通用純圖片精選封面（海灘、歐美、夏日、冬日、城市、山林、美食各 2 張）」。
   * 手冊頂部橫幅（Hero Banner）底圖自動套用該專案的封面圖片並疊加左深右透漸層遮罩。
3. **「`✈️ 旅行中`」狀態標籤與唯讀預覽開窗**（[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)、[PreviewModal.tsx](file:///d:/AnnaDome/src/components/guide-view/PreviewModal.tsx)）：
   * 當 `出發日期 <= TODAY <= 結束日期` 時，大廳卡片右上角自動顯示翠綠色 **`✈️ 旅行中`** 標籤。
   * 「📜 典藏回憶｜已完成專案」卡片預設僅顯示「📖 翻閱手冊」，點擊直接彈出唯讀手冊預覽視窗（視窗右上角提供小巧的「✏️ 編輯手冊」按鈕，下方固定提供「📄 下載 PDF」與「💾 下載網頁」）。
