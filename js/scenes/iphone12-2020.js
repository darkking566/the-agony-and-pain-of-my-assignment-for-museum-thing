// 沉浸場景：2020 年秋天的傍晚，一位年輕人在家裡，手機放在 MagSafe 充電座上響了：媽媽打來視訊。
// 字幕和解說文字在 js/data.js 的 scenes['iphone12']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, Person, placeBetween } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { richRoom, windowView, leafyPlant, framedPicture, blobShadow, ceilingLights, doorway } from './props.js';
import { sofa, patternRug, bookcase, officeChair, wallClock, tableLamp, deskClutter, shelfClutter, trashCan, armchair, indoorTree } from './props2.js';

const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function build({ scene, phone }) {
  /* ---------- 傍晚的光線 ---------- */
  scene.background = new THREE.Color('#1b2133');
  scene.add(new THREE.HemisphereLight('#cdd6ff', '#4a3a2a', 0.95));
  const warm = new THREE.PointLight('#ffc57a', 2.3, 10, 1.6);
  warm.position.set(1.2, 2.5, -1.0);
  scene.add(warm);
  const deskLamp = new THREE.PointLight('#ffd9a0', 1.3, 4, 1.8);
  deskLamp.position.set(-3.2, 1.5, -3.3);
  scene.add(deskLamp);
  const laptopGlow = new THREE.PointLight('#9ec8ff', 0.7, 3, 2);
  laptopGlow.position.set(-2.4, 1.2, -3.0);
  scene.add(laptopGlow);

  const RW = 10, RD = 8, RH = 3.2;
  richRoom(scene, {
    w: RW, d: RD, h: RH,
    floor: { kind: 'parquet', color: '#7a5a3c', size: 2, rough: 0.45 },
    wall: { kind: 'plaster', color: '#dcd3c2', size: 3 },
    wallBack: { kind: 'plaster', color: '#d2c6b0', size: 3 },
    wallRight: { kind: 'plaster', color: '#dcd3c2', size: 3 },
    ceil: { kind: 'ceil', color: '#e8e2d4', size: 1.8 },
    base: '#3b2a1c', crown: '#e8e2d4'
  });
  // 左牆的大窗：窗外是傍晚的城市，窗邊有窗簾
  windowView(scene, { pos: V(-RW / 2 + 0.11, 1.65, 0.4), yaw: Math.PI / 2, w: 3.0, h: 1.9, view: 'city', frame: '#3b3a3f', curtain: '#8a7f6e' });
  ceilingLights(scene, [-2.5, 1.5, 3.5], [-1.0, 1.4], RH - 0.1, 0.9, 0.2, '#ffe6b8');

  /* ---------- 書桌（靠後牆）：筆電、檯燈、馬克杯 ---------- */
  const desk = box(2.0, 0.06, 0.8, '#a8845a'); desk.position.set(-3.0, 0.76, -3.5); scene.add(desk);
  [[-0.92, -0.34], [0.92, -0.34], [-0.92, 0.34], [0.92, 0.34]].forEach(([x, z]) => { const l = box(0.06, 0.74, 0.06, '#5a4630'); l.position.set(-3.0 + x, 0.37, -3.5 + z); scene.add(l); });
  const lapBase = box(0.36, 0.02, 0.25, '#b8bcc2', { metalness: 0.6, roughness: 0.4 }); lapBase.position.set(-2.55, 0.8, -3.4); scene.add(lapBase);
  const lapScr = box(0.36, 0.24, 0.015, '#1b1d22'); lapScr.position.set(-2.55, 0.93, -3.53); lapScr.rotation.x = -0.2; scene.add(lapScr);
  {
    // 筆電螢幕：視訊會議的格子畫面（示意）
    const c = document.createElement('canvas'); c.width = 320; c.height = 200;
    const x = c.getContext('2d'); x.fillStyle = '#10131a'; x.fillRect(0, 0, 320, 200);
    const cols = ['#4a6fa5', '#a5674a', '#5a9a7a', '#9a5a8a', '#7a8a4a', '#4a8a9a'];
    for (let i = 0; i < 6; i++) {
      const tx = 8 + (i % 3) * 102, ty = 10 + Math.floor(i / 3) * 92;
      x.fillStyle = cols[i]; x.fillRect(tx, ty, 98, 86);
      x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.arc(tx + 49, ty + 36, 17, 0, 7); x.fill(); x.fillRect(tx + 24, ty + 56, 50, 30);
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.2), new THREE.MeshBasicMaterial({ map: tex })); lit.position.set(-2.55, 0.93, -3.52); lit.rotation.x = -0.2; scene.add(lit);
  }
  const lampArm = cyl(0.015, 0.015, 0.5, '#2a2f36', 6); lampArm.position.set(-3.5, 1.05, -3.6); scene.add(lampArm);
  const lampHead = cyl(0.05, 0.13, 0.12, '#2a2f36', 14); lampHead.position.set(-3.5, 1.33, -3.55); scene.add(lampHead);
  const mug = cyl(0.045, 0.04, 0.09, '#f2efe8', 12); mug.position.set(-3.3, 0.83, -3.3); scene.add(mug);
  officeChair(scene, -3.0, -2.75, Math.PI + 0.2, { color: '#2e3340' });
  deskClutter(scene, -3.55, 0.79, -3.45, { seed: 2 });
  // 書桌上方的層架與第二個螢幕（在家工作）
  const wshelf = box(1.6, 0.04, 0.26, '#a8845a'); wshelf.position.set(-3.0, 1.75, -RD / 2 + 0.23); scene.add(wshelf);
  shelfClutter(scene, -3.75, 1.77, -RD / 2 + 0.23, 1.45, { seed: 12, depth: 0.2 });
  const mon = box(0.62, 0.38, 0.03, '#1b1d22'); mon.position.set(-3.15, 1.15, -3.78); scene.add(mon);
  const monS = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34), new THREE.MeshBasicMaterial({ color: '#2a4a6a' })); monS.position.set(-3.15, 1.15, -3.764); scene.add(monS);
  const monStand = box(0.05, 0.3, 0.05, '#55595f'); monStand.position.set(-3.15, 0.93, -3.8); scene.add(monStand);
  trashCan(scene, -1.75, -3.55, { color: '#9aa0a6' });

  /* ---------- 左側：沙發、茶几、地毯 ---------- */
  patternRug(scene, -1.9, -0.6, 3.4, 2.2, { base: '#4a5a6a', border: '#cfc6b4', accent: '#c9a24a', seed: 8 });
  sofa(scene, -1.9, -1.75, 0, { w: 2.6, color: '#6a6f78', pillows: ['#d9a441', '#5a8a7a'] });
  const ctable = box(1.1, 0.05, 0.6, '#7a5a3a'); ctable.position.set(-1.9, 0.4, -0.5); scene.add(ctable);
  [[-0.5, -0.24], [0.5, -0.24], [-0.5, 0.24], [0.5, 0.24]].forEach(([x, z]) => { const l = box(0.05, 0.4, 0.05, '#4a3420'); l.position.set(-1.9 + x, 0.2, -0.5 + z); scene.add(l); });
  [['#8a2a2a', 0], ['#2a5a8a', 0.04]].forEach(([c, dy]) => { const b = box(0.28, 0.04, 0.2, c); b.position.set(-1.9, 0.44 + dy, -0.5); scene.add(b); });
  leafyPlant(scene, -4.2, -3.4, 1.2, 3);
  indoorTree(scene, 4.1, -3.4, { h: 2.1, seed: 2, pot: '#e8e4dc' });
  armchair(scene, -0.45, -0.45, -Math.PI / 2, { color: '#9a8a6a' });
  framedPicture(scene, -1.9, 2.0, -RD / 2 + 0.17, 0, 1.0, 0.7, 4);
  framedPicture(scene, 1.2, 2.2, -RD / 2 + 0.17, 0, 0.6, 0.8, 6);
  // 落地燈
  const fbase = cyl(0.16, 0.18, 0.03, '#2f3338', 16); fbase.position.set(-3.4, 0.015, -1.4); scene.add(fbase);
  const fpole = cyl(0.015, 0.015, 1.6, '#2f3338', 8); fpole.position.set(-3.4, 0.8, -1.4); scene.add(fpole);
  const fshade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.3, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#f2e6c8', emissive: '#ffd58a', emissiveIntensity: 0.6, side: THREE.DoubleSide }));
  fshade.position.set(-3.4, 1.7, -1.4); scene.add(fshade);
  wallClock(scene, 0.2, 2.45, -RD / 2 + 0.12, 0, { r: 0.18, rim: '#c9b996' });
  /* ---------- 右側：書櫃、門、掛勾上的口罩 ---------- */
  bookcase(scene, RW / 2 - 0.27, -2.3, -Math.PI / 2, { w: 2.0, h: 2.0, color: '#5a4030', shelves: 4, seed: 6 });
  doorway(scene, { pos: V(RW / 2 - 0.1, 0, 1.6), yaw: -Math.PI / 2, w: 0.95, h: 2.1, color: '#8a6a46', handle: '#c9ccd2' });
  // 門邊的掛勾：掛著一個口罩和一串鑰匙（2020 年的日常）
  const hook = box(0.05, 0.05, 0.05, '#2a2a2e'); hook.position.set(RW / 2 - 0.1, 1.55, 0.6); scene.add(hook);
  const mask = box(0.02, 0.1, 0.17, '#bcd7ea'); mask.position.set(RW / 2 - 0.13, 1.47, 0.6); scene.add(mask);
  const keys = box(0.02, 0.07, 0.04, '#b8bcc4', { metalness: 0.8 }); keys.position.set(RW / 2 - 0.13, 1.47, 0.78); scene.add(keys);
  // 鞋櫃與鞋子
  const shoeRack = box(0.32, 0.45, 0.9, '#d8d0c0'); shoeRack.position.set(RW / 2 - 0.27, 0.225, 0.45); scene.add(shoeRack);
  [[0.15, '#3a3a42'], [0.45, '#e8e4dc'], [0.75, '#8a3a2a']].forEach(([dz, c]) => { [-0.05, 0.05].forEach((o) => { const sh = box(0.26, 0.08, 0.09, c, { roughness: 0.6 }); sh.position.set(RW / 2 - 0.55, 0.04, dz + o); scene.add(sh); }); });
  const tray = box(0.28, 0.02, 0.2, '#c9b996'); tray.position.set(RW / 2 - 0.27, 0.46, 0.3); scene.add(tray);

  /* ---------- 高腳圓桌：手機放在 MagSafe 充電座上 ---------- */
  const TABLE = V(1.2, 0, -0.3), TOP = 1.05;
  const ttop = cyl(0.46, 0.46, 0.05, '#c9b996', 28); ttop.position.set(TABLE.x, TOP - 0.025, TABLE.z); scene.add(ttop);
  const tpole = cyl(0.05, 0.05, TOP - 0.05, '#4a4f55', 8); tpole.position.set(TABLE.x, (TOP - 0.05) / 2, TABLE.z); scene.add(tpole);
  const tbase = cyl(0.3, 0.32, 0.04, '#4a4f55', 20); tbase.position.set(TABLE.x, 0.02, TABLE.z); scene.add(tbase);
  [[0.55, 0.6], [1.85, 0.6]].forEach(([x, z]) => {   // 桌子前面的兩張高腳凳
    const st = cyl(0.17, 0.17, 0.05, '#2c2f35', 14); st.position.set(x, 0.66, z); scene.add(st);
    const sl = cyl(0.03, 0.03, 0.64, '#6d747a', 6); sl.position.set(x, 0.32, z); scene.add(sl);
  });
  // 桌上的小東西：乾洗手瓶、杯子
  const sanitizer = cyl(0.03, 0.03, 0.14, '#9fd3f2', 10); sanitizer.position.set(TABLE.x + 0.28, TOP + 0.07, TABLE.z - 0.1); scene.add(sanitizer);
  const sanPump = cyl(0.008, 0.008, 0.05, '#e8e8e8', 6); sanPump.position.set(TABLE.x + 0.28, TOP + 0.165, TABLE.z - 0.1); scene.add(sanPump);
  const cup = cyl(0.045, 0.04, 0.1, '#e8d9c0', 12); cup.position.set(TABLE.x - 0.28, TOP + 0.05, TABLE.z + 0.05); scene.add(cup);
  // MagSafe 充電座：圓形的小盤子，接一條線垂到桌邊
  const PUCK = V(TABLE.x, TOP + 0.004, TABLE.z - 0.25);
  const puck = cyl(0.036, 0.036, 0.008, '#e9ebee', 28); puck.position.copy(PUCK); scene.add(puck);
  const puckRing = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.0025, 8, 32), new THREE.MeshStandardMaterial({ color: '#cfd3d9', metalness: 0.6, roughness: 0.3 }));
  puckRing.rotation.x = Math.PI / 2; puckRing.position.set(PUCK.x, PUCK.y + 0.004, PUCK.z); scene.add(puckRing);
  {
    const curve = new THREE.CatmullRomCurve3([V(PUCK.x, PUCK.y, PUCK.z - 0.03), V(PUCK.x + 0.05, PUCK.y, PUCK.z - 0.12), V(PUCK.x + 0.12, TOP - 0.005, TABLE.z - 0.42), V(PUCK.x + 0.15, TOP - 0.2, TABLE.z - 0.5), V(PUCK.x + 0.15, 0.3, TABLE.z - 0.5)]);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.004, 6), new THREE.MeshStandardMaterial({ color: '#f2f3f5', roughness: 0.6 })));
  }
  // 吸上去時閃一圈光
  const snapRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.0035, 8, 40), new THREE.MeshBasicMaterial({ color: '#8fd0ff', transparent: true, opacity: 0, depthWrite: false }));
  snapRing.rotation.x = Math.PI / 2; snapRing.position.set(PUCK.x, PUCK.y + 0.012, PUCK.z); scene.add(snapRing);

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const user = add(new Person({ top: '#6a7a8a', bottom: '#2e3138', hair: '#2a2018', skin: '#e0b494', height: 1.0 }));
  const roomie = add(new Person({ top: '#a85a4a', bottom: '#3a3a44', dress: true, hair: '#1f1712', skin: '#c99a72', height: 0.95 }));
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const USER_SPOT = V(TABLE.x, 0, TABLE.z - 0.62);
  const ROOMIE_SPOT = V(-3.7, 0, 0.5);

  /* ---------- 手機（iPhone 12） ---------- */
  const iph = buildPhone(phone);
  const iphOuter = new THREE.Group();
  {
    const b = new THREE.Box3().setFromObject(iph);
    const s = new THREE.Vector3(); b.getSize(s);
    const c = b.getCenter(V());
    iph.position.sub(c);
    const sc = new THREE.Group();
    sc.add(iph);
    sc.scale.setScalar(0.2 / Math.max(s.x, s.y, s.z));
    sc.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    iphOuter.add(sc);
  }
  scene.add(iphOuter);
  // 三個位置：充電座上（平放、螢幕朝上、頂端朝向鏡頭）、手上、胸前
  const puckA = new THREE.Object3D();
  puckA.position.set(PUCK.x, PUCK.y + 0.0075, PUCK.z);
  puckA.rotation.set(-Math.PI / 2, Math.PI, 0, 'YXZ');
  scene.add(puckA);
  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.1, 0.06);
  user.arms.R.grip.add(handHold);
  const chest = new THREE.Object3D();
  chest.rotation.set(0.55, Math.PI, 0);
  chest.position.set(-0.08, 1.3, 0.36);
  user.root.add(chest);
  const A = { puck: puckA, hand: handHold, chest };
  const gripOf = {
    puck: () => PUCK.clone().add(V(0, 0.09, 0.0)),
    chest: () => chest.localToWorld(V(0, -0.14, -0.04)),
    hand: () => user.local(-0.3, 0.84, 0.08)
  };
  const poleOf = {
    puck: () => user.local(-0.7, 0.8, 0.15),
    chest: () => user.local(-0.6, 0.85, 0.1),
    hand: () => user.local(-0.5, 0.6, -0.1)
  };
  // 手臂：從 from 伸到 to（k 0→1）
  function reach(from, to, k) {
    if (from === 'hand' && to === 'hand') { user.reach.R = null; return; }
    user.reach.R = { target: () => gripOf[from]().lerp(gripOf[to](), k), pole: () => poleOf[from]().lerp(poleOf[to](), k) };
  }
  // 手機：在 a、b 兩個位置之間（w 0→1）
  let phonePlace = ['puck', 'puck', 0];
  const putPhone = (a, b, w) => { phonePlace = [a, b, w]; };
  function placePhone() { const [a, b, w] = phonePlace; placeBetween(iphOuter, A[a], A[b], w); }

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const lerpAngle = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };
  const phoneWorld = () => iphOuter.getWorldPosition(V());
  let snapK = 0;   // 0→1：吸上充電座的那一圈光

  function roomieIdle(T) {
    roomie.reset(); roomie.pos.copy(ROOMIE_SPOT); roomie.yaw = -Math.PI / 2 + Math.sin(T * 0.3) * 0.12;
    roomie.look = V(-4.5, 1.7, 0.4); roomie.lookAmt = 0.7; idle(roomie, T, 3);
  }

  /* ---------- 劇本 ---------- */
  const beats = {
    // 年輕人從門口走進來，走向高腳桌；手機靜靜躺在充電座上
    evening: {
      duration: 8,
      update(t, T) {
        snapK = 0;
        user.reset();
        user.walk(V(4.0, 0, 1.0), USER_SPOT, t, 0, 5.2);
        if (t > 5.2) user.yaw = lerpAngle(-Math.PI / 2, 0, span(t, 5.2, 6.4));
        reach('hand', 'hand', 0); putPhone('puck', 'puck', 0);
        if (t > 5.2) { user.look = phoneWorld(); user.lookAmt = span(t, 5.2, 6.2) * 0.7; }
        idle(user, T);
        roomieIdle(T);
      }
    },
    // 手機響了：媽媽打來視訊。伸手把手機從充電座上拿起來（磁鐵很快就鬆開），拿到胸前接聽
    pickup: {
      duration: 11,
      update(t, T) {
        snapK = 0;
        user.reset(); user.pos.copy(USER_SPOT); user.yaw = 0;
        user.look = phoneWorld(); user.lookAmt = 0.8;
        const grab = span(t, 2.6, 4.0);                 // 手伸向充電座
        const pull = span(t, 4.6, 6.4);                 // 拿起來，拉到胸前
        if (t < 4.4) { reach('hand', 'puck', grab); putPhone('puck', 'puck', 0); }
        else if (t < 4.7) { reach('puck', 'puck', 0); putPhone('puck', 'hand', span(t, 4.4, 4.7)); }
        else { reach('puck', 'chest', pull); putPhone('hand', 'chest', span(pull, 0.55, 1)); }
        idle(user, T);
        roomieIdle(T);
      }
    },
    // 視訊中：聊天、把手機拿高一點，讓對方看見房間
    call: {
      duration: 10,
      update(t, T) {
        snapK = 0;
        user.reset(); user.pos.copy(USER_SPOT); user.yaw = 0.05 + Math.sin(T * 0.5) * 0.06;
        reach('chest', 'chest', 0); putPhone('chest', 'chest', 0);
        const lift = span(t, 4.6, 6.0) * (1 - span(t, 8.0, 9.0));
        chest.position.set(-0.08, 1.3 + 0.1 * lift, 0.36 + 0.05 * lift);
        user.look = phoneWorld(); user.lookAmt = 0.8;
        user.headTilt = Math.sin(T * 1.4) * 0.04;
        user.bob = Math.sin(T * 1.1) * 0.006 + Math.abs(Math.sin(T * 6)) * 0.006 * span(t, 1.0, 1.4);
        roomieIdle(T);
      }
    },
    // 講完了：把手機放回充電座，磁鐵一吸就定位，螢幕上出現充電的圖示
    end: {
      duration: 10,
      update(t, T) {
        user.reset(); user.pos.copy(USER_SPOT); user.yaw = 0;
        const back = span(t, 1.6, 3.4);
        if (t < 1.6) { reach('chest', 'chest', 0); putPhone('chest', 'chest', 0); }
        else { reach('chest', 'puck', back); putPhone('hand', 'puck', span(back, 0.7, 1)); }
        // 放下之後手收回
        if (t >= 3.8) { reach('puck', 'hand', span(t, 3.8, 5.0)); putPhone('puck', 'puck', 0); }
        snapK = span(t, 3.1, 3.5) * (1 - span(t, 3.9, 5.0));
        user.look = phoneWorld(); user.lookAmt = 0.7;
        idle(user, T, 1);
        roomieIdle(T);
      }
    }
  };

  function ambient(T) { laptopGlow.intensity = 0.65 + Math.sin(T * 1.3) * 0.06; }
  function finish() {
    people.forEach((p) => p.apply());
    placePhone();
    snapRing.material.opacity = snapK * 0.9;
    snapRing.scale.setScalar(1 + (1 - snapK) * 0.5);
  }

  /* ---------- 螢幕特寫 ---------- */
  function statusBar(c, W, label = '5G') {
    c.fillStyle = '#fff'; c.font = `700 12px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.fillText('18:42', 22, 20);
    c.textAlign = 'right'; c.fillText(label, W - 62, 20);
    for (let i = 0; i < 4; i++) { c.fillRect(W - 54 + i * 6, 25 - (3 + i * 3), 4, 3 + i * 3); }
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(W - 28, 13, 20, 10); c.fillRect(W - 26, 15, 14, 6);
  }
  function faceTile(c, x, y, w, h, t) {
    c.save(); rr(c, x, y, w, h, 16); c.clip();
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#f0d4b0'); g.addColorStop(1, '#a8795a');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#5a4030'; c.beginPath(); c.arc(x + w / 2, y + h * 0.4 + Math.sin(t * 2) * 1.5, w * 0.17, 0, 7); c.fill();
    c.fillStyle = '#d9a982'; c.beginPath(); c.arc(x + w / 2, y + h * 0.43, w * 0.14, 0, 7); c.fill();
    c.fillStyle = '#7a6a8a'; rr(c, x + w * 0.2, y + h * 0.62, w * 0.6, h * 0.4, 20); c.fill();
    c.restore();
  }
  // 來電畫面 → 接聽
  function pickupInset(c, W, H, t) {
    const k = W / 240; c.scale(k, k);
    const h = H / k;
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b3a55'); g.addColorStop(1, '#10151f');
    c.fillStyle = g; c.fillRect(0, 0, 240, h);
    statusBar(c, 240);
    c.textAlign = 'center'; c.fillStyle = '#fff';
    if (t < 6.5) {
      c.font = `700 30px ${FONT}`; c.fillText('媽媽', 120, 110);
      c.font = `500 14px ${FONT}`; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('視訊來電…', 120, 140);
      const pulse = 1 + 0.08 * Math.sin(t * 7);
      c.fillStyle = '#ef4444'; c.beginPath(); c.arc(70, h - 80, 26, 0, 7); c.fill();
      c.fillStyle = '#22c55e'; c.beginPath(); c.arc(170, h - 80, 26 * pulse, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.font = `800 20px ${FONT}`; c.fillText('✕', 70, h - 79); c.fillText('✓', 170, h - 79);
    } else {
      c.font = `700 22px ${FONT}`; c.fillText('接通了', 120, h / 2 - 8);
      c.font = `500 13px ${FONT}`; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('5G 網路下的視訊通話', 120, h / 2 + 20);
    }
  }
  // 視訊通話
  function callInset(c, W, H, t) {
    const k = W / 240; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#0a0c10'; c.fillRect(0, 0, 240, h);
    faceTile(c, 6, 30, 228, h - 44, t);
    statusBar(c, 240);
    c.fillStyle = '#1f2937'; rr(c, 150, h - 118, 78, 98, 10); c.fill();
    c.fillStyle = '#64748b'; c.font = `600 12px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('你', 189, h - 69);
    c.fillStyle = 'rgba(15,23,42,.7)'; rr(c, 14, h - 52, 118, 26, 13); c.fill();
    c.fillStyle = '#e0f2fe'; c.font = `600 12px ${FONT}`; c.fillText(`通話中 ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t) % 60).padStart(2, '0')}`, 73, h - 39);
  }
  // 放回充電座：吸上去、出現充電的圈圈
  function endInset(c, W, H, t) {
    const k = W / 240; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#05070b'; c.fillRect(0, 0, 240, h);
    if (t < 1.4) { c.fillStyle = '#10151f'; c.fillRect(0, 0, 240, h); statusBar(c, 240); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `700 20px ${FONT}`; c.fillText('通話結束', 120, h / 2); return; }
    if (t < 3.5) { c.fillStyle = '#10151f'; c.fillRect(0, 0, 240, h); statusBar(c, 240); c.fillStyle = 'rgba(255,255,255,.8)'; c.textAlign = 'center'; c.font = `600 15px ${FONT}`; c.fillText('把手機放回充電座…', 120, h / 2); return; }
    const a = span(t, 3.5, 4.2);
    const cx = 120, cy = h / 2 - 10;
    c.strokeStyle = `rgba(74,222,128,${a})`; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.arc(cx, cy, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (0.64 + 0.003 * (t - 3.5))); c.stroke();
    c.strokeStyle = `rgba(255,255,255,${0.12 * a})`; c.beginPath(); c.arc(cx, cy, 42, 0, 7); c.stroke();
    c.fillStyle = `rgba(255,255,255,${a})`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 26px ${FONT}`; c.fillText('64%', cx, cy);
    c.font = `600 14px ${FONT}`; c.fillText('MagSafe 充電中', cx, cy + 70);
  }

  return {
    view: { pos: V(0, 1.55, 3.3), yaw: 0, pitch: -0.05 },
    closeDist: 1.7,   // 手機很小，演出時鏡頭靠近一點
    beats,
    ambient,
    finish,
    insets: {
      pickup: { aspect: 0.5, tone: 'phone', label: 'iPhone 12 螢幕', draw: (c, W, H, t) => pickupInset(c, W, H, t) },
      call: { aspect: 0.5, tone: 'phone', label: 'iPhone 12 螢幕', draw: (c, W, H, t) => callInset(c, W, H, t) },
      end: { aspect: 0.5, tone: 'phone', label: 'iPhone 12 螢幕', draw: (c, W, H, t) => endInset(c, W, H, t) }
    },
    focus: {
      room: () => V(0.8, 1.4, -1.0),
      user: () => head(user),
      phone: () => phoneWorld(),
      puck: () => PUCK.clone().add(V(0, 0.05, 0)),
      window: () => V(-4.6, 1.6, 0.4)
    },
    hotspots: {
      phone: { pos: () => phoneWorld().add(V(-0.12, 0.2, 0)), size: 0.36 },
      network: { pos: () => phoneWorld().add(V(0.2, 0.36, 0)), size: 0.3 },
      magsafe: { pos: () => PUCK.clone().add(V(-0.2, 0.14, 0.05)), size: 0.34 },
      screen: { pos: () => phoneWorld().add(V(0.22, 0.2, 0)), size: 0.3 }
    }
  };
}
