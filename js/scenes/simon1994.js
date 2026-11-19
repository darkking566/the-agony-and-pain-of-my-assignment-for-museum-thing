// 沉浸場景：1994 年機場候機室，一位出差的商人用 IBM Simon 的觸控筆查行事曆、寫郵件。
// 字幕和解說文字在 js/data.js 的 scenes['ibm-simon']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, sign, Person, placeBetween } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { richRoom, windowView, leafyPlant, blobShadow, vendingMachine, ceilingLights } from './props.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };

// 螢幕上的圖示位置（設計座標 320×240），同時也是觸控筆點的位置
const ICONS = [
  { name: '行事曆', x: 62, y: 70, ox: -0.03, oy: 0.05 },
  { name: '通訊錄', x: 160, y: 70, ox: 0, oy: 0.05 },
  { name: '郵件', x: 258, y: 70, ox: 0.03, oy: 0.05 },
  { name: '傳真', x: 62, y: 170, ox: -0.03, oy: 0.0 },
  { name: '待辦', x: 160, y: 170, ox: 0, oy: 0.0 },
  { name: '記事', x: 258, y: 170, ox: 0.03, oy: 0.0 }
];
const CAL = ICONS[0], MAIL = ICONS[2];

export function build({ scene, phone }) {
  /* ---------- 光線與候機室 ---------- */
  scene.background = new THREE.Color('#1c2230');
  scene.add(new THREE.HemisphereLight('#f4f0e6', '#5a5a64', 1.5));
  const sun = new THREE.DirectionalLight('#fff0d8', 2.0);
  sun.position.set(-9, 9, 6);
  sun.target.position.set(0, 0, -2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  const RW = 12, RD = 9, RH = 3.6;
  richRoom(scene, {
    w: RW, d: RD, h: RH,
    floor: { kind: 'parquet', color: '#8a8478', size: 2, rough: 0.5 },
    wall: { kind: 'plaster', color: '#d4d8dc', size: 3 },
    wallBack: { kind: 'plaster', color: '#c9ced3', size: 3 },
    wallRight: { kind: 'plaster', color: '#d4d8dc', size: 3 },
    ceil: { kind: 'ceil', color: '#e8e8e4', size: 1.8 },
    base: '#2d3038', crown: '#e8e8e4'
  });
  // 左牆的大片窗：窗外是停機坪
  windowView(scene, { pos: V(-RW / 2 + 0.11, 1.5, 0.4), yaw: Math.PI / 2, w: 4.2, h: 2.0, view: 'city', frame: '#3a3f47' });

  // 候機室的座椅、櫃台、柱子與盆栽
  const seatMat = '#4a5a72';
  [[2.4, -2.9], [3.8, -2.9], [2.4, -1.6], [3.8, -1.6]].forEach(([x, z]) => {
    const seat = box(0.9, 0.12, 0.7, seatMat); seat.position.set(x, 0.45, z); scene.add(seat);
    const back = box(0.9, 0.5, 0.1, seatMat); back.position.set(x, 0.75, z - 0.3); scene.add(back);
    const legs = box(0.8, 0.4, 0.6, '#3a3f47'); legs.position.set(x, 0.2, z); scene.add(legs);
  });
  const counter = box(2.6, 1.0, 0.7, '#5a4a3c'); counter.position.set(-3.6, 0.5, -3.6); scene.add(counter);
  const counterTop = box(2.7, 0.05, 0.8, '#d8cdbb'); counterTop.position.set(-3.6, 1.02, -3.6); scene.add(counterTop);
  const pillar = cyl(0.3, 0.3, RH, '#e2ddd0', 16); pillar.position.set(1.2, RH / 2, -0.4); scene.add(pillar);
  leafyPlant(scene, -4.6, 1.6, 1.0, 2);
  leafyPlant(scene, 4.8, 3.0, 1.1, 1);
  /* ---------- 機場的其他陳設 ---------- */
  // 後牆上的出發看板
  const boardFrame = box(3.4, 1.5, 0.08, '#1d1f23'); boardFrame.position.set(-1.0, 2.3, -RD / 2 + 0.2); scene.add(boardFrame);
  const rows = [['TPE 14:20', 'ON TIME'], ['HKG 15:05', 'GATE 7'], ['NRT 16:40', 'DELAY']];
  rows.forEach(([a, b], i) => {
    const t = sign(`${a}   ${b}`, 3.1, 0.3, { bg: '#111318', color: '#ffb84a', size: 60, w: 1024, h: 110, weight: 800, font: 'monospace' });
    t.position.set(-1.0, 2.62 - i * 0.36, -RD / 2 + 0.25); scene.add(t);
  });
  const dHead = sign('DEPARTURES', 3.1, 0.3, { bg: '#2a4a7a', color: '#ffffff', size: 70, w: 1024, h: 110, weight: 900 });
  dHead.position.set(-1.0, 3.0, -RD / 2 + 0.25); scene.add(dHead);
  // 自動販賣機與行李車
  vendingMachine(scene, 4.6, -3.9, 0, 2);
  const cart = box(0.9, 0.9, 0.55, '#8a7a5a'); cart.position.set(-4.4, 0.45, -1.2); scene.add(cart);
  const cartTop = box(0.9, 0.05, 0.55, '#6b5c44'); cartTop.position.set(-4.4, 0.92, -1.2); scene.add(cartTop);
  [[-0.35, 0.22], [0.35, 0.22]].forEach(([x, z]) => {
    const wheel = cyl(0.07, 0.07, 0.04, '#1d1d1f', 10); wheel.rotation.x = Math.PI / 2; wheel.position.set(-4.4 + x, 0.07, -1.2 + z); scene.add(wheel);
  });
  // 天花板的燈
  ceilingLights(scene, [-3, 0, 3], [-2.2, 1.2], RH - 0.1, 1.0, 0.25, '#fff6e0');

  /* ---------- 第三輪：行李、登機門指示、走道的地毯 ---------- */
  // 座椅旁的行李（小行李箱與背包）
  [[2.3, -2.9, 0.5, '#2e3a4a'], [2.9, -1.4, 0.4, '#7a2e2e'], [4.2, -2.3, 0.45, '#3a3a3a']].forEach(([x, z, h, c]) => {
    const bag = box(0.45, h, 0.28, c); bag.position.set(x, h / 2, z); scene.add(bag);
    const handle = box(0.2, 0.02, 0.02, '#1a1a1a'); handle.position.set(x, h + 0.02, z); scene.add(handle);
  });
  // 登機門指示牌（天花板下，指向右邊）
  const gate = sign('GATE 7  →', 1.6, 0.4, { bg: '#1d3a6a', color: '#ffffff', size: 84, w: 512, h: 128, weight: 800 });
  gate.position.set(3.4, 2.7, -RD / 2 + 0.25); scene.add(gate);
  // 地面上的導引線（黃色的線指向登機門）
  for (let i = 0; i < 6; i++) {
    const line = box(0.5, 0.01, 0.12, '#e8b830'); line.position.set(-1.5 + i * 0.7, 0.01, 3.2); scene.add(line);
  }
  /* ---------- 第二輪：安檢門、咖啡櫃檯、海報 ---------- */
  // 安檢門：兩根柱子加上頂部的橫板
  [[5.3, 0.0], [5.3, 1.6]].forEach(([x, z]) => {
    const post = box(0.12, 2.2, 0.12, '#c9ced3', { metalness: 0.5, roughness: 0.4 }); post.position.set(x, 1.1, z); scene.add(post);
  });
  const archTop = box(0.12, 0.25, 1.9, '#c9ced3', { metalness: 0.5, roughness: 0.4 }); archTop.position.set(5.3, 2.25, 0.8); scene.add(archTop);
  const arch = sign('SECURITY', 0.7, 0.2, { bg: '#1d3a6a', color: '#ffffff', size: 60, w: 512, h: 128, weight: 800 });
  arch.position.set(5.36, 2.25, 0.8); arch.rotation.y = -Math.PI / 2; scene.add(arch);
  // 咖啡櫃檯：櫃子、招牌、咖啡壺
  const cafeCounter = box(1.8, 1.0, 0.7, '#5a3f2b'); cafeCounter.position.set(-4.2, 0.5, 1.8); scene.add(cafeCounter);
  const cafeTop = box(1.9, 0.05, 0.8, '#d8cdbb'); cafeTop.position.set(-4.2, 1.02, 1.8); scene.add(cafeTop);
  const cafeSign = sign('COFFEE & NEWS', 1.6, 0.4, { bg: '#2b2f36', color: '#f3ead6', size: 68, w: 1024, h: 256, weight: 700 });
  cafeSign.position.set(-4.2, 1.8, 2.19); scene.add(cafeSign);
  const pot = cyl(0.08, 0.06, 0.28, '#3b3f45', 12); pot.position.set(-4.6, 1.2, 1.8); scene.add(pot);
  // 右牆的旅遊海報（三張）
  [[-2.6, '目的地：東京', '#2a6a8a'], [-0.4, '夏日海島', '#c98a3a'], [1.8, '歡迎登機', '#7a3a5a']].forEach(([z, text, bg]) => {
    const frame = box(0.04, 1.3, 1.0, '#2a2a2e'); frame.position.set(RW / 2 - 0.05, 1.8, z); scene.add(frame);
    const poster = sign(text, 0.9, 1.2, { bg, color: '#ffffff', size: 80, w: 256, h: 340, weight: 800 });
    poster.position.set(RW / 2 - 0.09, 1.8, z); poster.rotation.y = -Math.PI / 2; scene.add(poster);
  });
  // 一張站立用的高桌，商人就站在桌邊
  const TABLE = V(-0.4, 0, 0.9);
  const hop = cyl(0.42, 0.42, 0.05, '#c8bca4', 20); hop.position.set(TABLE.x, 1.08, TABLE.z); scene.add(hop);
  const hpole = cyl(0.05, 0.05, 1.04, '#4a4f55', 8); hpole.position.set(TABLE.x, 0.54, TABLE.z); scene.add(hpole);
  const hbase = cyl(0.3, 0.32, 0.04, '#4a4f55', 20); hbase.position.set(TABLE.x, 0.02, TABLE.z); scene.add(hbase);

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const man = add(new Person({ top: '#5a6068', bottom: '#2e3138', hair: '#3a3028', skin: '#e0b494', height: 1.0 }));
  {
    const tie = box(0.05, 0.28, 0.012, '#2a3a5a'); tie.position.set(0, 0.42, 0.13); man.torso.add(tie);
    const briefcase = box(0.1, 0.3, 0.38, '#3a2a1c'); briefcase.position.set(0.28, -0.25, 0.02); man.torso.add(briefcase);
  }
  // 櫃台後的接待人員，與走過的路人
  const clerk = add(new Person({ top: '#7a3b3b', bottom: '#2a2a2e', hair: '#222', skin: '#c68e63', height: 1.0 }));
  const walker = add(new Person({ top: '#3c5c7c', bottom: '#4a4a52', dress: true, hair: '#5a3a22', skin: '#edc6a2', height: 0.95 }));
  // 背景的旅客：一位來回走動、一位站著看報紙
  const pax = add(new Person({ top: '#6a4a7a', bottom: '#2e2e36', hair: '#2a2018', skin: '#c99a72', height: 1.0 }));
  const pax2 = add(new Person({ top: '#d6cbb5', bottom: '#4a3f35', hair: '#888', skin: '#e0b494', height: 0.98 }));
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const MAN_SPOT = V(-0.4, 0, 1.45);

  /* ---------- 觸控筆（拿在左手） ---------- */
  const stylus = new THREE.Group();
  {
    const shaft = cyl(0.012, 0.008, 0.3, '#1d1f23', 8); shaft.position.y = 0.12;
    const tip = cyl(0.004, 0.012, 0.03, '#b8bcc4', 8); tip.position.y = -0.02;
    stylus.add(shaft, tip);
  }
  man.arms.L.grip.add(stylus);
  stylus.position.set(0, -0.02, 0.02);
  stylus.rotation.set(0.5, 0, 0.3);

  /* ---------- 手上的 Simon ---------- */
  const simon = new THREE.Group();
  {
    const m = buildPhone(phone);
    const b = new THREE.Box3().setFromObject(m);
    const c = b.getCenter(V());
    const s = new THREE.Vector3(); b.getSize(s);
    m.position.sub(c);
    const inner = new THREE.Group();
    inner.add(m);
    inner.scale.setScalar(0.28 / Math.max(s.x, s.y, s.z));   // 最長邊約 28 公分
    inner.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    simon.add(inner);
  }
  scene.add(simon);
  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.1, 0.06);
  man.arms.R.grip.add(handHold);
  const chest = new THREE.Object3D();
  chest.rotation.set(0.55, Math.PI, 0);
  chest.position.set(-0.08, 1.3, 0.36);   // 胸前的位置（相對於身體）
  man.root.add(chest);
  const anchors = { chest, hand: handHold };
  const gripOf = {
    chest: () => chest.localToWorld(V(0, -0.14, -0.04)),
    hand: () => man.local(-0.3, 0.84, 0.08)
  };
  const poleOf = {
    chest: () => man.local(-0.6, 0.85, 0.1),
    hand: () => man.local(-0.5, 0.6, -0.1)
  };
  let pose = { from: 'hand', to: 'hand', k: 0 };
  function setSimon(from, to, k) {
    pose = { from, to, k };
    if (from === 'hand' && to === 'hand') { man.reach.R = null; return; }
    man.reach.R = {
      target: () => gripOf[from]().lerp(gripOf[to](), k),
      pole: () => poleOf[from]().lerp(poleOf[to](), k)
    };
  }
  function placeSimon() {
    const { from, to, k } = pose;
    if (from === 'hand') placeBetween(simon, handHold, anchors[to], span(k, 0.6, 1));
    else if (to === 'hand') placeBetween(simon, anchors[from], handHold, span(k, 0, 0.4));
    else placeBetween(simon, anchors[from], anchors[to], k);
  }

  // 左手的觸控筆點在螢幕的某個位置（amt 0→1 表示伸過去的程度）
  function stylusTo(ox, oy, amt) {
    if (amt <= 0) { man.reach.L = null; return; }
    man.reach.L = {
      target: () => man.local(0.3, 0.84, 0.08).lerp(chest.localToWorld(V(-ox, oy, 0.03)), amt),   // 機身的左右方向與螢幕相反，所以取反
      pole: () => man.local(0.7, 0.7, 0.1)
    };
  }

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };

  /* ---------- 劇本 ---------- */
  const beats = {
    // 商人推著行李，手上拿著 Simon 走過候機室
    lobby: {
      duration: 8,
      update(t, T) {
        man.reset();
        man.walk(V(-7, 0, 1.45), MAN_SPOT, t, 0, 5);
        if (t > 5) man.yaw = lerp(Math.PI / 2, 0.2, span(t, 5, 6));
        setSimon('hand', 'hand', 0);
        stylusTo(0, 0, 0);
        idle(man, T);
        clerk.reset(); clerk.pos.set(-3.6, 0, -2.6); clerk.yaw = 0; idle(clerk, T, 2);
        walker.reset(); walker.walk(V(7, 0, 2.6), V(-6, 0, 2.6), t, 1, 8);
        walker.yaw = -Math.PI / 2;
      }
    },
    // 站定，抽出觸控筆，點開行事曆
    touch: {
      duration: 9,
      update(t, T) {
        man.reset(); man.pos.copy(MAN_SPOT); man.yaw = 0.2;
        setSimon('hand', 'chest', span(t, 0.4, 1.6));
        if (t >= 1.6) setSimon('chest', 'chest', 0);
        // 先把觸控筆拿出來，再點一下行事曆
        const pick = span(t, 1.2, 2.0) * (1 - span(t, 2.4, 2.6));
        const tap = span(t, 2.4, 2.8) * (1 - span(t, 3.0, 3.4));
        stylusTo(CAL.ox, CAL.oy, tap > 0 ? tap : pick * 0.25);
        idle(man, T);
        clerk.reset(); clerk.pos.set(-3.6, 0, -2.6); clerk.yaw = 0; idle(clerk, T, 2);
        walker.reset(); walker.pos.set(30, 0, 2.6);   // 路人已經走遠，不在畫面內
      }
    },
    // 寫一封短郵件，按下傳送
    send: {
      duration: 8,
      update(t, T) {
        man.reset(); man.pos.copy(MAN_SPOT); man.yaw = 0.2;
        setSimon('chest', 'chest', 0);
        const tap = span(t, 3.0, 3.4) * (1 - span(t, 3.8, 4.2));
        stylusTo(MAIL.ox, MAIL.oy, tap);
        idle(man, T);
        clerk.reset(); clerk.pos.set(-3.6, 0, -2.6); clerk.yaw = 0; idle(clerk, T, 2);
        walker.reset(); walker.pos.set(30, 0, 2.6);
      }
    }
  };

  /* ---------- 每一格 ---------- */
  // 背景的旅客：一位從左到右慢慢走過，另一位站著看報紙、身體微微移動
  function ambient(T) {
    const L = 14, d = (T * 0.7) % L;
    pax.reset();
    pax.pos.set(-7 + d, 0, 2.6);
    pax.yaw = Math.PI / 2;
    pax.walkAmt = 1; pax.walkPhase = d * 4.4;
    pax2.reset();
    pax2.pos.set(2.4, 0, 2.2);
    pax2.yaw = -0.5;
    pax2.lean = 0.05;
    pax2.reach.L = { target: () => pax2.local(0.3, 0.9, 0.2), pole: () => pax2.local(0.6, 0.6, 0.2) };
    pax2.reach.R = { target: () => pax2.local(0.3, 0.8, 0.25), pole: () => pax2.local(0.6, 0.6, 0.2) };
    idle(pax2, T, 4);
  }
  function finish() {
    people.forEach((p) => p.apply());
    placeSimon();
  }

  /* ---------- 螢幕特寫 ---------- */
  // 主畫面：六個圖示，行事曆被點到時變成月曆
  function homeInset(c, W, H, t) {
    const k = W / 320; c.scale(k, k);
    const h = H / k;
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b2a3d'); g.addColorStop(1, '#0c1420');
    c.fillStyle = g; c.fillRect(0, 0, 320, h);
    c.fillStyle = '#cbd5e1'; c.font = `700 14px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('IBM Simon', 160, 18);
    ICONS.forEach((ic) => {
      c.fillStyle = '#2f4a6a'; rr(c, ic.x - 30, ic.y - 26, 60, 52, 10); c.fill();
      c.fillStyle = '#e2e8f0'; c.font = `600 13px ${FONT}`; c.fillText(ic.name, ic.x, ic.y + 40);
    });
    const opened = t > 2.9;
    if (opened && t < 4.8) {
      // 行事曆打開：月曆格子
      c.fillStyle = '#f8fafc'; c.fillRect(0, 0, 320, h);
      c.fillStyle = '#1e3a5f'; c.font = `800 16px ${FONT}`; c.fillText('行事曆・今天', 160, 22);
      c.font = `600 13px ${FONT}`; c.fillStyle = '#334155';
      for (let r = 0; r < 4; r++) for (let col = 0; col < 7; col++) {
        const n = r * 7 + col + 1;
        c.fillText(String(n), 30 + col * 42, 60 + r * 36);
      }
      c.fillStyle = 'rgba(59,130,246,.85)'; c.beginPath(); c.arc(30 + 3 * 42, 60 + 1 * 36, 13, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.fillText('14', 30 + 3 * 42, 60 + 1 * 36);
    }
    // 觸控筆的點按效果
    const tp = span(t, 2.4, 2.9) * (1 - span(t, 3.1, 3.5));
    if (tp > 0) {
      c.strokeStyle = `rgba(96,165,250,${tp})`; c.lineWidth = 4;
      c.beginPath(); c.arc(CAL.x, CAL.y, 12 + 22 * (1 - tp), 0, 7); c.stroke();
    }
  }
  // 電子郵件：寫字、傳送、顯示已送出
  function mailInset(c, W, H, t) {
    const k = W / 320; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#f8fafc'; c.fillRect(0, 0, 320, h);
    c.fillStyle = '#1e3a5f'; c.fillRect(0, 0, 320, 30);
    c.fillStyle = '#fff'; c.font = `700 14px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('新郵件', 10, 15);
    c.fillStyle = '#64748b'; c.font = `500 12px ${FONT}`;
    c.fillText('收件人：辦公室', 12, 50);
    c.fillStyle = '#0f172a'; c.font = `600 15px ${FONT}`;
    const msg = '明天會議移到下午三點';
    const n = clamp(Math.floor((t - 0.6) * 7), 0, msg.length);
    c.fillText(msg.slice(0, n) + (n < msg.length && Math.floor(t * 3) % 2 ? '|' : ''), 12, 92);
    // 傳送的進度條
    const p = span(t, 3.4, 5.2);
    c.fillStyle = '#e2e8f0'; rr(c, 12, 150, 296, 12, 6); c.fill();
    c.fillStyle = '#3b82f6'; rr(c, 12, 150, 296 * p, 12, 6); c.fill();
    c.fillStyle = '#334155'; c.font = `500 12px ${FONT}`;
    c.fillText(p >= 1 ? '已送出' : '傳送中…', 12, 180);
    if (p >= 1) {
      c.fillStyle = '#16a34a'; c.font = `800 16px ${FONT}`; c.textAlign = 'center';
      c.fillText('✓ 已送出', 160, 212);
    }
  }

  return {
    view: { pos: V(0, 1.55, 3.4), yaw: 0, pitch: -0.05 },
    beats,
    ambient,
    finish,
    insets: {
      touch: { aspect: 1.35, tone: 'lcd', label: 'Simon 螢幕', draw: (c, W, H, t) => homeInset(c, W, H, t) },
      send: { aspect: 1.35, tone: 'lcd', label: 'Simon 螢幕', draw: (c, W, H, t) => mailInset(c, W, H, t) }
    },
    focus: {
      lobby: () => V(0, 1.4, 0),
      man: () => head(man),
      simon: () => simon.getWorldPosition(V()),
      screen: () => chest.localToWorld(V(0, 0, 0.03))
    },
    hotspots: {
      simon: { pos: () => simon.localToWorld(V(0, 0.1, 0)), size: 0.45 },
      stylus: { pos: () => stylus.getWorldPosition(V()).add(V(0, 0.12, 0)), size: 0.3 },
      screen: { pos: () => chest.localToWorld(V(0, 0.07, 0.04)), size: 0.32 },
      battery: { pos: () => simon.localToWorld(V(0, -0.12, 0)), size: 0.3 }
    }
  };
}
