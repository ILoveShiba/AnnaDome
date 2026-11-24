export interface ProjectMeta {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  cover: string;
  updatedAt?: string;
  ownerId?: string;
  ownerName?: string;
  isCoEditing?: boolean;
  isSharedWithMe?: boolean;
  roomId?: string;
}

export interface TrashProjectEntry {
  project: ProjectMeta;
  guideData: TravelGuideData;
  deletedAt: string; // ISO String (移入暫存檔時間)
  expiresAt: string; // ISO String (10 天後自動永久刪除時間)
}

export interface FlightItem {
  id: string;
  direction?: 'outbound' | 'inbound'; // 去程 ('outbound') 或 回程 ('inbound')
  type: string;      // 例："去程航班" | "回程航班" | "轉機 / 國內線"
  time: string;      // 例："2026/11/20(五) 08:30 > 12:35"
  date?: string;     // YYYY-MM-DD (點選日曆)
  depTime?: string;  // HH:mm (出發時間)
  arrTime?: string;  // HH:mm (抵達時間)
  flightNo: string;  // 例："JX800 星宇航空"
  dep: string;       // 例："桃園機場 T1"
  arr: string;       // 例："成田機場 T2"
}

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
  time: string;            // 例："14:00 - 16:00"
  spot: string;            // 景點名稱
  enableMapLink?: boolean; // 是否啟用自動轉 Google Maps 景點連結
  trans: string;           // 交通形式說明
  routeUrl: string;        // Google Maps Direction URL
  note: string;            // 備註說明
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
  companions?: string; // 1. 旅行夥伴
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  coverUrl?: string;

  // 多航段航班清單（支援動態新增/刪除）
  flights: FlightItem[];

  // 向下相容舊版雙程欄位
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

  // 7. 備註（純文字章節）
  generalNote?: string;

  // 共編擁有者與共編開關識別
  ownerId?: string;
  ownerName?: string;
  isCoEditing?: boolean;

  // 構建版本識別
  buildTime?: string; // ISO String
}
