// 手機螢幕特寫的畫面。每一個 draw(ctx, w, h, t, T)：t 是這一段演出的秒數，T 是全域時間。
// 畫面裡的動作（誰什麼時候滑、什麼時候寫）要跟場景裡的時間對得上。
import { span } from '../scene-kit.js';

const FONT = '"Noto Sans TC","PingFang TC","Hiragino Sans","Microsoft JhengHei",sans-serif';
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
const txt = (c, s, x, y, size, color, align = 'left', weight = 600, font = FONT) => {
  c.font = `${weight} ${size}px ${font}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y);
};
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* ============================== Nokia 3310（單色 LCD） ============================== */
const LCD_BG = '#a9bf8e', LCD_INK = '#26301c';
function lcdFrame(c, W, H) {           // 設計座標 240×178
  const k = W / 240; c.scale(k, k);
  c.fillStyle = LCD_BG; c.fillRect(0, 0, 240, H / k);
  return k;
}
function lcdGrid(c, W, H) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = 'rgba(38,48,28,.07)';
  for (let x = 0; x < W; x += 4) c.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
}
function signal(c, x, y, n, ink = LCD_INK) { c.fillStyle = ink; for (let i = 0; i < 5; i++) { const h = 4 + i * 3; c.globalAlpha = i < n ? 1 : 0.2; c.fillRect(x + i * 6, y + 16 - h, 4, h); } c.globalAlpha = 1; }
function battery(c, x, y, lv, ink = LCD_INK) { c.strokeStyle = ink; c.lineWidth = 2; c.strokeRect(x, y, 22, 12); c.fillStyle = ink; c.fillRect(x + 22, y + 3, 3, 6); for (let i = 0; i < lv; i++) c.fillRect(x + 3 + i * 6, y + 3, 4, 6); }

function snakeScreen(c, W, H, t, T, score) {
  lcdFrame(c, W, H);
  signal(c, 8, 6, 4); battery(c, 202, 8, 3);
  txt(c, String(score).padStart(4, '0'), 120, 14, 14, LCD_INK, 'center', 800, 'monospace');
  c.strokeStyle = LCD_INK; c.lineWidth = 2; c.strokeRect(6, 28, 228, 140);
  const cell = 12, ox = 10, oy = 32, cols = 18, rows = 11;
  // 蛇沿著一圈路徑前進，吃到東西就變長
  const path = [];
  for (let x = 2; x < cols - 2; x++) path.push([x, 2]);
  for (let y = 2; y < rows - 2; y++) path.push([cols - 3, y]);
  for (let x = cols - 3; x > 2; x--) path.push([x, rows - 3]);
  for (let y = rows - 3; y > 2; y--) path.push([2, y]);
  const len = clamp(5 + Math.floor((T % 40) / 3), 5, 16);
  const head = Math.floor(T * 6.5) % path.length;
  c.fillStyle = LCD_INK;
  for (let i = 0; i < len; i++) {
    const [x, y] = path[(head - i + path.length * 3) % path.length];
    c.fillRect(ox + x * cell + 1, oy + y * cell + 1, cell - 2, cell - 2);
  }
  if (Math.floor(T * 3) % 2) { c.fillRect(ox + 9 * cell + 3, oy + 5 * cell + 3, 6, 6); }   // 閃爍的食物
  lcdGrid(c, W, H);
}
export const nokiaInsets = {
  room: { aspect: 1.35, tone: 'lcd', label: 'Nokia 3310 螢幕', draw(c, W, H, t, T) {
    lcdFrame(c, W, H); signal(c, 8, 6, 4); battery(c, 202, 8, 3);
    txt(c, '12:00', 120, 80, 52, LCD_INK, 'center', 800, 'monospace');
    txt(c, 'NOKIA', 120, 120, 16, LCD_INK, 'center', 800);
    txt(c, 'Menu', 120, 158, 14, LCD_INK, 'center', 700);
    lcdGrid(c, W, H);
  } },
  snake: { aspect: 1.35, tone: 'lcd', label: '貪吃蛇', draw(c, W, H, t, T) { snakeScreen(c, W, H, t, T, 30 + Math.floor(t * 4) * 10); } },
  drop: { aspect: 1.35, tone: 'lcd', label: '摔下去之後', draw(c, W, H, t, T) { snakeScreen(c, W, H, t, T, 240); } },
  sms: { aspect: 1.35, tone: 'lcd', label: '傳簡訊', draw(c, W, H, t, T) {
    lcdFrame(c, W, H); signal(c, 8, 6, 4); battery(c, 202, 8, 3);
    const msg = 'Meet at 5? c u soon';
    const n = clamp(Math.floor((t - 1.2) * 4.5), 0, msg.length);
    txt(c, 'Write message', 120, 14, 14, LCD_INK, 'center', 800);
    c.fillStyle = LCD_INK; c.fillRect(8, 30, 224, 2);
    const shown = msg.slice(0, n);
    const lines = [shown.slice(0, 15), shown.slice(15)];
    lines.forEach((l, i) => txt(c, l + (i === (n > 15 ? 1 : 0) && Math.floor(T * 2) % 2 ? '_' : ''), 12, 56 + i * 26, 22, LCD_INK, 'left', 800, 'monospace'));
    txt(c, `${160 - n}`, 218, 118, 16, LCD_INK, 'right', 800, 'monospace');
    txt(c, '(160 字元上限)', 12, 118, 12, LCD_INK, 'left', 700);
    c.fillRect(0, 140, 240, 2); txt(c, 'Options', 10, 158, 14, LCD_INK, 'left', 800); txt(c, 'Clear', 230, 158, 14, LCD_INK, 'right', 800);
    lcdGrid(c, W, H);
  } }
};

/* ============================== 第一代 iPhone ============================== */
function iphoneBar(c, label = '9:41 AM') {
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, 320, 22);
  txt(c, 'AT&T', 8, 11, 11, '#fff', 'left', 700); txt(c, 'E', 46, 11, 10, '#fff', 'left', 800);
  txt(c, label, 160, 11, 12, '#fff', 'center', 700);
  c.fillStyle = '#fff'; c.fillRect(280, 7, 26, 9); c.fillStyle = '#22c55e'; c.fillRect(282, 9, 18, 5);
}
function iphoneHome(c, fade = 1) {
  c.globalAlpha = fade;
  const g = c.createLinearGradient(0, 0, 320, 480); g.addColorStop(0, '#1e3a8a'); g.addColorStop(1, '#7c3aed'); c.fillStyle = g; c.fillRect(0, 0, 320, 480);
  const cols = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#06b6d4', '#a855f7', '#f43f5e', '#14b8a6', '#84cc16', '#f59e0b', '#6366f1', '#ec4899', '#0ea5e9', '#10b981', '#e11d48'];
  const names = ['簡訊', '行事曆', '相片', '相機', 'YouTube', '股市', '地圖', '天氣', '時鐘', '計算機', '備忘錄', '設定', 'iTunes', 'Safari', '電話', '郵件'];
  for (let i = 0; i < 16; i++) {
    const x = 26 + (i % 4) * 70, y = 52 + Math.floor(i / 4) * 84;
    c.fillStyle = cols[i]; rr(c, x, y, 52, 52, 12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; rr(c, x, y, 52, 24, 12); c.fill();
    txt(c, names[i], x + 26, y + 66, 10.5, '#fff', 'center', 600);
  }
  c.fillStyle = 'rgba(255,255,255,.22)'; rr(c, 10, 410, 300, 66, 14); c.fill();
  [0, 1, 2, 3].forEach((i) => { c.fillStyle = cols[[14, 15, 13, 3][i]]; rr(c, 28 + i * 70, 418, 52, 52, 12); c.fill(); });
  c.globalAlpha = 1;
}
function photoDraw(c, zoom) {
  c.save(); c.translate(160, 250); c.scale(zoom, zoom); c.translate(-160, -250);
  const sky = c.createLinearGradient(0, 120, 0, 330); sky.addColorStop(0, '#6ab7ff'); sky.addColorStop(1, '#ffd9a0'); c.fillStyle = sky; c.fillRect(0, 120, 320, 220);
  c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(220, 215, 24, 0, 7); c.fill();
  c.fillStyle = '#2f5d46'; c.beginPath(); c.moveTo(0, 330); c.lineTo(70, 230); c.lineTo(130, 290); c.lineTo(200, 220); c.lineTo(320, 330); c.closePath(); c.fill();
  c.fillStyle = '#1f3f33'; c.beginPath(); c.moveTo(0, 330); c.lineTo(100, 270); c.lineTo(180, 330); c.closePath(); c.fill();
  const lake = c.createLinearGradient(0, 330, 0, 380); lake.addColorStop(0, '#6aa6d8'); lake.addColorStop(1, '#2f5d8c'); c.fillStyle = lake; c.fillRect(0, 330, 320, 50);
  // 兩個人影（朋友合照）
  c.fillStyle = '#2b2b33'; [[120, 292], [150, 296]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y - 14, 7, 0, 7); c.fill(); rr(c, x - 9, y - 6, 18, 34, 6); c.fill(); });
  c.restore();
}
export const iphoneInsets = {
  swipe: { aspect: 0.667, tone: 'phone', label: '第一代 iPhone', draw(c, W, H, t, T) {
    const k = W / 320; c.scale(k, k);
    const unlock = span(t, 3.6, 5.2);
    const g = c.createLinearGradient(0, 0, 320, 480); g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#312e81'); c.fillStyle = g; c.fillRect(0, 0, 320, 480);
    txt(c, '9:41', 160, 120, 66, '#fff', 'center', 300, FONT); txt(c, '6月29日　星期五', 160, 172, 14, 'rgba(255,255,255,.8)', 'center', 500);
    // 滑動解鎖的滑桿
    c.fillStyle = 'rgba(255,255,255,.18)'; rr(c, 24, 380, 272, 52, 26); c.fill();
    const kx = 30 + unlock * 216;
    const shimmer = (T * 0.8) % 1;
    txt(c, '滑動來解鎖', 172, 406, 17, `rgba(255,255,255,${0.35 + 0.35 * Math.sin(shimmer * 6.28)})`, 'center', 500);
    c.fillStyle = '#e5e7eb'; rr(c, kx, 384, 56, 44, 22); c.fill(); txt(c, '›', kx + 28, 404, 28, '#6b7280', 'center', 800);
    if (t >= 3.6 && t < 5.4) { c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(kx + 28, 406, 18, 0, 7); c.fill(); }
    iphoneBar(c, '');
    if (unlock >= 1) { iphoneHome(c, span(t, 5.2, 6.0)); iphoneBar(c); }
  } },
  pinch: { aspect: 0.667, tone: 'phone', label: '兩指放大照片', draw(c, W, H, t, T) {
    const k = W / 320; c.scale(k, k);
    c.fillStyle = '#000'; c.fillRect(0, 0, 320, 480);
    const pz = span(t, 3.4, 6.2) * (1 - span(t, 7.0, 7.4));
    const zoom = 1 + 1.35 * pz;
    c.save(); rr(c, 0, 22, 320, 436, 0); c.clip(); photoDraw(c, zoom); c.restore();
    if (pz > 0.02) {   // 兩根手指往外拉
      const d = 24 + 78 * pz;
      [-1, 1].forEach((s) => { c.fillStyle = 'rgba(255,255,255,.32)'; c.beginPath(); c.arc(160 + s * d * 0.8, 250 - s * d * 0.5, 22, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.stroke(); });
    }
    iphoneBar(c); txt(c, '相片', 160, 470, 12, 'rgba(255,255,255,.6)', 'center', 600);
  } },
  compare: { aspect: 0.667, tone: 'phone', label: '主畫面', draw(c, W, H, t, T) { const k = W / 320; c.scale(k, k); iphoneHome(c); iphoneBar(c); } }
};

/* ============================== Galaxy Note（手寫筆記） ============================== */
function paper(c, title) {
  c.fillStyle = '#fff6bf'; c.fillRect(0, 0, 320, 520);
  c.fillStyle = '#e8a33b'; c.fillRect(0, 0, 320, 40);
  txt(c, title, 14, 21, 16, '#3b2a10', 'left', 800);
  c.strokeStyle = 'rgba(70,120,200,.35)'; c.lineWidth = 1.2;
  for (let y = 84; y < 500; y += 36) { c.beginPath(); c.moveTo(0, y); c.lineTo(320, y); c.stroke(); }
}
function scribble(c, y, len, seed, prog) {   // 一行看起來像手寫的線條，prog 是寫到多少
  c.strokeStyle = '#1e3a8a'; c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  const n = Math.floor(len * prog);
  for (let x = 0; x <= n; x += 2) {
    const gap = Math.sin(x * 0.17 + seed) > 0.78;                 // 字和字中間斷開
    const yy = y + Math.sin(x * 0.42 + seed) * 7 + Math.sin(x * 1.3 + seed * 2) * 3;
    if (gap) { c.moveTo(16 + x, yy); } else c.lineTo(16 + x, yy);
  }
  c.stroke();
  return [16 + n, y];
}
export const noteInsets = {
  write: { aspect: 0.62, tone: 'phone', label: 'S Pen 寫字', draw(c, W, H, t, T) {
    const k = W / 320; c.scale(k, k); paper(c, '期中報告大綱');
    const u = clamp((t - 2.6) * 0.9, 0, 4);
    const lens = [250, 210, 270, 160];
    let pen = null;
    for (let i = 0; i < 4; i++) {
      const p = clamp(u - i, 0, 1); if (p <= 0) continue;
      pen = scribble(c, 74 + i * 36, lens[i], i * 1.7, p);
    }
    if (pen && u < 4) { c.fillStyle = '#111'; c.beginPath(); c.arc(pen[0], pen[1], 4, 0, 7); c.fill(); }
  } },
  draw: { aspect: 0.62, tone: 'phone', label: '畫草圖', draw(c, W, H, t, T) {
    const k = W / 320; c.scale(k, k); paper(c, '想法草圖');
    c.strokeStyle = '#1e3a8a'; c.lineWidth = 3; c.lineCap = 'round';
    const p1 = span(t, 0.6, 2.6), p2 = span(t, 2.6, 3.6), p3 = span(t, 3.6, 5.6), p4 = span(t, 5.6, 6.8);
    c.beginPath(); c.arc(100, 150, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p1); c.stroke();                  // 圓
    if (p2 > 0) { c.beginPath(); c.moveTo(150, 150); c.lineTo(lerp(150, 210, p2), 150); c.stroke(); if (p2 > 0.9) { c.beginPath(); c.moveTo(196, 140); c.lineTo(210, 150); c.lineTo(196, 160); c.stroke(); } }  // 箭頭
    if (p3 > 0) { const w = 90 * p3, h = 70; c.strokeRect(215, 115, w, p3 > 0.5 ? h : h * p3 * 2); }                  // 方塊
    if (p4 > 0) { c.beginPath(); c.moveTo(100, 210); c.lineTo(100, lerp(210, 330, p4)); c.stroke(); }                  // 往下的線
    if (p4 >= 1) { c.strokeRect(50, 335, 100, 50); txt(c, 'OK', 100, 360, 22, '#1e3a8a', 'center', 800); }
  } }
};

/* ============================== Galaxy S24（AI） ============================== */
function night(c) {
  const g = c.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#0a0f24'); g.addColorStop(1, '#2a1a3a'); c.fillStyle = g; c.fillRect(0, 0, 320, 640);
  [['#ff4f8a', 40, 70], ['#4fd1ff', 250, 110], ['#5cff9a', 70, 200], ['#ffb347', 260, 250]].forEach(([col, x, y]) => { const r = c.createRadialGradient(x, y, 2, x, y, 46); r.addColorStop(0, col); r.addColorStop(1, 'transparent'); c.fillStyle = r; c.fillRect(x - 50, y - 50, 100, 100); });
}
export const s24Insets = {
  circle: { aspect: 0.5, tone: 'phone', label: '圈選即搜尋', draw(c, W, H, t, T) {
    const k = W / 320; c.scale(k, k); night(c);
    // 畫面上的招牌
    c.fillStyle = '#c9a066'; rr(c, 40, 170, 240, 74, 8); c.fill();
    txt(c, 'ラーメン　営業中', 160, 207, 26, '#3a1d12', 'center', 900);
    // 手指圈選：彩色光圈一格一格亮起來
    const p = span(t, 1.2, 3.4);
    if (p > 0) {
      const grad = c.createLinearGradient(20, 150, 300, 270); ['#4285f4', '#ea4335', '#fbbc05', '#34a853'].forEach((col, i) => grad.addColorStop(i / 3, col));
      c.strokeStyle = grad; c.lineWidth = 5; c.lineCap = 'round'; c.shadowColor = '#8ec5ff'; c.shadowBlur = 14;
      c.beginPath(); c.ellipse(160, 207, 150, 62, -0.06, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); c.stroke(); c.shadowBlur = 0;
    }
    // 底部的搜尋結果卡片滑上來
    const sh = span(t, 3.8, 5.2), y0 = lerp(640, 330, sh * sh * (3 - 2 * sh));
    c.fillStyle = '#ffffff'; rr(c, 0, y0, 320, 400, 26); c.fill();
    c.fillStyle = '#dadce0'; rr(c, 140, y0 + 10, 40, 5, 3); c.fill();
    c.fillStyle = '#f1f3f4'; rr(c, 20, y0 + 30, 280, 40, 20); c.fill();
    ['#4285f4', '#ea4335', '#fbbc05', '#34a853'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(42 + i * 14, y0 + 50, 4.5, 0, 7); c.fill(); });
    txt(c, '圈選即搜尋', 120, y0 + 50, 14, '#5f6368', 'left', 600);
    if (t > 5.6) {
      const a = span(t, 5.6, 6.4);
      c.globalAlpha = a;
      txt(c, '拉麵　營業中', 160, y0 + 118, 30, '#1a73e8', 'center', 900);
      txt(c, '翻譯自日文：ラーメン　営業中', 160, y0 + 154, 13, '#5f6368', 'center', 500);
      c.fillStyle = '#e8f0fe'; rr(c, 40, y0 + 186, 240, 44, 22); c.fill(); txt(c, '這是一間拉麵店', 160, y0 + 208, 16, '#1a73e8', 'center', 700);
      c.globalAlpha = 1;
    }
  } },
  order: { aspect: 0.5, tone: 'phone', label: '即時口譯', draw(c, W, H, t, T) {
    const k = W / 320; c.scale(k, k);
    c.fillStyle = '#111827'; c.fillRect(0, 0, 320, 640);
    c.fillStyle = '#1f2937'; c.fillRect(0, 0, 320, 70);
    txt(c, '即時口譯', 160, 30, 20, '#fff', 'center', 800); txt(c, '日文　⇄　中文', 160, 54, 13, '#9ca3af', 'center', 500);
    const msgs = [
      { at: 2.8, side: 'l', orig: 'いらっしゃいませ！', tr: '歡迎光臨！' },
      { at: 7.6, side: 'r', orig: '我要一碗拉麵', tr: 'ラーメンを一杯ください' }
    ];
    msgs.forEach((m, i) => {
      const a = span(t, m.at, m.at + 0.5); if (a <= 0) return;
      const y = 100 + i * 150, x = m.side === 'l' ? 14 : 66, w = 240, h = 120;
      c.save(); c.globalAlpha = a; c.translate(0, (1 - a) * 18);
      c.fillStyle = m.side === 'l' ? '#374151' : '#2563eb'; rr(c, x, y, w, h, 20); c.fill();
      txt(c, m.orig, x + 18, y + 30, 14, 'rgba(255,255,255,.65)', 'left', 500);
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x + 18, y + 48, w - 36, 1);
      txt(c, m.tr, x + 18, y + 84, m.tr.length > 8 ? 20 : 28, '#fff', 'left', 900);
      c.restore();
    });
    // 正在聽的聲波
    for (let i = 0; i < 9; i++) { const hh = 8 + 20 * Math.abs(Math.sin(T * 6 + i)); c.fillStyle = '#60a5fa'; rr(c, 100 + i * 14, 590 - hh / 2, 6, hh, 3); c.fill(); }
  } }
};

/* ============================== StarTAC（單色 LCD） ============================== */
const ST_BG = '#b4c8a0', ST_INK = '#1c2a16';
function stFrame(c, W, H) { const k = W / 240; c.scale(k, k); c.fillStyle = ST_BG; c.fillRect(0, 0, 240, H / k); return k; }
export const startacInsets = {
  buzz: { aspect: 1.7, tone: 'lcd', label: 'StarTAC 螢幕', draw(c, W, H, t, T) {
    stFrame(c, W, H);
    signal(c, 8, 6, 4, ST_INK); battery(c, 202, 8, 3, ST_INK);
    if (t < 6.2) {
      const blink = Math.floor(T * 2.5) % 2;
      if (blink) txt(c, 'INCOMING', 120, 50, 24, ST_INK, 'center', 900, 'monospace');
      txt(c, '555-0142', 120, 86, 20, ST_INK, 'center', 800, 'monospace');
      const vib = t > 1.0 && t < 4.4;
      if (vib) txt(c, ')))  VIBRATE  (((', 120, 114, 13, ST_INK, 'center', 800, 'monospace');
    } else {
      txt(c, 'CONNECTED', 120, 66, 22, ST_INK, 'center', 900, 'monospace');
      txt(c, '555-0142', 120, 98, 18, ST_INK, 'center', 800, 'monospace');
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(28,42,22,.07)'; for (let x = 0; x < W; x += 4) c.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
  } },
  talk: { aspect: 1.7, tone: 'lcd', label: 'StarTAC 通話中', draw(c, W, H, t, T) {
    stFrame(c, W, H);
    signal(c, 8, 6, 4, ST_INK); battery(c, 202, 8, 3, ST_INK);
    const s = Math.floor(t + 12);
    txt(c, 'ON CALL', 120, 46, 18, ST_INK, 'center', 900, 'monospace');
    txt(c, `00:${String(s).padStart(2, '0')}`, 120, 92, 40, ST_INK, 'center', 900, 'monospace');
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(28,42,22,.07)'; for (let x = 0; x < W; x += 4) c.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
  } }
};
