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
2. **共編設定介面文案精簡與房間 ID 唯讀權限鎖定**（[CloudConfigSection.tsx](file:///d:/AnnaDome/src/components/studio/CloudConfigSection.tsx)）：
   * 標題改為 **【`共編設定`】**、分享按鈕改為 **【`🔗 複製共編連結`】**、欄位標籤改為 **【`共編房間 ID（英文或數字代碼）：`】**。
   * **共編房間 ID 權限鎖定**：僅共編房間的原始主人（Owner）可編輯「共編房間 ID」；透過登入、註冊或訪客方式進入共編房間的旅伴，該欄位一律鎖定為唯讀（`readOnly`）並顯示 `🔒 唯讀（僅房間主人可修改）`。
3. **專案大廳區分「個人專案」與「他人共編專案」，主人端呈現【共編中】提醒小視窗**（[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)）：
   * **受邀共編者端大廳**：在「🧳 籌備與進行中專案」下方獨立出 **「`🤝 受邀參與的他人共編專案`」** 區塊，並於卡片上醒目標示藍紫色 **「`👤 擁有者：${project.ownerName}`」** 提醒標籤，清楚區分他人擁有的共編專案與個人自建專案。
   * **共編房間主人端大廳**：已開啟共編的個人專案卡片上，自動呈現翠綠色 **「`【共編中】旅伴共同編輯已開啟（ID: ...）`」** 提醒小視窗。
4. **手冊編輯區「大廳卡片封面圖片（網址或本機上傳）：」移至下一行**（[BasicInfoSection.tsx](file:///d:/AnnaDome/src/components/studio/BasicInfoSection.tsx)）：
   * 於 `🌟 0. 旅遊手冊命名與副標題` 中，「出發日期」與「結束日期」並排為同一列（2 欄），並將 **「`大廳卡片封面圖片（網址或本機上傳）：`」** 往下一行獨立成完整寬度的一列。
5. **共編者三選一進入模式與雲端空間瘦身保護**（[LoginView.tsx](file:///d:/AnnaDome/src/components/auth/LoginView.tsx)、[useCloudSync.ts](file:///d:/AnnaDome/src/hooks/useCloudSync.ts)）：
   * 受邀者點開 `?room=<房間ID>` 連結可選擇 **「👋 訪客共編（只需設定名稱）」**、**「🔐 帳號登入」** 或 **「✨ 註冊帳號」**；非 `admin` 帳號於公共 `/shared_rooms/` 共編時自動剔除大型 Base64 圖片，單一共編房間僅占約 `4KB`。

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
