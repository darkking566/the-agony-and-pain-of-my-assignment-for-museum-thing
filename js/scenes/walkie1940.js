// 沉浸場景：1940 年代的野外訓練場，一位通信兵背著無線電，跟遠處的指揮官通話。
// 字幕和解說文字在 js/data.js 的 scenes['scr-300']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, sign, Person, placeBetween } from '../scene-kit.js';
import { cloudSky, leafTree, GREEN, blobShadow } from './props.js';
import { grassTex, dirtTex, grassTufts, rocks, ridgeTent, willysJeep, sandbags, plankCrate, wirePoles } from './props2.js';

const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };

export function build({ scene }) {
  /* ---------- 天空、光線、地面 ---------- */
  const skyGeo = new THREE.SphereGeometry(220, 32, 16);
  const top = new THREE.Color('#6d8fb0'), hor = new THREE.Color('#f0e0bc');
  const cols = [];
  const pos = skyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = Math.max(0, Math.min(1, pos.getY(i) / 220 * 1.8));
    const c = hor.clone().lerp(top, k);
    cols.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
  cloudSky(scene);
  scene.fog = new THREE.Fog('#e6d6b4', 30, 120);

  scene.add(new THREE.HemisphereLight('#f7f1e0', '#6a6040', 1.5));
  const sun = new THREE.DirectionalLight('#ffe2a8', 2.6);
  sun.position.set(-18, 26, 12);
  sun.target.position.set(0, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 90 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ color: '#ffffff', map: grassTex('#7d8a4e', 3, [40, 40]), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);
  // 一條泥土小路，從左邊延伸到人物的位置
  const path = new THREE.Mesh(new THREE.PlaneGeometry(60, 3), new THREE.MeshStandardMaterial({ map: dirtTex('#9c8660', 5, [14, 1]), roughness: 1 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(-6, 0, 0.5);
  path.receiveShadow = true;
  scene.add(path);

  // 遠處的木柵欄、一排木箱、幾棵樹
  for (let x = -12; x <= 12; x += 2) {
    const post = box(0.12, 0.9, 0.12, '#6b5034'); post.position.set(x, 0.45, -3); scene.add(post);
  }
  [0.4, 0.75].forEach((y) => { const rail = box(24, 0.08, 0.08, '#7a5c3c'); rail.position.set(0, y, -3); scene.add(rail); });
  plankCrate(scene, 4.2, 0.3, -0.6, { w: 0.8, h: 0.6, d: 0.8, color: '#7a6040', rot: 0.1 });
  plankCrate(scene, 5.1, 0.25, -0.3, { w: 0.7, h: 0.5, d: 0.7, color: '#6b5538', rot: -0.2 });
  plankCrate(scene, 4.35, 0.85, -0.6, { w: 0.6, h: 0.5, d: 0.55, color: '#6b5538', rot: 0.35 });
  leafTree(scene, -9, -6, 3, 1.2, GREEN);
  leafTree(scene, 8, -7, 7, 1.1, GREEN);
  leafTree(scene, -4, -10, 11, 1.0, GREEN);
  leafTree(scene, 11, -1.5, 5, 1.0, GREEN);

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const op = add(new Person({ top: '#5a6440', bottom: '#4a5034', hair: '#2a2018', skin: '#c99a72', height: 0.98 }));
  {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.07, 14), new THREE.MeshStandardMaterial({ color: '#4a5033', roughness: 1 }));
    cap.position.set(0, 0.24, 0); op.head.add(cap);
    // 背上的無線電：機身與拉出的長天線
    const body = box(0.42, 0.52, 0.22, '#3a4028'); body.position.set(0, 0.12, -0.2); op.torso.add(body);
    const handle = box(0.2, 0.04, 0.04, '#222'); handle.position.set(0, 0.42, -0.2); op.torso.add(handle);
    const ant = cyl(0.008, 0.008, 1.2, '#1e1e1e', 6); ant.position.set(-0.14, 0.92, -0.22); ant.rotation.z = 0.06; op.torso.add(ant);
  }
  const cmd = add(new Person({ top: '#6b6f4a', bottom: '#4a5034', hair: '#3a2a1c', skin: '#e2b48e', height: 1.02 }));
  {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.07, 14), new THREE.MeshStandardMaterial({ color: '#4a5033', roughness: 1 }));
    cap.position.set(0, 0.24, 0); cmd.head.add(cap);
  }
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const OP_SPOT = V(-0.6, 0, 0.5);
  const CMD_SPOT = V(2.8, 0, -6.5);

  /* ---------- 營區的其他陳設與背景的士兵 ---------- */
  // 帳篷（四角錐）與吉普車（簡化的方塊造型）
  ridgeTent(scene, -6.5, -4.6, 0.25, { w: 2.2, l: 2.8, h: 1.6, color: '#6b7248' });
  willysJeep(scene, 7.0, -3.5, -0.35, '#4a5234');
  // 旗桿與旗子
  const pole = cyl(0.04, 0.04, 3.2, '#c9c3b0', 8); pole.position.set(-2.8, 1.6, -6.0); scene.add(pole);
  const flag = new THREE.Mesh((() => { const g = new THREE.PlaneGeometry(0.9, 0.5, 12, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) + 0.45; p.setZ(i, Math.sin(u * 7) * 0.06 * u); } g.computeVertexNormals(); return g; })(), new THREE.MeshStandardMaterial({ color: '#b8382c', roughness: 0.9, side: THREE.DoubleSide }));
  flag.position.set(-2.3, 2.85, -6.0); flag.castShadow = true; scene.add(flag);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: '#c9a84a', metalness: 0.7, roughness: 0.3 })); finial.position.set(-2.8, 3.25, -6.0); scene.add(finial);
  // 沙包（靠在柵欄旁）
  sandbags(scene, -3.7, -1.2, { r: 1.3, a0: -0.75, a1: 0.75, rows: 3, color: '#8a7a55', seed: 3 });
  sandbags(scene, 8.6, -7.2, { r: 2.0, a0: -1.2, a1: 0.4, rows: 4, color: '#80724f', seed: 8 });
  // 背景的士兵：一位站在營區邊，一位在柵欄後面來回走
  const sold1 = add(new Person({ top: '#4a5234', bottom: '#3e4530', hair: '#2a2018', skin: '#c99a72', height: 0.97 }));
  const sold2 = add(new Person({ top: '#5a6440', bottom: '#4a5034', hair: '#1f1712', skin: '#e0b494', height: 1.0 }));
  [sold1, sold2].forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });

  /* ---------- 第三輪：補給卡車、第二排帳篷、油桶堆 ---------- */
  // 補給卡車（方形貨箱加駕駛室，後輪兩個）
  {
    const truck = new THREE.Group();
    const bed = box(2.6, 1.0, 1.4, '#4f5a3a'); bed.position.set(0, 0.85, 0); truck.add(bed);
    const cab = box(0.9, 0.9, 1.3, '#4f5a3a'); cab.position.set(-1.75, 0.75, 0); truck.add(cab);
    const hood = box(0.7, 0.45, 1.25, '#434d31'); hood.position.set(-2.4, 0.45, 0); truck.add(hood);
    const canvas = box(2.5, 0.35, 1.3, '#8a8f6a'); canvas.position.set(0, 1.5, 0); truck.add(canvas);
    [[-1.7, 0.72], [-1.7, -0.72], [0.9, 0.72], [0.9, -0.72]].forEach(([x, z]) => {
      const w = cyl(0.38, 0.38, 0.22, '#1d1d1f', 12); w.rotation.x = Math.PI / 2; w.position.set(x, 0.38, z); truck.add(w);
    });
    truck.position.set(-7.4, 0, -7.6); truck.rotation.y = 0.2; scene.add(truck);
  }
  // 第二排帳篷
  [[1.4, -8.6], [3.9, -8.9], [6.4, -8.6]].forEach(([x, z], i) => ridgeTent(scene, x, z, (i - 1) * 0.08, { w: 1.8, l: 2.3, h: 1.3, color: ['#7a7f55', '#6f7550', '#7a7f55'][i] }));
  // 油桶堆（三層）
  [[0, 0.4, -4.2], [0.55, 0.4, -4.2], [0.28, 1.2, -4.2], [-0.2, 0.4, -4.8], [0.4, 0.4, -4.8]].forEach(([x, y, z]) => {
    const drum = cyl(0.25, 0.25, 0.8, '#3f5a3a', 14); drum.position.set(x + 5.8, y, z); scene.add(drum);
  });
  /* ---------- 第二輪：遠景、通信塔、補給區 ---------- */
  // 遠方的山丘（大型的錐形，顏色淡一點，表示距離感）
  [[-40, -50, 26, '#7d8a5e'], [0, -60, 34, '#6c7a50'], [42, -55, 28, '#7d8a5e']].forEach(([x, z, r, c]) => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.55, 18), new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
    hill.position.set(x, r * 0.27, z); scene.add(hill);
  });
  // 通信塔：細長的鋼架，有橫桿與頂端的小燈
  const towerX = 9.5, towerZ = -10;
  for (let i = 0; i < 3; i++) {
    const leg = cyl(0.05, 0.08, 6.5, '#8a8f96', 6);
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(towerX + Math.cos(a) * 0.45, 3.25, towerZ + Math.sin(a) * 0.45);
    leg.rotation.z = Math.cos(a) * 0.06; leg.rotation.x = Math.sin(a) * 0.06;
    scene.add(leg);
  }
  for (let y = 1; y < 6.5; y += 1.1) {
    const cross = box(0.9, 0.04, 0.04, '#a4a9b0'); cross.position.set(towerX, y, towerZ); scene.add(cross);
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff5a4a' }));
  beacon.position.set(towerX, 6.6, towerZ); scene.add(beacon);
  // 補給區：堆疊的木箱（上面有模板字樣）、油桶
  for (let i = 0; i < 4; i++) plankCrate(scene, -8.4 + (i % 2) * 0.95, 0.35 + Math.floor(i / 2) * 0.7, -6.4, { w: 0.9, h: 0.7, d: 0.7, color: i % 2 ? '#7a6040' : '#6b5538' });
  const stencil = sign('U.S.', 0.5, 0.3, { bg: '#6b5538', color: '#e8dcae', size: 70, w: 256, h: 160, weight: 800 });
  stencil.position.set(-8.4, 0.4, -6.025); scene.add(stencil);
  // 草叢、石頭、野戰電話線（從通信塔拉向指揮所）
  const onPath = (x, z) => Math.abs(z - 0.5) < 1.7 || (Math.abs(x + 0.6) < 1.2 && z > -1 && z < 4);
  grassTufts(scene, { cx: 0, cz: -4, w: 34, d: 22, count: 2600, seed: 4, avoid: onPath });
  grassTufts(scene, { cx: 0, cz: 6, w: 30, d: 8, count: 900, seed: 9, avoid: onPath });
  rocks(scene, { cx: 0, cz: -2, w: 30, d: 18, count: 60, seed: 5 });
  wirePoles(scene, [[9.5, -10], [5.5, -11.2], [1.5, -11.6], [-2.5, -11.4], [-6.5, -10.8]], { h: 4.0 });
  [[-6.0, -7.0], [-5.4, -7.0], [-6.7, -7.0]].forEach(([x, z]) => {
    const drum = cyl(0.25, 0.25, 0.8, '#3f5a3a', 14); drum.position.set(x, 0.4, z); scene.add(drum);
  });
  // 矮灌木叢（營區邊緣）
  [[-3.2, -4.4], [6.4, -4.8], [-10.5, -5.2], [13.5, -6.0]].forEach(([x, z], i) => {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + (i % 2) * 0.2, 0), new THREE.MeshStandardMaterial({ color: '#4f6a3a', roughness: 1 }));
    bush.position.set(x, 0.45, z); bush.castShadow = true; scene.add(bush);
  });

  /* ---------- 話筒（接在背上的無線電） ---------- */
  const mic = new THREE.Group();
  {
    const hm = new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.5 });
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.07), hm); ear.position.set(0, 0.1, 0.015);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), hm);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.07), hm); mouth.position.set(0, -0.1, 0.015);
    mic.add(ear, bar, mouth);
    mic.scale.setScalar(1.6);
    mic.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }
  const opScene = new THREE.Group(); opScene.add(mic); scene.add(opScene);
  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.02, 0.05);
  op.arms.R.grip.add(handHold);

  // 指揮官的話筒：接在他的耳邊，只在通話段落出現
  const cmdMic = new THREE.Group();
  {
    const hm = new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.5 });
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.07), hm); ear.position.set(0, 0, 0.015);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), hm); bar.position.set(0, -0.1, 0);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.07), hm); mouth.position.set(0, -0.2, 0.015);
    cmdMic.add(ear, bar, mouth);
    cmdMic.scale.setScalar(1.6);
    cmdMic.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }
  scene.add(cmdMic);

  const earGripOp = () => op.ear.R.localToWorld(V(0, -0.11, -0.06));
  const restHand = () => op.local(-0.3, 0.84, 0.08);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));

  // 把話筒從手上移到耳邊（k: 0→1）
  let micK = 0;
  function setMic(k) {
    micK = k;
    op.reach.R = k <= 0 ? null : {
      target: () => restHand().lerp(earGripOp(), k),
      pole: () => op.local(-0.6, 0.7, 0.1).lerp(op.local(-0.75, 0.75, 0.3), k)
    };
  }
  function placeMic() {
    if (micK <= 0) placeBetween(mic, handHold, handHold, 0);
    else placeBetween(mic, handHold, op.ear.R, micK);
  }

  /* ---------- 劇本 ---------- */
  const beats = {
    // 通信兵背著無線電，沿著小路走來
    walk: {
      duration: 8,
      update(t, T) {
        op.reset();
        op.walk(V(-12, 0, 0.5), OP_SPOT, t, 0, 6);
        if (t > 6) op.yaw = lerp(Math.PI / 2, 0.3, span(t, 6, 7));
        setMic(0);
        idle(op, T);
        cmd.reset(); cmd.pos.copy(CMD_SPOT); cmd.yaw = faceTo(cmd, OP_SPOT); idle(cmd, T, 2);
        cmdMic.visible = false;
      }
    },
    // 停下來，把話筒貼到耳邊，按住通話鍵
    call: {
      duration: 9,
      update(t, T) {
        op.reset(); op.pos.copy(OP_SPOT); op.yaw = 0.3;
        setMic(span(t, 0.6, 2.4));
        // 說話時頭微微朝著話筒
        op.look = V(0.3, 1.45, -6); op.lookAmt = 0.25;
        idle(op, T);
        cmd.reset(); cmd.pos.copy(CMD_SPOT); cmd.yaw = faceTo(cmd, OP_SPOT); idle(cmd, T, 2);
        cmdMic.visible = false;
      }
    },
    // 遠處的指揮官拿起自己的話筒，回覆一句
    reply: {
      duration: 8,
      update(t, T) {
        op.reset(); op.pos.copy(OP_SPOT); op.yaw = 0.3;
        setMic(1);
        op.look = head(cmd); op.lookAmt = 0.6;
        idle(op, T);
        cmd.reset(); cmd.pos.copy(CMD_SPOT); cmd.yaw = faceTo(cmd, OP_SPOT);
        cmd.look = head(op); cmd.lookAmt = 0.5;
        idle(cmd, T, 2);
        cmdMic.visible = true;
      }
    }
  };

  // 背景的士兵：一位站著站崗（身體微微晃動），一位在柵欄後面來回走
  function ambient(T) {
    sold1.reset(); sold1.pos.set(-4.2, 0, -5.0); sold1.yaw = 0.5; idle(sold1, T, 1);
    sold2.reset();
    const L = 20, d = (T * 0.8) % L;
    const x = d < L / 2 ? -9 + d * 1.0 : 11 - (d - L / 2) * 1.0;
    sold2.pos.set(x, 0, -1.9);
    sold2.yaw = d < L / 2 ? Math.PI / 2 : -Math.PI / 2;
    sold2.walkAmt = 1; sold2.walkPhase = d * 4.4;
  }
  function finish() {
    people.forEach((p) => p.apply());
    placeMic();
    // 指揮官的話筒貼在他耳邊（人物定位之後才算，位置才正確）
    if (cmdMic.visible) {
      cmd.root.updateMatrixWorld(true);
      cmdMic.position.copy(cmd.ear.R.getWorldPosition(V()));
      cmdMic.quaternion.copy(cmd.ear.R.getWorldQuaternion(new THREE.Quaternion()));
    }
  }

  /* ---------- 螢幕特寫：無線電面板 ---------- */
  // 通話：撥盤的指針擺動，按住通話鍵時「發話」燈亮起
  function callInset(c, W, H, t) {
    const k = W / 320; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#3a4028'; c.fillRect(0, 0, 320, h);
    c.fillStyle = '#20241a'; rr(c, 14, 14, 292, h - 28, 12); c.fill();
    // 撥盤
    const cx = 110, cy = 150, R = 80;
    c.strokeStyle = '#c5b98a'; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R, Math.PI, 2 * Math.PI); c.stroke();
    c.fillStyle = '#c5b98a'; c.font = `700 12px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) { const a = Math.PI + (i / 4) * Math.PI; c.fillText(String(i * 10), cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16)); }
    const a = Math.PI + (0.35 + 0.25 * Math.sin(t * 1.3)) * Math.PI;
    c.strokeStyle = '#f5e6b0'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); c.stroke();
    // 發話燈
    const tx = span(t, 0.8, 1.6) * (1 - span(t, 6.2, 6.8));
    c.fillStyle = tx > 0.5 ? '#ef4444' : '#4a1d1d'; c.beginPath(); c.arc(240, 80, 14, 0, 7); c.fill();
    c.fillStyle = '#e8dcae'; c.font = `700 14px ${FONT}`; c.textAlign = 'left';
    c.fillText('發話', 262, 80);
    c.fillText(tx > 0.5 ? '通話中' : '待機', 230, 120);
  }
  // 收話：訊號波形，指揮官回覆時波形會起伏
  function replyInset(c, W, H, t) {
    const k = W / 320; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#20241a'; c.fillRect(0, 0, 320, h);
    c.fillStyle = '#c5b98a'; c.font = `700 14px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('收話', 14, 20);
    const amp = 0.15 + 0.85 * span(t, 0.8, 1.6) * (1 - span(t, 4.8, 5.4));
    c.strokeStyle = '#86efac'; c.lineWidth = 2.5;
    c.beginPath();
    for (let x = 14; x <= 306; x += 3) {
      const y = h / 2 + Math.sin((x * 0.09) + t * 6) * 26 * amp + Math.sin(x * 0.23 + t * 3) * 8 * amp;
      if (x === 14) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    c.fillStyle = '#e8dcae'; c.font = `600 13px ${FONT}`; c.textAlign = 'center';
    c.fillText(t > 1.6 ? '收到，完畢。' : '…', 160, h - 22);
  }

  return {
    view: { pos: V(0, 1.6, 3.0), yaw: 0, pitch: -0.04 },
    beats,
    ambient,
    finish,
    insets: {
      call: { aspect: 1.5, tone: 'phone', label: '無線電面板', draw: (c, W, H, t) => callInset(c, W, H, t) },
      reply: { aspect: 1.5, tone: 'phone', label: '收話', draw: (c, W, H, t) => replyInset(c, W, H, t) }
    },
    focus: {
      walk: () => V(-2, 1.4, 0),
      op: () => head(op),
      radio: () => op.torso.localToWorld(V(0, 0.2, -0.2)),
      cmd: () => head(cmd)
    },
    hotspots: {
      radio: { pos: () => op.torso.localToWorld(V(0, 0.3, -0.25)), size: 0.45 },
      antenna: { pos: () => op.torso.localToWorld(V(-0.14, 1.2, -0.22)), size: 0.4 },
      handset: { pos: () => op.ear.R.localToWorld(V(0, 0.02, 0)), size: 0.35 },
      cmd: { pos: () => head(cmd).add(V(0, 0.5, 0)), size: 0.5 }
    }
  };
}
