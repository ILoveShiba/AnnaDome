import { create } from 'zustand';
import {
  ProjectMeta,
  TrashProjectEntry,
  TravelGuideData,
  FlightItem,
  SpotItem,
  HotelInfo,
  DayPlan,
  ShoppingItem,
  CouponItem,
  DocItem,
} from '../types/guide';
import { useAuthStore, loadUserSettings } from './useAuthStore';
import {
  syncProjectToLocalFolder,
  moveProjectFileToLocalTrash,
  removeProjectFileFromLocalTrash,
} from '../services/localFolderSync';
import {
  pushEntireHubToFirebase,
  pullEntireHubFromFirebase,
} from '../services/hubCloudSync';

export const HUB_STORAGE_KEY = 'travel_projects_list';
export const GUIDE_PREFIX = 'guide_data_';
export const TRASH_STORAGE_PREFIX = 'travel_projects_trash_';
export const TRASH_RETENTION_DAYS = 10;
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function getActiveUserId(): string {
  return useAuthStore.getState().currentUser?.userId || 'guest';
}

function getHubKeyForUser(userId: string): string {
  return `${HUB_STORAGE_KEY}_${userId}`;
}

function getGuideKeyForUser(userId: string, projectId: string): string {
  return `${GUIDE_PREFIX}${userId}_${projectId}`;
}

function getTrashKeyForUser(userId: string): string {
  return `${TRASH_STORAGE_PREFIX}${userId}`;
}

/**
 * 載入該使用者的「刪除暫存區」專案清單，並自動清除已放滿 10 天的過期專案
 */
function loadAndPurgeUserTrash(userId: string): TrashProjectEntry[] {
  const trashKey = getTrashKeyForUser(userId);
  const raw = safeGetStorage(trashKey);
  if (!raw) return [];
  try {
    const parsed: TrashProjectEntry[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const valid = parsed.filter((item) => {
      if (!item || !item.project) return false;
      const exp = item.expiresAt ? new Date(item.expiresAt).getTime() : 0;
      const del = item.deletedAt ? new Date(item.deletedAt).getTime() : 0;
      if (exp && now >= exp) return false;
      if (del && now - del >= TRASH_RETENTION_MS) return false;
      return true;
    });
    if (valid.length !== parsed.length) {
      safeSetStorage(trashKey, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

function getGlobalFirebaseUrlForUser(userId: string): string {
  const settings = loadUserSettings(userId);
  return settings.storageMode === 'firebase' ? (settings.firebaseDbUrl || '').trim() : '';
}

export const SAMPLE_PROJECT_IDS = new Set([
  'tokyo-2026',
  'sapporo-2026',
  'hcmc-2026',
]);

export function isSampleProjectId(projectId: string): boolean {
  return SAMPLE_PROJECT_IDS.has(projectId);
}

/**
 * 取消「有自建專案時自動清除 3 個範例專案」機制，
 * 並確保清單內若包含 3 個範例專案時，其標題前方皆帶有「(範例)」前綴字樣。
 */
function purgeSampleProjectsIfHasCustomProjects(
  userId: string,
  projects: ProjectMeta[]
): ProjectMeta[] {
  let updated = false;
  const normalized = projects.map((p) => {
    if (isSampleProjectId(p.id) && p.title && !p.title.startsWith('(範例)')) {
      updated = true;
      const newTitle = `(範例) ${p.title}`;
      const gKey = getGuideKeyForUser(userId, p.id);
      const gRaw = safeGetStorage(gKey);
      if (gRaw) {
        try {
          const parsedGuide = JSON.parse(gRaw);
          if (parsedGuide.guideTitle && !String(parsedGuide.guideTitle).startsWith('(範例)')) {
            parsedGuide.guideTitle = `(範例) ${parsedGuide.guideTitle}`;
            safeSetStorage(gKey, JSON.stringify(parsedGuide));
          }
        } catch {}
      }
      return { ...p, title: newTitle };
    }
    return p;
  });

  if (updated) {
    safeSetStorage(getHubKeyForUser(userId), JSON.stringify(normalized));
  }
  return normalized;
}

export const DEFAULT_PROJECTS: ProjectMeta[] = [
  {
    id: 'tokyo-2026',
    title: '(範例) 東京 5 日風格隨身手冊',
    startDate: '2026-11-20',
    endDate: '2026-11-24',
    cover:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sapporo-2026',
    title: '(範例) 北海道秋日散策',
    startDate: '2026-12-08',
    endDate: '2026-12-12',
    cover:
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hcmc-2026',
    title: '(範例) 胡志明市城市漫遊',
    startDate: '2026-04-30',
    endDate: '2026-05-03',
    cover:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80',
  },
];

export const DEFAULT_SAMPLE_DATA: TravelGuideData = {
  firebaseDbUrl: '',
  firebaseRoomId: 'tokyo-2026',
  guideTitle: '(範例) 東京 5 日風格隨身手冊',
  guideSubtitle: '東京深秋漫步 ｜ 11/20 (五) － 11/24 (二)',
  guideSummary:
    '• 精選東京市區與近郊楓葉名所，結合米其林星級拉麵、百年壽喜燒與銀座精品逛街路線。\n• 所有景點皆已綁定 Google Maps 導航與乘換案內路線。\n• 入境前請確認已完成 Visit Japan Web 登錄並截圖 QR Code。',
  companions: 'Anna、Charles',
  startDate: '2026-11-20',
  endDate: '2026-11-24',
  coverUrl:
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
  flights: [
    {
      id: 'flight-in-1',
      direction: 'outbound',
      type: '去程航班',
      date: '2026-11-20',
      depTime: '08:30',
      arrTime: '12:35',
      time: '2026/11/20(五) 08:30 > 12:35',
      flightNo: 'JX800 星宇航空',
      dep: '桃園機場 T1',
      arr: '成田機場 T2',
    },
    {
      id: 'flight-out-1',
      direction: 'inbound',
      type: '回程航班',
      date: '2026-11-24',
      depTime: '14:10',
      arrTime: '17:15',
      time: '2026/11/24(二) 14:10 > 17:15',
      flightNo: 'JX801 星宇航空',
      dep: '成田機場 T2',
      arr: '桃園機場 T1',
    },
  ],
  flightInTime: '2026/11/20(五) 08:30 > 12:35',
  flightInNo: 'JX800 星宇航空',
  flightInDep: '桃園機場 T1',
  flightInArr: '成田機場 T2',
  flightOutTime: '2026/11/24(二) 14:10 > 17:15',
  flightOutNo: 'JX801 星宇航空',
  flightOutDep: '成田機場 T2',
  flightOutArr: '桃園機場 T1',
  hotels: [
    {
      id: 'hotel-1',
      checkIn: '2026-11-20',
      checkOut: '2026-11-22',
      name: '銀座三井花園飯店',
      engName: 'Mitsui Garden Hotel Ginza Premier',
      address: '東京都中央區銀座 8-13-1',
      trans: '成田機場搭乘 Skyliner 至上野站，轉乘銀座線至「新橋站」1號出口步行 4 分鐘',
    },
    {
      id: 'hotel-2',
      checkIn: '2026-11-22',
      checkOut: '2026-11-24',
      name: '澀谷東急卓越大飯店',
      engName: 'Shibuya Excel Hotel Tokyu',
      address: '東京都澀谷區道玄坂 1-12-2',
      trans: 'JR / 東京Metro「澀谷站」直結，步行 2 分鐘即達飯店大廳',
    },
  ],
  days: [
    {
      id: 'day-1',
      dayNumber: 1,
      title: 'Day 1 (11/20 五)｜抵達東京．銀座建築與百年洋食探索',
      spots: [
        {
          id: 'spot-101',
          time: '12:35 - 14:30',
          spot: '成田國際機場 第二航廈',
          enableMapLink: true,
          trans: '搭乘京成電鐵 Skyliner 特急 (約 41 分鐘直達上野)',
          routeUrl:
            'https://www.google.com/maps/dir/%E6%88%90%E7%94%B0%E5%9C%8B%E9%9A%9B%E6%A9%9F%E5%A0%B4/%E9%8A%80%E5%BA%A7%E4%B8%89%E4%BA%95%E8%8A%B1%E5%9C%92%E9%A3%AF%E5%BA%97',
          note: '領取 Suica 與兌換 JR 東京廣域周遊券，先至飯店寄放行李。',
        },
        {
          id: 'spot-102',
          time: '15:30 - 18:00',
          spot: 'GINZA SIX 銀座六丁目',
          enableMapLink: true,
          trans: '自飯店步行約 6 分鐘',
          routeUrl:
            'https://www.google.com/maps/dir/%E9%8A%80%E5%BA%A7%E4%B8%89%E4%BA%95%E8%8A%B1%E5%9C%92%E9%A3%AF%E5%BA%97/GINZA+SIX',
          note: '逛蔦屋書店、頂樓空中花園俯瞰銀座街景，B2 品嚐中村藤吉抹茶甜點。',
        },
      ],
    },
    {
      id: 'day-2',
      dayNumber: 2,
      title: 'Day 2 (11/21 六)｜淺草雷門下町風情・晴空塔夕陽夜景',
      spots: [
        {
          id: 'spot-201',
          time: '09:30 - 12:00',
          spot: '淺草寺 雷門',
          enableMapLink: true,
          trans: '東京Metro銀座線「銀座站」直達「淺草站」1號出口',
          routeUrl: 'https://www.google.com/maps/dir/%E9%8A%80%E5%BA%A7%E7%AB%99/%E6%B7%BA%E8%8D%89%E5%AF%BA',
          note: '仲見世通品嚐人形燒、淺草炸肉餅，參拜觀音本堂並抽籤。',
        },
        {
          id: 'spot-202',
          time: '14:30 - 18:30',
          spot: '東京晴空塔 Tokyo Skytree',
          enableMapLink: true,
          trans: '經隅田川步道散步前往約 15 分鐘',
          routeUrl:
            'https://www.google.com/maps/dir/%E6%B7%BA%E8%8D%89%E5%AF%BA/%E6%9D%B1%E4%BA%AC%E6%99%B4%E7%A9%BA%E5%A1%94',
          note: '預約 16:00 登上 350m 天望甲板欣賞日落與富士山剪影。',
        },
      ],
    },
  ],
  shopping: [
    {
      id: 'shop-1',
      cat: '1. 合利他命 EX Plus / 第一三共胃腸藥',
      desc: '松本清或大國藥妝（澀谷店 / 銀座店），滿 5,500 日圓出示護照直接免稅 10%。',
    },
    {
      id: 'shop-2',
      cat: '2. NY Perfect Cheese 起司奶油脆餅',
      desc: '東京車站一番街或京王百貨新宿店，建議早上 10:30 前購買避免完售。',
    },
  ],
  coupons: [
    {
      id: 'coupon-1',
      title: '🐧 唐吉訶德 Don Quijote 免稅 10% + 最高 7% 折價券',
      url: 'https://www.djapanpass.com/coupon/0025120103',
      desc: '• 消費滿 10,000 日圓（未稅）享 10% 免稅 + 5% OFF\n• 結帳時請開啟手機畫面讓店員掃描條碼',
    },
  ],
  docs: [
    {
      id: 'doc-1',
      title: 'Visit Japan Web 入境檢疫與海關申報 QR Code',
      note: '下機後連上機場 Wi-Fi 開啟，或提前截圖備用。',
      linkUrl: 'https://vjw-lp.digital.go.jp/zh-hant/',
    },
  ],
  generalNote: '• 日本電壓為 100V（雙平腳插座），台灣兩孔插頭可直接使用。\n• 緊急聯絡電話：旅外國人急難救助 +81-3-3280-7811。',
  buildTime: new Date().toISOString(),
};

const SAPPORO_SAMPLE_DATA: TravelGuideData = {
  ...DEFAULT_SAMPLE_DATA,
  firebaseRoomId: 'sapporo-2026',
  guideTitle: '(範例) 北海道秋日散策',
  guideSubtitle: '札幌・小樽・定山溪 5 日 ｜ 12/08 (二) － 12/12 (六)',
  guideSummary: '• 北海道冬初雪景與湯咖哩、小樽運河硝子工房巡禮。\n• 建議攜帶防滑防水雪靴與保暖發熱衣。',
  startDate: '2026-12-08',
  endDate: '2026-12-12',
  coverUrl:
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
  flights: [
    {
      id: 'flight-sap-1',
      direction: 'outbound',
      type: '去程航班',
      date: '2026-12-08',
      depTime: '08:35',
      arrTime: '13:15',
      time: '2026/12/08(二) 08:35 > 13:15',
      flightNo: 'BR116 長榮航空',
      dep: '桃園機場 T2',
      arr: '新千歲機場',
    },
    {
      id: 'flight-sap-2',
      direction: 'inbound',
      type: '回程航班',
      date: '2026-12-12',
      depTime: '15:20',
      arrTime: '19:05',
      time: '2026/12/12(六) 15:20 > 19:05',
      flightNo: 'BR115 長榮航空',
      dep: '新千歲機場',
      arr: '桃園機場 T2',
    },
  ],
  flightInTime: '2026/12/08(二) 08:35 > 13:15',
  flightInNo: 'BR116 長榮航空',
  flightInDep: '桃園機場 T2',
  flightInArr: '新千歲機場',
  flightOutTime: '2026/12/12(六) 15:20 > 19:05',
  flightOutNo: 'BR115 長榮航空',
  flightOutDep: '新千歲機場',
  flightOutArr: '桃園機場 T2',
  hotels: [
    {
      id: 'hotel-sap-1',
      checkIn: '2026-12-08',
      checkOut: '2026-12-12',
      name: 'JR Tower 日航札幌飯店',
      engName: 'JR Tower Hotel Nikko Sapporo',
      address: '北海道札幌市中央區北5條西2丁目5番地',
      trans: '新千歲機場搭乘快速 Airport 號 37 分鐘直達「JR 札幌站」東改札口直結',
    },
  ],
  days: [
    {
      id: 'day-sap-1',
      dayNumber: 1,
      title: 'Day 1 (12/08 二)｜抵達新千歲．札幌車站與大通公園白色燈樹節',
      spots: [
        {
          id: 'spot-sap-101',
          time: '14:30 - 17:00',
          spot: 'JR 札幌車站 & 白色戀人公園',
          enableMapLink: true,
          trans: '搭乘 JR 快速 Airport 至札幌站轉東西線至宮之澤站',
          routeUrl: 'https://www.google.com/maps/dir/札幌駅/白い恋人パーク',
          note: '參觀巧克力工廠與歐風庭園點燈。',
        },
      ],
    },
  ],
};

const HCMC_SAMPLE_DATA: TravelGuideData = {
  ...DEFAULT_SAMPLE_DATA,
  firebaseRoomId: 'hcmc-2026',
  guideTitle: '(範例) 胡志明市城市漫遊',
  guideSubtitle: '法式殖民建築與精品咖啡 4 日 ｜ 04/30 (四) － 05/03 (日)',
  guideSummary: '• 第一郡粉紅教堂、中央郵局、濱城市場與越式河粉美食探索。\n• 當地交通建議全程使用 Grab App 叫車。',
  startDate: '2026-04-30',
  endDate: '2026-05-03',
  coverUrl:
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80',
  flights: [
    {
      id: 'flight-hcmc-1',
      direction: 'outbound',
      type: '去程航班',
      date: '2026-04-30',
      depTime: '07:30',
      arrTime: '10:00',
      time: '2026/04/30(四) 07:30 > 10:00',
      flightNo: 'VN571 越南航空',
      dep: '桃園機場 T1',
      arr: '新山一國際機場 T2',
    },
    {
      id: 'flight-hcmc-2',
      direction: 'inbound',
      type: '回程航班',
      date: '2026-05-03',
      depTime: '16:35',
      arrTime: '21:05',
      time: '2026/05/03(日) 16:35 > 21:05',
      flightNo: 'VN570 越南航空',
      dep: '新山一國際機場 T2',
      arr: '桃園機場 T1',
    },
  ],
  flightInTime: '2026/04/30(四) 07:30 > 10:00',
  flightInNo: 'VN571 越南航空',
  flightInDep: '桃園機場 T1',
  flightInArr: '新山一國際機場 T2',
  flightOutTime: '2026/05/03(日) 16:35 > 21:05',
  flightOutNo: 'VN570 越南航空',
  flightOutDep: '新山一國際機場 T2',
  flightOutArr: '桃園機場 T1',
  hotels: [
    {
      id: 'hotel-hcmc-1',
      checkIn: '2026-04-30',
      checkOut: '2026-05-03',
      name: '胡志明市西貢融合套房飯店',
      engName: 'Fusion Suites Saigon',
      address: '3-5 Suong Nguyet Anh, District 1, Ho Chi Minh City',
      trans: '新山一機場搭乘 Grab 約 25 分鐘直達第一郡飯店',
    },
  ],
  days: [
    {
      id: 'day-hcmc-1',
      dayNumber: 1,
      title: 'Day 1 (04/30 四)｜新定粉紅教堂・西貢中央郵局・歌劇院',
      spots: [
        {
          id: 'spot-hcmc-101',
          time: '11:30 - 13:30',
          spot: '錦麗河粉 Phở Lệ & 新定教堂',
          enableMapLink: true,
          trans: '全程使用 Grab 叫車移動（冷氣舒適且計價透明）',
          routeUrl: 'https://www.google.com/maps/dir/Fusion+Suites+Saigon/Tan+Dinh+Church',
          note: '品嚐正宗南越風味牛肉河粉，拍攝夢幻粉紅教堂外觀。',
        },
      ],
    },
  ],
};

export const createBlankGuideData = (projectId = '', userId = getActiveUserId()): TravelGuideData => ({
  firebaseDbUrl: getGlobalFirebaseUrlForUser(userId),
  firebaseRoomId: projectId,
  guideTitle: '',
  guideSubtitle: '',
  guideSummary: '',
  companions: '',
  startDate: '',
  endDate: '',
  coverUrl:
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
  flights: [
    {
      id: uid(),
      direction: 'outbound',
      type: '去程航班',
      date: '',
      depTime: '',
      arrTime: '',
      time: '',
      flightNo: '',
      dep: '',
      arr: '',
    },
    {
      id: uid(),
      direction: 'inbound',
      type: '回程航班',
      date: '',
      depTime: '',
      arrTime: '',
      time: '',
      flightNo: '',
      dep: '',
      arr: '',
    },
  ],
  flightInTime: '',
  flightInNo: '',
  flightInDep: '',
  flightInArr: '',
  flightOutTime: '',
  flightOutNo: '',
  flightOutDep: '',
  flightOutArr: '',
  hotels: [
    {
      id: uid(),
      checkIn: '',
      checkOut: '',
      name: '',
      engName: '',
      address: '',
      trans: '',
    },
  ],
  days: [
    {
      id: uid(),
      dayNumber: 1,
      title: 'Day 1｜',
      spots: [
        {
          id: uid(),
          time: '',
          spot: '',
          enableMapLink: false,
          trans: '',
          routeUrl: '',
          note: '',
        },
      ],
    },
  ],
  shopping: [
    {
      id: uid(),
      cat: '',
      desc: '',
    },
  ],
  coupons: [],
  docs: [
    {
      id: uid(),
      title: '',
      note: '',
      linkUrl: '',
    },
  ],
  generalNote: '',
  buildTime: new Date().toISOString(),
});

function safeGetStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, val: string): boolean {
  try {
    localStorage.setItem(key, val);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function extractDateFromStr(str?: string): string {
  if (!str) return '';
  const m = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return '';
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

export function parseFlightDateAndTimes(timeStr?: string): {
  date: string;
  depTime: string;
  arrTime: string;
} {
  if (!timeStr) return { date: '', depTime: '', arrTime: '' };
  const date = extractDateFromStr(timeStr);
  const times = timeStr.match(/(\d{1,2}:\d{2})/g) || [];
  const padTime = (t?: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  };
  return {
    date,
    depTime: padTime(times[0]),
    arrTime: padTime(times[1]),
  };
}

export function formatFlightTimeDisplay(date?: string, depTime?: string, arrTime?: string): string {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  let datePart = '';
  if (date) {
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      const w = !isNaN(d.getTime()) ? `(${weekdays[d.getDay()]})` : '';
      datePart = `${m[1]}/${m[2]}/${m[3]}${w}`;
    } else {
      datePart = date.replace(/-/g, '/');
    }
  }
  const timePart =
    depTime && arrTime
      ? `${depTime} > ${arrTime}`
      : depTime
        ? depTime
        : arrTime
          ? `> ${arrTime}`
          : '';
  return [datePart, timePart].filter(Boolean).join(' ');
}

export function computeDayTitlesWithStartDate(
  days: DayPlan[],
  flightInTime: string,
  fallbackStartDate?: string
): DayPlan[] {
  const iso = extractDateFromStr(flightInTime) || fallbackStartDate || '';
  const dateMatch = iso.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return days.map((day, idx) => {
    const dayNum = idx + 1;
    let prefix = `Day ${dayNum}｜`;
    if (dateMatch) {
      const startDate = new Date(
        parseInt(dateMatch[1], 10),
        parseInt(dateMatch[2], 10) - 1,
        parseInt(dateMatch[3], 10)
      );
      if (!isNaN(startDate.getTime())) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + idx);
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const w = weekdays[current.getDay()];
        prefix = `Day ${dayNum} (${mm}/${dd} ${w})｜`;
      }
    }

    const existingTitle = (day.title || '').trim();
    let customText = '';
    if (existingTitle.includes('｜')) {
      customText = existingTitle.split('｜').slice(1).join('｜');
    } else if (!existingTitle.startsWith('Day ')) {
      customText = existingTitle;
    }

    return {
      ...day,
      id: day.id || uid(),
      dayNumber: dayNum,
      title: prefix + customText,
      spots: (day.spots || []).map((s) => ({ ...s, id: s.id || uid() })),
    };
  });
}

function deriveFlightDates(flights: FlightItem[]): {
  outboundDate: string;
  inboundDate: string;
  firstOutbound?: FlightItem;
  lastInbound?: FlightItem;
} {
  const outbounds = flights.filter((f) => f.direction === 'outbound');
  const inbounds = flights.filter((f) => f.direction === 'inbound');

  const firstOutbound = outbounds[0] || flights[0];
  const lastInbound =
    inbounds.length > 0
      ? inbounds[inbounds.length - 1]
      : flights.length > 1
        ? flights[flights.length - 1]
        : undefined;

  const outboundDate =
    firstOutbound?.date || extractDateFromStr(firstOutbound?.time) || '';
  const inboundDate =
    lastInbound?.date || extractDateFromStr(lastInbound?.time) || '';

  return { outboundDate, inboundDate, firstOutbound, lastInbound };
}

function syncLegacyFlightFields(flights: FlightItem[]) {
  const { firstOutbound, lastInbound } = deriveFlightDates(flights);
  return {
    flightInTime: firstOutbound?.time || '',
    flightInNo: firstOutbound?.flightNo || '',
    flightInDep: firstOutbound?.dep || '',
    flightInArr: firstOutbound?.arr || '',
    flightOutTime: lastInbound?.time || '',
    flightOutNo: lastInbound?.flightNo || '',
    flightOutDep: lastInbound?.dep || '',
    flightOutArr: lastInbound?.arr || '',
  };
}

function normalizeGuideData(
  raw: Partial<TravelGuideData>,
  projectId: string,
  userId = getActiveUserId()
): TravelGuideData {
  const base = createBlankGuideData(projectId, userId);

  let normalizedFlights: FlightItem[] = [];
  if (raw.flights && Array.isArray(raw.flights) && raw.flights.length > 0) {
    normalizedFlights = raw.flights.map((f, idx) => {
      const parsed = parseFlightDateAndTimes(f.time);
      const date = f.date !== undefined ? f.date : parsed.date;
      const depTime = f.depTime !== undefined ? f.depTime : parsed.depTime;
      const arrTime = f.arrTime !== undefined ? f.arrTime : parsed.arrTime;
      const inferredDir: 'outbound' | 'inbound' =
        f.direction ||
        (f.type && f.type.includes('回')
          ? 'inbound'
          : f.type && f.type.includes('去')
            ? 'outbound'
            : idx === 0
              ? 'outbound'
              : 'inbound');
      const time =
        date || depTime || arrTime
          ? formatFlightTimeDisplay(date, depTime, arrTime)
          : f.time || '';
      return {
        id: f.id || uid(),
        direction: inferredDir,
        type: f.type || (inferredDir === 'outbound' ? '去程航班' : '回程航班'),
        date,
        depTime,
        arrTime,
        time,
        flightNo: f.flightNo || '',
        dep: f.dep || '',
        arr: f.arr || '',
      };
    });
  } else {
    const inParsed = parseFlightDateAndTimes(raw.flightInTime);
    const outParsed = parseFlightDateAndTimes(raw.flightOutTime);
    normalizedFlights = [
      {
        id: uid(),
        direction: 'outbound',
        type: '去程航班',
        date: inParsed.date,
        depTime: inParsed.depTime,
        arrTime: inParsed.arrTime,
        time: raw.flightInTime || '',
        flightNo: raw.flightInNo || '',
        dep: raw.flightInDep || '',
        arr: raw.flightInArr || '',
      },
      {
        id: uid(),
        direction: 'inbound',
        type: '回程航班',
        date: outParsed.date,
        depTime: outParsed.depTime,
        arrTime: outParsed.arrTime,
        time: raw.flightOutTime || '',
        flightNo: raw.flightOutNo || '',
        dep: raw.flightOutDep || '',
        arr: raw.flightOutArr || '',
      },
    ];
  }

  const legacyFlightFields = syncLegacyFlightFields(normalizedFlights);
  const { outboundDate, inboundDate } = deriveFlightDates(normalizedFlights);
  const globalFbUrl = getGlobalFirebaseUrlForUser(userId);

  const resolvedStartDate =
    outboundDate ||
    raw.startDate ||
    extractDateFromStr(legacyFlightFields.flightInTime) ||
    '';
  const resolvedEndDate =
    inboundDate ||
    raw.endDate ||
    extractDateFromStr(legacyFlightFields.flightOutTime) ||
    resolvedStartDate;

  const merged: TravelGuideData = {
    ...base,
    ...raw,
    ...legacyFlightFields,
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
    flights: normalizedFlights,
    // 優先引用會員「⚙️ 設定」中的全域 Firebase 網址
    firebaseDbUrl: globalFbUrl || raw.firebaseDbUrl || '',
    firebaseRoomId: raw.firebaseRoomId || projectId,
    hotels:
      raw.hotels && raw.hotels.length > 0
        ? raw.hotels.map((h) => ({ ...h, id: h.id || uid() }))
        : base.hotels,
    days:
      raw.days && raw.days.length > 0
        ? computeDayTitlesWithStartDate(
            raw.days,
            legacyFlightFields.flightInTime || '',
            resolvedStartDate
          )
        : base.days,
    shopping:
      raw.shopping && raw.shopping.length > 0
        ? raw.shopping.map((s) => ({ ...s, id: s.id || uid() }))
        : base.shopping,
    coupons:
      raw.coupons && raw.coupons.length > 0
        ? raw.coupons.map((c) => ({ ...c, id: c.id || uid() }))
        : [],
    docs:
      raw.docs && raw.docs.length > 0
        ? raw.docs.map((d: any) => ({
            id: d.id || uid(),
            title: d.title || '',
            note: d.note || '',
            linkUrl: d.linkUrl || d.imageUrl || d.fileData || '',
          }))
        : base.docs,
    companions: typeof raw.companions === 'string' ? raw.companions : '',
    generalNote: typeof raw.generalNote === 'string' ? raw.generalNote : '',
    buildTime: raw.buildTime || new Date().toISOString(),
  };

  if (!merged.startDate) {
    merged.startDate =
      (merged.hotels[0] && merged.hotels[0].checkIn) ||
      new Date().toISOString().split('T')[0];
  }
  if (!merged.endDate) {
    merged.endDate =
      (merged.hotels[0] && merged.hotels[0].checkOut) ||
      merged.startDate;
  }

  return merged;
}

/**
 * 將你截圖中這些原本屬於管理者的旅遊專案（如「北海岸」、「44」等，先前在 charles 帳號下建立的專案），
 * 轉移歸屬給管理者帳號 (`admin` / `u_admin`) 專用，並從舊一般帳號中移除，
 * 讓這些專案只有以 `admin` (密碼 `wanghome0830`) 登入時才看得到；
 * 其他一般使用者登入自己的帳號時只會看到屬於該使用者自己的專案。
 */
function transferExistingProjectsToAdminOwner(): void {
  const adminUserId = 'u_admin';
  const adminHubKey = getHubKeyForUser(adminUserId);
  const transferFlagKey = 'admin_exclusive_projects_transferred_v2';

  if (safeGetStorage(transferFlagKey) === 'true' && safeGetStorage(adminHubKey)) {
    return;
  }

  const adminProjectsMap = new Map<string, ProjectMeta>();

  // 1. 先讀取目前已經在 u_admin 下的專案
  const existingAdminRaw = safeGetStorage(adminHubKey);
  if (existingAdminRaw) {
    try {
      const list: ProjectMeta[] = JSON.parse(existingAdminRaw);
      if (Array.isArray(list)) {
        list.forEach((p) => {
          if (p && p.id) adminProjectsMap.set(p.id, p);
        });
      }
    } catch {}
  }

  // 2. 掃描先前在舊帳號 (如 charles) 下建立的自建專案，將其擁有權正式移轉至 u_admin，並清空舊帳號下的這些專案
  try {
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) allKeys.push(k);
    }

    allKeys.forEach((key) => {
      if (
        (key === HUB_STORAGE_KEY || key.startsWith(`${HUB_STORAGE_KEY}_`)) &&
        key !== adminHubKey
      ) {
        const rawList = safeGetStorage(key);
        if (!rawList) return;
        const oldUserId =
          key === HUB_STORAGE_KEY ? '' : key.slice(`${HUB_STORAGE_KEY}_`.length);

        try {
          const list: ProjectMeta[] = JSON.parse(rawList);
          if (Array.isArray(list)) {
            list.forEach((p) => {
              if (!p || !p.id) return;
              if (!adminProjectsMap.has(p.id)) {
                adminProjectsMap.set(p.id, p);
              }
              const targetAdminGuideKey = getGuideKeyForUser(adminUserId, p.id);
              const oldGuideKey = oldUserId
                ? getGuideKeyForUser(oldUserId, p.id)
                : GUIDE_PREFIX + p.id;
              const candidateGuideRaw =
                safeGetStorage(oldGuideKey) || safeGetStorage(GUIDE_PREFIX + p.id);

              if (candidateGuideRaw && !safeGetStorage(targetAdminGuideKey)) {
                safeSetStorage(targetAdminGuideKey, candidateGuideRaw);
              }
              // 從舊一般帳號中移除此專案明細，確保只有管理者 admin 登入才看得到這些專案
              if (oldUserId && oldUserId !== adminUserId) {
                safeRemoveStorage(oldGuideKey);
              }
            });
          }
          // 移除舊帳號的專案清單，使舊帳號回歸新帳號狀態（不再持有這些管理者專用專案）
          if (oldUserId && oldUserId !== adminUserId) {
            safeRemoveStorage(key);
          }
        } catch {}
      }
    });
  } catch {}

  safeSetStorage(transferFlagKey, 'true');

  if (adminProjectsMap.size > 0) {
    const mergedList = Array.from(adminProjectsMap.values());
    const cleaned = purgeSampleProjectsIfHasCustomProjects(adminUserId, mergedList);
    safeSetStorage(adminHubKey, JSON.stringify(cleaned));
  }
}

function loadOrInitUserProjects(userId: string): ProjectMeta[] {
  // 確保先前那些屬於管理者專用的專案已移轉至 u_admin 帳號下
  transferExistingProjectsToAdminOwner();

  const userHubKey = getHubKeyForUser(userId);
  const existingUserHub = safeGetStorage(userHubKey);

  if (existingUserHub) {
    try {
      const parsed: ProjectMeta[] = JSON.parse(existingUserHub);
      if (Array.isArray(parsed)) {
        return purgeSampleProjectsIfHasCustomProjects(userId, parsed);
      }
      return [...DEFAULT_PROJECTS];
    } catch {
      return [...DEFAULT_PROJECTS];
    }
  }

  // 若是第一位登入的會員且先前有未分帳號的舊專案，無損歸戶至該會員帳號下
  const legacyHubRaw = safeGetStorage(HUB_STORAGE_KEY);
  if (userId !== 'guest' && legacyHubRaw && !safeGetStorage('legacy_user_claimed_v3')) {
    try {
      const legacyProjects: ProjectMeta[] = JSON.parse(legacyHubRaw);
      if (Array.isArray(legacyProjects) && legacyProjects.length > 0) {
        legacyProjects.forEach((p) => {
          const oldData = safeGetStorage(GUIDE_PREFIX + p.id);
          if (oldData) {
            safeSetStorage(getGuideKeyForUser(userId, p.id), oldData);
          }
        });
        const cleanedLegacy = purgeSampleProjectsIfHasCustomProjects(userId, legacyProjects);
        safeSetStorage(userHubKey, JSON.stringify(cleanedLegacy));
        safeSetStorage('legacy_user_claimed_v3', userId);
        return cleanedLegacy;
      }
    } catch {}
  }

  // 新會員（尚無任何個人專案）預設初始化三大示範專案至其個人空間
  safeSetStorage(
    getGuideKeyForUser(userId, 'tokyo-2026'),
    JSON.stringify(DEFAULT_SAMPLE_DATA)
  );
  safeSetStorage(
    getGuideKeyForUser(userId, 'sapporo-2026'),
    JSON.stringify(SAPPORO_SAMPLE_DATA)
  );
  safeSetStorage(
    getGuideKeyForUser(userId, 'hcmc-2026'),
    JSON.stringify(HCMC_SAMPLE_DATA)
  );
  safeSetStorage(userHubKey, JSON.stringify(DEFAULT_PROJECTS));
  return [...DEFAULT_PROJECTS];
}

export interface GuideState extends TravelGuideData {
  activeView: 'hub' | 'generator';
  currentProjectId: string | null;
  projects: ProjectMeta[];
  trashedProjects: TrashProjectEntry[];
  showInlinePreview: boolean;
  isPreviewModalOpen: boolean;

  // 會員切換與全域設定連動 Actions
  reloadProjectsForUser: (userId: string) => void;
  syncGlobalSettingsToCurrentProject: () => void;
  getProjectDataById: (projectId: string) => TravelGuideData | null;
  replaceAllProjectsFromCloud: (
    projects: ProjectMeta[],
    guidesMap: Record<string, TravelGuideData>
  ) => void;

  // 專案大廳、刪除暫存區（10 天自動刪除）、封面更換與預覽開窗 Actions
  openProjectInGenerator: (projectId: string, autoPreview?: boolean) => void;
  openProjectInPreviewModal: (projectId: string) => void;
  setPreviewModalOpen: (open: boolean) => void;
  updateProjectCover: (projectId: string, coverUrl: string) => void;
  autoPullHubFromCloudIfConfigured: () => Promise<void>;
  createNewBlankTripAndEnter: () => void;
  returnToHub: () => void;
  saveCurrentProjectToHub: () => void;
  deleteProjectFromHub: (projectId: string) => void;
  deleteAllProjectsToTrash: () => number;
  restoreProjectFromTrash: (projectId: string) => void;
  permanentlyDeleteFromTrash: (projectId: string) => void;
  emptyTrash: () => void;
  importProjectToHubFromJSON: (data: Partial<TravelGuideData>, fallbackFileName?: string) => string;
  setShowInlinePreview: (show: boolean) => void;

  // 產生器表單 Actions
  updateField: <K extends keyof TravelGuideData>(field: K, value: TravelGuideData[K]) => void;
  setFlightInTime: (timeStr: string) => void;
  setFlightOutTime: (timeStr: string) => void;
  setProjectDates: (startDate: string, endDate: string) => void;
  // Flights CRUD
  addFlight: (direction?: 'outbound' | 'inbound') => void;
  updateFlight: (id: string, partial: Partial<FlightItem>) => void;
  deleteFlight: (id: string) => void;
  // Days & Spots CRUD + Reorder
  addDay: () => void;
  updateDayTitle: (dayId: string, title: string) => void;
  deleteDay: (dayId: string) => void;
  moveDay: (dayIndex: number, direction: 'UP' | 'DOWN') => void;
  reorderDays: (fromIndex: number, toIndex: number) => void;
  moveSpot: (dayIndex: number, spotIndex: number, direction: 'UP' | 'DOWN') => void;
  reorderSpots: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  addSpot: (dayIndex: number) => void;
  updateSpot: (dayIndex: number, spotId: string, partial: Partial<SpotItem>) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  // Hotels CRUD
  addHotel: () => void;
  updateHotel: (id: string, partial: Partial<HotelInfo>) => void;
  deleteHotel: (id: string) => void;
  // Shopping CRUD
  addShopping: () => void;
  updateShopping: (id: string, partial: Partial<ShoppingItem>) => void;
  deleteShopping: (id: string) => void;
  // Coupons CRUD
  addCoupon: () => void;
  updateCoupon: (id: string, partial: Partial<CouponItem>) => void;
  deleteCoupon: (id: string) => void;
  // Docs CRUD
  addDoc: () => void;
  updateDoc: (id: string, partial: Partial<DocItem>) => void;
  deleteDoc: (id: string) => void;
  // Data Import / Reset
  importFromJSON: (data: Partial<TravelGuideData>) => void;
  loadSampleData: () => void;
  resetToDefault: () => void;
  getSnapshot: () => TravelGuideData;
}

export const useGuideStore = create<GuideState>()((set, get) => {
  const initialUserId = getActiveUserId();
  const initialProjects = loadOrInitUserProjects(initialUserId);
  const initialTrash = loadAndPurgeUserTrash(initialUserId);

  let cloudHubPushTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 若使用者在「⚙️ 設定」啟用了 Firebase 雲端模式（或專案本身有設定全域 Firebase 網址），
   * 自動在背景將最新大廳專案清單與各專案明細（包含上傳壓縮後的 Base64 封面圖片）同步至 Firebase，
   * 確保換一台瀏覽器或電腦打開時都能直接看到最新封面與專案。
   */
  const scheduleAutoPushHubToFirebase = (
    userId: string,
    username: string,
    projectsList: ProjectMeta[],
    immediate = false
  ) => {
    const settings = loadUserSettings(userId);
    const fbUrl = (settings.firebaseDbUrl || '').trim();
    if (!fbUrl) return;

    if (cloudHubPushTimer) {
      clearTimeout(cloudHubPushTimer);
      cloudHubPushTimer = null;
    }

    const doPush = () => {
      pushEntireHubToFirebase(fbUrl, userId, username, projectsList, (id) =>
        get().getProjectDataById(id)
      ).catch(() => {});
    };

    if (immediate) {
      doPush();
    } else {
      cloudHubPushTimer = setTimeout(doPush, 1200);
    }
  };

  const persistCurrentProject = (nextState?: Partial<GuideState>, immediate = false) => {
    const s = { ...get(), ...nextState };
    const pid = s.currentProjectId;
    if (!pid) return;

    const userId = getActiveUserId();
    const username = useAuthStore.getState().currentUser?.username || 'guest';
    const globalFbUrl = getGlobalFirebaseUrlForUser(userId);

    const snapshot: TravelGuideData = {
      firebaseDbUrl: globalFbUrl || s.firebaseDbUrl,
      firebaseRoomId: s.firebaseRoomId || pid,
      guideTitle: s.guideTitle,
      guideSubtitle: s.guideSubtitle,
      guideSummary: s.guideSummary,
      companions: s.companions || '',
      startDate: s.startDate,
      endDate: s.endDate,
      coverUrl: s.coverUrl,
      flights: s.flights,
      flightInTime: s.flightInTime,
      flightInNo: s.flightInNo,
      flightInDep: s.flightInDep,
      flightInArr: s.flightInArr,
      flightOutTime: s.flightOutTime,
      flightOutNo: s.flightOutNo,
      flightOutDep: s.flightOutDep,
      flightOutArr: s.flightOutArr,
      hotels: s.hotels,
      days: s.days,
      shopping: s.shopping,
      coupons: s.coupons,
      docs: s.docs,
      generalNote: s.generalNote || '',
      buildTime: new Date().toISOString(),
    };

    safeSetStorage(getGuideKeyForUser(userId, pid), JSON.stringify(snapshot));

    const today = new Date().toISOString().split('T')[0];
    const { outboundDate, inboundDate } = deriveFlightDates(s.flights || []);

    const inferredStart =
      outboundDate ||
      extractDateFromStr(s.flightInTime) ||
      s.startDate ||
      (s.hotels[0] && s.hotels[0].checkIn) ||
      today;

    let inferredEnd =
      inboundDate ||
      extractDateFromStr(s.flightOutTime) ||
      s.endDate ||
      (s.hotels[0] && s.hotels[0].checkOut) ||
      '';

    if (!inferredEnd && inferredStart && s.days.length > 0) {
      const d = new Date(inferredStart);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + Math.max(0, s.days.length - 1));
        inferredEnd = d.toISOString().split('T')[0];
      }
    }
    if (!inferredEnd || inferredEnd < inferredStart) {
      inferredEnd = inferredStart;
    }

    const cleanTitle = (s.guideTitle || '').trim() || '未命名新旅程';
    const cleanCover =
      (s.coverUrl || '').trim() ||
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';

    const currentProjects = [...s.projects];
    const existingIdx = currentProjects.findIndex((p) => p.id === pid);
    const updatedMeta: ProjectMeta = {
      id: pid,
      title: cleanTitle,
      startDate: inferredStart,
      endDate: inferredEnd,
      cover: cleanCover,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      currentProjects[existingIdx] = {
        ...currentProjects[existingIdx],
        ...updatedMeta,
        cover: (s.coverUrl || '').trim() || currentProjects[existingIdx].cover || cleanCover,
      };
    } else {
      currentProjects.unshift(updatedMeta);
    }

    const cleanedProjects = purgeSampleProjectsIfHasCustomProjects(userId, currentProjects);
    safeSetStorage(getHubKeyForUser(userId), JSON.stringify(cleanedProjects));

    // 若會員已綁定本機自動備份資料夾，背景自動寫入實體 .json 檔（預設防抖 900ms + 過濾注音半成品並自動清理同 ID 舊檔）
    syncProjectToLocalFolder(
      userId,
      username,
      cleanedProjects,
      pid,
      snapshot,
      immediate
    ).catch(() => {});

    // 若已設定 Firebase 雲端網址，自動背景推播至 Firebase（含 Base64 封面圖）
    scheduleAutoPushHubToFirebase(userId, username, cleanedProjects, immediate);

    return {
      projects: cleanedProjects,
      startDate: inferredStart,
      endDate: inferredEnd,
      firebaseDbUrl: snapshot.firebaseDbUrl,
    };
  };

  const applyAndPersist = (updater: (state: GuideState) => Partial<GuideState>) => {
    set((state) => {
      const partial = updater(state);
      const syncResult = persistCurrentProject(partial, false);
      return {
        ...partial,
        ...(syncResult || {}),
        buildTime: new Date().toISOString(),
      };
    });
  };

  return {
    ...DEFAULT_SAMPLE_DATA,
    activeView: 'hub',
    currentProjectId: null,
    projects: initialProjects,
    trashedProjects: initialTrash,
    showInlinePreview: false,
    isPreviewModalOpen: false,

    reloadProjectsForUser: (userId) => {
      const userProjects = loadOrInitUserProjects(userId);
      const userTrash = loadAndPurgeUserTrash(userId);
      set({
        projects: userProjects,
        trashedProjects: userTrash,
        activeView: 'hub',
        currentProjectId: null,
        showInlinePreview: false,
        isPreviewModalOpen: false,
      });
    },

    syncGlobalSettingsToCurrentProject: () => {
      const userId = getActiveUserId();
      const globalFbUrl = getGlobalFirebaseUrlForUser(userId);
      set({ firebaseDbUrl: globalFbUrl });
    },

    getProjectDataById: (projectId) => {
      const userId = getActiveUserId();
      const raw = safeGetStorage(getGuideKeyForUser(userId, projectId));
      if (!raw) return null;
      try {
        return normalizeGuideData(JSON.parse(raw), projectId, userId);
      } catch {
        return null;
      }
    },

    replaceAllProjectsFromCloud: (projects, guidesMap) => {
      const userId = getActiveUserId();
      Object.entries(guidesMap).forEach(([pid, gData]) => {
        safeSetStorage(
          getGuideKeyForUser(userId, pid),
          JSON.stringify(normalizeGuideData(gData, pid, userId))
        );
      });
      const cleanedProjects = purgeSampleProjectsIfHasCustomProjects(userId, projects);
      safeSetStorage(getHubKeyForUser(userId), JSON.stringify(cleanedProjects));
      set({
        projects: cleanedProjects,
        activeView: 'hub',
        currentProjectId: null,
      });
    },

    openProjectInGenerator: (projectId, autoPreview = false) => {
      const userId = getActiveUserId();
      const savedStr = safeGetStorage(getGuideKeyForUser(userId, projectId));
      const projectMeta = get().projects.find((p) => p.id === projectId);
      let loadedData: TravelGuideData;

      if (savedStr) {
        try {
          loadedData = normalizeGuideData(JSON.parse(savedStr), projectId, userId);
        } catch {
          loadedData = createBlankGuideData(projectId, userId);
        }
      } else {
        loadedData = createBlankGuideData(projectId, userId);
        if (projectMeta) {
          loadedData.guideTitle = projectMeta.title;
          loadedData.startDate = projectMeta.startDate;
          loadedData.endDate = projectMeta.endDate;
          loadedData.coverUrl = projectMeta.cover;
          loadedData.flightInTime = projectMeta.startDate.replace(/-/g, '/');
          if (loadedData.flights[0]) {
            loadedData.flights[0].time = loadedData.flightInTime;
          }
        }
      }

      if (projectMeta) {
        if (!loadedData.startDate) loadedData.startDate = projectMeta.startDate;
        if (!loadedData.endDate) loadedData.endDate = projectMeta.endDate;
        if (!loadedData.coverUrl) loadedData.coverUrl = projectMeta.cover;
      }

      loadedData.firebaseDbUrl = getGlobalFirebaseUrlForUser(userId);

      set({
        ...loadedData,
        currentProjectId: projectId,
        activeView: 'generator',
        showInlinePreview: autoPreview,
        isPreviewModalOpen: false,
      });
    },

    openProjectInPreviewModal: (projectId) => {
      const userId = getActiveUserId();
      const savedStr = safeGetStorage(getGuideKeyForUser(userId, projectId));
      const projectMeta = get().projects.find((p) => p.id === projectId);
      let loadedData: TravelGuideData;

      if (savedStr) {
        try {
          loadedData = normalizeGuideData(JSON.parse(savedStr), projectId, userId);
        } catch {
          loadedData = createBlankGuideData(projectId, userId);
        }
      } else {
        loadedData = createBlankGuideData(projectId, userId);
        if (projectMeta) {
          loadedData.guideTitle = projectMeta.title;
          loadedData.startDate = projectMeta.startDate;
          loadedData.endDate = projectMeta.endDate;
          loadedData.coverUrl = projectMeta.cover;
        }
      }

      if (projectMeta) {
        if (!loadedData.startDate) loadedData.startDate = projectMeta.startDate;
        if (!loadedData.endDate) loadedData.endDate = projectMeta.endDate;
        if (!loadedData.coverUrl) loadedData.coverUrl = projectMeta.cover;
      }

      loadedData.firebaseDbUrl = getGlobalFirebaseUrlForUser(userId);

      // 不切換至 generator 編輯頁，直接載入資料並在當前頁面開啟唯讀預覽開窗
      set({
        ...loadedData,
        currentProjectId: projectId,
        isPreviewModalOpen: true,
      });
    },

    setPreviewModalOpen: (open) => set({ isPreviewModalOpen: open }),

    updateProjectCover: (projectId, coverUrl) => {
      const userId = getActiveUserId();
      const username = useAuthStore.getState().currentUser?.username || 'guest';
      const cleanCover =
        (coverUrl || '').trim() ||
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=720&q=80';
      const nowIso = new Date().toISOString();

      // 1. 更新大廳卡片清單中的 cover
      const nextProjects = get().projects.map((p) =>
        p.id === projectId ? { ...p, cover: cleanCover, updatedAt: nowIso } : p
      );
      safeSetStorage(getHubKeyForUser(userId), JSON.stringify(nextProjects));

      // 2. 更新該專案明細中的 coverUrl
      const guideKey = getGuideKeyForUser(userId, projectId);
      const rawGuide = safeGetStorage(guideKey);
      let updatedGuide: TravelGuideData;
      if (rawGuide) {
        try {
          updatedGuide = normalizeGuideData(JSON.parse(rawGuide), projectId, userId);
        } catch {
          updatedGuide = createBlankGuideData(projectId, userId);
        }
      } else {
        updatedGuide = createBlankGuideData(projectId, userId);
        const meta = nextProjects.find((p) => p.id === projectId);
        if (meta) {
          updatedGuide.guideTitle = meta.title;
          updatedGuide.startDate = meta.startDate;
          updatedGuide.endDate = meta.endDate;
        }
      }
      updatedGuide.coverUrl = cleanCover;
      updatedGuide.buildTime = nowIso;
      safeSetStorage(guideKey, JSON.stringify(updatedGuide));

      // 3. 若目前正在編輯器開啟此專案，同步更新當前 state 的 coverUrl
      const isCurrent = get().currentProjectId === projectId;
      set({
        projects: nextProjects,
        ...(isCurrent ? { coverUrl: cleanCover, buildTime: nowIso } : {}),
      });

      // 4. 立即同步寫入本機綁定備份資料夾與 Firebase 雲端（含 Base64 圖片資料）
      syncProjectToLocalFolder(
        userId,
        username,
        nextProjects,
        projectId,
        updatedGuide,
        true
      ).catch(() => {});
      scheduleAutoPushHubToFirebase(userId, username, nextProjects, true);
    },

    autoPullHubFromCloudIfConfigured: async () => {
      const user = useAuthStore.getState().currentUser;
      if (!user) return;
      const settings = loadUserSettings(user.userId);
      const fbUrl = (settings.firebaseDbUrl || '').trim();
      if (!fbUrl) return;

      try {
        const res = await pullEntireHubFromFirebase(fbUrl, user.username);
        if (res.ok && res.payload && Array.isArray(res.payload.projects)) {
          const cloudProjects = res.payload.projects;
          const cloudGuides = res.payload.guidesMap || {};
          if (cloudProjects.length > 0) {
            get().replaceAllProjectsFromCloud(cloudProjects, cloudGuides);
          }
        }
      } catch {}
    },

    createNewBlankTripAndEnter: () => {
      const userId = getActiveUserId();
      const newId = 'trip_' + Date.now();
      const today = new Date().toISOString().split('T')[0];
      const blank = createBlankGuideData(newId, userId);
      blank.startDate = today;
      blank.endDate = today;

      const newMeta: ProjectMeta = {
        id: newId,
        title: '新旅程（未命名）',
        startDate: today,
        endDate: today,
        cover:
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
        updatedAt: new Date().toISOString(),
      };

      const rawNextProjects = [newMeta, ...get().projects];
      const nextProjects = purgeSampleProjectsIfHasCustomProjects(userId, rawNextProjects);
      safeSetStorage(getHubKeyForUser(userId), JSON.stringify(nextProjects));
      safeSetStorage(getGuideKeyForUser(userId, newId), JSON.stringify(blank));

      set({
        ...blank,
        currentProjectId: newId,
        projects: nextProjects,
        activeView: 'generator',
        showInlinePreview: false,
      });
    },

    returnToHub: () => {
      const syncResult = persistCurrentProject(undefined, true);
      set({
        ...(syncResult || {}),
        activeView: 'hub',
        currentProjectId: null,
        showInlinePreview: false,
      });
    },

    saveCurrentProjectToHub: () => {
      const syncResult = persistCurrentProject(undefined, true);
      if (syncResult) {
        set({
          ...syncResult,
          buildTime: new Date().toISOString(),
        });
      }
    },

    deleteProjectFromHub: (projectId) => {
      const userId = getActiveUserId();
      const username = useAuthStore.getState().currentUser?.username || 'guest';
      const targetMeta = get().projects.find((p) => p.id === projectId);
      const rawGuide = safeGetStorage(getGuideKeyForUser(userId, projectId));
      let guideData: TravelGuideData = createBlankGuideData(projectId, userId);

      if (rawGuide) {
        try {
          guideData = normalizeGuideData(JSON.parse(rawGuide), projectId, userId);
        } catch {}
      } else if (targetMeta) {
        guideData.guideTitle = targetMeta.title;
        guideData.startDate = targetMeta.startDate;
        guideData.endDate = targetMeta.endDate;
        guideData.coverUrl = targetMeta.cover;
      }

      const nowMs = Date.now();
      const deletedAt = new Date(nowMs).toISOString();
      const expiresAt = new Date(nowMs + TRASH_RETENTION_MS).toISOString();

      let nextTrash = loadAndPurgeUserTrash(userId).filter(
        (t) => t.project.id !== projectId
      );
      if (targetMeta) {
        nextTrash = [
          {
            project: targetMeta,
            guideData,
            deletedAt,
            expiresAt,
          },
          ...nextTrash,
        ];
        safeSetStorage(getTrashKeyForUser(userId), JSON.stringify(nextTrash));
      }

      const nextProjects = get().projects.filter((p) => p.id !== projectId);
      safeSetStorage(getHubKeyForUser(userId), JSON.stringify(nextProjects));
      safeRemoveStorage(getGuideKeyForUser(userId, projectId));

      // 將本機資料夾內的實體檔案移入「_刪除暫存區_10天自動清理」並更新專案總表
      moveProjectFileToLocalTrash(userId, username, projectId, guideData, deletedAt).catch(
        () => {}
      );
      syncProjectToLocalFolder(userId, username, nextProjects, null, null, true).catch(
        () => {}
      );

      set({
        projects: nextProjects,
        trashedProjects: nextTrash,
      });
    },

    deleteAllProjectsToTrash: () => {
      const userId = getActiveUserId();
      const username = useAuthStore.getState().currentUser?.username || 'guest';
      const currentProjects = get().projects;
      if (currentProjects.length === 0) return 0;

      const nowMs = Date.now();
      const deletedAt = new Date(nowMs).toISOString();
      const expiresAt = new Date(nowMs + TRASH_RETENTION_MS).toISOString();

      const newTrashEntries: TrashProjectEntry[] = currentProjects.map((meta) => {
        const rawGuide = safeGetStorage(getGuideKeyForUser(userId, meta.id));
        let guideData: TravelGuideData = createBlankGuideData(meta.id, userId);
        if (rawGuide) {
          try {
            guideData = normalizeGuideData(JSON.parse(rawGuide), meta.id, userId);
          } catch {}
        } else {
          guideData.guideTitle = meta.title;
          guideData.startDate = meta.startDate;
          guideData.endDate = meta.endDate;
          guideData.coverUrl = meta.cover;
        }

        safeRemoveStorage(getGuideKeyForUser(userId, meta.id));
        moveProjectFileToLocalTrash(userId, username, meta.id, guideData, deletedAt).catch(
          () => {}
        );

        return {
          project: meta,
          guideData,
          deletedAt,
          expiresAt,
        };
      });

      const existingTrash = loadAndPurgeUserTrash(userId).filter(
        (t) => !currentProjects.some((p) => p.id === t.project.id)
      );
      const nextTrash = [...newTrashEntries, ...existingTrash];

      safeSetStorage(getTrashKeyForUser(userId), JSON.stringify(nextTrash));
      safeSetStorage(getHubKeyForUser(userId), JSON.stringify([]));
      syncProjectToLocalFolder(userId, username, [], null, null, true).catch(() => {});

      set({
        projects: [],
        trashedProjects: nextTrash,
      });
      return currentProjects.length;
    },

    restoreProjectFromTrash: (projectId) => {
      const userId = getActiveUserId();
      const username = useAuthStore.getState().currentUser?.username || 'guest';
      const currentTrash = loadAndPurgeUserTrash(userId);
      const entry = currentTrash.find((t) => t.project.id === projectId);
      if (!entry) return;

      const nextTrash = currentTrash.filter((t) => t.project.id !== projectId);
      safeSetStorage(getTrashKeyForUser(userId), JSON.stringify(nextTrash));

      const rawNextProjects = [
        entry.project,
        ...get().projects.filter((p) => p.id !== projectId),
      ];
      const nextProjects = purgeSampleProjectsIfHasCustomProjects(userId, rawNextProjects);

      safeSetStorage(getHubKeyForUser(userId), JSON.stringify(nextProjects));
      safeSetStorage(
        getGuideKeyForUser(userId, projectId),
        JSON.stringify(entry.guideData)
      );

      // 從本機暫存區移除並重新寫回正式資料夾
      removeProjectFileFromLocalTrash(userId, username, projectId).catch(() => {});
      syncProjectToLocalFolder(
        userId,
        username,
        nextProjects,
        projectId,
        entry.guideData,
        true
      ).catch(() => {});

      set({
        projects: nextProjects,
        trashedProjects: nextTrash,
      });
    },

    permanentlyDeleteFromTrash: (projectId) => {
      const userId = getActiveUserId();
      const username = useAuthStore.getState().currentUser?.username || 'guest';
      const nextTrash = loadAndPurgeUserTrash(userId).filter(
        (t) => t.project.id !== projectId
      );
      safeSetStorage(getTrashKeyForUser(userId), JSON.stringify(nextTrash));
      removeProjectFileFromLocalTrash(userId, username, projectId).catch(() => {});
      set({ trashedProjects: nextTrash });
    },

    emptyTrash: () => {
      const userId = getActiveUserId();
      const username = useAuthStore.getState().currentUser?.username || 'guest';
      safeSetStorage(getTrashKeyForUser(userId), JSON.stringify([]));
      removeProjectFileFromLocalTrash(userId, username, '*').catch(() => {});
      set({ trashedProjects: [] });
    },

    importProjectToHubFromJSON: (raw, fallbackFileName = '匯入的旅程') => {
      const userId = getActiveUserId();
      const newId = 'trip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const normalized = normalizeGuideData(raw, newId, userId);
      const title = (normalized.guideTitle || '').trim() || fallbackFileName;
      normalized.guideTitle = title;

      const newMeta: ProjectMeta = {
        id: newId,
        title,
        startDate: normalized.startDate || new Date().toISOString().split('T')[0],
        endDate:
          normalized.endDate || normalized.startDate || new Date().toISOString().split('T')[0],
        cover:
          normalized.coverUrl ||
          'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
        updatedAt: new Date().toISOString(),
      };

      const rawNextProjects = [newMeta, ...get().projects];
      const nextProjects = purgeSampleProjectsIfHasCustomProjects(userId, rawNextProjects);
      safeSetStorage(getHubKeyForUser(userId), JSON.stringify(nextProjects));
      safeSetStorage(getGuideKeyForUser(userId, newId), JSON.stringify(normalized));
      set({ projects: nextProjects });
      return title;
    },

    setShowInlinePreview: (show) => set({ showInlinePreview: show }),

    updateField: (field, value) =>
      applyAndPersist(() => ({
        [field]: value,
      })),

    setFlightInTime: (timeStr) =>
      applyAndPersist((state) => {
        const extractedStart = extractDateFromStr(timeStr) || state.startDate || '';
        const updatedDays = computeDayTitlesWithStartDate(state.days, timeStr, extractedStart);
        const nextFlights = [...state.flights];
        if (nextFlights[0]) {
          nextFlights[0] = { ...nextFlights[0], time: timeStr };
        }
        return {
          flightInTime: timeStr,
          flights: nextFlights,
          startDate: extractedStart || state.startDate,
          days: updatedDays,
        };
      }),

    setFlightOutTime: (timeStr) =>
      applyAndPersist((state) => {
        const extractedEnd = extractDateFromStr(timeStr) || state.endDate || '';
        const nextFlights = [...state.flights];
        if (nextFlights.length > 1) {
          const lastIdx = nextFlights.length - 1;
          nextFlights[lastIdx] = { ...nextFlights[lastIdx], time: timeStr };
        }
        return {
          flightOutTime: timeStr,
          flights: nextFlights,
          endDate: extractedEnd || state.endDate,
        };
      }),

    setProjectDates: (startDate, endDate) =>
      applyAndPersist((state) => {
        const updatedDays = computeDayTitlesWithStartDate(
          state.days,
          state.flights[0]?.time || state.flightInTime || startDate,
          startDate
        );
        return {
          startDate,
          endDate: endDate && endDate >= startDate ? endDate : startDate,
          days: updatedDays,
        };
      }),

    addFlight: (direction = 'outbound') =>
      applyAndPersist((state) => {
        const isOutbound = direction === 'outbound';
        const sameDirCount = state.flights.filter(
          (f) => (f.direction || 'outbound') === direction
        ).length;
        const defaultLabel = isOutbound
          ? sameDirCount === 0
            ? '去程航班'
            : `去程第 ${sameDirCount + 1} 段 / 轉機`
          : sameDirCount === 0
            ? '回程航班'
            : `回程第 ${sameDirCount + 1} 段 / 轉機`;

        const newFlight: FlightItem = {
          id: uid(),
          direction,
          type: defaultLabel,
          date: '',
          depTime: '',
          arrTime: '',
          time: '',
          flightNo: '',
          dep: '',
          arr: '',
        };

        const outbounds = state.flights.filter((f) => f.direction !== 'inbound');
        const inbounds = state.flights.filter((f) => f.direction === 'inbound');
        const nextFlights: FlightItem[] = isOutbound
          ? [...outbounds, newFlight, ...inbounds]
          : [...outbounds, ...inbounds, newFlight];

        return {
          flights: nextFlights,
          ...syncLegacyFlightFields(nextFlights),
        };
      }),

    updateFlight: (id, partial) =>
      applyAndPersist((state) => {
        const nextFlights = state.flights.map((f) => {
          if (f.id !== id) return f;
          const updated: FlightItem = { ...f, ...partial };
          // 若修改了 date / depTime / arrTime，自動同步組合顯示用 time 字串
          if (
            partial.date !== undefined ||
            partial.depTime !== undefined ||
            partial.arrTime !== undefined
          ) {
            updated.time = formatFlightTimeDisplay(
              updated.date,
              updated.depTime,
              updated.arrTime
            );
          } else if (partial.time !== undefined) {
            const parsed = parseFlightDateAndTimes(partial.time);
            if (parsed.date) updated.date = parsed.date;
            if (parsed.depTime) updated.depTime = parsed.depTime;
            if (parsed.arrTime) updated.arrTime = parsed.arrTime;
          }
          return updated;
        });

        const legacy = syncLegacyFlightFields(nextFlights);
        const { outboundDate, inboundDate } = deriveFlightDates(nextFlights);

        const nextStartDate = outboundDate || state.startDate || '';
        const nextEndDate = inboundDate || outboundDate || state.endDate || nextStartDate;
        const updatedDays = computeDayTitlesWithStartDate(
          state.days,
          legacy.flightInTime || nextStartDate,
          nextStartDate
        );

        return {
          flights: nextFlights,
          ...legacy,
          days: updatedDays,
          startDate: nextStartDate,
          endDate: nextEndDate,
        };
      }),

    deleteFlight: (id) =>
      applyAndPersist((state) => {
        const nextFlights = state.flights.filter((f) => f.id !== id);
        const legacy = syncLegacyFlightFields(nextFlights);
        const { outboundDate, inboundDate } = deriveFlightDates(nextFlights);
        const nextStartDate = outboundDate || state.startDate || '';
        const nextEndDate = inboundDate || outboundDate || state.endDate || nextStartDate;
        const updatedDays = computeDayTitlesWithStartDate(
          state.days,
          legacy.flightInTime || nextStartDate,
          nextStartDate
        );
        return {
          flights: nextFlights,
          ...legacy,
          days: updatedDays,
          startDate: nextStartDate,
          endDate: nextEndDate,
        };
      }),

    addDay: () =>
      applyAndPersist((state) => {
        const nextNum = state.days.length + 1;
        const rawNewDays: DayPlan[] = [
          ...state.days,
          {
            id: uid(),
            dayNumber: nextNum,
            title: `Day ${nextNum}｜`,
            spots: [
              {
                id: uid(),
                time: '',
                spot: '',
                enableMapLink: false,
                trans: '',
                routeUrl: '',
                note: '',
              },
            ],
          },
        ];
        return {
          days: computeDayTitlesWithStartDate(rawNewDays, state.flightInTime, state.startDate),
        };
      }),

    updateDayTitle: (dayId, title) =>
      applyAndPersist((state) => ({
        days: state.days.map((d) => (d.id === dayId ? { ...d, title } : d)),
      })),

    deleteDay: (dayId) =>
      applyAndPersist((state) => {
        const filtered = state.days.filter((d) => d.id !== dayId);
        return {
          days: computeDayTitlesWithStartDate(filtered, state.flightInTime, state.startDate),
        };
      }),

    moveDay: (dayIndex, direction) =>
      applyAndPersist((state) => {
        const targetIdx = direction === 'UP' ? dayIndex - 1 : dayIndex + 1;
        if (targetIdx < 0 || targetIdx >= state.days.length) return {};
        const nextDays = [...state.days];
        const temp = nextDays[dayIndex];
        nextDays[dayIndex] = nextDays[targetIdx];
        nextDays[targetIdx] = temp;
        return {
          days: computeDayTitlesWithStartDate(nextDays, state.flightInTime, state.startDate),
        };
      }),

    reorderDays: (fromIndex, toIndex) =>
      applyAndPersist((state) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= state.days.length ||
          toIndex >= state.days.length
        ) {
          return {};
        }
        const nextDays = [...state.days];
        const [moved] = nextDays.splice(fromIndex, 1);
        nextDays.splice(toIndex, 0, moved);
        return {
          days: computeDayTitlesWithStartDate(nextDays, state.flightInTime, state.startDate),
        };
      }),

    moveSpot: (dayIndex, spotIndex, direction) =>
      applyAndPersist((state) => {
        const targetDay = state.days[dayIndex];
        if (!targetDay) return {};
        const newSpots = [...targetDay.spots];
        const swapTarget = direction === 'UP' ? spotIndex - 1 : spotIndex + 1;
        if (swapTarget < 0 || swapTarget >= newSpots.length) return {};
        const temp = newSpots[spotIndex];
        newSpots[spotIndex] = newSpots[swapTarget];
        newSpots[swapTarget] = temp;

        const updatedDays = [...state.days];
        updatedDays[dayIndex] = { ...targetDay, spots: newSpots };
        return { days: updatedDays };
      }),

    reorderSpots: (dayIndex, fromIndex, toIndex) =>
      applyAndPersist((state) => {
        const targetDay = state.days[dayIndex];
        if (!targetDay || fromIndex === toIndex) return {};
        const newSpots = [...targetDay.spots];
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= newSpots.length ||
          toIndex >= newSpots.length
        ) {
          return {};
        }
        const [moved] = newSpots.splice(fromIndex, 1);
        newSpots.splice(toIndex, 0, moved);
        const updatedDays = [...state.days];
        updatedDays[dayIndex] = { ...targetDay, spots: newSpots };
        return { days: updatedDays };
      }),

    addSpot: (dayIndex) =>
      applyAndPersist((state) => {
        const updatedDays = [...state.days];
        const targetDay = updatedDays[dayIndex];
        if (!targetDay) return {};
        updatedDays[dayIndex] = {
          ...targetDay,
          spots: [
            ...targetDay.spots,
            {
              id: uid(),
              time: '',
              spot: '',
              enableMapLink: false,
              trans: '',
              routeUrl: '',
              note: '',
            },
          ],
        };
        return { days: updatedDays };
      }),

    updateSpot: (dayIndex, spotId, partial) =>
      applyAndPersist((state) => {
        const updatedDays = [...state.days];
        const targetDay = updatedDays[dayIndex];
        if (!targetDay) return {};
        updatedDays[dayIndex] = {
          ...targetDay,
          spots: targetDay.spots.map((s) => (s.id === spotId ? { ...s, ...partial } : s)),
        };
        return { days: updatedDays };
      }),

    deleteSpot: (dayIndex, spotId) =>
      applyAndPersist((state) => {
        const updatedDays = [...state.days];
        const targetDay = updatedDays[dayIndex];
        if (!targetDay) return {};
        updatedDays[dayIndex] = {
          ...targetDay,
          spots: targetDay.spots.filter((s) => s.id !== spotId),
        };
        return { days: updatedDays };
      }),

    addHotel: () =>
      applyAndPersist((state) => ({
        hotels: [
          ...state.hotels,
          {
            id: uid(),
            checkIn: '',
            checkOut: '',
            name: '',
            engName: '',
            address: '',
            trans: '',
          },
        ],
      })),

    updateHotel: (id, partial) =>
      applyAndPersist((state) => ({
        hotels: state.hotels.map((h) => (h.id === id ? { ...h, ...partial } : h)),
      })),

    deleteHotel: (id) =>
      applyAndPersist((state) => ({
        hotels: state.hotels.filter((h) => h.id !== id),
      })),

    addShopping: () =>
      applyAndPersist((state) => ({
        shopping: [
          ...state.shopping,
          {
            id: uid(),
            cat: '',
            desc: '',
          },
        ],
      })),

    updateShopping: (id, partial) =>
      applyAndPersist((state) => ({
        shopping: state.shopping.map((item) =>
          item.id === id ? { ...item, ...partial } : item
        ),
      })),

    deleteShopping: (id) =>
      applyAndPersist((state) => ({
        shopping: state.shopping.filter((item) => item.id !== id),
      })),

    addCoupon: () =>
      applyAndPersist((state) => ({
        coupons: [
          ...state.coupons,
          {
            id: uid(),
            title: '',
            url: '',
            desc: '',
          },
        ],
      })),

    updateCoupon: (id, partial) =>
      applyAndPersist((state) => ({
        coupons: state.coupons.map((c) => (c.id === id ? { ...c, ...partial } : c)),
      })),

    deleteCoupon: (id) =>
      applyAndPersist((state) => ({
        coupons: state.coupons.filter((c) => c.id !== id),
      })),

    addDoc: () =>
      applyAndPersist((state) => ({
        docs: [
          ...state.docs,
          {
            id: uid(),
            title: '',
            note: '',
            linkUrl: '',
          },
        ],
      })),

    updateDoc: (id, partial) =>
      applyAndPersist((state) => ({
        docs: state.docs.map((d) => (d.id === id ? { ...d, ...partial } : d)),
      })),

    deleteDoc: (id) =>
      applyAndPersist((state) => ({
        docs: state.docs.filter((d) => d.id !== id),
      })),

    importFromJSON: (data) =>
      applyAndPersist((state) => {
        const normalized = normalizeGuideData(data, state.currentProjectId || 'default_trip');
        return { ...normalized };
      }),

    loadSampleData: () =>
      applyAndPersist(() => ({
        ...DEFAULT_SAMPLE_DATA,
      })),

    resetToDefault: () =>
      applyAndPersist((state) => ({
        ...createBlankGuideData(state.currentProjectId || ''),
      })),

    getSnapshot: () => {
      const s = get();
      const userId = getActiveUserId();
      const globalFbUrl = getGlobalFirebaseUrlForUser(userId);
      return {
        firebaseDbUrl: globalFbUrl || s.firebaseDbUrl,
        firebaseRoomId: s.firebaseRoomId || s.currentProjectId || 'default_trip',
        guideTitle: s.guideTitle,
        guideSubtitle: s.guideSubtitle,
        guideSummary: s.guideSummary,
        companions: s.companions || '',
        startDate: s.startDate,
        endDate: s.endDate,
        coverUrl: s.coverUrl,
        flights: s.flights,
        flightInTime: s.flightInTime,
        flightInNo: s.flightInNo,
        flightInDep: s.flightInDep,
        flightInArr: s.flightInArr,
        flightOutTime: s.flightOutTime,
        flightOutNo: s.flightOutNo,
        flightOutDep: s.flightOutDep,
        flightOutArr: s.flightOutArr,
        hotels: s.hotels,
        days: s.days,
        shopping: s.shopping,
        coupons: s.coupons,
        docs: s.docs,
        generalNote: s.generalNote || '',
        buildTime: s.buildTime || new Date().toISOString(),
      };
    },
  };
});
