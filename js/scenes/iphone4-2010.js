// 沉浸場景：2010 年夏天的晚上，一位年輕人在客廳用 iPhone 4 的 FaceTime 跟遠方的家人視訊。
// 字幕和解說文字在 js/data.js 的 scenes['iphone4']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, Person, placeBetween } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { richRoom, windowView, leafyPlant, framedPicture, blobShadow, ceilingLights, doorway, pendantLamp } from './props.js';
import { sofa, patternRug, bookcase, kitchenRun, fridge, chair, tvSet, wallClock, tableLamp, armchair, indoorTree, ceilingFan } from './props2.js';

const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };

export function build({ scene, phone }) {
  /* ---------- 夜晚的客廳光線 ---------- */
  scene.background = new THREE.Color('#1a1f2e');
  scene.add(new THREE.HemisphereLight('#c7d2ff', '#4a3a2a', 0.9));
  const warm = new THREE.PointLight('#ffc57a', 2.2, 9, 1.6);
  warm.position.set(-1.5, 2.4, -1.0);
  scene.add(warm);
  const screenGlow = new THREE.PointLight('#8fc8ff', 0.6, 3, 2);
  screenGlow.position.set(0.8, 1.4, 0.6);
  scene.add(screenGlow);

  const RW = 9, RD = 8, RH = 3.2;
  richRoom(scene, {
    w: RW, d: RD, h: RH,
    floor: { kind: 'parquet', color: '#6b4a30', size: 2, rough: 0.5 },
    wall: { kind: 'plaster', color: '#d8cbb4', size: 3 },
    wallBack: { kind: 'plaster', color: '#cfc0a6', size: 3 },
    wallRight: { kind: 'plaster', color: '#d8cbb4', size: 3 },
    ceil: { kind: 'ceil', color: '#e6dccb', size: 1.8 },
    base: '#3b2a1c', crown: '#e6dccb'
  });
  // 左牆的窗：窗外是夜晚的城市
  windowView(scene, { pos: V(-RW / 2 + 0.11, 1.6, -0.6), yaw: Math.PI / 2, w: 2.6, h: 1.8, view: 'city', frame: '#3b2f27', curtain: '#8a6a4a' });
  // 天花板的燈
  ceilingLights(scene, [-1.5, 1.5], [-1.0], RH - 0.1, 0.9, 0.2, '#ffe2a8');

  /* ---------- 沙發、茶几、盆栽、掛畫 ---------- */
  sofa(scene, -2.6, -2.45, 0, { w: 2.8, color: '#4a5a6a', pillows: ['#d9a441', '#6a8a6a'] });
  const table = box(1.4, 0.06, 0.7, '#6b4a30'); table.position.set(-0.4, 0.5, -1.7); scene.add(table);
  const tableShelf = box(1.3, 0.03, 0.6, '#5a3d26'); tableShelf.position.set(-0.4, 0.14, -1.7); scene.add(tableShelf);
  [[-0.65, -0.3], [-0.15, -0.3], [-0.65, 0.3], [-0.15, 0.3]].forEach(([x, z]) => {
    const leg = box(0.05, 0.5, 0.05, '#4a3420'); leg.position.set(-0.4 + x, 0.25, -1.7 + z); scene.add(leg);
  });
  // 沙發旁的邊几與檯燈
  const side = box(0.45, 0.55, 0.45, '#5a3d26'); side.position.set(-4.3, 0.275, -2.5); scene.add(side);
  tableLamp(scene, -4.3, 0.55, -2.5, { shade: '#efe3c4' });
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), new THREE.MeshStandardMaterial({ color: '#f2efe8' }));
  mug.position.set(-0.8, 0.58, -1.6); scene.add(mug);
  indoorTree(scene, 3.7, -3.3, { h: 2.1, seed: 5, pot: '#8a5a3a' });
  armchair(scene, 0.95, -1.7, -Math.PI / 2, { color: '#7a5a3a' });
  ceilingFan(scene, 0, RH, 0.6);
  framedPicture(scene, -0.8, 1.9, -RD / 2 + 0.17, 0, 0.9, 0.7, 2);

  /* ---------- 客廳的其他陳設 ---------- */
  // 右牆的書櫃，書脊是各種顏色的小方塊
  bookcase(scene, RW / 2 - 0.27, -0.8, -Math.PI / 2, { w: 2.2, h: 2.0, d: 0.34, color: '#5a4030', shelves: 4, seed: 3 });
  // 電視（關著，螢幕微微反光）與矮櫃
  const tvStand = box(1.6, 0.4, 0.45, '#2e2a26'); tvStand.position.set(2.6, 0.2, -RD / 2 + 0.5); scene.add(tvStand);
  const tvDoors = box(1.5, 0.3, 0.02, '#3a342e'); tvDoors.position.set(2.6, 0.2, -RD / 2 + 0.735); scene.add(tvDoors);
  tvSet(scene, 2.6, 0.4, -RD / 2 + 0.45, 0, { w: 1.2 });
  // 地毯與落地燈
  patternRug(scene, -1.6, -1.4, 3.2, 2.2, { base: '#7a3b3b', border: '#d8c39a', accent: '#2f3f5a', seed: 5 });
  const lampPole = box(0.05, 1.5, 0.05, '#3a3a3e'); lampPole.position.set(-3.6, 0.75, 0.9); scene.add(lampPole);
  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.32, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#f2e6c8', emissive: '#ffd58a', emissiveIntensity: 0.6, side: THREE.DoubleSide }));
  lampShade.position.set(-3.6, 1.6, 0.9); scene.add(lampShade);
  // 後方的廚房：流理台、冰箱、爐子、牆上的小掛鐘
  kitchenRun(scene, -3.65, -RD / 2 + 0.1, 2.5, { cab: '#e8e2d4', top: '#3a3a40', sinkAt: 0.25, stoveAt: 0.74 });
  const hood = box(0.8, 0.3, 0.5, '#c9ced3', { roughness: 0.3, metalness: 0.5 }); hood.position.set(-1.8, 2.45, -RD / 2 + 0.35); scene.add(hood);
  fridge(scene, -4.05, -RD / 2 + 0.45, 0);
  wallClock(scene, 1.2, 2.45, -RD / 2 + 0.12, 0, { r: 0.2 });
  // 餐桌與吊燈（客廳和廚房之間）
  const dtable = box(1.4, 0.06, 0.9, '#6b4a30'); dtable.position.set(-4.0, 0.76, 1.6); scene.add(dtable);
  [[-0.6, -0.36], [0.6, -0.36], [-0.6, 0.36], [0.6, 0.36]].forEach(([x, z]) => {
    const leg = box(0.06, 0.74, 0.06, '#4a3420'); leg.position.set(-4.0 + x, 0.37, 1.6 + z); scene.add(leg);
  });
  [-0.4, 0.4].forEach((x) => chair(scene, -4.0 + x, 2.3, Math.PI, { color: '#7a5a3a' }));
  chair(scene, -4.0, 0.9, 0, { color: '#7a5a3a' });
  pendantLamp(scene, -4.0, RH, 1.6, { drop: 1.0, shade: '#2a2a30', r: 0.3 });
  // 餐桌上的碗盤與水瓶
  [-0.35, 0.35].forEach((dx) => { const pl = cyl(0.11, 0.09, 0.02, '#f4f2ec', 18); pl.position.set(-4.0 + dx, 0.8, 1.6); scene.add(pl); });
  const jug = cyl(0.06, 0.07, 0.22, '#cfe3ea', 14); jug.material = new THREE.MeshStandardMaterial({ color: '#cfe3ea', transparent: true, opacity: 0.6, roughness: 0.1 }); jug.position.set(-4.0, 0.9, 1.55); scene.add(jug);
  // 沙發的靠墊與茶几上的書
  [['#8a2a2a', 0], ['#2a5a8a', 0.04], ['#d9b84a', 0.08]].forEach(([c, dy]) => {
    const bk = box(0.3, 0.05, 0.22, c); bk.position.set(-0.3, 0.6 + dy, -1.5); scene.add(bk);
  });
  // 書櫃上方的兩幅相框、電視櫃上的花瓶與小植物
  framedPicture(scene, RW / 2 - 0.1, 2.5, -1.0, -Math.PI / 2, 0.6, 0.45, 5);
  framedPicture(scene, RW / 2 - 0.1, 2.5, 0.0, -Math.PI / 2, 0.5, 0.6, 7);
  const vase = cyl(0.07, 0.11, 0.3, '#9bbfd6', 14); vase.position.set(1.9, 1.0, -RD / 2 + 0.6); scene.add(vase);
  [[0, 1.3, 0], [0.05, 1.42, 0.02], [-0.04, 1.4, -0.03]].forEach(([dx, y, dz]) => {
    const stem = box(0.012, 0.22, 0.012, '#3f6b3a'); stem.position.set(1.9 + dx, y - 0.1, -RD / 2 + 0.6 + dz); scene.add(stem);
  });
  const flowerTop = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshStandardMaterial({ color: '#f1c40f' }));
  flowerTop.position.set(1.9, 1.43, -RD / 2 + 0.6); scene.add(flowerTop);
  // 右牆的房門（書櫃和前牆之間）
  doorway(scene, { pos: V(RW / 2 - 0.1, 0, 1.7), yaw: -Math.PI / 2, w: 0.9, h: 2.1, color: '#7a5a3e' });

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const user = add(new Person({ top: '#5a5f66', bottom: '#2e3138', hair: '#2a2018', skin: '#e0b494', height: 1.0 }));
  // 背景的家人：在廚房門口附近，手上拿著一杯水，偶爾走動
  const family = add(new Person({ top: '#8a4b4b', bottom: '#2e2e36', dress: true, hair: '#4a3020', skin: '#e0b494', height: 0.94 }));
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const USER_SPOT = V(0.2, 0, -0.2);

  /* ---------- 手機（iPhone 4） ---------- */
  const iph = buildPhone(phone);
  const iphOuter = new THREE.Group();
  {
    const b = new THREE.Box3().setFromObject(iph);
    const s = new THREE.Vector3(); b.getSize(s);
    const c = b.getCenter(V());
    iph.position.sub(c);
    const sc = new THREE.Group();
    sc.add(iph);
    sc.scale.setScalar(0.17 / Math.max(s.x, s.y, s.z));
    sc.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    iphOuter.add(sc);
  }
  scene.add(iphOuter);
  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.1, 0.06);
  user.arms.R.grip.add(handHold);
  const chest = new THREE.Object3D();
  chest.rotation.set(0.55, Math.PI, 0);
  chest.position.set(-0.08, 1.3, 0.36);
  user.root.add(chest);
  const anchors = { chest, hand: handHold };
  const gripOf = {
    chest: () => chest.localToWorld(V(0, -0.14, -0.04)),
    hand: () => user.local(-0.3, 0.84, 0.08)
  };
  const poleOf = {
    chest: () => user.local(-0.6, 0.85, 0.1),
    hand: () => user.local(-0.5, 0.6, -0.1)
  };
  let pose = { from: 'hand', to: 'hand', k: 0 };
  function setPhone(from, to, k) {
    pose = { from, to, k };
    if (from === 'hand' && to === 'hand') { user.reach.R = null; return; }
    user.reach.R = {
      target: () => gripOf[from]().lerp(gripOf[to](), k),
      pole: () => poleOf[from]().lerp(poleOf[to](), k)
    };
  }
  function placePhone() {
    const { from, to, k } = pose;
    if (from === 'hand') placeBetween(iphOuter, handHold, anchors[to], span(k, 0.6, 1));
    else if (to === 'hand') placeBetween(iphOuter, anchors[from], handHold, span(k, 0, 0.4));
    else placeBetween(iphOuter, anchors[from], anchors[to], k);
  }

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };

  /* ---------- 劇本 ---------- */
  const beats = {
    // 年輕人從走廊走進客廳，手上拿著剛買的 iPhone 4
    arrive: {
      duration: 8,
      update(t, T) {
        user.reset();
        user.walk(V(4.0, 0, 0.6), USER_SPOT, t, 0, 5);
        if (t > 5) user.yaw = lerp(Math.PI / 2 + Math.PI, 0.4, span(t, 5, 6));
        setPhone('hand', 'hand', 0);
        idle(user, T);
      }
    },
    // 按下 FaceTime，螢幕上出現遠方家人的臉
    call: {
      duration: 9,
      update(t, T) {
        user.reset(); user.pos.copy(USER_SPOT); user.yaw = 0.4;
        setPhone('hand', 'chest', span(t, 0.4, 1.6));
        if (t >= 1.6) setPhone('chest', 'chest', 0);
        user.look = iphOuter.getWorldPosition(V()); user.lookAmt = 0.5;
        idle(user, T);
      }
    },
    // 把手機舉高，讓對方看見這個房間
    talk: {
      duration: 8,
      update(t, T) {
        user.reset(); user.pos.copy(USER_SPOT); user.yaw = 0.4;
        setPhone('chest', 'chest', 0);
        const lift = span(t, 0.8, 2.6);
        user.bob = lift * 0.012 * Math.sin(T * 2);
        user.headTilt = Math.sin(T * 1.4) * 0.03;
        user.look = iphOuter.getWorldPosition(V()); user.lookAmt = 0.6;
        idle(user, T, 1);
      }
    }
  };

  // 背景的家人：在客廳另一端慢慢走動，偶爾停下來看看窗外
  function ambient(T) {
    const L = 6, d = (T * 0.25) % L;
    family.reset();
    family.pos.set(0.9 + Math.sin(d / L * Math.PI * 2) * 0.6, 0, -2.6 + Math.cos(d / L * Math.PI * 2) * 0.15);
    family.yaw = Math.cos(d / L * Math.PI * 2) > 0 ? Math.PI / 2 : -Math.PI / 2;
    family.walkAmt = 0.9; family.walkPhase = d * 4.4;
    family.look = V(-3.6, 1.5, -0.6); family.lookAmt = 0.6;
  }
  function finish() {
    people.forEach((p) => p.apply());
    placePhone();
  }

  /* ---------- 螢幕特寫：FaceTime 通話畫面 ---------- */
  // 對方的畫面：柔和的暖色背景與一個抽象的人形（不寫實，避免像真人）
  function faceTile(c, x, y, w, h, t) {
    c.save(); rr(c, x, y, w, h, 14); c.clip();
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#e8c9a0'); g.addColorStop(1, '#8a6a52');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#4a3428';
    c.beginPath(); c.arc(x + w / 2, y + h * 0.42 + Math.sin(t * 2) * 1.5, w * 0.16, 0, 7); c.fill();
    c.fillStyle = '#c99a72';
    c.beginPath(); c.arc(x + w / 2, y + h * 0.46, w * 0.13, 0, 7); c.fill();
    c.restore();
  }
  function callInset(c, W, H, t) {
    const k = W / 320; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#0a0c10'; c.fillRect(0, 0, 320, h);
    faceTile(c, 6, 6, 308, h - 12, t);
    // 自己的小畫面（右下角）
    c.fillStyle = '#1f2937'; rr(c, 200, h - 92, 110, 82, 10); c.fill();
    c.fillStyle = '#64748b'; c.font = `600 11px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('你', 255, h - 50);
    c.fillStyle = '#ffffff'; c.font = `700 13px ${FONT}`;
    c.fillText('FaceTime 視訊通話', 160, 24);
  }
  function talkInset(c, W, H, t) {
    // 先畫通話畫面（它已經設定好座標比例），再疊上「Retina」字樣
    callInset(c, W, H, t);
    const h = H / (W / 320);
    const a = span(t, 2.6, 3.4);
    if (a > 0) {
      c.globalAlpha = a;
      c.fillStyle = 'rgba(15,23,42,.8)'; rr(c, 60, h - 40, 200, 26, 13); c.fill();
      c.fillStyle = '#e0f2fe'; c.font = `600 12px ${FONT}`; c.textAlign = 'center';
      c.fillText('Retina 高解析度螢幕', 160, h - 27);
      c.globalAlpha = 1;
    }
  }

  return {
    view: { pos: V(0, 1.55, 3.0), yaw: 0, pitch: -0.05 },
    beats,
    ambient,
    finish,
    insets: {
      call: { aspect: 0.66, tone: 'phone', label: 'iPhone 4 螢幕', draw: (c, W, H, t) => callInset(c, W, H, t) },
      talk: { aspect: 0.66, tone: 'phone', label: 'iPhone 4 螢幕', draw: (c, W, H, t) => talkInset(c, W, H, t) }
    },
    focus: {
      arrive: () => V(0, 1.4, 0),
      user: () => head(user),
      phone: () => iphOuter.getWorldPosition(V()),
      window: () => V(-3.5, 1.6, -0.6)
    },
    hotspots: {
      retina: { pos: () => iphOuter.localToWorld(V(0, 0.02, 0.05)), size: 0.34 },
      camera: { pos: () => iphOuter.localToWorld(V(0, 0.3, 0.05)), size: 0.22 },
      glass: { pos: () => iphOuter.localToWorld(V(0, -0.02, -0.05)), size: 0.3 },
      window: { pos: () => V(-4.2, 1.9, -0.6), size: 0.6 }
    }
  };
}
