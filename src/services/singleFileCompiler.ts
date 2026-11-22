import { TravelGuideData, FlightItem } from '../types/guide';

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStaticSpan(
  path: string,
  value: string | undefined,
  placeholder: string,
  extraClass = ''
): string {
  const rawVal = value ? String(value) : '';
  const isDef = !rawVal || rawVal.trim() === '';
  const disp = isDef ? `(${placeholder})` : rawVal;
  return `<span class="scheme-c ${isDef ? 'is-placeholder ' : ''}${extraClass}" contenteditable="false" data-path="${path}" data-placeholder="${escapeHtml(
    placeholder
  )}" onfocus="onSchemeCFocus(this)" onblur="onSchemeCBlur(this)">${escapeHtml(disp)}</span>`;
}

function buildStaticBodyHtml(STATE: TravelGuideData): string {
  let html = '';
  const heroCover =
    (STATE.coverUrl && STATE.coverUrl.trim()) ||
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=720&q=80';
  const heroBgStyle = ` style="background-image: linear-gradient(90deg, rgba(2,6,23,0.86) 0%, rgba(15,23,42,0.68) 55%, rgba(15,23,42,0.38) 100%), url('${escapeHtml(
    heroCover
  )}'); background-size: cover; background-position: center;"`;
  html += `<header class="hero print-break-inside-avoid"${heroBgStyle}>`;
  html += '<div class="hero-badge">✈️ TRAVEL HANDBOOK · OFFLINE READY</div>';
  html +=
    '<h1>' +
    renderStaticSpan('guideTitle', STATE.guideTitle, '大標題：例 2026 東京深秋之旅') +
    '</h1>';
  html +=
    '<div class="hero-sub">' +
    renderStaticSpan('guideSubtitle', STATE.guideSubtitle, '副標題：例 5天4夜自由行手冊') +
    '</div>';
  if (STATE.companions && STATE.companions.trim()) {
    html +=
      '<div style="font-size:14px;color:#fef3c7;margin-bottom:12px;">👥 旅行夥伴：' +
      renderStaticSpan('companions', STATE.companions, '同行夥伴名單') +
      '</div>';
  }
  html +=
    '<div class="hero-summary">' +
    renderStaticSpan('guideSummary', STATE.guideSummary, '行程重點摘要說明') +
    '</div>';
  html += '</header>';

  // Flights
  const flightsList: FlightItem[] =
    STATE.flights && STATE.flights.length > 0
      ? STATE.flights
      : [
          {
            id: 'f-in',
            type: '去程航班',
            flightNo: STATE.flightInNo,
            time: STATE.flightInTime,
            dep: STATE.flightInDep,
            arr: STATE.flightInArr,
          },
          {
            id: 'f-out',
            type: '回程航班',
            flightNo: STATE.flightOutNo,
            time: STATE.flightOutTime,
            dep: STATE.flightOutDep,
            arr: STATE.flightOutArr,
          },
        ];

  html +=
    '<details open class="section-card" id="sec-flight"><summary><span>🛫 1. 航班資訊 (Flights)</span><span class="chev">▾</span></summary><div class="section-body grid-2">';
  flightsList.forEach((fl, fIdx) => {
    const basePath = `flights.${fIdx}`;
    html +=
      '<div class="subcard"><div><span class="badge">' +
      renderStaticSpan(basePath + '.type', fl.type, '航段') +
      '</span>';
    html +=
      '<strong>' +
      renderStaticSpan(basePath + '.flightNo', fl.flightNo, '班機代碼') +
      '</strong></div>';
    html +=
      '<div style="margin-top:6px;font-size:14px;">🕒 時間：' +
      renderStaticSpan(basePath + '.time', fl.time, 'YYYY/MM/DD HH:mm') +
      '</div>';
    html +=
      '<div style="font-size:14px;">🛫 出發：' +
      renderStaticSpan(basePath + '.dep', fl.dep, '出發機場') +
      ' → 🛬 抵達：' +
      renderStaticSpan(basePath + '.arr', fl.arr, '抵達機場') +
      '</div></div>';
  });
  html += '</div></details>';

  // Hotels
  html +=
    '<details open class="section-card" id="sec-hotels"><summary><span>🏨 2. 住宿飯店 (Hotels)</span><span class="chev">▾</span></summary><div class="section-body">';
  (STATE.hotels || []).forEach((h, idx) => {
    const mapUrl = h.name
      ? 'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(h.name + ' ' + (h.address || ''))
      : '#';
    html +=
      '<div class="subcard"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
    html +=
      '<div><strong>' +
      renderStaticSpan('hotels.' + idx + '.name', h.name, '飯店名稱') +
      '</strong>';
    if (h.engName) {
      html +=
        ' <span style="font-size:12px;color:#78716c;">(' +
        renderStaticSpan('hotels.' + idx + '.engName', h.engName, '英文名稱') +
        ')</span>';
    }
    html += '</div>';
    if (h.name)
      html += '<a class="map-link" href="' + mapUrl + '" target="_blank">📍 Google Maps</a>';
    html += '</div>';
    html +=
      '<div style="font-size:13px;color:#57534e;margin-top:4px;">📅 入住：' +
      renderStaticSpan('hotels.' + idx + '.checkIn', h.checkIn, 'YYYY-MM-DD') +
      ' ｜ 退房：' +
      renderStaticSpan('hotels.' + idx + '.checkOut', h.checkOut, 'YYYY-MM-DD') +
      '</div>';
    html +=
      '<div style="font-size:13px;margin-top:4px;">📍 地址：' +
      renderStaticSpan('hotels.' + idx + '.address', h.address, '飯店地址') +
      '</div>';
    html +=
      '<div style="font-size:13px;margin-top:4px;">🚇 交通：' +
      renderStaticSpan('hotels.' + idx + '.trans', h.trans, '交通方式說明') +
      '</div>';
    html += '</div>';
  });
  html += '</div></details>';

  // Days
  html +=
    '<details open class="section-card" id="sec-days"><summary><span>🗓️ 3. 每日行程 (Daily Itinerary)</span><span class="chev">▾</span></summary><div class="section-body">';
  (STATE.days || []).forEach((d, dIdx) => {
    html +=
      '<details open class="day-details" id="sec-day-' +
      dIdx +
      '"><summary><span>' +
      renderStaticSpan('days.' + dIdx + '.title', d.title, '當日主題') +
      '</span><span class="chev">▾</span></summary><div class="section-body" style="padding:14px;">';
    (d.spots || []).forEach((s, sIdx) => {
      const spotMap =
        s.enableMapLink && s.spot
          ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.spot)
          : '';
      html +=
        '<div class="spot-item"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
      html +=
        '<div><span class="badge">' +
        renderStaticSpan('days.' + dIdx + '.spots.' + sIdx + '.time', s.time, '09:00 - 11:00') +
        '</span>';
      html +=
        '<strong>' +
        renderStaticSpan('days.' + dIdx + '.spots.' + sIdx + '.spot', s.spot, '景點名稱') +
        '</strong></div>';
      html += '<div style="display:flex;gap:8px;align-items:center;">';
      if (spotMap)
        html += '<a class="map-link" href="' + spotMap + '" target="_blank">🗺️ 景點地圖</a>';
      if (s.routeUrl)
        html +=
          '<a class="map-link" href="' +
          escapeHtml(s.routeUrl) +
          '" target="_blank">🧭 導航路線</a>';
      html += '</div></div>';
      html +=
        '<div style="font-size:13px;margin-top:6px;">🚇 交通：' +
        renderStaticSpan(
          'days.' + dIdx + '.spots.' + sIdx + '.trans',
          s.trans,
          '交通與乘車資訊'
        ) +
        '</div>';
      html +=
        '<div style="font-size:13px;color:#57534e;margin-top:4px;">💡 備註：' +
        renderStaticSpan(
          'days.' + dIdx + '.spots.' + sIdx + '.note',
          s.note,
          '行程備註與提醒'
        ) +
        '</div>';
      html += '</div>';
    });
    html += '</div></details>';
  });
  html += '</div></details>';

  // Shopping
  html +=
    '<details open class="section-card" id="sec-shop"><summary><span>🛍️ 4. 必買伴手禮與採買清單 (Shopping)</span><span class="chev">▾</span></summary><div class="section-body">';
  html +=
    '<table class="shop-table"><thead><tr><th style="width:38%">採買品項 / 類別</th><th>建議購買地點與退稅提醒</th></tr></thead><tbody>';
  (STATE.shopping || []).forEach((item, idx) => {
    html +=
      '<tr><td>' +
      renderStaticSpan('shopping.' + idx + '.cat', item.cat, '品項名稱') +
      '</td><td>' +
      renderStaticSpan('shopping.' + idx + '.desc', item.desc, '購買地點與退稅說明') +
      '</td></tr>';
  });
  html += '</tbody></table></div></details>';

  // Coupons & Docs
  if ((STATE.coupons && STATE.coupons.length) || (STATE.docs && STATE.docs.length)) {
    html +=
      '<details open class="section-card" id="sec-extras"><summary><span>🎟️ 5. 優惠券與重要憑證檔案 (Coupons & Docs)</span><span class="chev">▾</span></summary><div class="section-body grid-2">';
    (STATE.coupons || []).forEach((c, idx) => {
      html +=
        '<div class="subcard"><span class="badge">優惠券</span><strong>' +
        renderStaticSpan('coupons.' + idx + '.title', c.title, '優惠券名稱') +
        '</strong>';
      html +=
        '<div style="font-size:13px;margin-top:6px;white-space:pre-line;">' +
        renderStaticSpan('coupons.' + idx + '.desc', c.desc, '使用限制說明') +
        '</div>';
      if (c.url)
        html +=
          '<div style="margin-top:6px;"><a class="map-link" href="' +
          escapeHtml(c.url) +
          '" target="_blank">🔗 開啟優惠券條碼</a></div>';
      html += '</div>';
    });
    (STATE.docs || []).forEach((doc, idx) => {
      html +=
        '<div class="subcard"><span class="badge">憑證文件</span><strong>' +
        renderStaticSpan('docs.' + idx + '.title', doc.title, '憑證名稱') +
        '</strong>';
      html +=
        '<div style="font-size:13px;margin-top:6px;">' +
        renderStaticSpan('docs.' + idx + '.note', doc.note, '憑證備註') +
        '</div>';
      if (doc.linkUrl)
        html +=
          '<div style="margin-top:6px;"><a class="map-link" href="' +
          escapeHtml(doc.linkUrl) +
          '" target="_blank">📄 開啟雲端憑證</a></div>';
      html += '</div>';
    });
    html += '</div></details>';
  }

  // 7. General Note
  if (STATE.generalNote && STATE.generalNote.trim()) {
    html +=
      '<details open class="section-card" id="sec-notes"><summary><span>📝 6. 備註 (Notes)</span><span class="chev">▾</span></summary><div class="section-body">';
    html +=
      '<div class="subcard" style="white-space:pre-line;font-size:14px;">' +
      renderStaticSpan('generalNote', STATE.generalNote, '旅程備註與提醒事項') +
      '</div>';
    html += '</div></details>';
  }

  return html;
}

export const compileToSingleHtml = (data: TravelGuideData): string => {
  const currentBuildTime = new Date().toISOString();
  const normalizedData: TravelGuideData = {
    ...data,
    flights:
      data.flights && data.flights.length > 0
        ? data.flights
        : [
            {
              id: 'f-in',
              type: '去程航班',
              flightNo: data.flightInNo || '',
              time: data.flightInTime || '',
              dep: data.flightInDep || '',
              arr: data.flightInArr || '',
            },
            {
              id: 'f-out',
              type: '回程航班',
              flightNo: data.flightOutNo || '',
              time: data.flightOutTime || '',
              dep: data.flightOutDep || '',
              arr: data.flightOutArr || '',
            },
          ],
  };

  const safeJson = JSON.stringify(normalizedData).replace(/</g, '\\u003c');
  const preRenderedHtml = buildStaticBodyHtml(normalizedData);

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(normalizedData.guideTitle || '旅遊手冊')}</title>
  <style>
    :root {
      --bg: #fafaf9;
      --card: #ffffff;
      --text: #1c1917;
      --muted: #78716c;
      --placeholder: #9ca3af;
      --accent: #b45309;
      --accent-soft: #fef3c7;
      --border: #e7e5e4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 96px;
    }
    .container { max-width: 880px; margin: 0 auto; padding: 24px 16px; }
    .hero {
      background: linear-gradient(135deg, #1c1917 0%, #44403c 60%, #78350f 100%);
      color: #fff;
      border-radius: 20px;
      padding: 32px 28px;
      margin-bottom: 24px;
      box-shadow: 0 12px 30px -10px rgba(28, 25, 23, 0.35);
      position: relative;
      overflow: hidden;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(255,255,255,0.14);
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    .hero h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .hero-sub { font-size: 16px; color: #fde68a; margin-bottom: 14px; }
    .hero-summary {
      font-size: 14px;
      color: #e7e5e4;
      background: rgba(255,255,255,0.08);
      padding: 12px 16px;
      border-radius: 12px;
      border-left: 3px solid #f59e0b;
      white-space: pre-line;
    }
    details.section-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      overflow: hidden;
    }
    details.section-card > summary {
      list-style: none;
      cursor: pointer;
      padding: 16px 20px;
      font-weight: 700;
      font-size: 17px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
      background: #fff;
    }
    details.section-card[open] > summary {
      border-bottom: 1px solid var(--border);
      background: #fafaf9;
    }
    details.section-card > summary::-webkit-details-marker { display: none; }
    .section-body { padding: 18px 20px; }
    .day-details {
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 12px;
      background: #fff;
    }
    .day-details > summary {
      list-style: none;
      cursor: pointer;
      padding: 13px 16px;
      font-weight: 600;
      color: #92400e;
      background: #fffbeb;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .day-details[open] > summary {
      border-bottom: 1px solid #fde68a;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    .day-details > summary::-webkit-details-marker { display: none; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    .subcard {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
      background: #fafaf9;
      margin-bottom: 10px;
    }
    .spot-item {
      border-left: 3px solid #d97706;
      padding: 12px 14px;
      background: #fafaf9;
      border-radius: 0 12px 12px 0;
      margin-bottom: 10px;
    }
    .badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 9px;
      border-radius: 6px;
      background: #fef3c7;
      color: #92400e;
      margin-right: 8px;
    }
    a.map-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #b45309;
      font-weight: 600;
      text-decoration: none;
      font-size: 13px;
    }
    a.map-link:hover { text-decoration: underline; }
    table.shop-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    table.shop-table th, table.shop-table td {
      border: 1px solid var(--border);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    table.shop-table th { background: #f5f5f4; font-weight: 600; }
    .scheme-c {
      transition: all 0.15s;
      border-radius: 4px;
      padding: 1px 4px;
      white-space: pre-line;
    }
    .scheme-c.is-placeholder { color: var(--placeholder) !important; font-style: italic; }
    body.edit-mode .scheme-c {
      outline: 1px dashed rgba(217, 119, 6, 0.65);
      background: rgba(254, 243, 199, 0.25);
      cursor: text;
    }
    .fab-bar {
      position: fixed;
      bottom: 18px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(28, 25, 23, 0.94);
      backdrop-filter: blur(8px);
      color: #fff;
      padding: 8px 14px;
      border-radius: 999px;
      display: flex;
      gap: 8px;
      align-items: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      z-index: 999;
    }
    .fab-btn {
      background: rgba(255,255,255,0.12);
      color: #fff;
      border: none;
      padding: 7px 13px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .fab-btn.active { background: #d97706; }
    @media print {
      @page { size: A4 portrait; margin: 12mm; }
      body { background: #fff !important; padding-bottom: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .no-print, .fab-bar { display: none !important; }
      .section-card, .day-details {
        overflow: visible !important;
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      .subcard, .spot-item, tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .scheme-c { outline: none !important; background: transparent !important; }
    }
  </style>
</head>
<body>
  <div class="container" id="guide-app-root">${preRenderedHtml}</div>

  <div class="fab-bar no-print">
    <button class="fab-btn" id="btn-toggle-edit" onclick="toggleEditMode()">✏️ 行內編輯: 關閉</button>
    <button class="fab-btn" onclick="toggleAllDetails(true)">📂 全部展開</button>
    <button class="fab-btn" onclick="toggleAllDetails(false)">📁 全部收合</button>
    <button class="fab-btn" onclick="handlePrint()">🖨️ 列印 / 匯出 PDF</button>
  </div>

  <script>
    let STATE = ${safeJson};
    const LOCAL_BUILD_TIME = "${currentBuildTime}";
    let isEditMode = false;

    function esc(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderSpan(path, value, placeholder, extraClass) {
      extraClass = extraClass || '';
      const isDef = !value || String(value).trim() === '';
      const disp = isDef ? '(' + placeholder + ')' : value;
      return '<span class="scheme-c ' + (isDef ? 'is-placeholder ' : '') + extraClass + '" ' +
        'contenteditable="' + (isEditMode ? 'true' : 'false') + '" ' +
        'data-path="' + path + '" data-placeholder="' + esc(placeholder) + '" ' +
        'onfocus="onSchemeCFocus(this)" onblur="onSchemeCBlur(this)">' + esc(disp) + '</span>';
    }

    function onSchemeCFocus(el) {
      if (!isEditMode) return;
      const ph = '(' + el.getAttribute('data-placeholder') + ')';
      if ((el.innerText || el.textContent || '').trim() === ph) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    function onSchemeCBlur(el) {
      const ph = el.getAttribute('data-placeholder');
      const raw = (el.innerText || el.textContent || '').replace(/\\r\\n/g, '\\n').trim();
      const val = (!raw || raw === '(' + ph + ')') ? '' : raw;
      const path = el.getAttribute('data-path');
      setByPath(STATE, path, val);
      persistAndSync();
      renderApp();
    }

    function setByPath(obj, path, value) {
      const parts = path.split('.');
      let cur = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
    }

    function renderApp() {
      const root = document.getElementById('guide-app-root');
      const existingDetails = Array.from(document.querySelectorAll('details[id]'));
      const openIds = existingDetails.length > 0
        ? existingDetails.filter(d => d.open).map(d => d.id)
        : null;

      let html = '';
      const heroCover = (STATE.coverUrl && STATE.coverUrl.trim()) || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=720&q=80';
      const heroBgStyle = ' style="background-image: linear-gradient(90deg, rgba(2,6,23,0.86) 0%, rgba(15,23,42,0.68) 55%, rgba(15,23,42,0.38) 100%), url(\\'' + esc(heroCover) + '\\'); background-size: cover; background-position: center;"';
      html += '<header class="hero print-break-inside-avoid"' + heroBgStyle + '>';
      html += '<div class="hero-badge">✈️ TRAVEL HANDBOOK · OFFLINE READY</div>';
      html += '<h1>' + renderSpan('guideTitle', STATE.guideTitle, '大標題：例 2026 東京深秋之旅') + '</h1>';
      html += '<div class="hero-sub">' + renderSpan('guideSubtitle', STATE.guideSubtitle, '副標題：例 5天4夜自由行手冊') + '</div>';
      if ((STATE.companions && STATE.companions.trim()) || isEditMode) {
        html += '<div style="font-size:14px;color:#fef3c7;margin-bottom:12px;">👥 旅行夥伴：' + renderSpan('companions', STATE.companions || '', '同行夥伴名單') + '</div>';
      }
      html += '<div class="hero-summary">' + renderSpan('guideSummary', STATE.guideSummary, '行程重點摘要說明') + '</div>';
      html += '</header>';

      // Flights
      html += '<details open class="section-card" id="sec-flight"><summary><span>🛫 1. 航班資訊 (Flights)</span><span class="chev">▾</span></summary><div class="section-body grid-2">';
      const flightsList = (STATE.flights && STATE.flights.length) ? STATE.flights : [
        { type: '去程航班', flightNo: STATE.flightInNo, time: STATE.flightInTime, dep: STATE.flightInDep, arr: STATE.flightInArr },
        { type: '回程航班', flightNo: STATE.flightOutNo, time: STATE.flightOutTime, dep: STATE.flightOutDep, arr: STATE.flightOutArr }
      ];
      flightsList.forEach((fl, fIdx) => {
        const basePath = 'flights.' + fIdx;
        html += '<div class="subcard"><div><span class="badge">' + renderSpan(basePath + '.type', fl.type, '航段') + '</span>';
        html += '<strong>' + renderSpan(basePath + '.flightNo', fl.flightNo, '班機代碼') + '</strong></div>';
        html += '<div style="margin-top:6px;font-size:14px;">🕒 時間：' + renderSpan(basePath + '.time', fl.time, 'YYYY/MM/DD HH:mm') + '</div>';
        html += '<div style="font-size:14px;">🛫 出發：' + renderSpan(basePath + '.dep', fl.dep, '出發機場') + ' → 🛬 抵達：' + renderSpan(basePath + '.arr', fl.arr, '抵達機場') + '</div></div>';
      });
      html += '</div></details>';

      // Hotels
      html += '<details open class="section-card" id="sec-hotels"><summary><span>🏨 2. 住宿飯店 (Hotels)</span><span class="chev">▾</span></summary><div class="section-body">';
      (STATE.hotels || []).forEach((h, idx) => {
        const mapUrl = h.name ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(h.name + ' ' + (h.address || '')) : '#';
        html += '<div class="subcard"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
        html += '<div><strong>' + renderSpan('hotels.' + idx + '.name', h.name, '飯店名稱') + '</strong>';
        if (h.engName || isEditMode) {
          html += ' <span style="font-size:12px;color:#78716c;">(' + renderSpan('hotels.' + idx + '.engName', h.engName || '', '英文名稱') + ')</span>';
        }
        html += '</div>';
        if (h.name) html += '<a class="map-link" href="' + mapUrl + '" target="_blank">📍 Google Maps</a>';
        html += '</div>';
        html += '<div style="font-size:13px;color:#57534e;margin-top:4px;">📅 入住：' + renderSpan('hotels.' + idx + '.checkIn', h.checkIn, 'YYYY-MM-DD') + ' ｜ 退房：' + renderSpan('hotels.' + idx + '.checkOut', h.checkOut, 'YYYY-MM-DD') + '</div>';
        html += '<div style="font-size:13px;margin-top:4px;">📍 地址：' + renderSpan('hotels.' + idx + '.address', h.address, '飯店地址') + '</div>';
        html += '<div style="font-size:13px;margin-top:4px;">🚇 交通：' + renderSpan('hotels.' + idx + '.trans', h.trans, '交通方式說明') + '</div>';
        html += '</div>';
      });
      html += '</div></details>';

      // Days
      html += '<details open class="section-card" id="sec-days"><summary><span>🗓️ 3. 每日行程 (Daily Itinerary)</span><span class="chev">▾</span></summary><div class="section-body">';
      (STATE.days || []).forEach((d, dIdx) => {
        html += '<details open class="day-details" id="sec-day-' + dIdx + '"><summary><span>' + renderSpan('days.' + dIdx + '.title', d.title, '當日主題') + '</span><span class="chev">▾</span></summary><div class="section-body" style="padding:14px;">';
        (d.spots || []).forEach((s, sIdx) => {
          const spotMap = (s.enableMapLink && s.spot) ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.spot) : '';
          html += '<div class="spot-item"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
          html += '<div><span class="badge">' + renderSpan('days.' + dIdx + '.spots.' + sIdx + '.time', s.time, '09:00 - 11:00') + '</span>';
          html += '<strong>' + renderSpan('days.' + dIdx + '.spots.' + sIdx + '.spot', s.spot, '景點名稱') + '</strong></div>';
          html += '<div style="display:flex;gap:8px;align-items:center;">';
          if (spotMap) html += '<a class="map-link" href="' + spotMap + '" target="_blank">🗺️ 景點地圖</a>';
          if (s.routeUrl) html += '<a class="map-link" href="' + esc(s.routeUrl) + '" target="_blank">🧭 導航路線</a>';
          html += '</div></div>';
          html += '<div style="font-size:13px;margin-top:6px;">🚇 交通：' + renderSpan('days.' + dIdx + '.spots.' + sIdx + '.trans', s.trans, '交通與乘車資訊') + '</div>';
          html += '<div style="font-size:13px;color:#57534e;margin-top:4px;">💡 備註：' + renderSpan('days.' + dIdx + '.spots.' + sIdx + '.note', s.note, '行程備註與提醒') + '</div>';
          html += '</div>';
        });
        html += '</div></details>';
      });
      html += '</div></details>';

      // Shopping
      html += '<details open class="section-card" id="sec-shop"><summary><span>🛍️ 4. 必買伴手禮與採買清單 (Shopping)</span><span class="chev">▾</span></summary><div class="section-body">';
      html += '<table class="shop-table"><thead><tr><th style="width:38%">採買品項 / 類別</th><th>建議購買地點與退稅提醒</th></tr></thead><tbody>';
      (STATE.shopping || []).forEach((item, idx) => {
        html += '<tr><td>' + renderSpan('shopping.' + idx + '.cat', item.cat, '品項名稱') + '</td><td>' + renderSpan('shopping.' + idx + '.desc', item.desc, '購買地點與退稅說明') + '</td></tr>';
      });
      html += '</tbody></table></div></details>';

      // Coupons & Docs
      if ((STATE.coupons && STATE.coupons.length) || (STATE.docs && STATE.docs.length)) {
        html += '<details open class="section-card" id="sec-extras"><summary><span>🎟️ 5. 優惠券與重要憑證檔案 (Coupons & Docs)</span><span class="chev">▾</span></summary><div class="section-body grid-2">';
        (STATE.coupons || []).forEach((c, idx) => {
          html += '<div class="subcard"><span class="badge">優惠券</span><strong>' + renderSpan('coupons.' + idx + '.title', c.title, '優惠券名稱') + '</strong>';
          html += '<div style="font-size:13px;margin-top:6px;">' + renderSpan('coupons.' + idx + '.desc', c.desc, '使用限制說明') + '</div>';
          if (c.url) html += '<div style="margin-top:6px;"><a class="map-link" href="' + esc(c.url) + '" target="_blank">🔗 開啟優惠券條碼</a></div>';
          html += '</div>';
        });
        (STATE.docs || []).forEach((doc, idx) => {
          html += '<div class="subcard"><span class="badge">憑證文件</span><strong>' + renderSpan('docs.' + idx + '.title', doc.title, '憑證名稱') + '</strong>';
          html += '<div style="font-size:13px;margin-top:6px;">' + renderSpan('docs.' + idx + '.note', doc.note, '憑證備註') + '</div>';
          if (doc.linkUrl) html += '<div style="margin-top:6px;"><a class="map-link" href="' + esc(doc.linkUrl) + '" target="_blank">📄 開啟雲端憑證</a></div>';
          html += '</div>';
        });
        html += '</div></details>';
      }

      // General Note
      if ((STATE.generalNote && STATE.generalNote.trim()) || isEditMode) {
        html += '<details open class="section-card" id="sec-notes"><summary><span>📝 6. 備註 (Notes)</span><span class="chev">▾</span></summary><div class="section-body">';
        html += '<div class="subcard" style="white-space:pre-line;font-size:14px;">' + renderSpan('generalNote', STATE.generalNote || '', '旅程備註與提醒事項') + '</div>';
        html += '</div></details>';
      }

      root.innerHTML = html;
      if (openIds !== null) {
        document.querySelectorAll('details[id]').forEach(d => {
          d.open = openIds.includes(d.id);
        });
      }
    }

    function toggleEditMode() {
      isEditMode = !isEditMode;
      document.body.classList.toggle('edit-mode', isEditMode);
      const btn = document.getElementById('btn-toggle-edit');
      btn.textContent = isEditMode ? '✏️ 行內編輯: 開啟' : '✏️ 行內編輯: 關閉';
      btn.classList.toggle('active', isEditMode);
      renderApp();
    }

    function toggleAllDetails(open) {
      document.querySelectorAll('details').forEach(d => {
        d.open = open;
      });
    }

    function handlePrint() {
      const list = Array.from(document.querySelectorAll('details'));
      const prev = list.map(d => d.open);
      list.forEach(d => { d.open = true; d.setAttribute('open', ''); });
      window.addEventListener('afterprint', function restore() {
        list.forEach((d, i) => { d.open = prev[i]; });
        window.removeEventListener('afterprint', restore);
      }, { once: true });
      setTimeout(() => window.print(), 100);
    }

    window.addEventListener('beforeprint', () => {
      document.querySelectorAll('details').forEach(d => {
        d.open = true;
        d.setAttribute('open', '');
      });
    });

    async function persistAndSync() {
      try {
        localStorage.setItem('standalone_guide_state', JSON.stringify(STATE));
        if (!STATE.firebaseDbUrl || !STATE.firebaseRoomId) return;
        let base = STATE.firebaseDbUrl.trim();
        if (!base.endsWith('/')) base += '/';
        const endpoint = base + 'guides/' + encodeURIComponent(STATE.firebaseRoomId) + '.json';
        await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: STATE, updatedAt: new Date().toISOString() })
        });
      } catch (e) {
        console.warn('Cloud sync skipped:', e);
      }
    }

    async function initCloudSync() {
      if (!STATE.firebaseDbUrl || !STATE.firebaseRoomId) return;
      try {
        let base = STATE.firebaseDbUrl.trim();
        if (!base.endsWith('/')) base += '/';
        const endpoint = base + 'guides/' + encodeURIComponent(STATE.firebaseRoomId) + '.json';
        const res = await fetch(endpoint);
        const data = await res.json();
        const cloudTs = data && data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
        const localTs = new Date(LOCAL_BUILD_TIME).getTime();
        if (data && data.state && cloudTs > localTs) {
          STATE = data.state;
          renderApp();
        } else {
          await persistAndSync();
        }
      } catch (e) {
        console.warn('Offline standalone mode:', e);
      }
    }

    renderApp();
    initCloudSync();
  <\/script>
</body>
</html>`;
};

export const downloadSingleHtml = (data: TravelGuideData): void => {
  const htmlContent = compileToSingleHtml(data);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (data.guideTitle || 'travel-guide').replace(/[\\/:*?"<>|]/g, '_');
  a.href = url;
  a.download = `${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延遲 60 秒才釋放 Blob URL，避免瀏覽器非同步下載或直接開啟時出現空白頁
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
};
