// 沉浸場景：1996 年的辦公大樓大廳，一位上班族腰間的 StarTAC 震動，接電話、跟同事比較、收進口袋。
// 字幕和解說文字在 js/data.js 的 scenes['startac']；這裡只負責場景和動作。
import { startacInsets } from './insets.js';
import * as THREE from 'three';
import { V, span, lerp, mat, box, cyl, sign, Person } from '../scene-kit.js';
import { loadPhone, setLid, makeHolder } from './kit2.js';
import { richRoom, ceilingLights, windowView, leafyPlant, framedPicture, surfaceTex, blobShadow } from './props.js';
import { sofa, seatRow, crtMonitor, filingCabinet, deskClutter, trashCan, wallClock, armchair, indoorTree, magazineRack } from './props2.js';

export function build({ scene, phone }) {
  /* ---------- 光線與大廳 ---------- */
  scene.background = new THREE.Color('#dfe6ec');
  scene.add(new THREE.HemisphereLight('#f6f7fa', '#9a9388', 2.0));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.2);
  sun.position.set(-9, 7, 3); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  richRoom(scene, { w: 10, d: 8, h: 3.6, floor: { kind: 'terrazzo', color: '#d9d3c7', size: 2, rough: 0.28 }, wall: { kind: 'plaster', color: '#e0dbce', size: 3 }, wallBack: { kind: 'plaster', color: '#cdd2d4', size: 3 }, base: '#5a4a38' });
  const wood = '#7a5a3c';
  // 左牆窗戶：窗外是城市的樓
  [-2.6, 0.2, 3.0].forEach((z) => windowView(scene, { pos: V(-5 + 0.11, 2.0, z), yaw: Math.PI / 2, w: 2.1, h: 1.9, view: 'city', frame: '#8c9399', blinds: 0.3 }));
  // 後牆：兩部電梯與樓層指示
  [-1.0, 0.6].forEach((x) => {
    const d = box(1.3, 2.4, 0.08, '#a9b0b5', { metalness: 0.6, roughness: 0.35 }); d.position.set(x, 1.2, -4 + 0.16);
    const seam = box(0.03, 2.4, 0.09, '#6d747a'); seam.position.set(x, 1.2, -4 + 0.17);
    const fr = box(1.5, 2.55, 0.06, '#5b6066'); fr.position.set(x, 1.27, -4 + 0.13);
    scene.add(fr, d, seam);
    // 不鏽鋼門片的細橫紋與門檻
    for (let k = 0; k < 12; k++) { const ln = box(1.28, 0.006, 0.005, '#c3c9ce'); ln.position.set(x, 0.2 + k * 0.19, -4 + 0.205); ln.castShadow = false; scene.add(ln); }
    const sill = box(1.5, 0.02, 0.2, '#8a9096', { metalness: 0.7, roughness: 0.3 }); sill.position.set(x, 0.01, -4 + 0.25); scene.add(sill);
  });
  const dirBoard = sign('DIRECTORY　1F 大廳　2F–12F 辦公室', 3.3, 0.5, { bg: '#26302b', color: '#f0ead8', size: 52, w: 1536, h: 200, weight: 600 });
  dirBoard.position.set(-3.1, 1.9, -4 + 0.17);
  const dirF = box(3.45, 0.62, 0.05, wood); dirF.position.set(-3.1, 1.9, -4 + 0.12);
  scene.add(dirF, dirBoard);
  const clock = new THREE.Group();
  const face = cyl(0.3, 0.3, 0.04, '#f4f1ea', 24); face.rotation.x = Math.PI / 2;
  const hh = box(0.025, 0.16, 0.01, '#222'); hh.position.set(0.04, 0.07, 0.03); hh.rotation.z = -0.5;
  const mm = box(0.018, 0.24, 0.01, '#222'); mm.position.set(-0.06, 0.08, 0.035); mm.rotation.z = 0.45;
  clock.add(face, hh, mm); clock.position.set(3.0, 2.8, -4 + 0.18); clock.visible = false; scene.add(clock);
  wallClock(scene, 3.0, 2.8, -4 + 0.12, 0, { r: 0.3, rim: '#5b6066' });

  // 電梯：呼叫鈕、樓層燈、出口燈
  [-1.0, 0.6].forEach((x, i) => {
    const ind = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshBasicMaterial({ color: i ? '#ff5a3a' : '#5aff8a' })); ind.position.set(x, 2.62, -4 + 0.17);
    scene.add(ind);
  });
  { const panel = box(0.14, 0.3, 0.04, '#9aa1a6', { metalness: 0.7, roughness: 0.3 }); panel.position.set(1.65, 1.2, -4 + 0.16); scene.add(panel);
    [0.08, -0.04].forEach((dy) => { const bt = box(0.05, 0.05, 0.02, '#e8e8e8'); bt.position.set(1.65, 1.2 + dy, -4 + 0.2); scene.add(bt); });
    const exit = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16), new THREE.MeshBasicMaterial({ color: '#3cff7a' })); exit.position.set(3.9, 3.2, -4 + 0.12); scene.add(exit);
    const panel2 = box(0.14, 0.3, 0.04, '#9aa1a6', { metalness: 0.7, roughness: 0.3 }); panel2.position.set(-1.95, 1.2, -4 + 0.16); scene.add(panel2);
    [0.08, -0.04].forEach((dy) => { const bt = box(0.05, 0.05, 0.02, '#e8e8e8'); bt.position.set(-1.95, 1.2 + dy, -4 + 0.2); scene.add(bt); });
    const ext = cyl(0.07, 0.07, 0.4, '#b3261e', 10); ext.position.set(2.4, 0.55, -4 + 0.2); scene.add(ext); }
  framedPicture(scene, 3.0, 1.7, -4 + 0.13, 0, 0.9, 0.6, 1); framedPicture(scene, 4.2, 1.7, -4 + 0.13, 0, 0.6, 0.8, 2);
  framedPicture(scene, 5 - 0.12, 1.8, -1.0, -Math.PI / 2, 1.0, 0.7, 3); framedPicture(scene, 5 - 0.12, 1.8, 0.4, -Math.PI / 2, 0.7, 0.5, 4);
  // 接待櫃台
  const desk = box(3.2, 1.05, 0.7, wood); desk.position.set(-2.4, 0.525, -2.3);
  const deskTop = box(3.3, 0.06, 0.8, '#e6dfd0'); deskTop.position.set(-2.4, 1.08, -2.3);
  scene.add(desk, deskTop);
  { const logo = sign('NORTHSTAR  TECHNOLOGIES', 3.2, 0.45, { bg: '#1d2a3a', color: '#e9e3d2', size: 52, w: 1536, h: 220, weight: 800, font: 'Georgia, serif' }); logo.position.set(-2.4, 2.65, -4 + 0.14); scene.add(logo);
    const kb = box(0.36, 0.025, 0.12, '#d9d3c2'); kb.position.set(-2.9, 1.12, -2.1); const np = box(0.28, 0.05, 0.02, '#3b2a1c'); np.position.set(-1.0, 1.13, -2.0);
    const bell = cyl(0.04, 0.05, 0.04, '#d9b25a', 10); bell.position.set(-1.4, 1.13, -2.1); scene.add(kb, np, bell); }
  // 櫃台正面的凸起木板與踢腳
  for (let i = 0; i < 4; i++) { const pn = box(0.7, 0.7, 0.03, '#8a6a4a'); pn.position.set(-2.4 - 1.2 + i * 0.8, 0.55, -1.94); scene.add(pn); }
  const kick = box(3.2, 0.1, 0.03, '#3b2a1c'); kick.position.set(-2.4, 0.05, -1.935); scene.add(kick);
  crtMonitor(scene, -2.9, 1.11, -2.35, Math.PI + 0.3, { w: 0.4 });
  filingCabinet(scene, -4.4, -3.6, 0, { color: '#8f8a80', drawers: 3, h: 1.0 });
  deskClutter(scene, -2.0, 1.11, -2.45, { seed: 3, rot: Math.PI });
  const pc = new THREE.Object3D(), mon = new THREE.Object3D();
  const lp = box(0.22, 0.07, 0.2, '#cfc9bb'); lp.position.set(-1.7, 1.14, -2.3);   // 桌上的市話
  scene.add(pc, mon, lp);
  // 長椅、盆栽、地毯
  // 長椅（有椅墊）、茶几與雜誌、地毯、盆栽
  sofa(scene, 3.6, 2.95, Math.PI, { w: 1.9, color: '#3b4a5a', legs: '#9aa1a6', pillows: [] });
  const bench = new THREE.Object3D(), benchBack = new THREE.Object3D();
  // 窗下的候客座椅、垃圾桶、傘架、地上的公司徽章
  seatRow(scene, -4.55, 1.5, Math.PI / 2, { n: 3, color: '#5a3a3a' });
  trashCan(scene, -4.5, 0.2, { color: '#8a9096' });
  { const us = cyl(0.13, 0.12, 0.5, '#3b3f45', 14); us.position.set(4.5, 0.25, -1.9); scene.add(us);
    ['#1c1c1c', '#7a2a2a'].forEach((c, i) => { const u = cyl(0.015, 0.015, 0.8, c, 6); u.position.set(4.48 + i * 0.05, 0.6, -1.9 + i * 0.03); u.rotation.z = (i - 0.5) * 0.12; scene.add(u); }); }
  { const med = cyl(0.75, 0.75, 0.006, '#b9a27a', 40); med.position.set(-0.2, 0.004, -2.9); med.receiveShadow = true; med.castShadow = false; scene.add(med);
    const inner = cyl(0.6, 0.6, 0.008, '#1d2a3a', 40); inner.position.set(-0.2, 0.005, -2.9); inner.castShadow = false; scene.add(inner);
    const star = sign('N', 0.7, 0.7, { bg: null, color: '#e9e3d2', size: 200, w: 256, h: 256, font: 'Georgia, serif' }); star.material.transparent = true; star.rotation.x = -Math.PI / 2; star.position.set(-0.2, 0.011, -2.9); scene.add(star); }
  const ct = box(0.9, 0.04, 0.5, '#2a2a2e', { roughness: 0.2, metalness: 0.4 }); ct.position.set(3.6, 0.42, 1.9);
  [-0.4, 0.4].forEach((dx) => { const l = box(0.04, 0.4, 0.04, '#9aa1a6', { metalness: 0.7 }); l.position.set(3.6 + dx, 0.2, 1.9); scene.add(l); });
  ['#c0503a', '#2f5d8a', '#e0d6c0'].forEach((c, i) => { const m = box(0.22, 0.012, 0.3, c); m.position.set(3.4 + i * 0.2, 0.445 + i * 0.01, 1.9); m.rotation.y = 0.3 * i; m.castShadow = false; scene.add(m); });
  const rugT = surfaceTex('carpet', '#6f8196').clone(); rugT.repeat.set(2.5, 1.6); rugT.needsUpdate = true;
  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.02, 2.2), [mat('#44566a'), mat('#44566a'), new THREE.MeshStandardMaterial({ map: rugT, roughness: 1 }), mat('#44566a'), mat('#44566a'), mat('#44566a')]); rug.position.set(0.3, 0.01, 1.2); rug.receiveShadow = true;
  const rugBorder = box(3.0, 0.005, 1.8, '#8a9db3'); rugBorder.position.set(0.3, 0.022, 1.2); rugBorder.castShadow = false;
  scene.add(bench, benchBack, ct, rug, rugBorder);
  indoorTree(scene, 4.35, -3.35, { h: 2.4, seed: 4 }); indoorTree(scene, -4.35, 3.35, { h: 2.2, seed: 7 }); leafyPlant(scene, 4.4, 1.0, 0.8, 3);
  armchair(scene, 2.55, 1.9, Math.PI / 2, { color: '#3b4a5a', legs: '#9aa1a6' });
  magazineRack(scene, 4.65, 2.0, -Math.PI / 2);
  ceilingLights(scene, [-3, 0, 3], [-2, 1.4], 3.59);

  /* ---------- 人物與手機 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const A = add(new Person({ top: '#2f3f58', bottom: '#2f3f58', hair: '#2b1d14', skin: '#e2b48e', height: 1.0 }));
  const B = add(new Person({ top: '#6a6a70', bottom: '#6a6a70', hair: '#9a9a9a', skin: '#d9a77f', height: 1.02 }));
  const recep = add(new Person({ top: '#a63a4a', bottom: '#2b2f3a', hair: '#4a2f1c', skin: '#edc6a2', height: 0.96 }));
  // A 的白襯衫與領帶
  {
    const sh = box(0.14, 0.32, 0.01, '#f2f0ea'); sh.position.set(0, 0.42, 0.122);
    const tie = box(0.05, 0.28, 0.012, '#8a2a2a'); tie.position.set(0, 0.42, 0.13);
    A.torso.add(sh, tie);
  }
  { const lan = box(0.03, 0.2, 0.01, '#2a5ad8'); lan.position.set(0.1, 0.3, 0.125); A.torso.add(lan); const card = box(0.07, 0.1, 0.01, '#f2f0ea'); card.position.set(0.1, 0.18, 0.13); A.torso.add(card);
    const glasses = box(0.2, 0.03, 0.02, '#222'); glasses.position.set(0, 0.14, 0.12); B.head.add(glasses); }
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const star = loadPhone(scene, phone, 0.34);
  const brick = loadPhone(scene, { shape: 'brick', color: '#e3ddd0', id: 'brick-old' }, 0.46);
  const hA = makeHolder(A, star.obj, { ear: V(0, -0.045, 0), grip: V(0, -0.05, -0.02) });
  const hB = makeHolder(B, brick.obj, { ear: V(0, -0.1, 0), grip: V(0, -0.1, -0.04) });

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };
  const lookAt = (p, v, a = 1) => { p.look = v; p.lookAmt = a; };

  const A_START = V(-3.7, 0, 1.9), A_SPOT = V(0.4, 0, 1.0), B_SPOT = V(2.1, 0, 1.05), A_WALK_END = V(-1.4, 0, 1.6);
  const RECEP = V(-2.4, 0, -3.0);
  function bg(T) {
    recep.reset(); recep.pos.copy(RECEP); recep.yaw = faceTo(recep, V(0, 0, 3)); idle(recep, T, 4);
  }

  /* ---------- 劇本 ---------- */
  const beats = {
    lobby: {
      duration: 10,
      update(t, T) {
        A.reset(); A.walk(A_START, A_SPOT, t, 0.4, 8.2);
        if (t > 8.2) A.yaw = lerp(A.yaw, faceTo(A, B_SPOT), span(t, 8.2, 9));
        hA.go('belt', 'belt', 0); setLid(star, 0);
        B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, V(0.2, 0, 1.4)); idle(B, T, 1); hB.go('hand', 'hand', 0);
        lookAt(B, head(A), span(t, 1, 3) * 0.8);
        bg(T);
      }
    },
    buzz: {
      duration: 10,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = faceTo(A, B_SPOT) - 0.2;
        const vib = span(t, 1.0, 1.2) * (1 - span(t, 3.6, 3.8));
        A.bob = Math.sin(T * 55) * 0.012 * vib; A.lean = Math.sin(T * 41) * 0.02 * vib;
        const k = span(t, 4.4, 5.6);
        hA.go('belt', 'chest', k); setLid(star, span(t, 6.2, 7.2));
        lookAt(A, k > 0.1 ? hA.pos() : V(A_SPOT.x, 0.9, A_SPOT.z + 0.3), span(t, 1, 1.6));
        B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, A.pos); idle(B, T, 1); hB.go('hand', 'hand', 0);
        lookAt(B, head(A), 1);
        bg(T);
      }
    },
    talk: {
      duration: 11,
      update(t, T) {
        A.reset();
        const k = span(t, 0.4, 1.6);
        hA.go('chest', 'ear', k); setLid(star, 1);
        const wk = A.walk(A_SPOT, A_WALK_END, t, 1.8, 9.2);
        if (wk >= 1) A.yaw = lerp(A.yaw, faceTo(A, B_SPOT), span(t, 9.2, 10)); else if (wk === 0) A.yaw = faceTo(A, B_SPOT) - 0.2;
        if (wk > 0 && wk < 1) idle(A, T, 2);
        B.reset(); B.pos.copy(B_SPOT); idle(B, T, 1); hB.go('hand', 'hand', 0);
        B.yaw = faceTo(B, A.pos); lookAt(B, head(A), 0.9);
        bg(T);
      }
    },
    compare: {
      duration: 12,
      update(t, T) {
        A.reset(); A.pos.copy(V(0.9, 0, 1.0)); A.yaw = faceTo(A, B_SPOT);
        B.reset(); B.pos.copy(V(1.9, 0, 1.05)); B.yaw = faceTo(B, A.pos);
        hA.go('ear', 'chest', span(t, 0, 1.2));
        setLid(star, 1 - span(t, 3.2, 4.2));
        hB.go('hand', 'chest', span(t, 5.4, 6.8));
        const sw = span(t, 7.6, 8.4);
        lookAt(A, sw > 0.5 ? hB.pos() : hA.pos(), 1);
        lookAt(B, sw > 0.5 ? hA.pos() : head(A), 1);
        idle(A, T); idle(B, T, 1);
        const laugh = span(t, 9.6, 10.0) * (1 - span(t, 11, 11.6));
        B.bob += Math.abs(Math.sin(T * 10)) * 0.02 * laugh;
        bg(T);
      }
    },
    pocket: {
      duration: 12,
      update(t, T) {
        A.reset(); A.pos.copy(V(0.9, 0, 1.0)); A.yaw = faceTo(A, B_SPOT);
        B.reset(); B.pos.copy(V(1.9, 0, 1.05)); B.yaw = faceTo(B, A.pos);
        setLid(star, 0);
        hA.go('chest', 'pocket', span(t, 0.6, 2.0));
        hB.go('chest', 'pocket', span(t, 4.2, 5.8));
        lookAt(A, t < 2.4 ? hA.pos() : head(B), 1);
        lookAt(B, t < 4 ? head(A) : hB.pos(), 1);
        idle(A, T); idle(B, T, 1);
        const laugh = span(t, 8.0, 8.4) * (1 - span(t, 10.4, 11));
        A.bob += Math.abs(Math.sin(T * 11)) * 0.022 * laugh; A.headTilt -= 0.15 * laugh;
        bg(T);
      }
    }
  };

  function ambient() { /* 大廳裡沒有需要一直動的東西 */ }
  function finish() {
    people.forEach((p) => p.apply());
    hA.place(); hB.place();
  }

  return {
    view: { pos: V(0, 1.55, 3.6), yaw: 0, pitch: -0.05 },
    beats, ambient, finish,
    insets: startacInsets,
    focus: {
      lobby: () => V(0.4, 1.4, -0.5),
      group: () => head(A).lerp(head(B), 0.5),
      phone: () => hA.pos(),
      brick: () => hB.pos()
    },
    hotspots: {
      startac: { pos: () => hA.pos().add(V(0, 0.42, 0)), size: 0.32 },
      vibe: { pos: () => A.local(-0.42, 0.95, 0.1), size: 0.3 },
      board: { pos: () => V(-3.1, 2.6, -3.8), size: 0.55 },
      pocket: { pos: () => A.local(-0.17, 1.62, 0.2), size: 0.3 },
      weight: { pos: () => hB.pos().add(V(0.3, 0.25, 0)), size: 0.34 },
      oldbrick: { pos: () => hB.pos().add(V(-0.3, 0.6, 0)), size: 0.34 }
    }
  };
}
