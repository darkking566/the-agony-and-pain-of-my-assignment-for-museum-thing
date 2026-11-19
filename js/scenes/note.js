// 沉浸場景：2011 年大學圖書館的書架旁，同學拿出 Galaxy Note，用 S Pen 直接在大螢幕上寫字、畫圖。
// 字幕和解說文字在 js/data.js 的 scenes['galaxy-note']；這裡只負責場景和動作。
import { noteInsets } from './insets.js';
import * as THREE from 'three';
import { V, span, lerp, mat, box, cyl, sign, Person } from '../scene-kit.js';
import { loadPhone, makeHolder, finger } from './kit2.js';
import { richRoom, ceilingLights, windowView, leafyPlant, framedPicture, surfaceTex, blobShadow } from './props.js';

export function build({ scene, phone }) {
  /* ---------- 光線與圖書館 ---------- */
  scene.background = new THREE.Color('#d8d2c6');
  scene.add(new THREE.HemisphereLight('#fff4e2', '#8f8068', 2.0));
  const sun = new THREE.DirectionalLight('#ffe9c4', 2.2);
  sun.position.set(-9, 6.5, 2); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  richRoom(scene, { w: 10, d: 8, h: 3.4, floor: { kind: 'parquet', color: '#9a7650', size: 2, rough: 0.42 }, wall: { kind: 'plaster', color: '#e8e1d0', size: 3 }, ceil: { kind: 'ceil', color: '#efe9dc', size: 1.8 }, base: '#4a3a28', crown: '#efe9dc' });
  const rugT = surfaceTex('carpet', '#7a4a3a').clone(); rugT.repeat.set(2.4, 1.5); rugT.needsUpdate = true;
  const rug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.02, 2.6), [mat('#4a2a22'), mat('#4a2a22'), new THREE.MeshStandardMaterial({ map: rugT, roughness: 1 }), mat('#4a2a22'), mat('#4a2a22'), mat('#4a2a22')]); rug.position.set(0.9, 0.01, 1.2); rug.receiveShadow = true; scene.add(rug);
  const rugB = box(3.7, 0.005, 2.1, '#a8745a'); rugB.position.set(0.9, 0.022, 1.2); rugB.castShadow = false; scene.add(rugB);
  // 左牆窗戶：窗外是校園的樹
  [-2.4, 1.2].forEach((z) => windowView(scene, { pos: V(-5 + 0.11, 1.9, z), yaw: Math.PI / 2, w: 2.6, h: 1.9, view: 'trees', frame: '#5a4a3c' }));

  // 書架：框加上一排排書
  const bookColors = ['#8a3b3b', '#3b5a8a', '#d9a441', '#4a7a5a', '#6a4a8a', '#e0d6c0', '#a8603b', '#2f3f58'];
  let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  function shelf(x, z, yaw, w = 3.0) {
    const g = new THREE.Group();
    const back = box(w, 2.6, 0.05, '#6b5238'); back.position.set(0, 1.3, -0.15);
    const l = box(0.05, 2.6, 0.4, '#6b5238'); l.position.set(-w / 2, 1.3, 0);
    const r = box(0.05, 2.6, 0.4, '#6b5238'); r.position.set(w / 2, 1.3, 0);
    g.add(back, l, r);
    for (let row = 0; row < 5; row++) {
      const plank = box(w, 0.04, 0.4, '#6b5238'); plank.position.set(0, 0.1 + row * 0.55, 0); g.add(plank);
      let bx = -w / 2 + 0.08;
      while (bx < w / 2 - 0.12) {
        const bw = 0.03 + rnd() * 0.04, bh = 0.28 + rnd() * 0.18;
        const b = box(bw, bh, 0.24, bookColors[Math.floor(rnd() * bookColors.length)]);
        b.position.set(bx + bw / 2, 0.12 + row * 0.55 + bh / 2, -0.02); b.castShadow = false; g.add(b);
        bx += bw + 0.005;
      }
    }
    g.position.set(x, 0, z); g.rotation.y = yaw; scene.add(g);
  }
  shelf(-1.4, -3.75, 0); shelf(1.8, -3.75, 0); shelf(4.8, -1.2, -Math.PI / 2); shelf(4.8, 2.0, -Math.PI / 2, 2.8);
  const sgn = sign('LIBRARY　閱覽區', 2.4, 0.42, { bg: '#2f3f58', color: '#f1ebd9', size: 64, w: 1024, h: 180, weight: 700 });
  sgn.position.set(0.2, 2.95, -4 + 0.16); scene.add(sgn);

  // 自習桌、檯燈
  const table = box(2.4, 0.06, 0.9, '#b58b5a'); table.position.set(-2.8, 0.76, 2.2);
  [[-1.1, -0.38], [1.1, -0.38], [-1.1, 0.38], [1.1, 0.38]].forEach(([x, z]) => {
    const leg = box(0.05, 0.74, 0.05, '#6d747a'); leg.position.set(-2.8 + x, 0.37, 2.2 + z); scene.add(leg);
  });
  const lampBase = cyl(0.1, 0.12, 0.03, '#2f4a3c', 12); lampBase.position.set(-3.3, 0.8, 2.2);
  const lampArm = cyl(0.015, 0.015, 0.45, '#2f4a3c', 6); lampArm.position.set(-3.3, 1.02, 2.2);
  const lampHead = cyl(0.04, 0.12, 0.12, '#2f4a3c', 12); lampHead.position.set(-3.3, 1.28, 2.2);
  scene.add(table, lampBase, lampArm, lampHead);
  [[-3.8, 2.2], [-2.0, 2.2]].forEach(([x, z]) => {
    const seat = box(0.45, 0.04, 0.45, '#3b4a5a'); seat.position.set(x, 0.46, z + 0.8);
    const bk = box(0.45, 0.4, 0.04, '#3b4a5a'); bk.position.set(x, 0.7, z + 1.03);
    scene.add(seat, bk);
  });
  ceilingLights(scene, [-3, 0, 3], [-1.6, 1.4], 3.39);
  // 書桌上的東西：筆電、書堆、馬克杯；牆上的畫、地球儀、盆栽
  { const lap = box(0.34, 0.02, 0.24, '#b9bcc0', { metalness: 0.6, roughness: 0.4 }); lap.position.set(-2.4, 0.8, 2.3);
    const scr = box(0.34, 0.22, 0.015, '#1b1d22'); scr.position.set(-2.4, 0.91, 2.18); scr.rotation.x = -0.25;
    const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), new THREE.MeshBasicMaterial({ color: '#cfe0f4' })); lit.position.set(-2.4, 0.91, 2.19); lit.rotation.x = -0.25;
    ['#8a3b3b', '#3b5a8a', '#d9a441'].forEach((c, i) => { const b = box(0.28 - i * 0.02, 0.05, 0.2, c); b.position.set(-3.1, 0.8 + i * 0.05, 2.0); b.rotation.y = i * 0.2; scene.add(b); });
    const mug = cyl(0.04, 0.035, 0.08, '#f2efe8', 12); mug.position.set(-2.1, 0.82, 2.4);
    const globeStand = cyl(0.12, 0.14, 0.04, '#4a3a28', 12); globeStand.position.set(-4.3, 0.02, -2.0);
    const globePole = cyl(0.015, 0.015, 0.7, '#4a3a28', 6); globePole.position.set(-4.3, 0.37, -2.0);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), new THREE.MeshStandardMaterial({ color: '#4a7aa8', roughness: 0.5 })); globe.position.set(-4.3, 0.9, -2.0);
    scene.add(lap, scr, lit, mug, globeStand, globePole, globe); }
  framedPicture(scene, -5 + 0.12, 1.9, -3.0, Math.PI / 2, 0.9, 0.6, 1); framedPicture(scene, 3.4, 2.2, -4 + 0.13, 0, 0.8, 0.55, 2);
  leafyPlant(scene, -4.4, -3.4, 1.2, 1); leafyPlant(scene, 4.3, 3.4, 1.0, 2);

  /* ---------- 人物與手機 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const A = add(new Person({ top: '#4a6a8a', bottom: '#2f3340', hair: '#1b1410', skin: '#e2b48e', height: 0.98 }));
  const B = add(new Person({ top: '#b5533c', bottom: '#3a3a42', hair: '#3a2a1c', skin: '#d9a77f', height: 0.94, dress: true }));
  const C = add(new Person({ top: '#7a8c5a', bottom: '#4a4a4a', hair: '#8a6a3a', skin: '#edc6a2', height: 1.0 }));

  { const pack = box(0.32, 0.4, 0.14, '#2f3f58'); pack.position.set(0, 0.28, -0.2); A.torso.add(pack);
    const gl = box(0.2, 0.03, 0.02, '#222'); gl.position.set(0, 0.14, 0.12); A.head.add(gl);
    const sc = box(0.3, 0.09, 0.27, '#d9a441'); sc.position.set(0, 0.61, 0); B.torso.add(sc);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.07, 14), mat('#43483f', { roughness: 1 })); cap.position.set(0, 0.24, 0); C.head.add(cap); }
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const noteP = loadPhone(scene, phone, 0.42);
  // 模型自帶的筆先藏起來，改用一支真的、拿在手上的筆
  noteP.obj.traverse((o) => {
    if (!o.isMesh) return;
    const t = o.geometry.type, pr = o.geometry.parameters || {};
    if ((t === 'CylinderGeometry' && pr.radiusTop === 0.012) || (t === 'ConeGeometry' && pr.radius === 0.012)) o.visible = false;
  });
  const small = loadPhone(scene, { shape: 'candybar', color: '#2f5aa8', id: 'small-2011' }, 0.22);
  const hA = makeHolder(A, noteP.obj, { ear: V(0, -0.08, 0), grip: V(0, -0.08, -0.02) });
  const hB = makeHolder(B, small.obj, { ear: V(0, -0.05, 0), grip: V(0, -0.04, -0.02) });

  const pen = new THREE.Group();
  {
    const body = cyl(0.01, 0.01, 0.16, '#2a2a2e', 8); body.position.y = 0.0;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.03, 8), mat('#d9d9d9')); tip.position.y = -0.095; tip.rotation.z = Math.PI;
    pen.add(body, tip);
    pen.position.set(0, -0.03, 0.045); pen.rotation.set(-0.95, 0, 0);
    pen.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    A.arms.L.grip.add(pen);
    pen.visible = false;
  }

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };
  const lookAt = (p, v, a = 1) => { p.look = v; p.lookAmt = a; };

  const A_SPOT = V(0.4, 0, 1.15), B_SPOT = V(1.85, 0, 1.15), C_SPOT = V(3.4, 0, -2.4);
  function bg(T) {
    C.reset(); C.pos.copy(C_SPOT); C.yaw = Math.PI * 0.85; idle(C, T, 5); lookAt(C, V(3.4, 1.6, -3.7), 0.8);
  }
  function writing(t, t0, lineGap = 0.035) {
    // 在螢幕上一行一行寫字：回傳手指在螢幕面上的位置
    const u = Math.max(0, (t - t0)) * 0.9;
    const line = Math.floor(u) % 4, f = u - Math.floor(u);
    return [lerp(-0.055, 0.055, f), 0.06 - line * lineGap + Math.sin(t * 32) * 0.004];
  }

  /* ---------- 劇本 ---------- */
  const beats = {
    library: {
      duration: 10,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = faceTo(A, B_SPOT); hA.go('pocket', 'pocket', 0); idle(A, T);
        B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, A.pos); idle(B, T, 1); hB.go('hand', 'hand', 0);
        lookAt(A, head(B), 0.8); lookAt(B, head(A), 0.8);
        finger(A, hA, 0, 0, 0); pen.visible = false; bg(T);
      }
    },
    pull: {
      duration: 11,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = faceTo(A, B_SPOT);
        const k = span(t, 1.0, 2.8);
        hA.go('pocket', 'chest', k);
        B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, A.pos); hB.go('hand', 'hand', 0);
        const lean = span(t, 3.0, 4.2);
        B.lean = 0.12 * lean; lookAt(B, hA.pos(), span(t, 2.0, 3.0));
        lookAt(A, hA.pos(), k);
        idle(A, T); B.headTilt += Math.sin(T * 2.4) * 0.03 * lean;
        const wow = span(t, 6.4, 7.0) * (1 - span(t, 8.6, 9.2));
        B.bob += wow * 0.03 * Math.abs(Math.sin(T * 10));
        finger(A, hA, 0, 0, 0); pen.visible = false; bg(T);
      }
    },
    write: {
      duration: 12,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = faceTo(A, B_SPOT) - 0.15;
        hA.go('chest', 'chest', 0); lookAt(A, hA.pos(), 1); idle(A, T);
        pen.visible = t > 0.8;
        const amt = span(t, 1.4, 2.4);
        const [ox, oy] = writing(t, 2.6);
        finger(A, hA, ox, oy, amt);
        B.reset(); B.pos.copy(V(1.5, 0, 1.2)); B.yaw = faceTo(B, A.pos); B.lean = 0.14; hB.go('hand', 'hand', 0);
        lookAt(B, hA.pos(), 1); B.headTilt = Math.sin(T * 2.0) * 0.04;
        bg(T);
      }
    },
    draw: {
      duration: 12,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = faceTo(A, B_SPOT) - 0.1;
        hA.go('chest', 'chest', 0); lookAt(A, hA.pos(), 1); idle(A, T);
        pen.visible = true;
        // 畫圖：手指在螢幕上畫圈和線
        const a = (t - 0.6) * 2.2;
        const k = span(t, 0.2, 1.0) * (1 - span(t, 8.6, 9.4));
        finger(A, hA, Math.cos(a) * 0.045, 0.01 + Math.sin(a * 1.3) * 0.05, k);
        B.reset(); B.pos.copy(V(1.5, 0, 1.2)); B.yaw = faceTo(B, A.pos); B.lean = 0.14; hB.go('hand', 'hand', 0);
        lookAt(B, hA.pos(), 1);
        const nod = span(t, 6.0, 6.4) * (1 - span(t, 9.2, 9.8));
        B.headTilt = 0.18 * Math.abs(Math.sin(T * 5)) * nod;
        bg(T);
      }
    },
    size: {
      duration: 12,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = faceTo(A, B_SPOT);
        B.reset(); B.pos.copy(V(1.7, 0, 1.15)); B.yaw = faceTo(B, A.pos);
        pen.visible = false; finger(A, hA, 0, 0, 0);
        hB.go('hand', 'chest', span(t, 0.8, 2.2));
        const away = span(t, 7.0, 8.6);
        hA.go('chest', 'pocket', away);
        const sw = span(t, 3.4, 4.2) * (1 - span(t, 6.4, 7.0));
        lookAt(A, sw > 0.5 ? hB.pos() : hA.pos(), 1);
        lookAt(B, sw > 0.5 ? hA.pos() : hB.pos(), 1);
        idle(A, T); idle(B, T, 1);
        const laugh = span(t, 9.0, 9.4) * (1 - span(t, 10.8, 11.4));
        B.bob += Math.abs(Math.sin(T * 10)) * 0.022 * laugh; A.bob += Math.abs(Math.sin(T * 9)) * 0.018 * laugh;
        bg(T);
      }
    }
  };

  function ambient() { /* 圖書館裡沒有需要一直動的東西 */ }
  function finish() {
    people.forEach((p) => p.apply());
    hA.place(); hB.place();
  }

  return {
    view: { pos: V(0, 1.55, 3.6), yaw: 0, pitch: -0.05 },
    beats, ambient, finish,
    insets: noteInsets,
    focus: {
      library: () => V(0.8, 1.4, -0.5),
      group: () => head(A).lerp(head(B), 0.5),
      phone: () => hA.pos(),
      small: () => hB.pos()
    },
    hotspots: {
      note: { pos: () => hA.pos().add(V(0, 0.4, 0)), size: 0.32 },
      oldphone: { pos: () => hB.pos().add(V(0.1, 0.3, 0)), size: 0.3 },
      sign: { pos: () => V(0.2, 3.25, -3.8), size: 0.55 },
      spen: { pos: () => hA.pos().add(V(-0.3, 0.2, 0)), size: 0.28 },
      screen: { pos: () => hA.pos().add(V(0.3, 0.55, 0)), size: 0.3 },
      phablet: { pos: () => head(A).lerp(head(B), 0.5).add(V(0, 0.55, 0)), size: 0.5 }
    }
  };
}
