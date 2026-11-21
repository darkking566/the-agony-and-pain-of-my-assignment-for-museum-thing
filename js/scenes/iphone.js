// 沉浸場景：2007 年夏天的咖啡館，兩個朋友站在高腳桌旁，其中一個拿出剛買的第一代 iPhone。
// 字幕和解說文字在 js/data.js 的 scenes['iphone']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import { iphoneInsets } from './insets.js';
import * as THREE from 'three';
import { V, span, lerp, mat, box, cyl, sign, Person, placeBetween } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { richRoom, ceilingLights, windowView, leafyPlant, framedPicture, blobShadow, surfaceTex } from './props.js';
import { chair, sofa, shelfClutter, trashCan, wallClock } from './props2.js';

export function build({ scene, phone }) {
  /* ---------- 光線與房間 ---------- */
  scene.background = new THREE.Color('#d9cfc2');
  scene.add(new THREE.HemisphereLight('#fff6e6', '#9a8268', 1.9));
  const sun = new THREE.DirectionalLight('#ffe3b8', 2.6);
  sun.position.set(-9, 6, 3);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  const RW = 9, RD = 8, RH = 3.2;
  richRoom(scene, { w: RW, d: RD, h: RH, floor: { kind: 'parquet', color: '#7a5434', size: 2, rough: 0.4 }, wall: { kind: 'plaster', color: '#e4d9c6', size: 3 }, wallBack: { kind: 'brick', color: '#9a5a44', size: 2 }, wallRight: { kind: 'brick', color: '#9a5a44', size: 2 }, ceil: { kind: 'ceil', color: '#e6dccb', size: 1.8 }, base: '#3b2a1c', crown: '#e6dccb' });
  // 左牆大窗：窗外是夏天的街
  [-2.4, 1.2].forEach((z) => windowView(scene, { pos: V(-RW / 2 + 0.11, 1.7, z), yaw: Math.PI / 2, w: 2.8, h: 1.8, view: 'city', frame: '#3b2f27', curtain: '#b39a7c' }));

  // 吧台、咖啡機、菜單黑板
  const counter = box(5.2, 1.05, 0.7, '#5a3f2b'); counter.position.set(0.5, 0.525, -2.9);
  const counterTop = box(5.3, 0.06, 0.8, '#d8cdbb'); counterTop.position.set(0.5, 1.08, -2.9);
  scene.add(counter, counterTop);
  // 吧台正面的直條木板與黃銅腳踏桿
  for (let i = 0; i < 26; i++) { const sl = box(0.18, 0.95, 0.02, i % 2 ? '#5f432e' : '#553b28'); sl.position.set(0.5 - 2.6 + 0.1 + i * 0.2, 0.5, -2.54); sl.castShadow = false; scene.add(sl); }
  const rail = cyl(0.025, 0.025, 5.0, '#c9a24a', 10); rail.material = mat('#c9a24a', { roughness: 0.25, metalness: 0.85 }); rail.rotation.z = Math.PI / 2; rail.position.set(0.5, 0.22, -2.42); scene.add(rail);
  [-1.8, 0.5, 2.8].forEach((x) => { const br = box(0.03, 0.03, 0.12, rail.material); br.position.set(x, 0.22, -2.48); scene.add(br); });
  // 收銀機、磨豆機、小費罐、餐巾紙
  const reg = box(0.38, 0.18, 0.32, '#2a2a2e', { roughness: 0.4 }); reg.position.set(-0.1, 1.2, -2.8); scene.add(reg);
  const regS = box(0.26, 0.16, 0.03, '#1a1a1e'); regS.position.set(-0.1, 1.36, -2.92); regS.rotation.x = -0.4; scene.add(regS);
  const regG = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), new THREE.MeshBasicMaterial({ color: '#7fd6a0' })); regG.position.set(-0.1, 1.365, -2.9); regG.rotation.x = -0.4; scene.add(regG);
  const grinder = cyl(0.09, 0.11, 0.28, '#3b3f45', 14); grinder.position.set(-2.0, 1.25, -2.95); scene.add(grinder);
  const hopper = cyl(0.1, 0.05, 0.18, '#3b3f45', 14); hopper.material = new THREE.MeshStandardMaterial({ color: '#6a4a2a', transparent: true, opacity: 0.6, roughness: 0.1 }); hopper.position.set(-2.0, 1.48, -2.95); scene.add(hopper);
  const jar = cyl(0.06, 0.06, 0.14, '#cfe3ea', 14); jar.material = new THREE.MeshStandardMaterial({ color: '#d6e8ef', transparent: true, opacity: 0.45, roughness: 0.05 }); jar.position.set(0.3, 1.18, -2.65); scene.add(jar);
  const nap = box(0.14, 0.1, 0.1, '#c9ced3', { metalness: 0.6, roughness: 0.3 }); nap.position.set(0.55, 1.16, -2.7); scene.add(nap);
  const machine = new THREE.Group();
  const mb = box(0.9, 0.55, 0.5, '#b9bec4', { metalness: 0.7, roughness: 0.3 }); mb.position.y = 0.3;
  const mt = box(0.9, 0.12, 0.5, '#3b3f45'); mt.position.y = 0.62;
  [-0.25, 0.25].forEach((x) => { const h = cyl(0.04, 0.04, 0.14, '#222', 8); h.position.set(x, 0.18, 0.28); machine.add(h); });
  machine.add(mb, mt); machine.position.set(-1.2, 1.11, -2.95); scene.add(machine);
  [0.6, 1.3, 2.0].forEach((x, i) => {
    const cup = cyl(0.07, 0.055, 0.1, ['#f2efe8', '#e1d3bd', '#f2efe8'][i], 12); cup.position.set(x, 1.17, -2.85); scene.add(cup);
  });
  const menu = box(2.6, 1.2, 0.06, '#26302b'); menu.position.set(0.6, 2.05, -RD / 2 + 0.16);
  const menuF = box(2.75, 1.35, 0.04, '#6b4a2f'); menuF.position.set(0.6, 2.05, -RD / 2 + 0.13);
  const menuT = sign('COFFEE　SUMMER 2007', 2.3, 0.4, { bg: '#26302b', color: '#f3ead6', size: 72, w: 1024, h: 170, weight: 700 });
  menuT.position.set(0.6, 2.4, -RD / 2 + 0.195);
  const menuT2 = sign('LATTE · MOCHA · DRIP', 2.3, 0.3, { bg: '#26302b', color: '#cfd8c6', size: 54, w: 1024, h: 130, weight: 500 });
  menuT2.position.set(0.6, 1.95, -RD / 2 + 0.195);
  scene.add(menuF, menu, menuT, menuT2);

  // 吊燈
  [-2.4, 3.2].forEach((x) => [-0.6, 1.6].forEach((z) => {
    const cord = cyl(0.01, 0.01, 0.9, '#222', 4); cord.position.set(x, RH - 0.45, z); cord.castShadow = false;
    const shade = cyl(0.12, 0.28, 0.26, '#c8892e', 14); shade.position.set(x, RH - 1.0, z); shade.castShadow = false;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff3c9' })); bulb.position.set(x, RH - 1.08, z);
    scene.add(cord, shade, bulb);
  }));

  // 高腳桌：兩個朋友站在桌邊
  const TABLE = V(1.35, 0, 0.1);
  const stool = (x, z) => { const s = cyl(0.17, 0.17, 0.05, '#3b3f45', 14); s.position.set(x, 0.72, z); const l = cyl(0.03, 0.03, 0.7, '#6d747a', 6); l.position.set(x, 0.36, z); scene.add(s, l); };
  {
    const top = cyl(0.5, 0.5, 0.05, '#d8c7a5', 24); top.position.set(TABLE.x, 1.08, TABLE.z);
    const pole = cyl(0.05, 0.05, 1.05, '#4a4f55', 8); pole.position.set(TABLE.x, 0.53, TABLE.z);
    const base = cyl(0.3, 0.32, 0.04, '#4a4f55', 20); base.position.set(TABLE.x, 0.02, TABLE.z);
    scene.add(top, pole, base);
    const cup = cyl(0.045, 0.04, 0.08, '#f2efe8', 12); cup.position.set(TABLE.x - 0.18, 1.14, TABLE.z + 0.1);
    const cup2 = cyl(0.045, 0.04, 0.08, '#e8d9c0', 12); cup2.position.set(TABLE.x + 0.2, 1.14, TABLE.z - 0.08);
    scene.add(cup, cup2);
  }
  stool(-2.6, 0.2); stool(-2.6, 1.4); stool(3.4, 1.8);
  // 窗邊小桌，每桌兩把椅子、桌上有杯子
  [[-3.4, -1.0], [-3.4, 1.6]].forEach(([x, z], i) => {
    const top = cyl(0.35, 0.35, 0.04, '#cdbb98', 18); top.position.set(x, 0.74, z);
    const pole = cyl(0.04, 0.04, 0.72, '#4a4f55', 6); pole.position.set(x, 0.36, z);
    const foot = cyl(0.22, 0.24, 0.03, '#4a4f55', 16); foot.position.set(x, 0.015, z);
    scene.add(top, pole, foot);
    chair(scene, x, z - 0.6, 0, { color: '#3b2a1c' }); chair(scene, x, z + 0.6, Math.PI, { color: '#3b2a1c' });
    const c = cyl(0.045, 0.04, 0.08, i ? '#e8d9c0' : '#f2efe8', 12); c.position.set(x + 0.1, 0.8, z - 0.05); scene.add(c);
    const sauc = cyl(0.08, 0.07, 0.012, '#f2efe8', 16); sauc.position.set(x + 0.1, 0.766, z - 0.05); scene.add(sauc);
  });
  // 右牆（磚牆）的長沙發、小桌、上方的層架
  sofa(scene, 4.05, 0.2, -Math.PI / 2, { w: 2.2, color: '#6a3b2a', legs: '#2a1c12', pillows: ['#c9a46a', '#3f5a4a'] });
  const st = cyl(0.3, 0.3, 0.04, '#cdbb98', 18); st.position.set(3.25, 0.55, 0.2); scene.add(st);
  const stp = cyl(0.035, 0.035, 0.53, '#4a4f55', 6); stp.position.set(3.25, 0.27, 0.2); scene.add(stp);
  const shelfB = box(0.24, 0.04, 1.8, '#5a3f2b'); shelfB.position.set(RW / 2 - 0.22, 1.85, 0.2); scene.add(shelfB);
  shelfClutter(scene, RW / 2 - 0.22, 1.87, 1.0, 1.6, { seed: 21, rot: Math.PI / 2, depth: 0.18 });
  wallClock(scene, RW / 2 - 0.12, 2.5, -1.8, -Math.PI / 2, { r: 0.2, rim: '#3b2a1c' });
  trashCan(scene, -0.6, 3.4, { color: '#3b3f45' });
  // 門口的小黑板立牌
  { const g = new THREE.Group(); g.position.set(-1.6, 0, 3.2); g.rotation.y = 0.3;
    [-1, 1].forEach((e) => { const p = box(0.5, 0.8, 0.025, '#5a3f2b'); p.position.set(0, 0.38, e * 0.12); p.rotation.x = e * -0.16; g.add(p); });
    const t = sign('今日推薦', 0.42, 0.62, { bg: '#26302b', color: '#f3ead6', size: 52, w: 256, h: 380, weight: 700 }); t.position.set(0, 0.4, 0.14); t.rotation.x = -0.16; g.add(t);
    scene.add(g); }
  // 盆栽、掛畫、玻璃蛋糕櫃、吧台後的杯架
  leafyPlant(scene, 4.0, -3.4, 1.1, 1); leafyPlant(scene, -4.0, 3.3, 1.0, 2);
  framedPicture(scene, -3.6, 2.1, -RD / 2 + 0.17, 0, 0.7, 0.9, 1); framedPicture(scene, 4.2, 2.0, -RD / 2 + 0.17, 0, 0.6, 0.8, 2);
  { const cs = box(1.1, 0.45, 0.5, '#d8cdbb'); cs.position.set(2.3, 1.36, -2.95);
    const gl = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: '#cfe0e8', transparent: true, opacity: 0.25, roughness: 0.1 })); gl.position.set(2.3, 1.56, -2.95);
    scene.add(cs, gl);
    ['#e8c9a0', '#b8754a', '#f0e0c0', '#6a3b2a'].forEach((c, i) => { const cake = cyl(0.11, 0.11, 0.1, c, 14); cake.position.set(1.95 + i * 0.24, 1.46, -2.95); scene.add(cake); });
    for (let i = 0; i < 3; i++) { const sh = box(1.9, 0.04, 0.22, '#5a3f2b'); sh.position.set(-3.1, 1.5 + i * 0.4, -RD / 2 + 0.3); sh.castShadow = false; scene.add(sh);
      for (let k = 0; k < 7; k++) { const cup = cyl(0.045, 0.035, 0.07, k % 2 ? '#f2efe8' : '#e1d3bd', 10); cup.position.set(-3.95 + k * 0.28, 1.55 + i * 0.4, -RD / 2 + 0.3); cup.castShadow = false; scene.add(cup); } } }

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const A = add(new Person({ top: '#3f6b8c', bottom: '#2b2f3a', hair: '#1b1410', skin: '#e2b48e', height: 1.0 }));
  const B = add(new Person({ top: '#b5533c', bottom: '#4a3f35', hair: '#3a2a1c', skin: '#d9a77f', height: 0.94, dress: true }));
  const barista = add(new Person({ top: '#2c2c2c', bottom: '#2c2c2c', hair: '#222', skin: '#c68e63', height: 1.0 }));
  const guest = add(new Person({ top: '#7a8c5a', bottom: '#4a4a4a', hair: '#8a6a3a', skin: '#edc6a2', height: 0.98 }));
  { const ap = box(0.4, 0.7, 0.02, '#e8e2d4'); ap.position.set(0, -0.05, 0.13); barista.torso.add(ap);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.07, 14), mat('#2c2c2c', { roughness: 1 })); cap.position.set(0, 0.24, 0); barista.head.add(cap);
    const bag = box(0.3, 0.26, 0.1, '#6a3b2a'); bag.position.set(0.28, -0.3, 0.02); A.torso.add(bag);
    const sc = box(0.3, 0.09, 0.27, '#e8d9c0'); sc.position.set(0, 0.61, 0); B.torso.add(sc); }
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });

  /* ---------- 手機（拿在手上的邏輯做成可重複使用的小零件） ---------- */
  const fit = (model, maxDim) => {
    const b = new THREE.Box3().setFromObject(model);
    const s = new THREE.Vector3(); b.getSize(s);
    const c = b.getCenter(V());
    model.position.sub(c);
    const g = new THREE.Group(); g.add(model);
    const k = maxDim / Math.max(s.x, s.y, s.z);
    g.scale.setScalar(k);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const outer = new THREE.Group(); outer.add(g); scene.add(outer);
    return outer;
  };
  const makeHolder = (person, obj) => {
    const hold = new THREE.Object3D(); hold.position.set(0, 0.02, 0.05); person.arms.R.grip.add(hold);
    const chest = new THREE.Object3D(); chest.rotation.set(0.55, Math.PI, 0); person.root.add(chest);
    chest.position.set(-0.08, 1.3, 0.36);
    const h = {
      k: 0,
      chest, obj,
      rest: () => person.local(-0.3, 0.84, 0.08),
      grip: () => chest.localToWorld(V(0, -0.04, -0.02)),
      pole: (k) => person.local(-0.5 - 0.1 * k, 0.6 + 0.25 * k, -0.1 + 0.2 * k),
      set(k) {
        h.k = k;
        if (k <= 0) { person.reach.R = null; return; }
        person.reach.R = { target: () => h.rest().lerp(h.grip(), k), pole: () => h.pole(k) };
      },
      place() { placeBetween(obj, hold, chest, span(h.k, 0.55, 1)); },
      pos: () => obj.getWorldPosition(V())
    };
    return h;
  };
  const iphoneObj = fit(buildPhone(phone), 0.19);
  const flipObj = fit(buildPhone({ shape: 'clam', color: '#9aa0a8', id: 'razr' }), 0.2);
  const hA = makeHolder(A, iphoneObj);
  const hB = makeHolder(B, flipObj);

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };

  const A_SPOT = V(0.55, 0, 1.15), B_SPOT = V(2.15, 0, 0.95);
  const BARISTA = V(0.6, 0, -3.5), GUEST = V(2.6, 0, -2.4);

  // 手指：左手伸到螢幕前面滑動
  function finger(person, h, ox, oy, amt) {
    if (amt <= 0) { person.reach.L = null; return; }
    person.reach.L = {
      target: () => person.local(0.3, 0.84, 0.08).lerp(h.chest.localToWorld(V(ox, oy, 0.03)), amt),
      pole: () => person.local(0.7, 0.7, 0.1)
    };
  }
  function bg(T) {
    barista.reset(); barista.pos.copy(BARISTA); barista.yaw = Math.PI - 0.2 + Math.sin(T * 0.3) * 0.2; idle(barista, T, 4);
    guest.reset(); guest.pos.copy(GUEST); guest.yaw = faceTo(guest, V(0.6, 0, -3.2)); idle(guest, T, 5);
  }
  const lookAt = (p, v, a = 1) => { p.look = v; p.lookAmt = a; };

  /* ---------- 劇本 ---------- */
  const beats = {
    cafe: {
      duration: 9,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = 0.7; hA.set(0); idle(A, T);
        B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, A.pos); hB.set(0); idle(B, T, 1);
        lookAt(A, head(B), 0.7); lookAt(B, head(A), 0.7);
        finger(A, hA, 0, 0, 0); bg(T);
      }
    },
    swipe: {
      duration: 11,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = 0.35;
        const k = span(t, 0.4, 1.8);
        hA.set(k); hA.chest.position.set(-0.08, 1.3, 0.36);
        lookAt(A, hA.pos(), k); idle(A, T);
        const sw = span(t, 3.6, 4.0) * (1 - span(t, 8.4, 8.8));
        const phase = ((t - 3.6) * 0.9) % 1;
        finger(A, hA, lerp(-0.045, 0.045, phase), -0.03 + phase * 0.01, sw);
        B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, A.pos); hB.set(0);
        const lean = span(t, 2.6, 4.0);
        B.walk(B_SPOT, V(1.85, 0, 1.0), t, 2.4, 4.2);
        B.yaw = faceTo(B, A.pos); B.lean = 0.14 * lean; lookAt(B, hA.pos(), span(t, 1.2, 2.4));
        B.headTilt = Math.sin(T * 2.2) * 0.04 * lean;
        const wow = span(t, 8.4, 9) * (1 - span(t, 10.2, 10.8));
        B.bob += wow * 0.03 * Math.abs(Math.sin(T * 10));
        bg(T);
      }
    },
    pinch: {
      duration: 11,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = 0.35;
        hA.set(1); hA.chest.position.set(-0.08, 1.3, 0.36);
        lookAt(A, hA.pos(), 1); idle(A, T);
        // 放大照片：手指從中間往外拉
        const zoom = span(t, 3.4, 3.8) * (1 - span(t, 7.0, 7.4));
        const k = Math.abs(Math.sin((t - 3.4) * 1.3));
        finger(A, hA, lerp(-0.01, 0.05, k), lerp(-0.03, 0.03, k), zoom);
        B.reset(); B.pos.copy(V(1.85, 0, 1.0)); B.yaw = faceTo(B, A.pos); hB.set(0);
        B.lean = 0.14; lookAt(B, hA.pos(), 1);
        // 朋友忍不住伸手
        const reach = span(t, 7.2, 8.4) * (1 - span(t, 9.6, 10.4));
        if (reach > 0) {
          B.reach.R = {
            target: () => B.local(-0.3, 0.84, 0.08).lerp(hA.chest.localToWorld(V(0.03, -0.04, 0.05)), reach),
            pole: () => B.local(-0.6, 0.7, 0.2)
          };
        }
        bg(T);
      }
    },
    compare: {
      duration: 10,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = 0.5;
        hA.set(1); hA.chest.position.set(-0.08, 1.3, 0.36);
        B.reset(); B.pos.copy(V(1.85, 0, 1.0)); B.yaw = faceTo(B, A.pos);
        const k = span(t, 0.4, 1.8);
        hB.set(k); hB.chest.position.set(-0.08, 1.3, 0.36);
        finger(A, hA, 0, 0, 0);
        // 兩人各自看自己的手機，再看看對方的
        const sw = span(t, 4.2, 5.0) * (1 - span(t, 6.8, 7.6));
        lookAt(A, sw > 0.5 ? hB.pos() : hA.pos(), 1);
        lookAt(B, sw > 0.5 ? hA.pos() : hB.pos(), 1);
        idle(A, T); idle(B, T, 1);
        bg(T);
      }
    }
  };

  function ambient() { /* 咖啡館裡沒有需要一直動的東西 */ }
  function finish() {
    people.forEach((p) => p.apply());
    hA.place(); hB.place();
  }

  return {
    view: { pos: V(0, 1.55, 3.4), yaw: 0, pitch: -0.05 },
    beats,
    ambient,
    finish,
    insets: iphoneInsets,
    focus: {
      cafe: () => V(0.8, 1.4, 0),
      group: () => head(A).lerp(head(B), 0.5),
      iphone: () => hA.pos(),
      flip: () => hB.pos()
    },
    hotspots: {
      iphone: { pos: () => hA.pos().add(V(0, 0.34, 0)), size: 0.3 },
      oldphone: { pos: () => hB.pos().add(V(0, 0.2, 0)), size: 0.3 },
      board: { pos: () => V(0.6, 2.95, -3.8), size: 0.6 },
      touch: { pos: () => hA.pos().add(V(0.12, 0.32, 0)), size: 0.28 },
      net: { pos: () => hA.pos().add(V(-0.26, 0.48, 0)), size: 0.28 },
      appstore: { pos: () => head(A).lerp(head(B), 0.5).add(V(0, 0.5, 0)), size: 0.5 }
    }
  };
}
