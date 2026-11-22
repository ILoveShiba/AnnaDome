/**
 * 本機圖片上傳自動縮圖與 Base64 壓縮服務
 * - 將使用者上傳的任意尺寸照片透過 Canvas 等比例縮放至最大寬高 (預設 720px)
 * - 輸出為高畫質 JPEG Data URL (data:image/jpeg;base64,...)，單張約 35KB ~ 75KB
 * - 可直接嵌入專案 JSON、LocalStorage 與 Firebase Realtime Database，換瀏覽器或跨裝置皆可直接顯示
 */

export const PRESET_COVERS: string[] = [
  // 1-2: 海灘
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=720&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=720&q=80',
  // 3-4: 歐美
  'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=720&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=720&q=80',
  // 5-6: 夏日
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=720&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=720&q=80',
  // 7-8: 冬日
  'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=720&q=80',
  'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?auto=format&fit=crop&w=720&q=80',
  // 9-10: 城市
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80',
  'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=720&q=80',
  // 11-12: 山林
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=720&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=720&q=80',
  // 13-14: 美食
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=720&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=720&q=80',
];

export function compressImageFileToDataUrl(
  file: File,
  maxWidth = 720,
  maxHeight = 450,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('請選擇有效的圖片檔案（JPG / PNG / WebP）！'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('讀取圖片檔案失敗！'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('解析圖片格式失敗！'));
      img.onload = () => {
        let targetW = img.width;
        let targetH = img.height;

        if (targetW > maxWidth || targetH > maxHeight) {
          const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }

        // 先鋪一層白底（防止透明 PNG 轉 JPEG 時背景變黑）
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
