# ✈️ 旅遊手冊管理中心 & 旅行手冊一鍵產生器 — 開發進度與功能規格清單

本文件記錄系統自初始化重構、專案大廳改版、細節優化至後續 **會員系統、全域儲存設定中心與 GitHub Pages 公開部署** 的所有工作項目。

---

## ⏳ 一、 進行中與待開發項目 (In Progress & Upcoming Tasks)

<details open>
<summary><b>📂 點此展開／收合「最新完成之進階模組與雙欄同步改版」（共 6 大子標題，已全數開發完畢！）</b></summary>

### 1. 簡易會員登入、內建管理者帳號與個人專案隔離系統 (Member & Admin Auth with Project Isolation)

> **目標**：同一套登入介面同時提供給一般使用者註冊／登入與管理者登入；每位使用者（包含管理者）輸入自己的帳號與密碼後，只會看到屬於自己帳號存取權限下的旅遊專案。

- [x] 建立會員與內建管理者認證模組 ([useAuthStore.ts](file:///d:/AnnaDome/src/store/useAuthStore.ts) & [LoginView.tsx](file:///d:/AnnaDome/src/components/auth/LoginView.tsx))：
    - [x] 保留一般使用者「註冊新帳號」與「會員／管理者登入」完整功能，所有人共用同一個登入畫面
    - [x] 內建管理者專屬帳號 `admin`（密碼：`wanghome0830`），管理者於同一登入介面輸入 `admin` 與密碼即可進入管理者專屬大廳
    - [x] 支援登入狀態記憶與大廳右上角「目前帳號顯示 / 🚪 登出」按鈕
- [x] 實作依帳號權限嚴格隔離的專案資料空間 ([useGuideStore.ts](file:///d:/AnnaDome/src/store/useGuideStore.ts))：
    - [x] 將大廳專案清單與行程明細依帳號獨立命名隔離（`travel_projects_list_<userId>` 與 `guide_data_<userId>_<projectId>`），不同帳號登入時只看得到自己的專案
    - [x] 將先前已建立的既有專案（如「北海岸」、「44」等管理者專用專案）將存取權限正式歸屬移轉至管理者帳號 `admin`（`u_admin`）名下，只有登入 `admin`（密碼 `wanghome0830`）時才可存取這些專案
    - [x] **三大範例專案標題標示「(範例)」並保留不自動清除**：內建「(範例) 東京 5 日風格隨身手冊」、「(範例) 北海道秋日散策」、「(範例) 胡志明市城市漫遊」3 筆範例專案，於專案標題前方統一加上 `(範例)` 字樣，並取消新增自建專案時自動清除範例專案之行為（使用者可自行決定是否保留或透過刪除按鈕移至暫存區）

### 2. 會員全域「⚙️ 設定中心」與專案雲端欄位精簡化 (Global Storage Settings & Room-ID Only)

> **目標**：登入後提供統一的「⚙️ 設定」功能，讓使用者預先選擇資料要存在「本機儲存位置」或「Firebase 雲端位置」；各旅遊專案直接引用此全域設定，不再重複填寫 Firebase 網址，專案內只需保留「房間 ID」。

- [x] 在專案大廳頂部新增 **「⚙️ 設定」** 按鈕與全域設定彈窗 ([UserSettingsModal.tsx](file:///d:/AnnaDome/src/components/hub/UserSettingsModal.tsx))：
    - [x] 提供「預設資料儲存位置」切換設定（每位會員獨立保存自己的設定檔 `user_settings_<userId>`）：
        - [x] **模式 A：本機儲存位置**（使用瀏覽器本地儲存 / 綁定電腦本機備份資料夾）
        - [x] **模式 B：Firebase 雲端資料庫位置**（僅管理者 `admin` 帳號預設綁定專屬雲端資料庫 `https://travel-handbook-241bb-default-rtdb.firebaseio.com/`，讓管理者於電腦與手機登入即自動跨裝置同步；其他一般使用者帳號預設為本機儲存且 Firebase 網址欄位為空白，需自行填寫自己的 Firebase 網址，不占用管理者雲端空間）
- [x] 精簡各專案產生器表單 ([CloudConfigSection.tsx](file:///d:/AnnaDome/src/components/studio/CloudConfigSection.tsx))：
    - [x] **移除**各專案表單內的「Firebase Realtime Database 網址」輸入框
    - [x] 每次建立或開啟專案時，系統自動引用該會員在「⚙️ 設定」中儲存的 Firebase 網址設定檔
    - [x] 專案表單內**僅保留「行程共編房間 ID (`firebaseRoomId`)」單一欄位**（並自動顯示目前是否已連結全域 Firebase 設定）

### 3. 本機資料夾直連自動備份與全專案雲端同步 (Local Folder & Cloud Sync Engine)

> **目標**：配合會員在「⚙️ 設定」中選擇的儲存位置，自動執行實體 `.json` 備份或跨裝置大廳同步。

- [x] **本機儲存強化（File System Access API - [localFolderSync.ts](file:///d:/AnnaDome/src/services/localFolderSync.ts)）**：
    - [x] 在「⚙️ 設定」中支援點擊「📂 選擇／綁定本機自動備份資料夾」，將該會員的所有專案自動同步寫入電腦指定資料夾為實體 `.json` 檔案
    - [x] **防注音半成品檔名與同 ID 舊檔自動清理 (`removeStaleProjectFilesFromDir` & `hasUnfinishedBopomofo`)**：寫入本機資料夾時啟用 900ms 防抖延遲 (Debounce) 並過濾未完成選字的注音符號（`ㄅ~ㄦ`），且在寫入完整檔名時自動刪除同專案 ID 先前產生的舊檔名與注音殘留檔，確保每個專案在資料夾內永遠只保留最後唯一 1 個完整 JSON 檔案
    - [x] **刪除模式切換（「🗑️ 刪除」按鈕）與刪除暫存區（保留 10 天後自動刪除）([ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx) & [localFolderSync.ts](file:///d:/AnnaDome/src/services/localFolderSync.ts))**：專案卡片預設隱藏 `✕` 按鈕，點擊大廳右上角「🗑️ 刪除」按鈕後各專案卡片才顯示可點選的 `✕`；點選 `✕` 時必先跳出防誤刪確認提醒視窗，確認後將專案與本機 JSON 檔案移至「刪除暫存區（`_刪除暫存區_10天自動清理`）」保留 10 天（期間可隨時一鍵還原），滿 10 天後自動永久清除
    - [x] 支援「🔄 從本機資料夾一鍵還原所有專案」
- [x] **Firebase 雲端大廳同步 ([hubCloudSync.ts](file:///d:/AnnaDome/src/services/hubCloudSync.ts))**：
    - [x] 當會員在「⚙️ 設定」啟用 Firebase 儲存位置時，支援將該會員的「專案大廳卡片清單」與「各專案明細」一鍵推播或拉取至 Firebase `/user_workspaces/<username>.json` 與 `/guides/<roomId>.json`
    - [x] 保留 `updatedAt` vs `LOCAL_BUILD_TIME` 時間戳記防護，實現跨手機/電腦登入同一帳號即可同步所有旅遊卡片

### 4. GitHub Pages 公開網站部署準備 (GitHub Pages Deployment)

- [x] 調整 [vite.config.ts](file:///d:/AnnaDome/vite.config.ts) 為相對路徑基底 (`base: './'`)，確保不論部署在 `https://<username>.github.io/` 根目錄或子專案路徑 `https://<username>.github.io/<repo-name>/` 都能正常載入靜態資源
- [x] 建立 [.gitignore](file:///d:/AnnaDome/.gitignore) 與 GitHub Actions 自動部署設定檔 ([.github/workflows/deploy.yml](file:///d:/AnnaDome/.github/workflows/deploy.yml))，推送程式碼至 GitHub 時自動發佈至 GitHub Pages

### 5. 常駐置頂標題列、雙欄同步即時對位與介面圖示精簡優化 (Sticky Header & Dual-Column Live Sync)

- [x] **移除重複單色 SVG 圖示，統一保留彩色圖示** ([ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx) & [UserSettingsModal.tsx](file:///d:/AnnaDome/src/components/hub/UserSettingsModal.tsx))：
    - [x] 移除與彩色 Emoji 重複疊加的 Lucide 單色線條圖示，僅保留彩色圖示（`⚙️ 設定`、`📤 匯入舊專案 JSON`、`➕ 開啟新旅程`、`💾 本機儲存模式`、`☁️ Firebase 雲端資料庫模式`、`✕`）
- [x] **全面固定為「雙欄同步模式」（左欄表單編輯、右欄唯讀預覽）** ([App.tsx](file:///d:/AnnaDome/src/App.tsx) & [HeaderBar.tsx](file:///d:/AnnaDome/src/components/studio/HeaderBar.tsx))：
    - [x] 移除上方模式切換鈕、多餘的雙欄說明標語及「右側預覽行內編輯」切換按鈕，進入編輯器直接固定採用左右雙欄並排配置（左側表單 `#studio-panel` 專責編輯、右側預覽 `#guide-panel` 保持乾淨唯讀顯示）
- [x] **上方導覽列與標題工具列常駐置頂 (`#sticky-top-header`)** ([HeaderBar.tsx](file:///d:/AnnaDome/src/components/studio/HeaderBar.tsx))：
    - [x] 將頂部深色導覽列（返回專案大廳、正在編輯專案、設定、儲存、建立空白旅程）與「✈️ 旅行手冊一鍵產生器」標題＋「📥 資料備份 / 📤 資料匯入 / 🗑️ 清空本專案內容」整合為常駐置頂 (`sticky top-0 z-40`)，畫面往下捲動時永不被捲走
- [x] **右側即時預覽預設全部展開 (`defaultOpen={true}`)** ([FlightView.tsx](file:///d:/AnnaDome/src/components/guide-view/FlightView.tsx)、[HotelView.tsx](file:///d:/AnnaDome/src/components/guide-view/HotelView.tsx)、[ItineraryView.tsx](file:///d:/AnnaDome/src/components/guide-view/ItineraryView.tsx)、[ShoppingView.tsx](file:///d:/AnnaDome/src/components/guide-view/ShoppingView.tsx)、[GuideContainer.tsx](file:///d:/AnnaDome/src/components/guide-view/GuideContainer.tsx))：
    - [x] 右側手冊預覽的所有折疊區塊（航班、飯店、每日行程規劃、Day 1 ~ N 各日行程、必買採買清單、優惠券與重要憑證）預設全部打開
- [x] **左側編輯區塊與右側即時預覽自動同步對位** ([previewSync.ts](file:///d:/AnnaDome/src/services/previewSync.ts))：
    - [x] 點擊、聚焦、打字編輯或捲動左側任一區塊與單一子項目（`0. 命名與副標題`、`1. 航班 / 單筆航班`、`2. 飯店 / 單筆飯店`、`3. 每日行程 / 單日卡片 / 單一景點時段`、`4. 購物清單`、`5. 優惠券`、`6. 重要文件`）時，右側預覽獨立捲軸 (`#guide-scroll-viewport`) 自動平滑捲動對齊對應的預覽區塊 (`#preview-sync-*`) 並加上外框高亮提示
    - [x] 於 [index.css](file:///d:/AnnaDome/src/styles/index.css) 的 `@media print` 同步解除 `#guide-scroll-viewport` 的高度與捲軸限制並隱藏 `#sticky-top-header`，確保雙欄常駐模式下匯出多頁 PDF 不會被截斷

### 6. 最新追加之 11 項細節優化與功能擴充 (Latest 11 Enhancements)

- [x] **出發日期與結束日期改為唯讀，自動串聯去程與回程航班日期** ([BasicInfoSection.tsx](file:///d:/AnnaDome/src/components/studio/BasicInfoSection.tsx) & [useGuideStore.ts](file:///d:/AnnaDome/src/store/useGuideStore.ts))：
    - [x] 將「出發日期」與「結束日期」設為唯讀 (`readOnly`)，直接自動連動下方「2. 航班時間資訊」中「去程航班」與「回程航班」所選取的日期，並自動更新大廳卡片與 `Day 1 ~ N` 天數日期
- [x] **整合下方「即時預覽 / 下載 PDF / 下載網頁」至頂部「✈️ 旅行手冊一鍵產生器」同一列，點擊開窗預覽並提供下載** ([HeaderBar.tsx](file:///d:/AnnaDome/src/components/studio/HeaderBar.tsx) & [PreviewModal.tsx](file:///d:/AnnaDome/src/components/guide-view/PreviewModal.tsx))：
    - [x] 移除原本固定於畫面最下方的三顆按鈕列，於「✈️ 旅行手冊一鍵產生器」標題同列新增 **「👁️ 即時預覽」** 按鈕
    - [x] 點選「👁️ 即時預覽」後彈出唯讀手冊預覽視窗 ([PreviewModal.tsx](file:///d:/AnnaDome/src/components/guide-view/PreviewModal.tsx))，完整呈現目前編輯好的手冊內容，並於視窗下方固定提供 **「📄 下載 PDF」** 與 **「💾 下載網頁」** 兩顆按鈕
- [x] **大廳卡片封面網址與本機照片上傳即時顯示圖片預覽** ([BasicInfoSection.tsx](file:///d:/AnnaDome/src/components/studio/BasicInfoSection.tsx))：
    - [x] 當「大廳卡片封面圖片」輸入框內存在網址或已上傳本機照片時，立即於該欄位正下方即時顯示封面圖片預覽
- [x] **航班資訊區分為「🛫 去程航班」與「🛬 回程航班」兩大區塊，並改用日期與時間點選器** ([FlightSection.tsx](file:///d:/AnnaDome/src/components/studio/FlightSection.tsx))：
    - [x] 拆分為「去程航班區塊」與「回程航班區塊」，兩個區塊各自具備獨立的 **「`+ 新增去程航班`」** 與 **「`+ 新增回程航班`」** 按鈕
    - [x] 航班時間改為點選日曆開窗 (`<input type="date">`) 與起飛／抵達時間選取器 (`<input type="time">`)，選取後自動格式化為手冊顯示時間並同步連動上方唯讀的出發／結束日期
- [x] **於「7. 電子票券與重要文件 (超連結)」下方新增「📝 8. 備註」純文字章節** ([NoteManager.tsx](file:///d:/AnnaDome/src/components/studio/NoteManager.tsx) & [GuideContainer.tsx](file:///d:/AnnaDome/src/components/guide-view/GuideContainer.tsx))：
    - [x] 新增「📝 8. 備註」章節，僅允許填入純文字 (`<textarea>`)，並即時同步顯示於右側手冊預覽與匯出之 PDF / 網頁中
- [x] **專案大廳「📖 翻閱手冊」直接開窗顯示唯讀手冊，已完成專案預設僅限翻閱並於預覽視窗右上角提供小巧「✏️ 編輯手冊」按鈕** ([ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx) & [PreviewModal.tsx](file:///d:/AnnaDome/src/components/guide-view/PreviewModal.tsx))：
    - [x] 「📜 典藏回憶｜已完成專案」卡片預設只顯示「📖 翻閱手冊」按鈕（不顯示編輯行程按鈕）
    - [x] 點選「📖 翻閱手冊」直接於大廳彈出唯讀手冊預覽視窗，並於預覽視窗右上角提供尺寸精簡的 **「✏️ 編輯手冊」** 按鈕，需要修改時點選即可進入雙欄編輯器
- [x] **專案大廳新增排序下拉選單（依手冊大標題／依出發日期 ＋ 正序／倒序）** ([ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx))：
    - [x] 於專案大廳頂部新增排序控制下拉選單，支援選擇 **「依出發日期」** 或 **「依手冊大標題」** 排序，並提供 **「正序」** 與 **「倒序」** 排列切換
- [x] **系統名稱正名與新增「👥 1. 旅行夥伴」文字框章節（後續章節依序順延為 2 ~ 8）** ([LoginView.tsx](file:///d:/AnnaDome/src/components/auth/LoginView.tsx)、[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)、[CompanionSection.tsx](file:///d:/AnnaDome/src/components/studio/CompanionSection.tsx))：
    - [x] 將大廳與登入頁面的「✈️ 旅伴手冊管理中心」統一改為 **「✈️ 旅遊手冊管理中心」**
    - [x] 於「🌟 0. 旅遊手冊命名與副標題」後方新增獨立文字框章節 **「👥 1. 旅行夥伴」**，並將原 `1. 航班`、`2. 飯店`、`3. 每日行程`、`4. 購物清單`、`5. 電子優惠券`、`6. 電子票券與重要文件`、`7. 備註` 依序往後順延編號為 **`2 ~ 8`**
- [x] **所有專案卡片皆支援自行更換封面圖片（本機照片上傳壓縮同步 Firebase 雲端／貼上網址／14 張精選純圖片庫）與手冊橫幅底圖連動** ([ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)、[BasicInfoSection.tsx](file:///d:/AnnaDome/src/components/studio/BasicInfoSection.tsx)、[imageUtils.ts](file:///d:/AnnaDome/src/services/imageUtils.ts))：
    - [x] 大廳每一張專案卡片（包含「籌備中」、「✈️ 旅行中」與「已完結」專案）左上角皆提供 **「🖼️ 更換封面」** 按鈕，無需進入編輯器即可直接更換封面
    - [x] 支援 **「📁 選擇本機照片上傳」**（透過 Canvas 自動最佳化壓縮轉為 Base64 Data URL 寫入專案 JSON 與 Firebase Realtime Database，換另一台電腦或不同瀏覽器登入皆可直接顯示照片）、**「🔗 貼上網路圖片網址」** 與 **「🎨 14 張通用精選封面圖庫（涵蓋海灘、歐美、夏日、冬日、城市、山林、美食各 2 張純圖片直接點選，無地區限制與文字遮罩）」** 三種方式，並於登入或更換封面時自動與 Firebase 雲端同步
    - [x] **手冊頂部橫幅（Hero Banner）底圖自動連動專案封面圖片** ([HeroBannerView.tsx](file:///d:/AnnaDome/src/components/guide-view/HeroBannerView.tsx) & [singleFileCompiler.ts](file:///d:/AnnaDome/src/services/singleFileCompiler.ts))：手冊預覽、開窗預覽、PDF 與下載網頁的頂部橫幅自動套用該專案的封面圖片作為背景底圖，並搭配左深右透漸層遮罩兼顧視覺質感與文字清晰度
- [x] **正在旅行期間之專案自動顯示「`✈️ 旅行中`」狀態標籤** ([ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx))：
    - [x] 以本機當地時區日期 (`TODAY`) 自動判斷，當專案的 `出發日期 <= TODAY <= 結束日期` 時，大廳卡片右上角自動由「籌備中」切換為翠綠色 **`✈️ 旅行中`** 標籤

- [x] **單一專案「🔗 複製共編連結」與 `/shared_rooms/` 旅伴／訪客共編系統及共編房間權限控管** ([CloudConfigSection.tsx](file:///d:/AnnaDome/src/components/studio/CloudConfigSection.tsx)、[HeaderBar.tsx](file:///d:/AnnaDome/src/components/studio/HeaderBar.tsx)、[ProjectHubView.tsx](file:///d:/AnnaDome/src/components/hub/ProjectHubView.tsx)、[BasicInfoSection.tsx](file:///d:/AnnaDome/src/components/studio/BasicInfoSection.tsx)、[useCloudSync.ts](file:///d:/AnnaDome/src/hooks/useCloudSync.ts)、[LoginView.tsx](file:///d:/AnnaDome/src/components/auth/LoginView.tsx)、[useGuideStore.ts](file:///d:/AnnaDome/src/store/useGuideStore.ts))：
    - [x] **尚未開啟共編之專案預設隱藏共編設定，頂部新增「🤝 開啟共同編輯」按鈕**：點擊編輯行程進入尚未進行共編的專案時，預設先隱藏共編設定區塊；並於頂部標頭「👁️ 即時預覽」按鈕左側新增 **「`🤝 開啟共同編輯`」** 按鈕，點擊後才開啟並展開「共編設定」區塊
    - [x] **共編設定文字精簡化**：區塊標題改為 **「`共編設定`」**、分享按鈕改為 **「`🔗 複製共編連結`」**、欄位標籤改為 **「`共編房間 ID（英文或數字代碼）：`」**
    - [x] **共編房間 ID 權限鎖定（非房間主人設為唯讀 `readOnly`）**：僅共編房間的原始建立者（主人）有權限修改「共編房間 ID」；受邀共編者（不論透過帳號登入、註冊帳號或訪客模式進入共編房間）該欄位強制鎖定為唯讀 (`readOnly`) 並標示「`🔒 唯讀（僅房間主人可修改）`」
    - [x] **大廳區分「個人專案」與「🤝 受邀參與的他人共編專案」，主人端大廳卡片顯示【共編中】提醒小視窗**：
        - [x] 受邀共編者以帳號登入後，於大廳「🧳 籌備與進行中專案」下方獨立出 **「`🤝 受邀參與的他人共編專案`」** 專屬區塊，並於卡片標示藍紫色 **「`👤 擁有者：${project.ownerName}`」** 提醒標籤
        - [x] 在共編專案主人端的大廳卡片內，自動呈現翠綠色 **「`【共編中】旅伴共同編輯已開啟（ID: ...）`」** 提醒小視窗
    - [x] **手冊編輯區「大廳卡片封面圖片（網址或本機上傳）：」獨立移至下一行**：於 `🌟 0. 旅遊手冊命名與副標題` 中，將「出發日期」與「結束日期」並排為同一列，「大廳卡片封面圖片（網址或本機上傳）：」獨立往下移至新的一整行
    - [x] 底層 Firebase 網址對一般會員與訪客完全隱藏（新會員仍可於「⚙️ 設定」自訂自己的 Firebase），並具備雲端空間自動瘦身保護（非 `admin` 帳號於 `/shared_rooms/` 共編時自動剔除大型 Base64 圖片，每間共編房僅約 4KB）

</details>

---

## ✅ 二、 已完成項目 (Completed Features)

<details>
<summary><b>📂 點此展開／收合「基礎與第一階段已完成項目」（共 5 大子標題）</b></summary>

### 1. 核心架構與專案環境

- [x] 建立 **React 18 + TypeScript + Vite + Tailwind CSS + Zustand** 標準專案架構 (`src/`)
- [x] 建立本機免安裝預編譯打包管線 (`bundle.cjs`)，將全部 TypeScript 模組預編譯為純 JavaScript 並注入 [index.html](file:///d:/AnnaDome/index.html) 與 [TravelGuideStudio.html](file:///d:/AnnaDome/TravelGuideStudio.html)
- [x] 建立本地雙埠開發伺服器 ([server.cjs](file:///d:/AnnaDome/server.cjs)，同時支援 `http://localhost:5173` 與 `http://localhost:8080`) 及一鍵啟動腳本 ([啟動網站.bat](file:///d:/AnnaDome/%E5%95%9F%E5%8B%95%E7%B6%B2%E7%AB%99.bat))
- [x] 建立自動化無頭渲染與匯出腳本語法測試 (`smoke-test.cjs`)

### 2. 旅遊手冊管理中心（專案大廳 `#hub-view`）

- [x] **狀態驅動單頁無縫切換 (`activeView: 'hub' | 'generator'`)**：移除舊版鎖死捲軸的 `200vh` 滑動軌道，改以純狀態切換顯示/隱藏，釋放 100% 螢幕空間
- [x] **自動日期分類看板**：
    - [x] 🧳 **籌備與進行中專案**：自動篩選結束日期晚於或等於今日 (`endDate >= TODAY`) 的旅程卡片；若今日剛好介於出發日期與結束日期之間 (`startDate <= TODAY <= endDate`)，卡片右上角自動亮起綠色 **`✈️ 旅行中`** 標籤（尚未出發則顯示 **`籌備中`**）
    - [x] 📜 **典藏回憶｜已完成專案**：自動將結束日期早於今日 (`endDate < TODAY`) 的過往旅程歸檔並標示 **`已完結`**
- [x] **無彈窗直通建立新旅程（「＋ 開啟新旅程」）**：點擊後直接建立獨立專案 ID (`trip_<timestamp>`) 並切換至產生器表單，無需填寫阻斷式彈窗
- [x] **大廳直接匯入舊專案（「📤 匯入舊專案 JSON」）**：上傳 `.json` 備份檔後自動解析航班或飯店日期、建立大廳卡片並自動歸類
- [x] **預載三大完整示範專案（標題前綴標示「(範例)」）**：內建「(範例) 東京 5 日風格隨身手冊」、「(範例) 北海道秋日散策」、「(範例) 胡志明市城市漫遊」完整航班、飯店、每日景點與優惠券明細，且不會因建立自建專案而自動被清除
- [x] **舊版資料自動無損遷移**：自動偵測瀏覽器中舊版單一專案資料並轉存為大廳獨立專案卡片
- [x] **卡片快捷入口與刪除模式保護**：進行中專案提供「✏️ 編輯行程」與「📖 翻閱手冊」；已完成專案預設僅顯示「📖 翻閱手冊」（於預覽視窗右上角提供小巧「✏️ 編輯手冊」按鈕）；卡片左上角提供「🖼️ 更換封面」；點擊大廳右上角「🗑️ 刪除」切換鈕後各卡片才顯示 `✕` 並移入 10 天刪除暫存區

### 3. 頂部迷你導覽列 (`#mini-nav`) 與多專案獨立儲存

- [x] **置頂 44px 深色迷你導覽列 (`#0f172a`)**：僅在進入產生器模式時顯示，返回大廳時自動隱藏
- [x] **「⬅ 返回專案大廳」按鈕**：點擊自動保存當前進度、切換回大廳並即時刷新卡片資訊
- [x] **動態專案名稱標籤**：即時顯示 `正在編輯：<專案名稱>`
- [x] **頂部快捷按鈕**：提供「💾 儲存專案至大廳」與「＋ 建立全新空白旅程」
- [x] **多專案隔離儲存 (`LocalStorage`)**：
    - [x] 大廳索引清單獨立儲存於 `travel_projects_list`
    - [x] 各專案完整行程明細隔離儲存於 `guide_data_<projectId>`
- [x] **表單與大廳卡片雙向即時連動**：修改手冊大標題、出發/結束日期或去回程航班日期時，自動同步更新大廳卡片標題、日期與分類狀態

### 4. 旅行手冊產生器表單 (`#studio-panel`)

- [x] **暫存與備份工具列 (`.storage-bar`)**：支援單一專案「👁️ 即時預覽（開窗預覽並提供下載 PDF / 下載網頁）」、「📥 資料備份 (JSON)」、「📤 資料匯入 (JSON)」、「🗑️ 清空本專案內容」與 300ms Debounce 自動暫存時間提示
- [x] **🌟 0. 旅遊手冊命名與副標題**：
    - [x] 支援大標題、副標題、唯讀出發日期（自動串聯去程航班日期）、唯讀結束日期（自動串聯回程航班日期）、大廳封面圖片網址設定（輸入網址後於下方即時顯示封面圖片預覽）
    - [x] **首頁重點摘要支援多行分段**：輸入換行符號可完整保留段落結構
- [x] **👥 1. 旅行夥伴**：提供獨立文字框填寫同行旅行夥伴名單或備註，並同步顯示於手冊封面橫幅、PDF 與單檔下載網頁中
- [x] **✈️ 2. 航班時間資訊（去程／回程分區與多航段管理）**：
    - [x] 區分為「🛫 去程航班區塊」與「🛬 回程航班區塊」，各自提供 **「`+ 新增去程航班`」** 與 **「`+ 新增回程航班`」** 按鈕，支援不限數量的航段新增與個別刪除
    - [x] 每段航班支援自訂航段標籤及日期開窗 (`<input type="date">`)、起飛時間 (`<input type="time">`)、抵達時間 (`<input type="time">`)、班機代號、出發機場、抵達機場
    - [x] 去程首段與回程末段日期自動連動上方唯讀的「出發日期 / 結束日期」以及下方 `Day 1 ~ N` 的日期與星期幾前綴
- [x] **🏨 3. 飯店資訊**：支援多筆飯店新增/刪除、原生日期選取器 (`<input type="date">`)、中英文飯店名稱、地址（自動綁定 Google Maps）與交通引導
- [x] **🗓️ 4. 每日行程與景點規劃**：
    - [x] **整天行程排序**：同時支援滑鼠拖曳排序 (`☰ 拖曳整天排序`) 與 `⬆` / `⬇` 按鈕上下移動
    - [x] **景點時段排序**：同時支援滑鼠拖曳排序 (`☰ 拖曳排序`) 與 `⬆` / `⬇️` 按鈕上下移動
    - [x] **景點名稱與【☑ 自動轉地圖】開關按鈕**：將欄位文字精簡為 `景點名稱：`，並在旁邊設置 `☑ 自動轉地圖` 切換按鈕；使用者勾選後才會在手冊產生景點地圖連結，未勾選則不顯示連結
    - [x] **內嵌「🗺️ Google Maps 導航生成器」**：填寫起點與終點（未填起點自動帶入上一站名稱）並點擊 `⚡ 生成`，自動產出導航路線網址
- [x] **🛍️ 5. 購物採買清單**：支援品項類別與購買地點/退稅提醒之動態新增與刪除
- [x] **🎁 6. 電子優惠券設定**：支援優惠券名稱、條碼網址與多行折扣條件說明
- [x] **📎 7. 電子票券與重要文件 (超連結)**：支援 QR Code、登機證或雲端 PDF 網址綁定
- [x] **📝 8. 備註（純文字章節）**：位於電子票券與重要文件下方，僅允許輸入純文字，並同步顯示於手冊預覽、PDF 與單檔網頁中

### 5. 手冊預覽 (`#guide-panel` & `PreviewModal`) 與匯出引擎

- [x] **頂部「👁️ 即時預覽」唯讀開窗整合下載功能 ([PreviewModal.tsx](file:///d:/AnnaDome/src/components/guide-view/PreviewModal.tsx))**：將「👁️ 即時預覽」、「📄 下載 PDF」、「💾 下載網頁」整合至「✈️ 旅行手冊一鍵產生器」標題同列，點選「👁️ 即時預覽」（或從大廳點擊「📖 翻閱手冊」）即開窗顯示唯讀手冊完整內容，並於視窗下方提供「📄 下載 PDF」與「💾 下載網頁」兩顆按鈕
- [x] **雙欄右側唯讀即時預覽 (`isEditable={false}`)**：編輯器維持左欄表單編輯、右欄唯讀即時預覽並自動同步捲動對位，移除多餘的行內編輯切換鈕以防止誤觸
- [x] **方案 C 自動全選互動元件 (`SchemeCPlaceholder.tsx`)**：
    - [x] 欄位空白時強制顯示 `#9ca3af` 淺灰斜體 `(例：...)`
    - [x] 聚焦點擊空白預設文字時自動全選，打字直接覆蓋；失焦清空自動恢復預設提示
    - [x] 支援 `multiline` 多段落換行（`innerText` + `whitespace-pre-line`），在預覽區按 `Enter` 分段也能完整保留
- [x] **📄 無痕全展開 PDF 列印引擎 (`pdfExport.ts` & `index.css`)**：
    - [x] 採用 `<details open>` + `.accordion-collapsed` 架構繞過 Chromium Shadow DOM 列印限制
    - [x] 點擊「📄 下載 PDF」或按 `Ctrl + P` 時，100% 自動展開所有天數與折疊區塊、隱藏後台表單與按鈕，並防止單一景點卡片跨頁截斷
- [x] **💾 單檔離線 HTML 編譯器 (`singleFileCompiler.ts`)**：
    - [x] 匯出時直接將完整手冊 DOM 靜態預渲染（Pre-render）寫入 `#guide-app-root`
    - [x] 移除會阻塞離線開啟的外部 Google Fonts `<link>`，達成 100% 零外部網路請求
    - [x] 延遲 60 秒釋放 `Blob URL`（解決點擊下載後立即開啟變成 `about:blank` 空白頁的問題）
    - [x] 匯出之單一 `.html` 內建行內編輯、全部展開/收合、PDF 列印與 Firebase 同步能力

</details>
