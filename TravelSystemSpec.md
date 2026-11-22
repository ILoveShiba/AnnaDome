# 旅行手冊產生器 (Travel Guide Generator) - React 重構技術規格書

本規格書專為使用 **React 18+ / TypeScript / Vite** 重構「旅行手冊一鍵產生器」制定，定義了系統架構、元件拆分階層、狀態管理模型、方案 C 互動機制、Firebase 同步演算法，以及前端單檔 HTML 編譯技術規範。

---

## 1. 系統架構與設計模式 (Architecture & Design Patterns)

### 1.1 核心架構目標
1. **雙模運行模式 (Dual-Mode Operation)**：
   * **產生器模式 (Generator / Studio View)**：提供結構化表單、日期運算、拖曳排序、Google 導航網址生成與資料持久化暫存。
   * **手冊檢視模式 (Guide Preview & Standalone View)**：卡片化折疊介面、行內直接編輯 (In-place Editing)、PDF/列印專用樣式。
2. **單檔離線匯出引擎 (Single-File Compilation Engine)**：
   * 系統不依賴後端伺服器，直接在瀏覽器前端透過範本引擎或字串組裝，將目前 React 狀態編譯為**完全自包含 (Self-Contained) 的單一 HTML 檔案**供使用者下載分享。
3. **無縫雲端與時間戳記防護 (Timestamp Guard Synchronization)**：
   * 透過時間戳記比對 (`updatedAt` vs `LOCAL_BUILD_TIME`)，解決本地新匯出手冊被雲端舊快取覆蓋的競態問題。

---

## 2. 核心資料模型 (TypeScript Schemas)

```typescript
// src/types/guide.ts

export interface HotelInfo {
  id: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  name: string;
  engName?: string;
  address: string;
  trans: string;
}

export interface SpotItem {
  id: string;
  time: string;      // 例："14:00 - 16:00"
  spot: string;      // 景點名稱，失焦自動綁定 Google Maps Search
  trans: string;     // 交通形式說明
  routeUrl: string;  // Google Maps Direction URL
  note: string;      // 備註說明
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  title: string;     // 例："Day 1 (08/15 六)｜抵達東京．銀座探索"
  spots: SpotItem[];
}

export interface ShoppingItem {
  id: string;
  cat: string;       // 採買類別 / 品項
  desc: string;      // 購買地點與退稅提醒
}

export interface CouponItem {
  id: string;
  title: string;
  url: string;
  desc: string;
}

export interface DocItem {
  id: string;
  title: string;
  note: string;
  linkUrl: string;   // Google Drive 憑證或雲端 PDF 連結
}

export interface TravelGuideData {
  // 雲端與手冊基礎設定
  firebaseDbUrl: string;
  firebaseRoomId: string;
  guideTitle: string;
  guideSubtitle: string;
  guideSummary: string;

  // 航班資訊（雙程 4 欄位拆解）
  flightInTime: string;
  flightInNo: string;
  flightInDep: string;
  flightInArr: string;
  flightOutTime: string;
  flightOutNo: string;
  flightOutDep: string;
  flightOutArr: string;

  // 各大模組集合
  hotels: HotelInfo[];
  days: DayPlan[];
  shopping: ShoppingItem[];
  coupons: CouponItem[];
  docs: DocItem[];
  
  // 構建版本識別
  buildTime?: string; // ISO String
}
```

---

## 3. 專案目錄結構 (React Project Structure)

```
travel-guide-app/
├── public/
│   ├── favicon.ico
│   └── manifest.json             # PWA 應用程式清單
├── src/
│   ├── assets/                   # 靜態圖示與 SVG 標誌
│   ├── components/
│   │   ├── common/               # 原子級通用 UI 元件
│   │   │   ├── Button.tsx
│   │   │   ├── TextInput.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── DetailsAccordion.tsx # 支援預設全收合的細節折疊卡片
│   │   │   └── SchemeCPlaceholder.tsx # 方案 C 自動全選行內文字元件
│   │   ├── studio/               # 產生器後台編輯元件
│   │   │   ├── HeaderBar.tsx
│   │   │   ├── CloudConfigSection.tsx
│   │   │   ├── BasicInfoSection.tsx
│   │   │   ├── FlightSection.tsx
│   │   │   ├── HotelManager.tsx
│   │   │   ├── ItineraryPlanner/
│   │   │   │   ├── DayCard.tsx
│   │   │   │   ├── SpotCard.tsx
│   │   │   │   └── RouteGeneratorDialog.tsx # Google 路線快速產生器
│   │   │   ├── ShoppingManager.tsx
│   │   │   ├── CouponManager.tsx
│   │   │   └── DocManager.tsx
│   │   └── guide-view/           # 產出物手冊預覽及獨立手冊元件
│   │       ├── GuideContainer.tsx
│   │       ├── HeroBannerView.tsx
│   │       ├── FlightView.tsx
│   │       ├── HotelView.tsx
│   │       ├── ItineraryView.tsx
│   │       ├── ShoppingView.tsx
│   │       └── FloatingActionBar.tsx    # PDF 匯出與模式切換按鈕
│   ├── hooks/
│   │   ├── useAutoSave.ts        # 本機 LocalStorage 自動寫入 (Debounce 300ms)
│   │   ├── useDateInference.ts   # 去程時間推算 Day 1 ~ N 日期
│   │   └── useCloudSync.ts       # Firebase Realtime DB 版本安全輪詢與更新
│   ├── store/
│   │   └── useGuideStore.ts      # Zustand 全域狀態 (整合 CRUD Action 與 Immer)
│   ├── services/
│   │   ├── googleMaps.ts         # 搜尋與導航路線 URL 封裝函式
│   │   ├── singleFileCompiler.ts # 將當前 React 資料編譯注入為單檔 HTML
│   │   └── pdfExport.ts          # 呼叫無痕 @media print 匯出
│   ├── types/
│   │   └── guide.ts
│   ├── styles/
│   │   └── index.css             # Tailwind 與 Print 專用樣式規則
│   ├── App.tsx                   # 路由或主檢視切換 (Studio vs Preview)
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. 關鍵模組實作規格與 React 設計模式

### 4.1 方案 C：Placeholder 互動式元件 (`SchemeCPlaceholder.tsx`)
* **需求規格**：
  * 當值為空時，文字呈現 `(例：...)`，字體為淺灰（`#9ca3af`）與斜體（`italic`）。
  * 點擊/聚焦時自動調用 `window.getSelection()` 全選文字，輸入即直接覆蓋，無需逐字刪除。
  * 失焦（`blur`）時，若輸入了新文字則移除 placeholder 樣式；若被使用者全刪空，自動恢復預設 placeholder。

```tsx
// src/components/common/SchemeCPlaceholder.tsx
import React, { useRef } from 'react';
import clsx from 'clsx';

interface SchemeCPlaceholderProps {
  value: string;
  placeholder: string;
  isEditable: boolean;
  onValueChange: (newValue: string) => void;
  className?: string;
}

export const SchemeCPlaceholder: React.FC<SchemeCPlaceholderProps> = ({
  value,
  placeholder,
  isEditable,
  onValueChange,
  className,
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const isDefault = !value || value.trim() === '';
  const displayContent = isDefault ? `(${placeholder})` : value;

  const handleFocus = () => {
    if (!isEditable || !spanRef.current) return;
    if (isDefault) {
      const range = document.createRange();
      range.selectNodeContents(spanRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const rawText = e.currentTarget.textContent?.trim() || '';
    if (!rawText || rawText === `(${placeholder})`) {
      onValueChange('');
    } else {
      onValueChange(rawText);
    }
  };

  return (
    <span
      ref={spanRef}
      contentEditable={isEditable}
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={clsx(
        'transition-colors',
        isEditable && 'outline-dashed outline-1 outline-amber-600/60 bg-amber-50/20 px-1 rounded',
        isDefault ? 'text-gray-400 italic' : 'text-gray-800 font-normal',
        className
      )}
    >
      {displayContent}
    </span>
  );
};
```

---

### 4.2 狀態管理與業務邏輯 (`useGuideStore.ts`)
採用 **Zustand** 管理全域表單資料，支援日期推算與拖曳排序更新。

```typescript
// src/store/useGuideStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TravelGuideData, SpotItem, HotelInfo } from '../types/guide';

interface GuideState extends TravelGuideData {
  updateField: <K extends keyof TravelGuideData>(field: K, value: TravelGuideData[K]) => void;
  setFlightInTime: (timeStr: string) => void;
  moveSpot: (dayIndex: number, spotIndex: number, direction: 'UP' | 'DOWN') => void;
  addSpot: (dayIndex: number) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  addHotel: () => void;
  updateHotel: (id: string, partial: Partial<HotelInfo>) => void;
  deleteHotel: (id: string) => void;
  importFromJSON: (data: TravelGuideData) => void;
  resetToDefault: () => void;
}

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      // 初始狀態定義 (省略空字串設定)
      firebaseDbUrl: '',
      firebaseRoomId: '',
      guideTitle: '',
      guideSubtitle: '',
      guideSummary: '',
      flightInTime: '',
      flightInNo: '',
      flightInDep: '',
      flightInArr: '',
      flightOutTime: '',
      flightOutNo: '',
      flightOutDep: '',
      flightOutArr: '',
      hotels: [],
      days: [],
      shopping: [],
      coupons: [],
      docs: [],

      updateField: (field, value) => set({ [field]: value }),

      // 航班日期自動推算所有天數標題前綴
      setFlightInTime: (timeStr) => {
        set({ flightInTime: timeStr });
        const dateMatch = timeStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (!dateMatch) return;

        const startDate = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

        const updatedDays = get().days.map((day, idx) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + idx);
          const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
          const dd = String(currentDate.getDate()).padStart(2, '0');
          const w = weekdays[currentDate.getDay()];
          const prefix = `Day ${idx + 1} (${mm}/${dd} ${w})｜`;

          const existingTitle = day.title;
          const userSuffix = existingTitle.includes('｜') ? existingTitle.split('｜')[1] : existingTitle.replace(/^Day \d+/, '');
          return { ...day, title: prefix + (userSuffix.trim() || '當日行程規劃') };
        });

        set({ days: updatedDays });
      },

      // 景點排序
      moveSpot: (dayIndex, spotIndex, direction) => {
        const targetDay = get().days[dayIndex];
        if (!targetDay) return;
        const newSpots = [...targetDay.spots];
        const swapTarget = direction === 'UP' ? spotIndex - 1 : spotIndex + 1;

        if (swapTarget < 0 || swapTarget >= newSpots.length) return;
        const temp = newSpots[spotIndex];
        newSpots[spotIndex] = newSpots[swapTarget];
        newSpots[swapTarget] = temp;

        const updatedDays = [...get().days];
        updatedDays[dayIndex] = { ...targetDay, spots: newSpots };
        set({ days: updatedDays });
      },

      // 飯店新增與更新
      addHotel: () => set((state) => ({
        hotels: [
          ...state.hotels,
          {
            id: crypto.randomUUID(),
            checkIn: '',
            checkOut: '',
            name: '',
            address: '',
            trans: '',
          },
        ],
      })),

      updateHotel: (id, partial) => set((state) => ({
        hotels: state.hotels.map((h) => (h.id === id ? { ...h, ...partial } : h)),
      })),

      deleteHotel: (id) => set((state) => ({
        hotels: state.hotels.filter((h) => h.id !== id),
      })),

      // ...其餘 CRUD Actions
    }),
    { name: 'travel_guide_store' }
  )
);
```

---

### 4.3 雲端雙向同步與版本時間戳記防護 (`useCloudSync.ts`)

```typescript
// src/hooks/useCloudSync.ts
import { useEffect } from 'react';
import { useGuideStore } from '../store/useGuideStore';

export const useCloudSync = (localBuildTime: string) => {
  const { firebaseDbUrl, firebaseRoomId, importFromJSON } = useGuideStore();

  useEffect(() => {
    if (!firebaseDbUrl || !firebaseRoomId) return;

    let base = firebaseDbUrl.trim();
    if (!base.endsWith('/')) base += '/';
    const endpoint = `${base}guides/${encodeURIComponent(firebaseRoomId)}.json`;

    const syncWithCloud = async () => {
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        const cloudTimestamp = data?.updatedAt ? new Date(data.updatedAt).getTime() : 0;
        const localTimestamp = new Date(localBuildTime).getTime();

        if (data?.state && cloudTimestamp > localTimestamp) {
          // 雲端資料較新：執行更新
          importFromJSON(data.state);
        } else {
          // 本地資料較新：推播覆蓋雲端，校正遠端舊紀錄
          const currentState = useGuideStore.getState();
          await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              state: currentState,
              updatedAt: new Date().toISOString(),
            }),
          });
        }
      } catch (err) {
        console.warn('離線模式運行中，無法存取 Firebase:', err);
      }
    };

    syncWithCloud();
  }, [firebaseDbUrl, firebaseRoomId, localBuildTime]);
};
```

---

### 4.4 單檔 HTML 編譯服務 (`singleFileCompiler.ts`)
* **核心責任**：
  1. 將目前 Zustand Store 中的最新資料序列化為 JSON。
  2. 提取出打包後的純 CSS（Tailwind 編譯產物）與簡潔的 Vanilla JS / 輕量腳本。
  3. 將完整內容包裝為一個**可雙擊開啟、離線可用、且具有原生列印樣式的獨立 HTML**。

```typescript
// src/services/singleFileCompiler.ts
import { TravelGuideData } from '../types/guide';

export const compileToSingleHtml = (data: TravelGuideData): string => {
  const currentBuildTime = new Date().toISOString();
  
  // 組裝完整的 HTML、Tailwind Inline 樣式與輕量 DOM 互動腳本
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${data.guideTitle || '旅遊手冊'}</title>
  <style>
    /* 內嵌完整核心手冊樣式與列印樣式 (@media print) */
    ${/* 注入產出的獨立樣式碼 */ ''}
  </style>
</head>
<body>
  <div id="guide-app-root">
    ${/* 靜態預渲染出的手冊 DOM 結構 */ ''}
  </div>
  <script>
    const INITIAL_DATA = ${JSON.stringify(data)};
    const LOCAL_BUILD_TIME = "${currentBuildTime}";
    // 注入行內編輯、地圖搜尋自動更新、全選 Placeholder 引擎與 Firebase 同步腳本
  <\/script>
</body>
</html>`;
};
```

---

## 5. UI 與排版設計標準規範

| 模組 | 檢視模式 (Preview) 規格 | 編輯模式 (Edit Mode) 額外控制項 |
| :--- | :--- | :--- |
| **頂部導航** | 顯示行程主標題、副標題、摘要卡片 | 標題可直接點擊編輯；空白時呈現灰階斜體 `(大標題)` |
| **航班時間** | 去/回程均拆分為 `時間`、`班機代碼`、`出發機場`、`抵達機場` 4 個獨立欄位 | 點選 Placeholder 自動全選文字 |
| **住宿飯店** | 顯示飯店名稱（附 Google Maps 連結）、地址、交通與入住期間 | 提供 **「➕ 新增飯店」**、**「✕ 刪除飯店」**；日期支援原生 `<input type="date">` 選取器 |
| **每日行程** | 景點名稱失焦自動換 Google Maps URL；交通路線支援 Google 導航路線按鈕 | 每個景點時段提供 **「⬆」**、**「⬇」** 快速排序與刪除；提供 **「📍 點我編輯可生成 Google 路線」** 按鈕 |
| **採買清單** | 雙欄式表格：`類別` 與 `建議地點與提醒`（無第三欄操作鈕） | 支援列新增與內文字編輯 |
| **折疊選單** | 所有主選單及 Day 1 ~ N 子選單**預設收合**（移除 `open` 屬性） | 保持一致折疊行為 |
| **列印模式** | 觸發 `window.print()` 時強制展開所有折疊區塊，隱藏管理與編輯按鈕，卡片設定 `break-inside: avoid` | 列印完成自動恢復原本折疊狀態 |

---

## 6. 相依套件設定 (`package.json`)

```json
{
  "name": "react-travel-guide-app",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.2",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.2",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5",
    "vite": "^5.2.11",
    "vite-plugin-pwa": "^0.20.0"
  }
}
```