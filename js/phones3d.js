// 手機 3D 模型：每支手機分成「後殼／主機板／前殼」三層，可以分解檢視；
// 並帶有可點的零件（按鍵、螢幕、按鈕）、可動的機構（掀蓋、滑蓋、天線、觸控筆）和說明熱點。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
const MONO = '"Courier New", ui-monospace, monospace';

/* ---------- 材質 ---------- */
const plastic = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.04, envMapIntensity: 0.8, ...o });
const metal = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.92, envMapIntensity: 1.1, ...o });
const glassMat = (c = '#06080c', o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.08, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.3, ...o });
const rubber = (c, o = {}) => plastic(c, { roughness: 0.9, ...o });
const lum = (c) => { const k = new THREE.Color(c); return 0.2126 * k.r + 0.7152 * k.g + 0.0722 * k.b; };
const shade = (c, a) => { const k = new THREE.Color(c); return '#' + k.lerp(new THREE.Color(a < 0 ? '#000' : '#fff'), Math.abs(a)).getHexString(); };

function rbox(w, h, d, material, r = 0.02) {
  r = Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005);
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(r, 0.001)), material);
}
function cyl(rt, rb, h, material, seg = 24) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material); }
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const axisZ = (m) => { m.rotation.x = Math.PI / 2; return m; };

/* ---------- 按鍵貼圖與聲音 ---------- */
const keyCache = {};
function keyTex(ch, fg) {
  const k = ch + fg;
  if (keyCache[k]) return keyCache[k];
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `800 ${ch.length > 1 ? 30 : 58}px ${FONT}`;
  x.fillText(ch, 48, 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (keyCache[k] = t);
}
let audio = null;
const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], '*': [941, 1209], 0: [941, 1336], '#': [941, 1477] };
export function beep(ch) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const f = DTMF[ch] || [800, 1100];
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, audio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.09);
    g.connect(audio.destination);
    f.forEach((hz) => { const o = audio.createOscillator(); o.frequency.value = hz; o.connect(g); o.start(); o.stop(audio.currentTime + 0.1); });
  } catch (e) { /* 沒有聲音就算了 */ }
}

/* ---------- 零件組裝台 ---------- */
class Rig {
  constructor(p) {
    this.p = p;
    this.root = new THREE.Group();
    this.back = new THREE.Group(); this.core = new THREE.Group(); this.front = new THREE.Group();
    this.root.add(this.back, this.core, this.front);
    this.hot = []; this.acts = []; this.inter = []; this.pressers = []; this.upd = [];
    this.parts = []; this.pads = []; this.cams = []; this.queued = []; this.shell = []; this.internals = [];
    this.solid = new THREE.Group(); this.root.add(this.solid);
    this.guides = new THREE.Group(); this.guides.visible = false; this.root.add(this.guides);
    this.hlMat = new THREE.LineBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.9, depthTest: false });
    this.sel = null; this.hov = null; this.dims = null;
    this.s = { explode: 0 }; this.t = { explode: 0 }; this.init = { explode: 0 };
    this.ex = 0.3; this.screen = null;
  }
  state(name, v) { this.s[name] = v; this.t[name] = v; this.init[name] = v; }
  flip(name) { this.t[name] = this.t[name] > 0.5 ? 0 : 1; }
  pin(parent, pos, side, title, text, needs = null) {
    const a = new THREE.Object3D(); a.position.copy(pos); parent.add(a);
    this.hot.push({ anchor: a, side, title, text, needs });
  }
  tap(mesh, fn) { mesh.userData.onTap = fn; this.inter.push(mesh); }
  // 可按下去的零件：node 沿著 axis 方向縮進 depth
  pressable(node, axis, depth, fn) {
    node.userData.pv = 0; node.userData.base = node.position.clone(); node.userData.axis = axis.clone(); node.userData.depth = depth;
    this.pressers.push(node);
    return (hitMesh) => { node.userData.pv = 1; fn && fn(hitMesh); };
  }
  action(id, label, run) { this.acts.push({ id, label, run }); }
  partOf(obj) { while (obj) { const pt = this.parts.find((q) => q.group === obj); if (pt) return pt; obj = obj.parent; } return null; }
  select(pt) { this.sel = pt; this.onSelect && this.onSelect(pt); }
  update(dt, t) {
    const k = 1 - Math.exp(-dt * 6);
    for (const key in this.t) this.s[key] += (this.t[key] - this.s[key]) * k;
    const e = this.s.explode;
    for (const pt of this.parts) pt.group.position.z = pt.z0 + pt.k * this.ex * e;
    const open = e > 0.003;
    this.shell.forEach((o) => { o.visible = open; });
    this.internals.forEach((o) => { o.visible = open; });
    this.solid.visible = !open;
    this.guides.visible = e > 0.02;
    if (this.guideMat) this.guideMat.opacity = 0.55 * Math.min(1, e * 1.5);
    this.hlMat.opacity = 0.65 + 0.3 * Math.sin(t * 6);
    for (const pt of this.parts) if (pt.hl) pt.hl.visible = e > 0.4 && (this.sel === pt || this.hov === pt);
    for (const n of this.pressers) {
      if (n.userData.pv > 0) n.userData.pv = Math.max(0, n.userData.pv - dt * 7);
      n.position.copy(n.userData.base).addScaledVector(n.userData.axis, -n.userData.depth * Math.min(1, n.userData.pv * 2));
    }
    this.upd.forEach((f) => f(this.s, dt, t));
    if (this.screen) this.screen.update(dt);
  }
  reset() { for (const key in this.t) this.t[key] = this.init[key]; if (this.screen) this.screen.reset(); }
  get busy() { return Object.keys(this.t).some((key) => Math.abs(this.t[key] - this.s[key]) > 0.002); }
}

// 靜止時是一體成形的實心機身（外型圓潤）；分解時換成真正的後蓋、中空中框、前面板，零件放在中框裡
function slabs(rig, { W, H, D, r = 0.03, back, front, rim }) {
  const g = D * 0.16, d = D / 2 - g / 2;
  rig.solid.add(at(rbox(W, H, d, back, r), 0, 0, -(g / 2 + d / 2)));
  rig.solid.add(at(rbox(W, H, d, front || back, r), 0, 0, g / 2 + d / 2));
  rig.solid.add(rbox(W - 0.004, H - 0.004, g + 0.002, plastic('#0b0c0e', { roughness: 0.6 }), Math.min(r, 0.01)));
  const db = D * 0.2, dm = D - 2 * db;
  const bp = at(rbox(W, H, db, back, Math.min(r, db / 2)), 0, 0, -D / 2 + db / 2); rig.back.add(bp); rig.shell.push(bp);
  const fp = at(rbox(W, H, db, front || back, Math.min(r, db / 2)), 0, 0, D / 2 - db / 2); rig.front.add(fp); rig.shell.push(fp);
  rig.dims = { W, H, D, db, dm, r, t: Math.max(0.012, Math.min(W, H) * 0.05), rim: rim || front || back };
  rig.ex = Math.max(W, H) * 0.38;
  return { g, d, zf: D / 2, zb: -D / 2 };
}

// 一排按鍵，每顆都可以按；digits 會輸出到螢幕
function keypad(rig, parent, { cols, rows, w, h, cx = 0, cy, z, chars, kd = 0.02, kw, kh, color, text, round = 0.01 }) {
  const m = plastic(color, { roughness: 0.55 });
  kw = kw || (w / cols) * 0.76; kh = kh || (h / rows) * 0.7;
  rig.pads.push({ cx, cy, w, h, cols, rows });
  chars.forEach((ch, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const g = new THREE.Group();
    g.position.set(cx - w / 2 + (c + 0.5) * (w / cols), cy + h / 2 - (r + 0.5) * (h / rows), z);
    const body = at(rbox(kw, kh, kd, m, round), 0, 0, kd / 2);
    g.add(body);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(kw, kh) * 0.8, Math.min(kw, kh) * 0.8), new THREE.MeshBasicMaterial({ map: keyTex(ch, text), transparent: true, depthWrite: false }));
    lab.position.z = kd + 0.0008; g.add(lab);
    parent.add(g);
    const press = rig.pressable(g, V(0, 0, 1), kd * 0.6, () => { beep(ch); rig.screen && rig.screen.key(ch); });
    rig.tap(body, press);
  });
}
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

function lens(parent, x, y, z, r, ring = '#8c929b', inner = '#101830') {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const o = cyl(r, r, 0.012, metal(ring, { roughness: 0.25 })); o.rotation.x = Math.PI / 2; g.add(o);
  const gl = cyl(r * 0.78, r * 0.78, 0.016, glassMat('#05070c')); gl.rotation.x = Math.PI / 2; gl.position.z = -0.002; g.add(gl);
  const ic = new THREE.Mesh(new THREE.CircleGeometry(r * 0.38, 20), new THREE.MeshStandardMaterial({ color: inner, roughness: 0.1, metalness: 0.6, emissive: '#1d3a8a', emissiveIntensity: 0.4 }));
  ic.rotation.y = Math.PI; ic.position.z = -0.0105; g.add(ic);
  parent.add(g); return g;
}

/* ====================================================================
   會動的螢幕：每支手機自己一張畫布，按鍵、點螢幕都會更新
   ==================================================================== */
const APPS = [
  ['電話', '#22c55e'], ['訊息', '#3b82f6'], ['相機', '#6b7280'], ['時鐘', '#1f2937'],
  ['地圖', '#10b981'], ['音樂', '#ef4444'], ['相簿', '#f59e0b'], ['設定', '#94a3b8'],
  ['天氣', '#0ea5e9'], ['郵件', '#2563eb'], ['筆記', '#eab308'], ['計算機', '#475569'],
  ['影片', '#a855f7'], ['商店', '#06b6d4'], ['瀏覽', '#14b8a6'], ['錄音', '#f43f5e']
];
const DOCK = [APPS[0], APPS[1], APPS[14], APPS[5]];
const WALLS = {
  iphone: ['#1e3a8a', '#7c3aed'], iphone4: ['#0ea5e9', '#1e40af'], iphone5s: ['#7c3aed', '#be185d'], iphone12: ['#38bdf8', '#6366f1'],
  'htc-dream': ['#0f172a', '#14532d'], 'galaxy-note': ['#0f2b3b', '#1e1b4b'], 'galaxy-s24': ['#6b5b8a', '#1e1b4b']
};
const CLASSIC = ['iphone', 'iphone4', 'iphone5s'];
// IBM Simon 功能選單（內容為示意）
const SIMON_APPS = [
  ['行事曆', '今天 14:00　開會'], ['通訊錄', '王先生　555-0142'], ['電子郵件', '1 封新郵件'],
  ['傳真', '傳送中… 第 1／2 頁'], ['待辦事項', '回覆客戶來信'], ['記事本', '週五前交報告']
];

function roundPath(x, l, t, w, h, r) { x.beginPath(); x.roundRect ? x.roundRect(l, t, w, h, r) : x.rect(l, t, w, h); }
const pad2 = (n) => String(n).padStart(2, '0');

class Screen {
  constructor(rig, kind, w, h, { id = '', corner = 0, notch = null } = {}) {
    this.rig = rig; this.kind = kind; this.id = id; this.corner = corner; this.notch = notch;
    this.c = document.createElement('canvas');
    this.c.width = 256; this.c.height = Math.round(256 * h / w);
    this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
      map: this.tex, emissiveMap: this.tex, emissive: '#ffffff', emissiveIntensity: 0.8, roughness: 0.25, envMapIntensity: 0.5
    }));
    this.touch = kind === 'ios' || kind === 'android' || kind === 'simon';
    this.reset();
  }
  reset() { this.on = true; this.mode = this.touch ? (this.kind === 'simon' ? 'home' : 'lock') : 'idle'; this.num = ''; this.msg = ''; this.msgT = 0; this.app = ''; this.appT = 0; this.light = false; this.snake = null; this.redraw(); }
  redraw() { this.draw(); this.tex.needsUpdate = true; }
  toggleOn() { this.on = !this.on; if (!this.on && this.mode === 'snake') this.mode = 'idle'; this.redraw(); return this.on; }
  poke() { if (!this.on) { this.on = true; this.redraw(); } }

  /* ----- 輸入 ----- */
  key(ch) {
    if (this.touch) return;
    this.poke();
    if (this.mode === 'snake') { this.steer(ch); return; }
    if (this.kind === 'led') {
      if (ch === 'CLR') this.num = '';
      else if (ch === 'END') { this.num = ''; this.say('END'); }
      else if (ch === 'SND') this.say(this.num ? 'CALLING' : '');
      else if (/^[0-9*#]$/.test(ch) && this.num.length < 10) this.num += ch;
    } else {
      if (ch === 'C') this.num = this.num.slice(0, -1);
      else if (ch === 'OK') this.say(this.num ? '撥號中…' : '');
      else if (/^[0-9*#]$/.test(ch) && this.num.length < 12) this.num += ch;
    }
    this.redraw();
  }
  say(m) { this.msg = m; this.msgT = 1.3; }
  tap(u, v) {
    if (!this.touch) return;
    this.poke();
    if (this.kind === 'simon') { this.tapSimon(u, v); return; }
    const W = this.c.width, H = this.c.height, px = u * W, py = (1 - v) * H;
    if (this.mode === 'lock') this.mode = 'home';
    else if (this.mode === 'app') this.mode = 'home';
    else if (this.mode === 'home') {
      const g = this.grid();
      let hit = null;
      APPS.forEach((a, i) => { const cx = g.x0 + (i % 4 + 0.5) * g.cw, cy = g.y0 + (Math.floor(i / 4) + 0.5) * g.ch; if (Math.abs(px - cx) < g.cw / 2 && Math.abs(py - cy) < g.ch / 2) hit = a; });
      DOCK.forEach((a, i) => { const cx = (i + 0.5) * (W / 4); if (Math.abs(px - cx) < W / 8 + 4 && Math.abs(py - g.dockY) < g.icon / 2 + 8) hit = a; });
      if (hit) { this.mode = 'app'; this.app = hit; this.appT = 4; }
    }
    this.redraw();
  }
  homeButton() {
    if (!this.touch || this.kind === 'simon') return;
    this.poke();
    this.mode = this.mode === 'home' ? 'lock' : 'home';
    this.redraw();
  }
  grid() {
    const W = this.c.width, H = this.c.height, top = 46;
    const ch = (H - top - 92) / 4, cw = W / 4;
    return { x0: 0, y0: top, cw, ch, icon: Math.min(cw * 0.66, ch * 0.62), dockY: H - 56 };
  }

  /* ----- 貪食蛇 ----- */
  startSnake() {
    this.poke(); this.mode = 'snake';
    this.snake = { cols: 18, rows: 11, body: [[8, 5], [7, 5], [6, 5]], dir: [1, 0], next: [1, 0], food: [13, 5], t: 0, dead: 0, score: 0 };
    this.redraw();
  }
  stopSnake() { this.mode = 'idle'; this.snake = null; this.redraw(); }
  steer(ch) {
    const m = { 2: [0, -1], 8: [0, 1], 4: [-1, 0], 6: [1, 0] }[ch];
    const s = this.snake;
    if (!m || !s) return;
    if (m[0] + s.dir[0] === 0 && m[1] + s.dir[1] === 0) return;
    s.next = m;
  }
  stepSnake() {
    const s = this.snake; s.dir = s.next;
    const h = [s.body[0][0] + s.dir[0], s.body[0][1] + s.dir[1]];
    if (h[0] < 0 || h[1] < 0 || h[0] >= s.cols || h[1] >= s.rows || s.body.some((b) => b[0] === h[0] && b[1] === h[1])) { s.dead = 1.4; return; }
    s.body.unshift(h);
    if (h[0] === s.food[0] && h[1] === s.food[1]) {
      s.score++;
      do { s.food = [Math.floor(Math.random() * s.cols), Math.floor(Math.random() * s.rows)]; } while (s.body.some((b) => b[0] === s.food[0] && b[1] === s.food[1]));
    } else s.body.pop();
  }
  update(dt) {
    let dirty = false;
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) { this.msg = ''; dirty = true; } }
    if (this.appT > 0 && this.mode === 'app') { this.appT -= dt; if (this.appT <= 0) { this.mode = 'home'; dirty = true; } }
    if (this.mode === 'snake' && this.snake && this.on) {
      const s = this.snake;
      if (s.dead > 0) { s.dead -= dt; if (s.dead <= 0) this.startSnake(); dirty = true; }
      else { s.t += dt; if (s.t > 0.17) { s.t = 0; this.stepSnake(); dirty = true; } }
    }
    if (dirty) this.redraw();
  }

  /* ----- 繪製 ----- */
  draw() {
    const { x, c } = this, W = c.width, H = c.height;
    x.save();
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    if (this.on) {
      x.save();
      if (this.corner) { roundPath(x, 0, 0, W, H, this.corner); x.clip(); }
      if (this.kind === 'led') this.drawLED(x, W, H);
      else if (this.kind === 'lcd') this.drawLCD(x, W, H);
      else if (this.kind === 'color') this.drawColor(x, W, H);
      else if (this.kind === 'simon') this.drawSimon(x, W, H);
      else this.drawTouch(x, W, H);
      x.restore();
    }
    if (this.notch) {
      x.fillStyle = '#000';
      if (this.notch.type === 'notch') {
        const w = this.notch.w, h = this.notch.h;
        x.beginPath(); x.moveTo(W / 2 - w / 2, -2); x.lineTo(W / 2 + w / 2, -2); x.lineTo(W / 2 + w / 2, h - 12);
        x.quadraticCurveTo(W / 2 + w / 2, h, W / 2 + w / 2 - 12, h); x.lineTo(W / 2 - w / 2 + 12, h);
        x.quadraticCurveTo(W / 2 - w / 2, h, W / 2 - w / 2, h - 12); x.closePath(); x.fill();
      } else { x.beginPath(); x.arc(W / 2, this.notch.y, this.notch.r, 0, 6.3); x.fill(); x.strokeStyle = 'rgba(80,100,140,.5)'; x.lineWidth = 1.5; x.stroke(); }
    }
    x.restore();
  }
  /* ----- IBM Simon：單色觸控的功能選單（2 欄 × 3 列） ----- */
  simonCells() { const W = this.c.width, H = this.c.height, top = 62; return { x0: 10, top, cw: (W - 20) / 2, ch: (H - top - 12) / 3 }; }
  tapSimon(u, v) {
    const W = this.c.width, H = this.c.height, px = u * W, py = (1 - v) * H;
    if (this.mode === 'app') { this.mode = 'home'; this.redraw(); return; }
    const g = this.simonCells();
    SIMON_APPS.forEach((a, i) => {
      const cx = g.x0 + (i % 2) * g.cw, cy = g.top + Math.floor(i / 2) * g.ch;
      if (px >= cx && px < cx + g.cw && py >= cy && py < cy + g.ch) { this.mode = 'app'; this.app = a; this.appT = 4; }
    });
    this.redraw();
  }
  drawSimon(x, W, H) {
    const ink = '#1f261c';
    x.fillStyle = '#d4dccb'; x.fillRect(0, 0, W, H);
    x.fillStyle = ink; x.textBaseline = 'middle'; x.textAlign = 'center';
    if (this.mode === 'app' && this.app) {
      x.font = `bold 34px ${FONT}`; x.fillText(this.app[0], W / 2, H * 0.3);
      x.fillRect(20, H * 0.3 + 28, W - 40, 3);
      x.font = `600 20px ${FONT}`; x.fillText(this.app[1], W / 2, H * 0.3 + 70);
      x.font = `500 15px ${FONT}`; x.fillText('輕觸螢幕回到選單', W / 2, H - 30);
      return;
    }
    x.font = `bold 24px ${FONT}`; x.fillText('IBM Simon', W / 2, 26);
    x.fillRect(10, 46, W - 20, 3);
    const g = this.simonCells();
    SIMON_APPS.forEach((a, i) => {
      const cx = g.x0 + (i % 2) * g.cw + 5, cy = g.top + Math.floor(i / 2) * g.ch + 6;
      x.lineWidth = 3; x.strokeStyle = ink; roundPath(x, cx, cy, g.cw - 10, g.ch - 12, 8); x.stroke();
      x.font = `bold 19px ${FONT}`; x.fillText(a[0], cx + (g.cw - 10) / 2, cy + (g.ch - 12) / 2);
    });
  }
  drawLED(x, W, H) {
    x.fillStyle = '#150505'; x.fillRect(0, 0, W, H);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const fs = Math.min(H * 0.7, W / (10 * 0.62));
    x.font = `bold ${fs}px ${MONO}`;
    x.fillStyle = 'rgba(255,59,47,.1)'; x.fillText('8888888888', W / 2, H / 2 + 3);
    x.shadowColor = '#ff2a1a'; x.shadowBlur = 14; x.fillStyle = '#ff4a3a';
    x.fillText(this.msg || this.num, W / 2, H / 2 + 3);
    x.shadowBlur = 0;
  }
  drawLCD(x, W, H) {
    const ink = '#26301c';
    x.fillStyle = this.light ? '#c9e3a3' : '#a9bf8e'; x.fillRect(0, 0, W, H);
    if (this.mode === 'snake' && this.snake) { this.drawSnake(x, W, H, ink); return; }
    x.fillStyle = ink; x.textBaseline = 'alphabetic';
    for (let i = 0; i < 4; i++) x.fillRect(12 + i * 9, 34 - i * 7, 6, 8 + i * 7);
    x.strokeStyle = ink; x.lineWidth = 3; x.strokeRect(W - 46, 14, 32, 18); x.fillRect(W - 14, 19, 4, 8); x.fillRect(W - 42, 18, 22, 10);
    if (this.msg) { x.textAlign = 'center'; x.font = `bold ${H * 0.18}px ${FONT}`; x.fillText(this.msg, W / 2, H * 0.58); }
    else if (this.num) {
      x.textAlign = 'right'; const fs = Math.min(H * 0.26, (W - 24) / (this.num.length * 0.62));
      x.font = `bold ${fs}px ${MONO}`; x.fillText(this.num, W - 14, H * 0.62);
    } else { x.textAlign = 'center'; x.font = `bold ${H * 0.34}px ${MONO}`; x.fillText('12:00', W / 2, H * 0.64); }
    x.textAlign = 'center'; x.font = `bold ${H * 0.11}px ${FONT}`;
    x.fillText(this.num ? '撥號' : '選單', W / 2, H - 12);
    x.fillRect(12, H - 30, W - 24, 2);
  }
  drawSnake(x, W, H, ink) {
    const s = this.snake, cell = Math.floor(Math.min((W - 16) / s.cols, (H - 34) / s.rows));
    const ox = Math.floor((W - cell * s.cols) / 2), oy = H - 8 - cell * s.rows;
    x.fillStyle = ink; x.font = `bold 15px ${FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillText(`分數 ${s.score}`, 10, 14);
    x.lineWidth = 2; x.strokeStyle = ink; x.strokeRect(ox - 2, oy - 2, cell * s.cols + 4, cell * s.rows + 4);
    s.body.forEach((b, i) => {
      x.globalAlpha = s.dead && Math.floor(s.dead * 8) % 2 ? 0.25 : 1;
      x.fillRect(ox + b[0] * cell + 1, oy + b[1] * cell + 1, cell - 2, cell - 2);
      x.globalAlpha = 1;
    });
    x.strokeRect(ox + s.food[0] * cell + 2, oy + s.food[1] * cell + 2, cell - 4, cell - 4);
    if (s.dead) { x.textAlign = 'center'; x.fillStyle = ink; x.fillRect(W / 2 - 62, H / 2 - 16, 124, 30); x.fillStyle = '#c9e3a3'; x.fillText('GAME OVER', W / 2, H / 2 - 1); }
  }
  drawColor(x, W, H) {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b6cff'); g.addColorStop(1, '#0b1f66');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.9)'; x.textBaseline = 'middle';
    x.textAlign = 'left'; x.font = `bold 15px ${FONT}`; x.fillText('▂▄▆', 10, 14);
    x.textAlign = 'right'; x.fillText('12:00', W - 10, 14);
    if (this.msg) { x.textAlign = 'center'; x.font = `bold ${H * 0.16}px ${FONT}`; x.fillText(this.msg, W / 2, H * 0.55); }
    else if (this.num) { x.textAlign = 'center'; const fs = Math.min(H * 0.24, (W - 20) / (this.num.length * 0.62)); x.font = `bold ${fs}px ${MONO}`; x.fillText(this.num, W / 2, H * 0.5); }
    else {
      ['#ff4b4b', '#4bff7a', '#ffd84b', '#ffffff'].forEach((col, i) => { x.fillStyle = col; roundPath(x, 20 + i * 54, H * 0.32, 40, 40, 9); x.fill(); });
      x.fillStyle = 'rgba(255,255,255,.9)'; x.textAlign = 'center'; x.font = `bold ${H * 0.17}px ${FONT}`; x.fillText('選單', W / 2, H * 0.78);
    }
  }
  drawTouch(x, W, H) {
    const id = this.id, wall = WALLS[id] || WALLS.iphone12, classic = CLASSIC.includes(id), android = this.kind === 'android';
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, wall[0]); g.addColorStop(1, wall[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const d = new Date(), time = `${d.getHours()}:${pad2(d.getMinutes())}`;
    const top = this.notch ? 14 : 12;
    x.textBaseline = 'middle';
    if (this.mode !== 'app') {
      x.fillStyle = 'rgba(255,255,255,.92)'; x.font = `600 12px ${FONT}`;
      x.textAlign = 'left'; x.fillText(classic ? '機不可失' : time, 14, top + 4);
      x.textAlign = 'right'; x.fillText(classic ? time : '▂▄▆ 100%', W - 14, top + 4);
    }
    if (this.mode === 'lock') {
      x.textAlign = 'center'; x.fillStyle = '#fff';
      if (classic) {
        x.font = `300 ${W * 0.26}px ${FONT}`; x.fillText(time, W / 2, H * 0.28);
        x.font = `500 13px ${FONT}`; x.fillText(`${d.getMonth() + 1} 月 ${d.getDate()} 日`, W / 2, H * 0.28 + W * 0.2);
        x.fillStyle = 'rgba(0,0,0,.45)'; roundPath(x, 18, H - 62, W - 36, 40, 10); x.fill();
        x.fillStyle = 'rgba(255,255,255,.9)'; x.font = `500 14px ${FONT}`; x.fillText('›  輕觸或滑動來解鎖', W / 2, H - 42);
      } else {
        x.font = `600 ${W * 0.3}px ${FONT}`; x.fillText(time, W / 2, H * 0.24);
        x.font = `500 14px ${FONT}`; x.fillText(`${d.getMonth() + 1} 月 ${d.getDate()} 日`, W / 2, H * 0.24 + W * 0.22);
        x.fillStyle = 'rgba(0,0,0,.35)'; [W * 0.2, W * 0.8].forEach((cx) => { x.beginPath(); x.arc(cx, H - 52, 20, 0, 6.3); x.fill(); });
        x.fillStyle = 'rgba(255,255,255,.9)'; x.font = `500 12px ${FONT}`; x.fillText('輕觸螢幕解鎖', W / 2, H - 52);
      }
    } else if (this.mode === 'home') {
      const gr = this.grid();
      APPS.forEach((a, i) => {
        const cx = gr.x0 + (i % 4 + 0.5) * gr.cw, cy = gr.y0 + (Math.floor(i / 4) + 0.5) * gr.ch;
        this.icon(x, cx, cy - 6, gr.icon, a, android);
        x.fillStyle = 'rgba(255,255,255,.92)'; x.font = `500 ${classic ? 11 : 10}px ${FONT}`; x.textAlign = 'center'; x.fillText(a[0], cx, cy + gr.icon / 2 + 2);
      });
      x.fillStyle = 'rgba(255,255,255,.2)'; roundPath(x, 6, H - 90, W - 12, 68, 18); x.fill();
      DOCK.forEach((a, i) => this.icon(x, (i + 0.5) * (W / 4), gr.dockY, gr.icon, a, android));
      x.fillStyle = 'rgba(255,255,255,.7)'; [-1, 0, 1].forEach((k) => { x.beginPath(); x.arc(W / 2 + k * 12, H - 98, k ? 2.5 : 3.5, 0, 6.3); x.fill(); });
    } else if (this.mode === 'app') {
      const a = this.app, gg = x.createLinearGradient(0, 0, 0, H);
      gg.addColorStop(0, a[1]); gg.addColorStop(1, shade(a[1], -0.5));
      x.fillStyle = gg; x.fillRect(0, 0, W, H);
      x.fillStyle = '#fff'; x.textAlign = 'center';
      x.font = `800 ${W * 0.36}px ${FONT}`; x.fillText(a[0][0], W / 2, H * 0.4);
      x.font = `700 ${W * 0.12}px ${FONT}`; x.fillText(a[0], W / 2, H * 0.4 + W * 0.3);
      x.font = `500 12px ${FONT}`; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('輕觸螢幕回到主畫面', W / 2, H - 28);
    }
  }
  icon(x, cx, cy, s, a, round) {
    const g = x.createLinearGradient(cx, cy - s / 2, cx, cy + s / 2);
    g.addColorStop(0, shade(a[1], 0.25)); g.addColorStop(1, a[1]);
    x.fillStyle = g;
    if (round) { x.beginPath(); x.arc(cx, cy, s / 2, 0, 6.3); x.fill(); } else { roundPath(x, cx - s / 2, cy - s / 2, s, s, s * 0.23); x.fill(); }
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = `800 ${s * 0.46}px ${FONT}`; x.fillText(a[0][0], cx, cy + 1);
  }
}

// 把螢幕放進零件裡，並讓點螢幕可以互動
function addScreen(rig, parent, kind, w, h, pos, opts) {
  const sc = new Screen(rig, kind, w, h, { id: rig.p.id, ...opts });
  sc.mesh.position.copy(pos);
  parent.add(sc.mesh);
  rig.screen = sc;
  rig.tap(sc.mesh, (hit) => { if (sc.touch && hit && hit.uv) sc.tap(hit.uv.x, hit.uv.y); });
  return sc;
}

/* ====================================================================
   各款手機
   ==================================================================== */
const keyLook = (body) => (lum(body) > 0.45 ? { color: '#2b2b2b', text: '#f2f2f2' } : { color: '#d9d6cf', text: '#222222' });

function brick(rig, p) {
  const W = 0.5, H = 1.45, D = 0.26, F = rig.front, B = rig.back;
  const body = plastic(p.color, { roughness: 0.55 }), dark = plastic('#111', { roughness: 0.35 });
  slabs(rig, { W, H, D, r: 0.05, back: body, front: body });
  const zf = D / 2;
  F.add(at(rbox(W * 0.98, 0.012, 0.006, dark, 0.003), 0, -H * 0.2, zf));
  for (let i = 0; i < 5; i++) F.add(at(rbox(0.2, 0.012, 0.008, dark, 0.004), 0, H * 0.43 - i * 0.026, zf + 0.001));
  F.add(at(rbox(0.36, 0.13, 0.03, dark, 0.015), 0, H * 0.285, zf + 0.002));
  addScreen(rig, F, 'led', 0.3, 0.09, V(0, H * 0.285, zf + 0.0185));
  const k = keyLook(p.color);
  keypad(rig, F, { cols: 3, rows: 5, w: 0.36, h: 0.56, cy: 0, z: zf, chars: ['END', 'CLR', 'SND', ...DIGITS], kd: 0.022, ...k });
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) F.add(at(rbox(0.014, 0.014, 0.006, dark, 0.004), -0.05 + i * 0.02, -H * 0.4 - j * 0.03, zf));
  // 伸縮天線
  const boot = at(cyl(0.034, 0.04, 0.1, rubber('#1a1a1a')), 0.14, H / 2 + 0.04, -0.03); B.add(boot);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 12), metal('#8d9096')); B.add(rod);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), rubber('#1a1a1a')); B.add(tip);
  rig.state('ext', 1);
  rig.upd.push((s) => { const len = 0.1 + 0.34 * s.ext; rod.scale.y = len; rod.position.set(0.14, H / 2 + 0.09 + len / 2, -0.03); tip.position.set(0.14, H / 2 + 0.09 + len, -0.03); });
  rig.action('ant', () => (rig.t.ext > 0.5 ? '收起天線' : '拉出天線'), () => rig.flip('ext'));
  rig.pin(B, V(0.14, H / 2 + 0.3, -0.03), 0, '伸縮天線', '1G 類比訊號很弱，要靠長長的天線才收得到，所以早期手機都有一根突出的天線。這支的天線可以拉出、收起。');
  rig.pin(F, V(0, H * 0.285, zf + 0.02), 1, 'LED 顯示幕', '紅色 LED 只能顯示數字，沒有選單、沒有聯絡人，也沒有簡訊。');
  rig.pin(F, V(0.17, 0.12, zf + 0.03), 1, '實體撥號鍵', '按鍵又大又硬，一次只能撥一個號碼。點點看，螢幕會跟著顯示。');
  rig.pin(F, V(0, -H * 0.37, zf + 0.01), 1, '下半部是電池', '電池占了機身將近一半，充電要好幾個小時，通話時間卻只有半小時左右。');
}

function car(rig, p) {
  const W = 0.95, H = 0.42, D = 0.62, F = rig.front;
  const body = plastic(p.color, { roughness: 0.5 }), dark = plastic('#101114', { roughness: 0.3 });
  slabs(rig, { W, H, D, r: 0.05, back: body, front: body });
  const zf = D / 2;
  F.add(at(rbox(0.8, 0.26, 0.02, dark, 0.012), 0, -0.01, zf + 0.004));
  F.add(at(rbox(0.34, 0.1, 0.012, plastic('#050505'), 0.01), -0.2, 0.05, zf + 0.012));
  addScreen(rig, F, 'led', 0.3, 0.075, V(-0.2, 0.05, zf + 0.0185));
  keypad(rig, F, { cols: 3, rows: 4, w: 0.27, h: 0.17, cx: 0.22, cy: -0.02, z: zf + 0.01, chars: DIGITS, kd: 0.01, kw: 0.07, kh: 0.032, color: '#d9d6cf', text: '#222', round: 0.004 });
  const knob = at(cyl(0.04, 0.04, 0.03, metal('#aeb2b8')), -0.3, -0.07, zf + 0.025); knob.rotation.x = Math.PI / 2; F.add(knob);
  // 話筒
  const hs = new THREE.Group();
  const hm = plastic('#2b2b2b', { roughness: 0.45 });
  hs.add(rbox(0.82, 0.1, 0.18, hm, 0.045));
  [-0.36, 0.36].forEach((x) => { hs.add(at(rbox(0.16, 0.14, 0.22, hm, 0.06), x, 0, 0)); for (let i = 0; i < 3; i++) hs.add(at(rbox(0.07, 0.008, 0.006, dark, 0.002), x, -0.02 + i * 0.02, 0.112)); });
  F.add(hs);
  [-0.3, 0.3].forEach((x) => F.add(at(rbox(0.06, 0.07, 0.1, dark, 0.02), x, H / 2 + 0.02, 0)));
  const cordM = rubber('#1c1c1c');
  let cord = null, lastKey = '';
  rig.state('hand', 0);
  rig.upd.push((s) => {
    hs.position.set(0, 0.3 + 0.28 * s.hand, 0.14 * s.hand);
    hs.rotation.z = 0.9 * s.hand;
    const key = s.hand.toFixed(3) + s.explode.toFixed(3);
    if (key === lastKey) return; lastKey = key;
    const end = V(0.4, 0, 0).applyEuler(hs.rotation).add(hs.position); end.z += rig.front.position.z;
    const st = V(0.46, 0.12, 0.3);
    const m = st.clone().lerp(end, 0.5); m.y -= 0.14; m.z += 0.1;
    const curve = new THREE.CatmullRomCurve3([st, st.clone().add(V(0.04, -0.08, 0.06)), m, end]);
    const g = new THREE.TubeGeometry(curve, 28, 0.011, 6);
    if (cord) { cord.geometry.dispose(); cord.geometry = g; } else { cord = new THREE.Mesh(g, cordM); rig.root.add(cord); }
  });
  rig.action('hand', () => (rig.t.hand > 0.5 ? '放回話筒' : '拿起話筒'), () => rig.flip('hand'));
  rig.pin(hs, V(0, 0.1, 0.12), 1, '話筒', '和家裡的有線電話一樣，拿起話筒才能通話。點「拿起話筒」看看。');
  rig.pin(F, V(0.32, 0.12, zf + 0.02), 1, '主機', '車用電話的主機固定在車上，用車子的電瓶供電，所以不是「帶著走」的電話。');
  rig.pin(F, V(-0.2, 0.05, zf + 0.02), 1, '數字顯示幕', '只能顯示撥出的號碼，點右邊的按鍵試試。');
}

function flip(rig, p) {
  const W = 0.34, H = 0.95, D = 0.15, F = rig.front, B = rig.back;
  const body = plastic(p.color, { roughness: 0.5 }), dark = plastic('#111', { roughness: 0.35 });
  slabs(rig, { W, H, D, r: 0.04, back: body, front: body });
  const zf = D / 2, k = keyLook(p.color);
  for (let i = 0; i < 3; i++) F.add(at(rbox(0.12, 0.01, 0.008, dark, 0.004), 0, H * 0.44 - i * 0.022, zf + 0.001));
  F.add(at(rbox(0.26, 0.1, 0.02, dark, 0.012), 0, H * 0.3, zf + 0.004));
  addScreen(rig, F, 'led', 0.22, 0.07, V(0, H * 0.3, zf + 0.0145));
  keypad(rig, F, { cols: 3, rows: 1, w: 0.25, h: 0.07, cy: -0.03, z: zf, chars: ['END', 'CLR', 'SND'], kd: 0.014, ...k });
  keypad(rig, F, { cols: 3, rows: 4, w: 0.25, h: 0.26, cy: -0.28, z: zf, chars: DIGITS, kd: 0.014, ...k });
  const hinge = new THREE.Group();
  hinge.position.set(0, -H / 2 + 0.03, zf + 0.012);
  const flap = at(rbox(W * 0.96, 0.34, 0.022, body, 0.02), 0, -0.17, 0);
  hinge.add(flap);
  for (let i = 0; i < 4; i++) hinge.add(at(rbox(0.012, 0.012, 0.004, dark, 0.004), -0.05 + i * 0.033, -0.17, 0.0125));
  F.add(hinge);
  rig.state('open', 1);
  rig.upd.push((s) => { hinge.rotation.x = -(Math.PI - 0.1) + (Math.PI - 0.1 + 0.12) * s.open; });
  rig.action('flap', () => (rig.t.open > 0.5 ? '闔上翻蓋' : '打開翻蓋'), () => rig.flip('open'));
  B.add(at(cyl(0.02, 0.024, 0.06, rubber('#1a1a1a')), 0.11, H / 2 + 0.02, -0.02));
  B.add(at(cyl(0.009, 0.009, 0.16, metal('#8d9096')), 0.11, H / 2 + 0.12, -0.02));
  rig.pin(hinge, V(0, -0.2, 0.012), 1, '翻蓋', '闔上時保護按鍵，打開後剛好靠近嘴邊當作收音。這是早期把手機縮小的辦法。點「闔上翻蓋」看看。');
  rig.pin(B, V(0.11, H / 2 + 0.22, -0.02), 0, '短天線', '比前一代短很多，因為基地台變多、訊號變好，不需要那麼長的天線了。');
  rig.pin(F, V(0, H * 0.3, zf + 0.02), 1, 'LED 顯示幕', '還是只能顯示數字，但已經能放進外套口袋。');
}

function clam(rig, p) {
  const W = 0.32, H = 0.5, D = 0.08, F = rig.front;
  const body = plastic(p.color, { roughness: 0.45 }), dark = plastic('#0f1012', { roughness: 0.3 });
  slabs(rig, { W, H, D, r: 0.04, back: body, front: body });
  const zf = D / 2, k = keyLook(p.color);
  keypad(rig, F, { cols: 3, rows: 4, w: 0.22, h: 0.28, cy: -0.08, z: zf, chars: DIGITS, kd: 0.01, ...k, color: '#9aa0a8', text: '#111' });
  keypad(rig, F, { cols: 3, rows: 1, w: 0.22, h: 0.06, cy: 0.14, z: zf, chars: ['END', 'CLR', 'SND'], kd: 0.01, color: '#9aa0a8', text: '#111' });
  for (let i = 0; i < 5; i++) F.add(at(rbox(0.012, 0.008, 0.004, dark, 0.003), -0.04 + i * 0.02, -H / 2 + 0.03, zf));
  const lt = D * 0.66, Hl = H * 0.95;
  const top = new THREE.Group();
  top.userData.isLid = true;
  top.position.set(0, H / 2, zf);
  top.add(at(rbox(W, Hl, lt, body, 0.04), 0, Hl / 2, -D / 2));
  top.add(at(rbox(0.23, 0.16, 0.006, dark, 0.012), 0, Hl * 0.5, -D / 2 + lt / 2));
  const scr = addScreen(rig, top, 'lcd', 0.2, 0.12, V(0, Hl * 0.5, -D / 2 + lt / 2 + 0.004));
  for (let i = 0; i < 3; i++) top.add(at(rbox(0.07, 0.008, 0.004, dark, 0.003), 0, Hl * 0.86 - i * 0.016, -D / 2 + lt / 2));
  top.add(at(cyl(0.017, 0.02, 0.04, rubber('#16171a')), 0.1, Hl + 0.01, -D / 2));
  top.add(at(cyl(0.008, 0.008, 0.12, metal('#8d9096')), 0.1, Hl + 0.09, -D / 2));
  F.add(top);
  const pivot = at(cyl(0.014, 0.014, W * 0.5, metal('#6b7078')), 0, H / 2, zf - 0.012); pivot.rotation.z = Math.PI / 2; F.add(pivot);
  rig.state('open', 1);
  rig.upd.push((s) => { top.rotation.x = (Math.PI - 0.06) + (-0.2 - (Math.PI - 0.06)) * s.open; });
  rig.action('lid', () => (rig.t.open > 0.5 ? '合上蓋子' : '掀開蓋子'), () => rig.flip('open'));
  rig.pin(top, V(0, Hl * 0.75, -D / 2 + lt / 2 + 0.01), 1, '貝殼式掀蓋', '合起來的大小只有一包香菸左右，才放得進口袋，這是它被叫做「口袋電話」的原因。點「合上蓋子」看看。');
  rig.pin(top, V(0.1, Hl + 0.13, -D / 2), 0, '伸縮天線', '蓋子頂端的小天線，這時的天線已經比大哥大短很多。');
  rig.pin(F, V(0, -0.08, zf + 0.015), 1, '按鍵', '小小的按鍵排在下半部，闔上蓋子時會被蓋住，不會被誤觸。');
  void scr;
}

function candybar(rig, p) {
  const W = 0.3, H = 0.7, D = 0.13, F = rig.front, B = rig.back;
  const nokia = p.id === 'nokia-3210' || p.id === 'nokia-3310';
  const L = (x, y, z, r, ring) => { rig.cams.push({ x, y, r }); return lens(B, x, y, z, r, ring); };
  const body = plastic(p.color, { roughness: 0.5 }), face = plastic('#d9dde3', { roughness: 0.35 }), dark = plastic('#101114', { roughness: 0.3 });
  slabs(rig, { W, H, D, r: 0.06, back: body, front: body });
  const zf = D / 2;
  F.add(at(rbox(W * 0.86, H * 0.9, 0.012, face, 0.045), 0, 0, zf));
  const color = p.screen === 'color';
  F.add(at(rbox(0.22, 0.18, 0.01, dark, 0.012), 0, 0.154, zf + 0.008));
  addScreen(rig, F, color ? 'color' : 'lcd', 0.19, 0.15, V(0, 0.154, zf + 0.0135));
  F.add(at(rbox(0.08, 0.008, 0.006, dark, 0.003), 0, 0.31, zf + 0.007));
  const kc = lum(p.color) > 0.45 ? '#555' : shade(p.color, -0.15);
  keypad(rig, F, { cols: 3, rows: 1, w: 0.2, h: 0.05, cy: 0.0, z: zf + 0.006, chars: ['OK', 'C', '▼'], kd: 0.012, color: '#20304f', text: '#fff', kw: 0.058, kh: 0.045 });
  keypad(rig, F, { cols: 3, rows: 4, w: 0.2, h: 0.22, cy: -0.18, z: zf + 0.006, chars: DIGITS, kd: 0.014, color: kc, text: '#fff' });
  rig.pin(F, V(0, 0.154, zf + 0.02), 1, color ? '彩色螢幕' : '單色 LCD 螢幕', color ? '螢幕不再只有黑白，手機開始有了「畫面」。' : '只有一種顏色的點陣螢幕，能顯示數字和簡單文字。' + (nokia ? '試試「背光」和「貪食蛇」。' : ''));
  rig.pin(F, V(0.09, -0.18, zf + 0.02), 1, '實體按鍵', '每個按鍵都是真的，按下去會「喀」一聲。點點看，螢幕會顯示號碼。');
  if (nokia) {
    const colors = ['#2c3e63', '#b3261e', '#2e7d32', '#d4a017', '#6b7280', '#7e57c2'];
    let ci = Math.max(0, colors.indexOf(p.color));
    rig.action('cover', () => '換外殼', () => { ci = (ci + 1) % colors.length; body.color.set(colors[ci]); });
    rig.action('light', () => (rig.screen.light ? '關背光' : '開背光'), () => { rig.screen.light = !rig.screen.light; rig.screen.poke(); rig.screen.redraw(); });
    rig.action('snake', () => (rig.screen.mode === 'snake' ? '結束貪食蛇' : '玩貪食蛇'), () => { rig.screen.mode === 'snake' ? rig.screen.stopSnake() : rig.screen.startSnake(); });
    rig.pin(B, V(0, -0.05, -D / 2 - 0.005), -1, '可換外殼', '背殼可以直接拆下來換顏色，手機從此變成可以搭配衣服的配件。點「換外殼」看看。');
  }
  if (p.camera) {
    L(0.06, 0.2, -D / 2 - 0.005, 0.03);
    B.add(axisZ(at(cyl(0.012, 0.012, 0.004, metal('#cfd3d8', { roughness: 0.1 })), -0.06, 0.2, -D / 2 - 0.002)));
    rig.pin(B, V(0.06, 0.2, -D / 2 - 0.02), -1, '背面鏡頭', '最早量產的照相手機之一。拍好的照片可以直接傳給朋友，旁邊的小鏡子用來自拍。');
  }
}

function slider(rig, p) {
  const W = 0.34, H = 0.6, D = 0.055, F = rig.front;
  const body = plastic(p.color, { roughness: 0.45 }), top = plastic(shade(p.color, 0.1), { roughness: 0.4 }), dark = plastic('#0c0d0f', { roughness: 0.3 });
  slabs(rig, { W, H, D, r: 0.04, back: body, front: body });
  const zf = D / 2;
  const rows = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL←', 'ZXCVBNM.,↵'];
  keypad(rig, F, { cols: 10, rows: 4, w: 0.31, h: 0.2, cy: -0.185, z: zf, chars: rows.join('').split(''), kd: 0.012, kw: 0.026, kh: 0.036, color: '#4a4d52', text: '#e8e8e8', round: 0.006 });
  const sl = new THREE.Group();
  sl.position.set(0, 0, zf + 0.0175);
  sl.add(rbox(W, H, 0.035, top, 0.04));
  sl.add(at(rbox(0.3, 0.42, 0.008, dark, 0.02), 0, 0.085, 0.018));
  addScreen(rig, sl, 'android', 0.27, 0.36, V(0, 0.09, 0.0225));
  [[-0.11, '#2fbf5b'], [-0.06, '#555'], [0.06, '#555'], [0.11, '#d33']].forEach(([x, c]) => sl.add(at(rbox(0.04, 0.018, 0.008, plastic(c, { roughness: 0.4 }), 0.008), x, -0.245, 0.019)));
  const ball = at(new THREE.Mesh(new THREE.SphereGeometry(0.022, 20, 14), metal('#9aa0a8', { roughness: 0.2 })), 0, -0.245, 0.021);
  sl.add(ball);
  F.add(sl);
  rig.state('slide', 0);
  rig.upd.push((s) => { sl.position.y = 0.26 * s.slide; });
  rig.action('slide', () => (rig.t.slide > 0.5 ? '收回鍵盤' : '滑出鍵盤'), () => rig.flip('slide'));
  rig.pin(sl, V(0, -0.245, 0.03), 1, '軌跡球', '還沒有多點觸控的年代，用軌跡球移動游標，選取畫面上的項目。');
  rig.pin(sl, V(0, 0.2, 0.03), 1, 'Android 1.0', '第一支 Android 手機的畫面。點螢幕可以解鎖、打開 App。');
  rig.pin(F, V(0, -0.19, zf + 0.02), 1, '滑出式全鍵盤', '螢幕往上滑開，就能看到 QWERTY 鍵盤，打字比點螢幕鍵盤快。點「滑出鍵盤」看看。');
}

function phablet(rig, p) {
  const W = 0.5, H = 0.88, D = 0.06, F = rig.front;
  const back = plastic(p.color, { roughness: 0.55 }), frame = plastic('#15171b', { roughness: 0.35 }), dark = plastic('#0a0b0d', { roughness: 0.3 });
  slabs(rig, { W, H, D, r: 0.05, back, front: frame });
  const zf = D / 2;
  F.add(at(rbox(W - 0.014, H - 0.014, 0.006, glassMat('#050608'), 0.04), 0, 0, zf + 0.001));
  addScreen(rig, F, 'android', 0.45, 0.72, V(0, 0.035, zf + 0.0046), { corner: 12 });
  const hb = new THREE.Group(); hb.position.set(0, -0.385, zf + 0.004);
  const hbm = at(rbox(0.1, 0.035, 0.008, plastic('#2a2d33', { roughness: 0.25 }), 0.016), 0, 0, 0.002);
  hb.add(hbm); F.add(hb);
  rig.tap(hbm, rig.pressable(hb, V(0, 0, 1), 0.004, () => { beep('5'); rig.screen.homeButton(); }));
  [[-0.16, '≡'], [0.16, '↩']].forEach(([x, ch]) => F.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), new THREE.MeshBasicMaterial({ map: keyTex(ch, '#9fb0c8'), transparent: true })), x, -0.385, zf + 0.0047)));
  F.add(at(rbox(0.1, 0.008, 0.004, dark, 0.003), 0, 0.41, zf + 0.004));
  F.add(axisZ(at(cyl(0.008, 0.008, 0.004, dark), -0.12, 0.41, zf + 0.004)));
  // S Pen 收在底部筆槽，在核心層，拆開時看得到
  const pen = new THREE.Group();
  const bar = cyl(0.011, 0.011, 0.6, metal('#9a9da3', { roughness: 0.35 }));
  const tipc = at(new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.04, 14), plastic('#2b2b2b')), 0, -0.32, 0); tipc.rotation.x = Math.PI;
  const clk = at(cyl(0.008, 0.008, 0.03, plastic('#222')), 0, 0.315, 0);
  pen.add(bar, tipc, clk);
  const penWrap = new THREE.Group(); penWrap.add(pen); rig.core.add(penWrap); rig.queued.push({ id: 'pen', group: penWrap, k: -0.15 });
  rig.state('pen', 0);
  rig.upd.push((s) => { pen.position.set(0.15 + 0.07 * s.pen, -0.16 - 0.4 * s.pen, 0.05 * s.pen); pen.rotation.z = -0.35 * s.pen; });
  rig.action('pen', () => (rig.t.pen > 0.5 ? '收回 S Pen' : '拿出 S Pen'), () => rig.flip('pen'));
  rig.pin(pen, V(0, -0.3, 0.02), 0, 'S Pen 觸控筆', '平時收在機身底部的筆槽裡。拿出來之後可以在螢幕上寫字、畫圖，這是 Galaxy Note 最有名的特色。');
  rig.pin(F, V(0.14, 0.2, zf + 0.02), 1, '5.3 吋大螢幕', '螢幕大到介於手機和平板之間，所以被稱為「平板手機」。點螢幕可以解鎖、開 App。');
  rig.pin(hb, V(0, 0, 0.02), 1, '實體 Home 鍵', '螢幕底下還保留一顆真正的按鍵，按一下回主畫面。');
}

const TOUCH = {
  iphone: { W: 0.37, H: 0.69, D: 0.07, r: 0.055, frame: '#b9bbbf', back: 'alu', backColor: '#c4c6ca', sw: 0.31, sh: 0.465, sy: 0.0175, hy: -0.285, home: 'sq', corner: 10, cam: 'iphone1' },
  iphone4: { W: 0.355, H: 0.69, D: 0.066, r: 0.018, frame: '#9a9ca1', back: 'glass', backColor: '#101114', sw: 0.3, sh: 0.45, sy: 0.015, hy: -0.29, home: 'sq', corner: 9, cam: 'iphone4' },
  iphone5s: { W: 0.35, H: 0.78, D: 0.058, r: 0.03, frame: '#cdbd9c', back: 'alu', backColor: '#d8c3a5', sw: 0.29, sh: 0.516, sy: 0.027, hy: -0.335, home: 'touchid', corner: 9, cam: 'iphone5s' },
  iphone12: { W: 0.43, H: 0.88, D: 0.054, r: 0.04, frame: '#a9b6c8', back: 'glass', sw: 0.396, sh: 0.846, sy: 0, corner: 28, notch: { type: 'notch', w: 103, h: 22 }, cam: 'iphone12' },
  'galaxy-s24': { W: 0.42, H: 0.9, D: 0.043, r: 0.035, frame: '#8f8b9c', back: 'frost', sw: 0.394, sh: 0.875, sy: 0, corner: 20, notch: { type: 'punch', r: 5, y: 11 }, cam: 's24' }
};

function touchPhone(rig, p) {
  const C = TOUCH[p.id] || (p.shape === 'modern' ? TOUCH.iphone12 : TOUCH.iphone4);
  const { W, H, D } = C, F = rig.front, B = rig.back, zf = D / 2, zb = -D / 2;
  const android = p.id === 'galaxy-s24';
  const L = (x, y, z, r, ring) => { rig.cams.push({ x, y, r }); return lens(B, x, y, z, r, ring); };
  const frameM = metal(C.frame, { roughness: 0.28 });
  const bc = C.backColor || p.color;
  const backM = C.back === 'alu' ? metal(bc, { roughness: 0.4 }) : glassMat(bc, { roughness: C.back === 'frost' ? 0.38 : 0.15, metalness: 0.1 });
  const dark = plastic('#0c0d10', { roughness: 0.3 });
  slabs(rig, { W, H, D, r: C.r, back: backM, front: frameM });
  F.add(at(rbox(W - 0.012, H - 0.012, 0.006, glassMat('#050608'), C.r * 0.8), 0, 0, zf + 0.001));
  addScreen(rig, F, android ? 'android' : 'ios', C.sw, C.sh, V(0, C.sy, zf + 0.0046), { corner: C.corner, notch: C.notch });

  if (C.home) {
    const g = new THREE.Group(); g.position.set(0, C.hy, zf + 0.0045);
    const disc = cyl(0.025, 0.025, 0.004, glassMat('#0a0a0a', { roughness: 0.2 })); disc.rotation.x = Math.PI / 2; disc.position.z = 0.001;
    g.add(disc);
    if (C.home === 'sq') {
      const sq = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.02), new THREE.MeshBasicMaterial({ map: keyTex('▢', '#9a9a9a'), transparent: true }));
      sq.position.z = 0.0035; g.add(sq);
    } else { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.029, 0.0045, 10, 40), metal('#e2dccd', { roughness: 0.2 })); ring.position.z = 0.001; g.add(ring); }
    F.add(g);
    rig.tap(disc, rig.pressable(g, V(0, 0, 1), 0.004, () => { beep('5'); rig.screen.homeButton(); }));
    rig.pin(g, V(0, 0, 0.01), 1, C.home === 'touchid' ? 'Touch ID 指紋辨識' : 'Home 鍵', C.home === 'touchid' ? '把手指放在 Home 鍵上就能解鎖，指紋辨識從這一代開始。按一下也可以回主畫面。' : '整個正面只剩這一顆按鍵，按一下就回到主畫面。');
  }
  if (!C.notch) {
    F.add(at(rbox(0.07, 0.007, 0.003, dark, 0.003), 0, H / 2 - 0.045, zf + 0.0045));
    if (p.id === 'iphone4') F.add(axisZ(at(cyl(0.007, 0.007, 0.003, glassMat('#05070c')), -0.075, H / 2 - 0.045, zf + 0.0045)));
  }

  // 側邊按鍵
  const bm = metal(C.frame, { roughness: 0.35 });
  const side = (x, y, len, axis, fn) => {
    const g = new THREE.Group(); g.position.set(x, y, 0);
    const b = rbox(0.008, len, 0.014, bm, 0.003); g.add(b); F.add(g);
    rig.tap(b, rig.pressable(g, axis, 0.005, fn));
    return g;
  };
  const toggle = () => { rig.screen.toggleOn(); };
  let pw;
  if (C.notch) pw = side(W / 2 + 0.002, H * 0.17, 0.1, V(1, 0, 0), toggle);
  else { pw = new THREE.Group(); pw.position.set(0.1, H / 2 + 0.002, 0); const pb = rbox(0.045, 0.008, 0.014, bm, 0.003); pw.add(pb); F.add(pw); rig.tap(pb, rig.pressable(pw, V(0, 1, 0), 0.005, toggle)); }
  side(-W / 2 - 0.002, H * 0.2, 0.05, V(-1, 0, 0), () => beep('1'));
  side(-W / 2 - 0.002, H * 0.11, 0.05, V(-1, 0, 0), () => beep('1'));
  if (!android) { const sw = side(-W / 2 - 0.002, H * 0.3, 0.028, V(-1, 0, 0), () => {}); sw.children[0].material = plastic('#ff8a1f'); }
  rig.pin(pw, V(0, 0, 0.012), 0, '電源鍵', '按一下開關螢幕，點點看。');

  // 背面
  const lensR = { iphone1: 0.022, iphone4: 0.028, iphone5s: 0.03, iphone12: 0.033, s24: 0.032 };
  const flashM = new THREE.MeshStandardMaterial({ color: '#fff4cf', emissive: '#ffe9a8', emissiveIntensity: 0.8, roughness: 0.3 });
  const flash = (x, y, z, r = 0.012) => { const f = cyl(r, r, 0.004, flashM); f.rotation.x = Math.PI / 2; B.add(at(f, x, y, z)); };
  let camPos = V(-W * 0.3, H * 0.4, zb - 0.02), camTitle = '背面鏡頭', camText = '';
  switch (C.cam) {
    case 'iphone1':
      B.add(at(rbox(W * 0.97, 0.13, 0.004, rubber('#17181b'), 0.01), 0, -H / 2 + 0.08, zb - 0.002));
      L(-W * 0.3, H * 0.4, zb - 0.004, lensR.iphone1, '#444');
      camPos = V(-W * 0.3, H * 0.4, zb - 0.02); camTitle = '200 萬畫素鏡頭'; camText = '第一代 iPhone 的鏡頭只有後面一顆，沒有閃光燈，也不能錄影。黑色塑膠條是為了讓天線訊號穿透金屬背板。'; break;
    case 'iphone4':
      L(-W * 0.28, H * 0.4, zb - 0.004, lensR.iphone4, '#8a8e95'); flash(-W * 0.02, H * 0.41, zb - 0.002);
      camPos = V(-W * 0.28, H * 0.4, zb - 0.02); camTitle = '後置鏡頭與閃光燈'; camText = 'iPhone 4 第一次加入 LED 閃光燈，正面另外多了一顆前鏡頭，可以視訊通話。'; break;
    case 'iphone5s':
      B.add(at(rbox(W * 0.96, 0.06, 0.003, glassMat('#f1efe9', { roughness: 0.25 }), 0.008), 0, H / 2 - 0.05, zb - 0.0012));
      B.add(at(rbox(W * 0.96, 0.06, 0.003, glassMat('#f1efe9', { roughness: 0.25 }), 0.008), 0, -H / 2 + 0.05, zb - 0.0012));
      L(0, H * 0.4, zb - 0.004, lensR.iphone5s, '#b8a98a');
      { const tr = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.005, 8, 36), flashM); tr.position.set(0, H * 0.4, zb - 0.003); B.add(tr); }
      camPos = V(0, H * 0.4, zb - 0.02); camTitle = '雙色溫閃光燈'; camText = '鏡頭外圈有一白一琥珀兩顆閃光燈，會依環境調整色溫，拍出來的膚色更自然。'; break;
    case 'iphone12':
      B.add(at(rbox(0.2, 0.2, 0.012, glassMat(shade(p.color, 0.12), { roughness: 0.2 }), 0.045), -0.1, H * 0.345, zb - 0.006));
      L(-0.145, H * 0.345 + 0.045, zb - 0.014, lensR.iphone12); L(-0.145, H * 0.345 - 0.045, zb - 0.014, lensR.iphone12);
      flash(-0.055, H * 0.345 + 0.045, zb - 0.014);
      camPos = V(-0.1, H * 0.345, zb - 0.03); camTitle = '雙鏡頭'; camText = '一顆廣角、一顆超廣角，斜著排在方形鏡頭模組裡。'; break;
    case 's24':
      [0, 1, 2].forEach((i) => L(-W * 0.28, H * 0.36 - i * 0.095, zb - 0.004, lensR.s24, '#5d6068'));
      flash(-W * 0.28 + 0.075, H * 0.36, zb - 0.002, 0.009);
      camPos = V(-W * 0.28, H * 0.31, zb - 0.02); camTitle = '三顆獨立鏡頭'; camText = '主鏡頭、超廣角和望遠鏡頭各自凸出來，三顆鏡頭負責不同的拍攝距離。'; break;
    default: break;
  }
  rig.pin(B, camPos, -1, camTitle, camText);
  if (C.notch && C.notch.type === 'notch') rig.pin(F, V(0, H / 2 - 0.02, zf + 0.012), 1, '瀏海', 'Face ID 臉部辨識的感測器和前鏡頭都擠在這塊黑色區域裡。');
  if (android) {
    rig.pin(F, V(0, H / 2 - 0.016, zf + 0.012), 1, '打孔前鏡頭', '前鏡頭縮小成螢幕上的一個小洞，畫面幾乎滿版。');
    rig.pin(F, V(0.1, -0.1, zf + 0.012), 1, 'Galaxy AI', 'S24 系列開始內建 AI 功能，例如即時口譯，還有圈起畫面就能搜尋的「圈選即搜尋」。點螢幕玩玩看。');
  } else rig.pin(F, V(0.1, C.hy + 0.2, zf + 0.012), 1, p.id === 'iphone' ? '多點觸控螢幕' : '觸控螢幕', p.id === 'iphone' ? '手指就是游標。不用觸控筆，也不用一堆實體按鍵，直接點螢幕操作。點螢幕試試看。' : '直接用手指點螢幕操作。點螢幕可以解鎖、打開 App。');
}


/* ====================================================================
   分解檢視：把機身拆成真的零件（後蓋、電池、主機板、螢幕模組⋯⋯）
   ==================================================================== */
/* ====================================================================
   展品專用造型：IBM Simon（長條觸控機）、SCR-300（背負式電台）
   這兩件沒有照片，造型是依介紹文字示意的，細節已簡化。
   ==================================================================== */
function simon(rig, p) {
  const W = 0.36, H = 1.12, D = 0.17, F = rig.front;
  const body = plastic(p.color, { roughness: 0.5 }), dark = plastic('#0d0e11', { roughness: 0.35 });
  slabs(rig, { W, H, D, r: 0.035, back: body, front: body });
  rig.batteryLabel = 'BATTERY';
  const zf = D / 2, sw = 0.29, sh = sw * 293 / 160, sy = 0.1;   // 螢幕解析度 160×293，直立
  F.add(at(rbox(W * 0.92, sh + 0.1, 0.012, dark, 0.02), 0, sy, zf + 0.003));
  addScreen(rig, F, 'simon', sw, sh, V(0, sy, zf + 0.0095));
  F.add(at(rbox(0.1, 0.012, 0.006, dark, 0.004), 0, H * 0.47, zf + 0.002));
  F.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16 * 96 / 256), new THREE.MeshBasicMaterial({ map: labelTex('SIMON', '#cfd3d8', '#17181c') })), 0, -H * 0.4, zf + 0.0035));
  // 觸控筆：平時貼在機身右側，可以拔出來
  const pen = new THREE.Group();
  pen.add(cyl(0.011, 0.011, 0.5, plastic('#1b1c20', { roughness: 0.4 })));
  pen.add(at(cyl(0.003, 0.011, 0.05, metal('#b8bcc4', { roughness: 0.3 }), 10), 0, -0.275, 0));
  F.add(pen);
  rig.state('pen', 0);
  rig.upd.push((s) => { pen.position.set(W / 2 + 0.008 + 0.16 * s.pen, 0.16 * s.pen, 0.02 + 0.26 * s.pen); pen.rotation.set(0, 0, 0.55 * s.pen); });
  rig.action('pen', () => (rig.t.pen > 0.5 ? '收回觸控筆' : '拔出觸控筆'), () => rig.flip('pen'));
  rig.pin(F, V(0, sy, zf + 0.02), 1, '單色觸控螢幕', '約 4.5 吋的單色螢幕，上面疊一層電阻式觸控層：用筆尖或手指壓下去才會有反應。點點看螢幕上的圖示。');
  rig.pin(pen, V(0, 0.1, 0.02), 1, '隨機附的觸控筆', '機器附一支觸控筆。電阻式螢幕用尖的筆頭比手指準，不過用手指也能操作。點「拔出觸控筆」看看。');
  rig.pin(F, V(0, -H * 0.4, zf + 0.012), 1, '續航很有限', '電池通話只能撐約 1 小時，充電要 14 至 16 小時。');
}

function radio(rig, p) {
  const W = 0.58, H = 0.78, D = 0.3, F = rig.front, B = rig.back;
  const body = plastic(p.color, { roughness: 0.7 }), panel = plastic(shade(p.color, -0.14), { roughness: 0.6 });
  const dark = plastic('#14170f', { roughness: 0.5 }), steel = metal('#b9bcb4', { roughness: 0.35 });
  slabs(rig, { W, H, D, r: 0.03, back: body, front: body });
  rig.batteryLabel = 'BA-70';
  const zf = D / 2;
  F.add(at(rbox(W * 0.9, H * 0.9, 0.008, panel, 0.01), 0, 0, zf + 0.002));
  // 調頻撥盤：點一下會轉動
  const knob = new THREE.Group(); knob.position.set(-0.12, 0.12, zf + 0.012);
  const dial = axisZ(cyl(0.12, 0.12, 0.022, steel, 28)); knob.add(dial);
  knob.add(at(axisZ(cyl(0.085, 0.085, 0.004, dark, 28)), 0, 0, 0.012));
  knob.add(at(rbox(0.014, 0.1, 0.006, plastic('#e8e6d8'), 0.003), 0, 0.045, 0.016));
  F.add(knob);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, t = at(rbox(0.006, 0.018, 0.004, plastic('#e8e6d8'), 0.002), -0.12 + Math.cos(a) * 0.14, 0.12 + Math.sin(a) * 0.14, zf + 0.008);
    t.rotation.z = a - Math.PI / 2; F.add(t);
  }
  rig.state('tune', 0);
  rig.upd.push((s) => { knob.rotation.z = -s.tune * 0.8; });
  rig.tap(dial, () => { rig.t.tune += 1; });
  [[0.15, 0.2], [0.15, 0.03]].forEach(([x, y]) => F.add(at(axisZ(cyl(0.04, 0.04, 0.03, steel, 20)), x, y, zf + 0.014)));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => F.add(at(axisZ(cyl(0.012, 0.012, 0.008, steel, 10)), sx * W * 0.4, sy * H * 0.4, zf + 0.008)));
  F.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3 * 96 / 256), new THREE.MeshBasicMaterial({ map: labelTex('SCR-300', '#e9e7d6', '#1f2418') })), 0.04, -0.22, zf + 0.0065));
  F.add(at(axisZ(cyl(0.022, 0.022, 0.02, dark, 16)), W / 2 - 0.07, -H * 0.38, zf + 0.012));   // 話筒插孔
  // 背面：背架與肩帶
  B.add(at(rbox(W * 0.84, H * 0.8, 0.014, dark, 0.012), 0, -0.02, -D / 2 - 0.006));
  [-0.15, 0.15].forEach((x) => B.add(at(rbox(0.07, H * 1.0, 0.012, plastic('#5d5b45', { roughness: 0.9 }), 0.006), x, -0.05, -D / 2 - 0.018)));
  // 天線：可以拉出、收起
  B.add(at(cyl(0.045, 0.05, 0.1, rubber('#14170f')), -0.2, H / 2 + 0.04, -0.02));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1, 12), metal('#8d9096')); B.add(rod);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), rubber('#1a1a1a')); B.add(tip);
  rig.state('ext', 1);
  rig.upd.push((s) => { const len = 0.1 + 0.4 * s.ext; rod.scale.y = len; rod.position.set(-0.2, H / 2 + 0.09 + len / 2, -0.02); tip.position.set(-0.2, H / 2 + 0.09 + len, -0.02); });
  rig.action('ant', () => (rig.t.ext > 0.5 ? '收起天線' : '拉出天線'), () => rig.flip('ext'));
  // 話筒：用線接到機身，可以拿起
  const hs = new THREE.Group(), hm = plastic('#1f2218', { roughness: 0.5 });
  hs.add(rbox(0.07, 0.3, 0.055, hm, 0.025));
  hs.add(at(rbox(0.1, 0.085, 0.085, hm, 0.03), 0, 0.2, 0.012));
  hs.add(at(rbox(0.1, 0.075, 0.085, hm, 0.03), 0, -0.2, 0.012));
  const ptt = at(rbox(0.03, 0.12, 0.014, plastic('#0c0d09'), 0.005), 0, 0, 0.034); hs.add(ptt);
  F.add(hs);
  rig.tap(ptt, rig.pressable(ptt, V(0, 0, 1), 0.01, () => beep('PTT')));
  F.add(at(rbox(0.03, 0.1, 0.04, steel, 0.01), W / 2 + 0.03, 0.12, 0.02));
  const cordM = rubber('#1c1c1c');
  let cord = null, lastKey = '';
  rig.state('hand', 0);
  rig.upd.push((s) => {
    hs.position.set(W / 2 + 0.075 + 0.2 * s.hand, 0.02 + 0.26 * s.hand, 0.03 + 0.2 * s.hand);
    hs.rotation.z = -0.8 * s.hand;
    const key = s.hand.toFixed(3) + s.explode.toFixed(3);
    if (key === lastKey) return; lastKey = key;
    const end = V(0, -0.18, 0).applyEuler(hs.rotation).add(hs.position); end.z += rig.front.position.z;
    const st = V(W / 2 - 0.07, -H * 0.38, zf + 0.012);
    const m = st.clone().lerp(end, 0.5); m.y -= 0.16; m.z += 0.1;
    const curve = new THREE.CatmullRomCurve3([st, st.clone().add(V(0.03, -0.07, 0.05)), m, end]);
    const g = new THREE.TubeGeometry(curve, 28, 0.009, 6);
    if (cord) { cord.geometry.dispose(); cord.geometry = g; } else { cord = new THREE.Mesh(g, cordM); rig.root.add(cord); }
  });
  rig.action('hand', () => (rig.t.hand > 0.5 ? '放回話筒' : '拿起話筒'), () => rig.flip('hand'));
  rig.pin(F, V(-0.12, 0.12, zf + 0.03), 1, '調頻撥盤', '轉動撥盤來選擇要用的頻道。點撥盤，它會轉動。');
  rig.pin(B, V(-0.2, H / 2 + 0.3, -0.02), 0, '長天線', '天線拉出來才收發得好。通話距離約 3 英里（約 4.8 公里），依地形與天線而定。點「收起天線」看看。');
  rig.pin(hs, V(0, 0.2, 0.06), 1, '話筒', '話筒用一條線接到機身。話筒上有通話鍵：按住說話、放開收聽（這一類對講機的典型用法）。點「拿起話筒」，再點通話鍵。');
  rig.pin(F, V(0.04, -0.22, zf + 0.02), 1, '背著走的電台', '連電池約 15 公斤上下（依電池而不同），所以要用背架和肩帶背在背上。');
}

const TIER = { brick: 'analog', car: 'analog', flip: 'analog', clam: 'digital', candybar: 'digital', slider: 'smart', touch: 'smart', modern: 'smart', phablet: 'smart', radio: 'analog', simon: 'digital' };
const SIM_IDS = ['nokia-3210', 'nokia-3310', 'siemens-s10', 'iphone', 'htc-dream', 'iphone4', 'iphone5s', 'iphone12', 'galaxy-note', 'galaxy-s24'];
const PART_COLORS = {
  back: '#94a3b8', coil: '#f59e0b', battery: '#22c55e', camera: '#a855f7', antenna: '#eab308', sim: '#06b6d4', pen: '#f472b6', frame: '#64748b',
  audio: '#fb923c', vib: '#f97316', board: '#10b981', shield: '#cbd5e1', heat: '#ef4444', membrane: '#38bdf8', display: '#3b82f6', sensor: '#c084fc', front: '#60a5fa'
};
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function rrShape(w, h, r) {
  r = Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005);
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function ringMesh(W, H, r, t, depth, mat) {
  const sh = rrShape(W, H, r);
  sh.holes.push(rrShape(W - 2 * t, H - 2 * t, Math.max(r - t, 0.004)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  return new THREE.Mesh(g, mat);
}
function labelTex(text, fg = '#e9edf2', bg = '#2b3038') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 96);
  x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 3; x.strokeRect(6, 6, 244, 84);
  x.fillStyle = fg; x.font = `800 44px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// 每個零件的名稱與說明
// 專用造型的零件說明（避免套用手機的通用說明，例如鋰電池、Wi‑Fi 天線）
const SHAPE_PARTS = {
  radio: {
    back: ['背面外殼', '背面連著背架和肩帶，讓人可以把整台電台背在背上。'],
    front: ['前面板', '撥盤、旋鈕和話筒的插孔都在這一面。'],
    frame: ['機身骨架', '電台的框架，收發電路和電池都固定在這裡。'],
    battery: ['電池（BA-70／BA-80）', '專用電池有兩種：BA-70 約 6.8 公斤、可用約 20 至 25 小時；BA-80 輕約 2.7 公斤，但只能用約 12 至 15 小時。'],
    board: ['收發電路', '把聲音轉成無線電波送出去、再把收到的訊號還原成聲音的電路，都在這一塊。']
  },
  simon: {
    back: ['後殼', '塑膠後殼，機身又厚又重。'],
    front: ['前面板', '正面大半是觸控螢幕。'],
    frame: ['中框', '機身的骨架，電路板和電池固定在這裡。'],
    battery: ['電池', '續航很有限：通話約 1 小時，充電要 14 至 16 小時。'],
    board: ['主機板', '電話、傳真、電子郵件和行事曆等功能的電路，都在這塊板子上。'],
    display: ['單色觸控 LCD 模組', '160×293 像素的單色液晶，上面疊一層電阻式觸控層，壓下去才有反應。'],
    antenna: ['天線', '負責收發行動電話訊號。']
  }
};

function partInfo(id, p, tier) {
  const over = SHAPE_PARTS[p.shape];
  if (over && over[id]) return over[id];
  const modern = p.id === 'iphone12' || p.id === 'galaxy-s24';
  const backs = {
    iphone: ['鋁製後殼', '金屬背板。底部的黑色塑膠條是天線的「窗口」，讓訊號能穿過金屬。'],
    iphone4: ['玻璃後蓋', '前後都是玻璃，中間夾著不鏽鋼外框。玻璃不擋訊號，也容易摔裂。'],
    iphone5s: ['鋁製後殼', '陽極處理的鋁殼，上下兩條玻璃是天線的「窗口」。'],
    iphone12: ['玻璃後蓋', '玻璃不擋電磁波，所以後面才能放無線充電線圈。'],
    'galaxy-s24': ['霧面玻璃後蓋', '玻璃後蓋，讓無線充電的磁場穿過去。三顆鏡頭直接凸在上面。'],
    'galaxy-note': ['塑膠後蓋', '可以直接掀開，下面就是電池和 SIM 卡槽。'],
    'htc-dream': ['塑膠後蓋', '掀開後蓋可以換電池、放 SIM 卡。']
  };
  const batt = {
    analog: ['電池組', '早期的電池組多是鎳鎘電池，又大又重，占掉機身將近一半。充電要好幾個小時，通話大約只有半小時。'],
    digital: ['鋰離子電池', '比早期電池輕巧許多、容量也更大，所以待機可以撐好幾天。'],
    smart: ['鋰聚合物電池', '薄薄一片，用雙面膠貼在機殼裡。容量大，厚度只有幾毫米。']
  };
  const boards = {
    analog: ['主機板（射頻電路）', '1G 是類比訊號，沒有數位晶片，電路板上主要是把聲音調變成無線電波的收發電路。'],
    digital: ['主機板', '數位通話的基頻晶片、處理按鍵和螢幕的微控制器，都在這片電路板上。'],
    smart: ['主機板', modern && p.id === 'iphone12' ? 'A14 仿生晶片、記憶體、5G 數據晶片和各種感測器，擠在這片小板子上。' : '處理器、記憶體、數據晶片和各種感測器，擠在這片小板子上。']
  };
  const disp = p.id === 'iphone12' || p.id === 'galaxy-s24' || p.id === 'galaxy-note'
    ? ['AMOLED 顯示模組', '每個像素自己發光，黑色就是不發光，所以可以做得更薄、更省電。']
    : p.shape === 'touch' || p.shape === 'slider' ? ['觸控 LCD 模組', '液晶面板加上一層觸控感應層，手指碰到螢幕，感應層就知道碰到哪裡。']
    : p.shape === 'brick' || p.shape === 'car' || p.shape === 'flip' ? ['LED 顯示模組', '小小的紅色 LED，只能顯示數字。']
    : p.screen === 'color' ? ['彩色 LCD 模組', '液晶面板，只能顯示少數幾種顏色。'] : ['單色 LCD 模組', '只有一種顏色的點陣液晶，靠背光照亮。'];
  const cams = {
    iphone: '200 萬畫素，只有一顆，沒有閃光燈。', iphone4: '500 萬畫素，旁邊多了 LED 閃光燈。', iphone5s: '800 萬畫素，外圈是雙色溫閃光燈。',
    iphone12: '兩顆 1200 萬畫素鏡頭：廣角和超廣角。', 'galaxy-s24': '主鏡頭 5000 萬畫素，另外還有超廣角和望遠鏡頭。', 'j-sh04': '約 11 萬畫素，是最早量產的照相手機之一。'
  };
  const T = {
    back: () => backs[p.id] || (tier === 'analog' ? ['後殼', '塑膠後殼，用卡扣固定。拆開才看得到電池和電路。'] : ['後殼', '塑膠後殼，用卡扣固定在中框上。']),
    frame: () => (tier === 'smart' && p.id !== 'galaxy-note' && p.id !== 'htc-dream' ? ['金屬中框', '同時負責支撐零件、散熱，外框的金屬條也是天線的一部分。'] : ['中框', '機身的骨架。電路板、電池和按鍵膠墊都固定在這裡。']),
    battery: () => batt[tier],
    board: () => (p.shape === 'car' ? ['主機電路板', '車用電話的電路板比手機大很多，電力由車子的電瓶供應，所以裡面沒有電池。'] : boards[tier]),
    shield: () => ['屏蔽罩', '薄薄的金屬罩，擋住電磁干擾，也保護底下的晶片。'],
    membrane: () => ['按鍵膠墊', '橡膠做的圓頂，按下去會壓到電路板上的接點，所以手感才有「喀」一聲。'],
    display: () => disp,
    camera: () => ['相機模組', '鏡頭、感光元件和對焦馬達包成一整塊。' + (cams[p.id] || '')],
    sensor: () => (p.id === 'iphone12' ? ['Face ID 感測器', '投射上萬個紅外線點，量出臉的深度來解鎖，也包含前鏡頭。'] : ['前鏡頭', '自拍和視訊通話用。']),
    audio: () => ['喇叭與麥克風', '上方是通話用的聽筒，下方是外放喇叭和麥克風。'],
    vib: () => (p.id === 'iphone12' ? ['Taptic Engine', '用精準的線性震動模擬「按下去」的觸感。'] : ['震動馬達', '靜音時用震動提醒來電。']),
    antenna: () => ['天線', '貼在機殼內側的細金屬條，負責收發行動網路、Wi‑Fi 和藍牙訊號。'],
    sim: () => ['SIM 卡槽', '放電信業者的 SIM 卡。換卡，就換了號碼。'],
    coil: () => (p.id === 'iphone12' ? ['無線充電線圈與磁鐵', 'MagSafe 用一圈磁鐵把充電器吸準位置，讓線圈對齊。'] : ['無線充電線圈', '把手機放在充電板上，不插線也能充電。']),
    heat: () => ['均熱板', '裡面的液體蒸發、冷凝，把處理器的熱攤平，手機才不會局部發燙。'],
    pen: () => ['S Pen 觸控筆', '平時收在底部的筆槽，拿出來可以在螢幕上寫字畫圖。'],
    front: () => (tier === 'smart' ? ['前面板', '最外面的強化玻璃，也是手指直接碰到的那一層。' + (p.shape === 'slider' ? '' : '')] : ['前殼與按鍵面板', '帶著按鍵孔位的前殼，按鍵帽、聽筒孔和螢幕窗口都在這一塊。'])
  };
  return (T[id] || (() => [id, '']))();
}

function finishRig(rig) {
  const d = rig.dims;
  if (!d) return;
  const p = rig.p, tier = TIER[p.shape] || 'digital', smart = tier === 'smart', modern = p.id === 'iphone12' || p.id === 'galaxy-s24';
  const { W, H, D, dm, t } = d, iw = W - 2 * t, ih = H - 2 * t, hz = dm / 2;
  const dark = plastic('#101216', { roughness: 0.4 }), gold = metal('#d4a94a', { roughness: 0.35 });
  const parts = rig.parts;
  rig.parts.push({ id: 'back', group: rig.back, k: -1, z0: 0 });
  rig.parts.push({ id: 'front', group: rig.front, k: 1, z0: 0 });
  const mk = (id, k) => { const g = new THREE.Group(); g.visible = false; rig.internals.push(g); rig.core.add(g); const pt = { id, group: g, k, z0: 0 }; parts.push(pt); return pt.group; };

  // 中框：中空的外框，電路板和電池都放在裡面
  { const g = mk('frame', 0); const m = ringMesh(W, H, Math.min(d.r, W / 2, H / 2), t, dm, d.rim); g.add(m); rig.shell.push(m); }

  // 電池
  if (p.shape !== 'car') {
    const brick = p.shape === 'brick' || p.shape === 'radio', g = mk('battery', -0.62);
    const bw = iw * (brick ? 0.92 : 0.82), bh = ih * (brick ? 0.4 : 0.4), bt = dm * (brick ? 0.55 : 0.36), by = -ih * (brick ? 0.27 : 0.22);
    g.add(at(rbox(bw, bh, bt, plastic(smart ? '#c9ced6' : '#2c3036', { roughness: 0.45, metalness: smart ? 0.5 : 0.1 }), 0.005), 0, by, -hz + bt / 2));
    const lab = at(new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.7, bw * 0.7 * 96 / 256), new THREE.MeshBasicMaterial({ map: labelTex(rig.batteryLabel || (tier === 'analog' ? 'Ni-Cd' : tier === 'digital' ? 'Li-ion' : 'Li-Po'), smart ? '#222' : '#e9edf2', smart ? '#dfe3e8' : '#2c3036') })), 0, by, -hz + bt + 0.0008);
    g.add(lab);
    g.add(at(rbox(bw * 0.2, 0.012, bt * 0.5, gold, 0.002), bw * 0.25, by + bh / 2 + 0.006, -hz + bt * 0.5));
    if (p.id === 'iphone5s' || p.id === 'iphone12') [-0.25, 0.25].forEach((fx) => g.add(at(rbox(0.008, bh * 0.9, 0.002, plastic('#eceff3'), 0.001), bw * fx, by - 0.01, -hz + bt + 0.0015)));
  }

  // 主機板
  const bh = p.shape === 'car' ? ih * 0.8 : ih * 0.5, by = p.shape === 'car' ? 0 : ih * 0.22, bw = iw * 0.92, bt = Math.max(0.004, dm * 0.1), bz = hz * 0.15;
  {
    const g = mk('board', 0.28);
    g.add(at(rbox(bw, bh, bt, plastic(p.id === 'galaxy-s24' ? '#16202e' : '#1b6b4a', { roughness: 0.55 }), 0.003), 0, by, bz));
    const n = 7;
    for (let i = 0; i < n; i++) {
      const cw = bw * (0.1 + rnd(i) * 0.14), ch = bh * (0.08 + rnd(i + 9) * 0.12), cz = dm * 0.07 + rnd(i + 3) * dm * 0.06;
      const cx = (rnd(i + 20) - 0.5) * (bw - cw - 0.01), cy = by + (rnd(i + 31) - 0.5) * (bh - ch - 0.01);
      g.add(at(rbox(cw, ch, cz, i % 3 === 0 ? gold : dark, 0.002), cx, cy, bz + bt / 2 + cz / 2));
      rig.chipSpots = rig.chipSpots || [];
      if (i < 3) rig.chipSpots.push({ cx, cy, cw, ch, z: bz + bt / 2 + cz + 0.0015 });
    }
    for (let i = 0; i < 12; i++) g.add(at(rbox(bw * 0.035, 0.004, 0.002, gold, 0.001), -bw * 0.4 + i * bw * 0.073, by - bh / 2 + 0.006, bz + bt / 2 + 0.001));
  }
  // 屏蔽罩
  if (tier !== 'analog' && rig.chipSpots) {
    const g = mk('shield', 0.42);
    rig.chipSpots.forEach((c) => {
      g.add(at(rbox(c.cw * 1.15, c.ch * 1.15, 0.002, metal('#c8cdd4', { roughness: 0.4 }), 0.002), c.cx, c.cy, c.z));
      g.add(at(rbox(c.cw * 0.9, c.ch * 0.9, 0.0012, metal('#aeb4bc', { roughness: 0.3 }), 0.001), c.cx, c.cy, c.z + 0.0014));
    });
  }
  // 按鍵膠墊
  if (rig.pads.length) {
    const g = mk('membrane', 0.5);
    rig.pads.forEach((pd) => {
      g.add(at(rbox(pd.w * 1.12, pd.h * 1.1, 0.003, rubber('#aab3bd', { roughness: 0.7 }), 0.003), pd.cx, pd.cy, hz - 0.012));
      for (let i = 0; i < pd.cols * pd.rows; i++) {
        const cx = pd.cx - pd.w / 2 + ((i % pd.cols) + 0.5) * (pd.w / pd.cols), cy = pd.cy + pd.h / 2 - (Math.floor(i / pd.cols) + 0.5) * (pd.h / pd.rows);
        const dome = cyl(Math.min(pd.w / pd.cols, pd.h / pd.rows) * 0.26, Math.min(pd.w / pd.cols, pd.h / pd.rows) * 0.3, 0.005, rubber('#2a3038', { roughness: 0.6 }), 16);
        dome.rotation.x = Math.PI / 2; g.add(at(dome, cx, cy, hz - 0.0085));
      }
    });
  }
  // 螢幕模組
  if (rig.screen && rig.screen.mesh.parent === rig.front) {
    const sm = rig.screen.mesh, gp = sm.geometry.parameters, g = mk('display', 0.68);
    const th = Math.min(0.012, dm * 0.18);
    g.add(at(rbox(gp.width, gp.height, th, plastic('#0d0f14', { roughness: 0.3 }), 0.004), sm.position.x, sm.position.y, hz - th / 2 - 0.001));
    g.add(at(rbox(gp.width * 0.92, gp.height * 0.92, 0.0015, plastic('#26324a', { roughness: 0.2, metalness: 0.2 }), 0.002), sm.position.x, sm.position.y, hz + 0.0005 - 0.001));
    g.add(at(rbox(gp.width * 0.3, 0.05, 0.002, plastic('#c97b2a', { roughness: 0.5 }), 0.001), sm.position.x, sm.position.y - gp.height / 2 - 0.02, hz - th));
  }
  // 相機模組
  if (rig.cams.length) {
    const g = mk('camera', -0.46), ct = Math.min(0.016, dm * 0.5);
    rig.cams.forEach((c) => {
      g.add(at(rbox(c.r * 2.7, c.r * 2.7, ct, plastic('#1a1d22', { roughness: 0.4 }), 0.004), c.x, c.y, -hz + ct / 2));
      const b = at(cyl(c.r * 0.8, c.r * 0.8, ct * 0.7, metal('#555a62', { roughness: 0.3 })), c.x, c.y, -hz + ct * 0.35); b.rotation.x = Math.PI / 2; g.add(b);
    });
  }
  // 前感測器／前鏡頭
  if (smart && rig.screen && p.shape !== 'slider') {
    const g = mk('sensor', 0.8), sy = ih / 2 - 0.018, sx = p.id === 'iphone4' ? -0.075 : p.id === 'galaxy-note' ? -0.12 : 0;
    if (p.id === 'iphone12') { g.add(at(rbox(0.15, 0.022, 0.008, plastic('#14161b'), 0.004), 0, sy, hz - 0.006)); [-0.05, 0, 0.05].forEach((x) => { const c2 = at(cyl(0.006, 0.006, 0.01, metal('#4b5361')), x, sy, hz - 0.006); c2.rotation.x = Math.PI / 2; g.add(c2); }); }
    else if (p.id !== 'iphone') { const c2 = at(cyl(0.01, 0.01, 0.01, metal('#4b5361')), sx, sy, hz - 0.006); c2.rotation.x = Math.PI / 2; g.add(c2); }
    else g.add(at(rbox(0.04, 0.012, 0.006, dark, 0.003), 0, sy, hz - 0.005));
  }
  // 喇叭、麥克風（背負式電台的聽筒與麥克風在話筒裡，機身內沒有）
  if (p.shape !== 'radio') {
    const g = mk('audio', 0.14);
    g.add(at(rbox(0.07, 0.012, 0.008, metal('#7c828c'), 0.003), 0, ih / 2 - 0.02, hz * 0.4));
    g.add(at(rbox(iw * 0.3, 0.022, 0.012, dark, 0.004), iw * 0.22, -ih / 2 + 0.025, hz * 0.3));
    g.add(axisZ(at(cyl(0.007, 0.007, 0.008, metal('#8a909a')), -iw * 0.25, -ih / 2 + 0.022, hz * 0.3)));
  }
  // 震動馬達
  if (smart) {
    const g = mk('vib', 0.18);
    if (p.id === 'iphone12') g.add(at(rbox(0.13, 0.045, 0.014, metal('#6f7681'), 0.004), iw * 0.2, -ih * 0.35, hz * 0.2));
    else { const m = at(cyl(0.02, 0.02, 0.01, metal('#7a808a')), iw * 0.22, -ih * 0.34, hz * 0.2); m.rotation.x = Math.PI / 2; g.add(m); }
  }
  // 天線
  if (tier !== 'analog') {
    const g = mk('antenna', -0.34);
    g.add(at(rbox(iw * 0.7, 0.008, 0.0018, gold, 0.001), 0, ih / 2 - 0.012, -hz + 0.002));
    g.add(at(rbox(iw * 0.7, 0.008, 0.0018, gold, 0.001), 0, -ih / 2 + 0.012, -hz + 0.002));
    g.add(at(rbox(0.008, ih * 0.5, 0.0018, gold, 0.001), -iw / 2 + 0.012, ih * 0.1, -hz + 0.002));
  }
  // SIM 卡槽
  if (SIM_IDS.includes(p.id)) {
    const g = mk('sim', -0.24);
    g.add(at(rbox(0.03, 0.055, 0.003, metal('#b9bec6'), 0.001), iw / 2 - 0.022, ih * 0.1, 0));
    g.add(at(rbox(0.018, 0.024, 0.0015, gold, 0.001), iw / 2 - 0.022, ih * 0.1, 0.0022));
  }
  // 無線充電線圈
  if (modern) {
    const g = mk('coil', -0.82), R = Math.min(iw, ih) * 0.22;
    const tr = new THREE.Mesh(new THREE.TorusGeometry(R, 0.004, 8, 48), metal('#d9893a', { roughness: 0.35 })); tr.position.set(0, ih * 0.05, -hz + 0.004); g.add(tr);
    const tr2 = tr.clone(); tr2.scale.setScalar(0.72); g.add(tr2);
    if (p.id === 'iphone12') for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const m = rbox(0.018, 0.01, 0.003, metal('#4a4f58'), 0.001); m.position.set(Math.cos(a) * R * 1.3, ih * 0.05 + Math.sin(a) * R * 1.3, -hz + 0.004); m.rotation.z = a + Math.PI / 2; g.add(m); }
  }
  // 均熱板
  if (p.id === 'galaxy-s24') { const g = mk('heat', 0.54); g.add(at(rbox(iw * 0.6, ih * 0.38, 0.0025, metal('#c98a5a', { roughness: 0.35 }), 0.004), 0, ih * 0.2, hz - 0.016)); }
  // builder 另外交代的零件（S Pen）
  rig.queued.forEach((q) => { parts.push({ id: q.id, group: q.group, k: q.k, z0: 0 }); });

  // 登錄：邊界框、高亮框、標籤錨點、導引線
  rig.root.updateMatrixWorld(true);
  const gMat = new THREE.LineDashedMaterial({ color: '#7db4ff', dashSize: 0.025, gapSize: 0.018, transparent: true, opacity: 0 });
  rig.guideMat = gMat;
  const seen = new Set();
  parts.forEach((pt) => {
    const info = partInfo(pt.id, p, tier);
    pt.title = info[0]; pt.text = info[1]; pt.color = PART_COLORS[pt.id] || '#94a3b8';
    const box = new THREE.Box3().setFromObject(pt.group);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    const pad = 0.012;
    const hl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s.x + pad, s.y + pad, s.z + pad)), rig.hlMat);
    hl.position.copy(c).sub(pt.group.position); hl.visible = false; hl.userData.hl = true;
    pt.group.add(hl); pt.hl = hl;
    const a = new THREE.Object3D(); a.position.set(box.max.x - Math.min(0.02, s.x * 0.2), c.y + Math.min(0.03, s.y * 0.2), c.z);
    pt.group.add(a);
    rig.hot.push({ anchor: a, side: 0, title: pt.title, text: pt.text, needs: 'explode', part: pt });
    if (pt.id !== 'back' && pt.id !== 'front' && pt.id !== 'frame') {
      const key = c.x.toFixed(2) + c.y.toFixed(2);
      if (!seen.has(key)) {
        seen.add(key);
        const pos = new Float32Array([c.x, c.y, -rig.ex * 1.15, c.x, c.y, rig.ex * 1.15]);
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const line = new THREE.Line(geo, gMat); line.computeLineDistances(); rig.guides.add(line);
      }
    }
  });
  const axis = new THREE.BufferGeometry(); axis.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -rig.ex * 1.15, 0, 0, rig.ex * 1.15]), 3));
  const al = new THREE.Line(axis, gMat); al.computeLineDistances(); rig.guides.add(al);
  parts.sort((a, b) => a.k - b.k);
}

const BUILDERS = { brick, car, flip, clam, candybar, slider, phablet, touch: touchPhone, modern: touchPhone, radio, simon };

export function buildPhone(p) {
  const rig = new Rig(p);
  (BUILDERS[p.shape] || candybar)(rig, p);
  finishRig(rig);
  rig.update(0, 0);   // 套用預設狀態：靜止時只顯示一體成形的外觀，內部零件先藏起來
  return rig;
}
