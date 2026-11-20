// 沉浸場景：1984 年的街頭，一位上班族拿出 DynaTAC 8000X 講電話。
// 字幕和解說文字在 js/data.js 的 scenes['dynatac-8000x']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, mat, box, cyl, sign, Person, placeBetween, building, textTexture } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { asphaltTex, pavingTex, blobShadow, decal, cloudSky, leafTree, GREEN, manhole, bench, bicycle, postBox, makeSedan, richBuilding, lampPost, hydrantAndGrate } from './props.js';

export function build({ scene, phone }) {
  /* ---------- 天空、光線、地面 ---------- */
  const skyGeo = new THREE.SphereGeometry(220, 32, 16);
  const top = new THREE.Color('#6f9cc6'), hor = new THREE.Color('#f1d6b2');
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
  scene.fog = new THREE.Fog('#e6d3b8', 40, 130);

  scene.add(new THREE.HemisphereLight('#dde8f2', '#6b5a48', 1.25));
  const sun = new THREE.DirectionalLight('#ffd9a8', 2.4);
  sun.position.set(-22, 30, 16);
  sun.target.position.set(0, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  const fill = new THREE.DirectionalLight('#b4c4da', 0.35); fill.position.set(14, 10, 18); scene.add(fill);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  const walkMat = (w, d) => new THREE.MeshStandardMaterial({ map: pavingTex([w / 2, d / 2]), roughness: 0.95 });
  const near = new THREE.Mesh(new THREE.BoxGeometry(140, 0.3, 10.5), walkMat(140, 10.5));
  near.position.set(0, -0.15, 0.75);
  near.receiveShadow = true;
  const farWalk = new THREE.Mesh(new THREE.BoxGeometry(140, 0.3, 4.5), walkMat(140, 4.5));
  farWalk.position.set(0, -0.15, -14.75);
  farWalk.receiveShadow = true;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(140, 8), new THREE.MeshStandardMaterial({ map: asphaltTex([35, 2]), roughness: 1 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.15, -8.5);
  road.receiveShadow = true;
  scene.add(near, farWalk, road);
  // 路緣石、斑馬線、下水道蓋、補過的路面
  const curbM = mat('#a2a09a', { roughness: 0.8 });
  [-4.6, -12.4].forEach((z) => { const c = box(140, 0.16, 0.2, curbM); c.position.set(0, -0.07, z); c.castShadow = false; scene.add(c); });
  for (let i = 0; i < 8; i++) { const zb = decal(0.5, 3.4, '#e8e4d8'); zb.position.set(-9 + i * 0.95, -0.138, -6.3); scene.add(zb); const zb2 = decal(0.5, 3.4, '#e8e4d8'); zb2.position.set(-9 + i * 0.95, -0.138, -10.7); scene.add(zb2); }
  [[-14, -6.4], [8, -10.6], [20, -6.5]].forEach(([x, z]) => manhole(scene, x, -0.15, z));
  const patch = decal(3.2, 1.3, '#2e2d2f', 0.9); patch.position.set(14, -0.138, -10.4); scene.add(patch);
  [-8.42, -8.58].forEach((z) => {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(140, 0.08), mat('#e0b23c'));
    l.rotation.x = -Math.PI / 2;
    l.position.set(0, -0.14, z);
    scene.add(l);
  });

  /* ---------- 建築 ---------- */
  const palette = ['#8a4b38', '#b9ab92', '#7b6a58', '#a0624a', '#6d6a63', '#c4b49a', '#94553f'];
  const shops = ['DELI', 'SHOES', 'BANK', 'DINER', 'HOTEL', 'RADIO', 'BOOKS', 'CAFE', 'TAILOR'];
  let n = 0;
  const row = (z, facing, mastAt) => {
    let x = -60;
    while (x < 60) {
      const w = 7 + ((n * 37) % 5);
      const isMast = mastAt !== undefined && x <= mastAt && x + w > mastAt;
      const h = isMast ? 20 : 9 + ((n * 53) % 20);
      const fl = Math.max(2, Math.round((h - 3.6) / 3.2));
      const b = richBuilding(scene, building, {
        x: x + w / 2, z: z + facing * -5, w, d: 10, facing, floors: isMast ? 5 : fl,
        color: palette[n % palette.length], seed: n,
        shop: shops[n % shops.length], shopColor: ['#1d2a3a', '#5a1f1b', '#1f3b2c', '#3b2a4a'][n % 4], awn: n % 2 === 0, interior: n % 3, hours: 'OPEN  MON–SAT  9–6'
      });
      const hh = 3.6 + (isMast ? 5 : fl) * 3.2;
      if (isMast) mastBase.set(x + w / 2, hh + 0.35, z + facing * -5);
      x += w + 0.2;
      n++;
    }
  };
  const mastBase = V();
  row(-17, 1, -11);
  row(6, -1);

  // 屋頂上的基地台天線
  const mast = new THREE.Group();
  const steel = mat('#c9ccd0', { metalness: 0.6, roughness: 0.4 });
  const MH = 7;
  [[0.5, 0], [-0.25, 0.43], [-0.25, -0.43]].forEach(([x, z]) => {
    const leg = cyl(0.05, 0.07, MH, steel, 6);
    leg.position.set(x, MH / 2, z);
    mast.add(leg);
  });
  for (let y = 0.8; y < MH; y += 1.1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 4, 3), steel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    mast.add(ring);
  }
  [0, 2.09, 4.19].forEach((a) => {
    const panel = box(0.28, 1.3, 0.1, '#eeeeee');
    panel.position.set(Math.cos(a) * 0.65, MH - 0.8, Math.sin(a) * 0.65);
    panel.rotation.y = -a;
    mast.add(panel);
  });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3b2f' }));
  beacon.position.y = MH + 0.1;
  mast.add(beacon);
  mast.scale.setScalar(1.5);
  mast.position.copy(mastBase);
  scene.add(mast);
  const mastTop = mastBase.clone().add(V(0, (MH + 0.8) * 1.5, 0));

  /* ---------- 街道小物 ---------- */
  const lamp = (x, z, dir) => { const g = lampPost(scene, x, z, 1); g.rotation.y = dir; };
  [-14, 0.5, 15].forEach((x) => lamp(x - 6, -4.1, Math.PI / 2));
  [-20, 2, 22].forEach((x) => lamp(x, -12.9, -Math.PI / 2));

  hydrantAndGrate(scene, 2.9, -3.95);
  const bin = cyl(0.28, 0.25, 0.9, '#3f4a3f', 12);
  bin.position.set(-6.2, 0.45, -3.9);
  scene.add(bin);
  const tree = (x, z) => leafTree(scene, x, z, (Math.abs(x * 3 + z) | 0) + 1, 1, GREEN);
  tree(-11, -3.7); tree(11.5, -3.7); tree(-16, -13.5); tree(9, -13.5);

  // 公共電話
  const PX = -3.4, PZ = -2.6;
  const booth = new THREE.Group();
  const bPole = cyl(0.05, 0.05, 1.2, '#6d747a');
  bPole.position.y = 0.6;
  const housing = box(0.3, 0.7, 0.38, '#8d949a', { metalness: 0.5, roughness: 0.4 });
  housing.position.y = 1.5;
  const face = box(0.02, 0.4, 0.24, '#5c6268');
  face.position.set(0.16, 1.46, 0);
  booth.add(bPole, housing, face);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const k = box(0.02, 0.05, 0.05, '#d8d8d8');
    k.position.set(0.175, 1.38 - r * 0.07 + 0.1, -0.07 + c * 0.07);
    booth.add(k);
  }
  const hood = box(0.5, 0.06, 0.6, '#1f4e8c');
  hood.position.y = 1.9;
  const phoneSign = sign('PHONE', 0.56, 0.17, { bg: '#1f4e8c', size: 80, w: 512, h: 156 });
  phoneSign.position.set(0.26, 2.04, 0);
  phoneSign.rotation.y = Math.PI / 2;
  const signBack = phoneSign.clone();
  signBack.position.x = -0.26;
  signBack.rotation.y = -Math.PI / 2;
  const signBox = box(0.5, 0.2, 0.6, '#1f4e8c');
  signBox.position.y = 2.04;
  booth.add(hood, signBox, phoneSign, signBack);
  booth.position.set(PX, 0, PZ);
  scene.add(booth);
  // 話筒掛點與話筒
  const hook = new THREE.Object3D();
  hook.position.set(0.2, 1.66, 0.13);
  hook.rotation.y = -Math.PI / 2;
  booth.add(hook);
  const handset = new THREE.Group();
  {
    const hm = mat('#1c1c1c', { roughness: 0.5 });
    const ear = box(0.075, 0.06, 0.07, hm); ear.position.set(0, 0, 0.015);
    const bar = box(0.04, 0.19, 0.04, hm); bar.position.set(0, -0.1, 0);
    const mouth = box(0.07, 0.06, 0.07, hm); mouth.position.set(0, -0.2, 0.015);
    handset.add(ear, bar, mouth);
  }
  scene.add(handset);
  const cordPts = Array.from({ length: 14 }, () => V());
  const cordGeo = new THREE.BufferGeometry().setFromPoints(cordPts);
  const cord = new THREE.Line(cordGeo, new THREE.LineBasicMaterial({ color: '#1c1c1c' }));
  cord.frustumCulled = false;
  scene.add(cord);
  const cordRoot = V(PX + 0.16, 1.22, PZ + 0.12);
  function updateCord() {
    const end = handset.localToWorld(V(0, -0.22, 0));
    const d = cordRoot.distanceTo(end);
    const sag = Math.max(0.05, 0.6 - d * 0.5);
    cordPts.forEach((p, i) => {
      const k = i / (cordPts.length - 1);
      p.lerpVectors(cordRoot, end, k);
      p.y -= Math.sin(Math.PI * k) * sag;
    });
    cordGeo.setFromPoints(cordPts);
  }

  // 書報攤
  const kiosk = new THREE.Group();
  const kb = box(1.0, 1.1, 1.8, '#2f5a3c');
  kb.position.y = 0.55;
  const roof = box(1.4, 0.1, 2.2, '#24452e');
  roof.position.y = 2.1;
  [-0.95, 0.95].forEach((z) => {
    const p = cyl(0.04, 0.04, 1.0, '#24452e', 6);
    p.position.set(-0.45, 1.6, z);
    kiosk.add(p);
  });
  const rack = box(0.08, 0.9, 1.7, '#3a2e22');
  rack.position.set(-0.52, 1.5, 0);
  kiosk.add(kb, roof, rack);
  ['#d94b3a', '#f2e8d0', '#3a6fb0', '#f0c43c', '#e8e2d4', '#7a3f8c', '#f2e8d0', '#4a9a6a'].forEach((c, i) => {
    const mg = box(0.02, 0.32, 0.24, c);
    mg.position.set(-0.57, 1.25 + Math.floor(i / 4) * 0.38, -0.6 + (i % 4) * 0.4);
    kiosk.add(mg);
  });
  const headline = sign('CELLULAR PHONES GO ON SALE', 1.5, 0.28, { bg: '#f2ede2', color: '#1a1a1a', size: 44, w: 1024, h: 192, weight: 900, font: 'Georgia, serif' });
  headline.position.set(-0.505, 0.75, 0);
  headline.rotation.y = -Math.PI / 2;
  kiosk.add(headline);
  const newsSign = sign('NEWS', 1.6, 0.36, { bg: '#b3261e', size: 96 });
  newsSign.position.set(-0.71, 2.35, 0);
  newsSign.rotation.y = -Math.PI / 2;
  const newsBox = box(0.1, 0.4, 1.7, '#b3261e');
  newsBox.position.set(-0.65, 2.35, 0);
  kiosk.add(newsBox, newsSign);
  kiosk.position.set(4.6, 0, 1.0);
  scene.add(kiosk);

  // 停在路邊、裝了車用電話的車
  const parked = makeSedan('#6b2f2a', { antenna: true });
  parked.position.set(6.8, -0.15, -5.35);
  scene.add(parked);
  // 來往的車
  const traffic = [
    { c: makeSedan('#c9b98f'), z: -7.5, v: 8, off: 0 },
    { c: makeSedan('#2f4a6b'), z: -10.4, v: -9, off: 40 },
    { c: makeSedan('#e3e0d8'), z: -7.5, v: 7.5, off: 65 },
    { c: makeSedan('#3f5a3a'), z: -10.4, v: -8, off: 90 }
  ];
  traffic.forEach((t) => { t.c.position.set(0, -0.15, t.z); if (t.v < 0) t.c.rotation.y = Math.PI; scene.add(t.c); });

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const exec = add(new Person({ top: '#2b3240', bottom: '#2b3240', hair: '#3a2a1c', skin: '#e2b48e', height: 1.02 }));
  {
    const shirt = box(0.14, 0.32, 0.01, '#f2f0ea');
    shirt.position.set(0, 0.42, 0.122);
    const tie = box(0.05, 0.28, 0.012, '#9b2a24');
    tie.position.set(0, 0.42, 0.13);
    exec.torso.add(shirt, tie);
  }
  const caller = add(new Person({ top: '#a63a2a', bottom: '#a63a2a', dress: true, hair: '#6b3b1f', skin: '#edc6a2', height: 0.96 }));
  const kid = add(new Person({ top: '#d9a441', bottom: '#3f5a85', hair: '#1f1712', skin: '#b97f55', height: 0.96 }));
  const oldMan = add(new Person({ top: '#556b4f', bottom: '#5a4a3a', hair: '#a8a8a8', skin: '#e0b494', height: 1.0 }));
  const oldLady = add(new Person({ top: '#7a5a8c', bottom: '#7a5a8c', dress: true, hair: '#d2d2d2', skin: '#e6c0a0', height: 0.94 }));
  const walkers = [
    { p: add(new Person({ top: '#8c3b3b', bottom: '#2a2a2e', hair: '#222' })), z: -14.2, v: 1.3, off: 0 },
    { p: add(new Person({ top: '#d6cbb5', bottom: '#4a3f35', hair: '#5a3a22', dress: true, height: 0.95 })), z: -15.4, v: -1.2, off: 20 },
    { p: add(new Person({ top: '#3c5c7c', bottom: '#2a2a2e', hair: '#111' })), z: -13.8, v: -1.4, off: 45 },
    { p: add(new Person({ top: '#6a6a44', bottom: '#3a3a3a', hair: '#7a5a3a', height: 1.04 })), z: -15.0, v: 1.1, off: 60 }
  ];

  // 衣著小細節 + 腳下的柔邊陰影
  {
    const wool = mat('#3a3a3c', { roughness: 1 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.07, 14), mat('#43483f', { roughness: 1 })); cap.position.set(0, 0.24, 0); oldMan.head.add(cap);
    const brim = box(0.2, 0.02, 0.08, '#43483f'); brim.position.set(0, 0.215, 0.13); oldMan.head.add(brim);
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), mat('#c9bfa6', { roughness: 1 })); hat.position.set(0, 0.17, 0); hat.rotation.x = -0.25; oldLady.head.add(hat);
    const scarf = box(0.3, 0.1, 0.27, '#d9a441'); scarf.position.set(0, 0.61, 0); kid.torso.add(scarf);
    const coat = box(0.46, 0.34, 0.27, '#556b4f'); coat.position.set(0, -0.07, 0); oldMan.torso.add(coat);
    const brief = box(0.1, 0.3, 0.38, '#3a2a1c'); brief.position.set(0, -0.2, 0); const hndl = box(0.02, 0.08, 0.14, '#222'); hndl.position.set(0, -0.03, 0); // 公事包（掛在身體旁）
    void brief; void hndl; void wool;
  }
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.5); b.position.y = 0.012; p.root.add(b); });
  // DynaTAC：原點設在聽筒位置，方便貼在耳邊
  const dyna = new THREE.Group();
  {
    const m = buildPhone(phone);
    const b = new THREE.Box3().setFromObject(m);
    const c = b.getCenter(V());
    m.position.sub(c);
    const inner = new THREE.Group();
    inner.add(m);
    inner.scale.setScalar(0.17);
    inner.position.y = -0.1;
    inner.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    dyna.add(inner);
  }
  scene.add(dyna);
  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.1, 0.06);
  exec.arms.R.grip.add(handHold);
  const chest = new THREE.Object3D();
  chest.rotation.set(0.6, Math.PI, 0);
  exec.root.add(chest);

  const q = sprite('？', '#1f1b16');
  q.scale.set(0.35, 0.35, 1);
  scene.add(q);

  /* ---------- 共用動作 ---------- */
  const EXEC_SPOT = V(1.3, 0, -1.2);
  const KID_SPOT = V(-0.9, 0, -2.5);
  const OM_SPOT = V(4.2, 0, -3.4), OL_SPOT = V(4.8, 0, -3.05);
  const CALLER_SPOT = V(-2.75, 0, -2.6);
  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const earGrip = (p, side) => () => p.ear[side].localToWorld(V(0, -0.11, -0.06));
  const hookGrip = () => hook.localToWorld(V(0, -0.1, -0.05));
  const restR = () => exec.local(-0.3, 0.84, 0.08);

  // DynaTAC 的位置：hand（拿在手上）、ear（耳邊）、chest（拿在胸前看）
  const anchors = { ear: exec.ear.R, chest, hand: handHold };
  const gripOf = {
    ear: earGrip(exec, 'R'),
    chest: () => chest.localToWorld(V(0, -0.14, -0.04)),
    hand: restR
  };
  const poleOf = {
    ear: () => exec.local(-0.75, 0.75, 0.3),
    chest: () => exec.local(-0.6, 0.85, 0.1),
    hand: () => exec.local(-0.5, 0.6, -0.1)
  };
  let phonePose = { from: 'hand', to: 'hand', k: 0 };
  function setPhone(from, to, k) {
    phonePose = { from, to, k };
    if (from === 'hand' && to === 'hand') { exec.reach.R = null; return; }
    exec.reach.R = {
      target: () => gripOf[from]().lerp(gripOf[to](), k),
      pole: () => poleOf[from]().lerp(poleOf[to](), k)
    };
  }
  function placePhone() {
    const { from, to, k } = phonePose;
    if (from === 'hand') placeBetween(dyna, handHold, anchors[to], span(k, 0.6, 1));
    else if (to === 'hand') placeBetween(dyna, anchors[from], handHold, span(k, 0, 0.4));
    else placeBetween(dyna, anchors[from], anchors[to], k);
  }
  // 話筒：hook（掛著）、caller（女士耳邊）、exec（上班族耳邊）
  let handsetPose = { from: 'caller', to: 'caller', k: 0 };
  const handsetAnchor = { hook, caller: caller.ear.L, exec: exec.ear.L };

  function talkIdle(p, T, phase = 0) {
    p.headTilt = Math.sin(T * 1.9 + phase) * 0.05;
    p.bob = Math.sin(T * 1.1 + phase) * 0.006;
  }

  /* ---------- 劇本 ---------- */
  // 每一段的 update(t, T)：t = 這段開始後的秒數，T = 全域時間（給閒置小動作用）
  const beats = {
    street: {
      duration: 10,
      update(t, T) {
        exec.reset(); exec.pos.set(30, 0, -1.2); exec.yaw = -Math.PI / 2; setPhone('hand', 'hand', 0);
        kid.reset(); kid.pos.set(-30, 0, -2.5);
        oldMan.reset(); oldMan.pos.set(30, 0, -3.4);
        oldLady.reset(); oldLady.pos.set(30, 0, -3.05);
        callerOnPhone(T);
      }
    },
    arrive: {
      duration: 12,
      update(t, T) {
        exec.reset();
        exec.walk(V(14, 0, -1.2), EXEC_SPOT, t, 0, 7.2);
        if (t > 7.2) exec.yaw = lerp(-Math.PI / 2, -0.35, span(t, 7.2, 7.9));
        const k = span(t, 7.6, 9.0);
        setPhone('hand', k > 0 ? 'ear' : 'hand', k);
        if (t > 9) talkIdle(exec, T);
        kid.reset();
        kid.walk(V(-14, 0, -2.5), KID_SPOT, t, 1, 11);
        oldMan.reset(); oldMan.walk(V(15, 0, -3.4), OM_SPOT, t, 2, 11.5);
        oldLady.reset(); oldLady.walk(V(15.6, 0, -3.05), OL_SPOT, t, 2, 11.5);
        callerOnPhone(T);
        if (t > 8.5) { caller.look = head(exec); caller.lookAmt = span(t, 8.5, 9.5) * 0.8; }
      }
    },
    stare: {
      duration: 9,
      update(t, T) {
        execTalking(T);
        crowdStare(t, T);
        // 小孩伸手指著他
        const pt = span(t, 3.4, 4.2) * (1 - span(t, 7, 7.8));
        if (pt > 0) {
          kid.reach.R = {
            target: () => {
              const s = kid.arms.R.shoulder.getWorldPosition(V());
              const d = head(exec).sub(s).normalize();
              const down = kid.local(-0.28, 0.85, 0.05);
              return down.lerp(s.addScaledVector(d, 0.58), pt);
            },
            pole: () => kid.local(-0.4, 0.6, -0.4)
          };
        }
        callerOnPhone(T);
        caller.look = head(exec); caller.lookAmt = 0.8;
      }
    },
    dead: {
      duration: 10,
      update(t, T) {
        exec.reset(); exec.pos.copy(EXEC_SPOT); exec.yaw = -0.35;
        const k = span(t, 0, 1.4);
        setPhone(k > 0 ? 'ear' : 'ear', 'chest', k);
        if (k === 0) setPhone('ear', 'ear', 0);
        exec.look = dyna.getWorldPosition(V()); exec.lookAmt = k;
        const shake = span(t, 1.6, 2.0) * (1 - span(t, 3.4, 3.8));
        chest.position.set(-0.1 + Math.sin(t * 28) * 0.035 * shake, 1.22, 0.36);
        q.visible = t > 2.2 && t < 6;
        if (!q.visible) q.position.set(0, -10, 0);
        q.position.copy(exec.local(0, 2.05 + Math.sin(T * 3) * 0.02, 0));
        crowdStare(9, T);
        // 小孩笑出來
        const laugh = span(t, 4.6, 5.0) * (1 - span(t, 7.2, 7.8));
        kid.bob = Math.abs(Math.sin(T * 13)) * 0.025 * laugh;
        kid.headTilt = -0.25 * laugh;
        kid.lean = -0.08 * laugh;
        callerOnPhone(T);
        caller.look = head(exec); caller.lookAmt = 0.8;
      }
    },
    payphone: {
      duration: 12,
      update(t, T) {
        q.visible = false;
        // 女士掛上電話離開
        caller.reset();
        const hang = span(t, 0, 1.4);
        caller.pos.copy(CALLER_SPOT); caller.yaw = -Math.PI / 2;
        handsetPose = hang < 1 ? { from: 'caller', to: 'hook', k: hang } : { from: 'hook', to: 'hook', k: 0 };
        if (t < 1.6) caller.reach.L = { target: () => earGrip(caller, 'L')().lerp(hookGrip(), hang), pole: () => caller.local(0.7, 1.0, 0.2) };
        if (t > 1.8) {
          caller.walk(CALLER_SPOT, V(-2.75, 0, -1.6), t, 1.8, 2.6);
          if (t > 2.6) caller.walk(V(-2.75, 0, -1.6), V(-19, 0, -1.6), t, 2.6, 12);
        }
        // 上班族走向公共電話
        exec.reset();
        exec.pos.copy(EXEC_SPOT); exec.yaw = -0.35;
        setPhone('chest', 'hand', span(t, 0, 1.4));
        if (t > 1.4) setPhone('hand', 'hand', 0);
        if (t > 1.6) exec.yaw = lerp(-0.35, -1.66, span(t, 1.6, 2.5));
        if (t > 2.5) exec.walk(EXEC_SPOT, V(-2.2, 0, -1.5), t, 2.5, 6);
        if (t > 6) exec.walk(V(-2.2, 0, -1.5), CALLER_SPOT, t, 6, 7);
        if (t > 7) exec.yaw = lerp(exec.yaw, -Math.PI / 2, span(t, 7, 7.6));
        const pick = span(t, 7.8, 9.2);
        if (t > 7.6) {
          exec.reach.L = { target: () => hookGrip().lerp(earGrip(exec, 'L')(), pick), pole: () => exec.local(0.8, 1.0, 0.2) };
          if (pick > 0) handsetPose = { from: 'hook', to: 'exec', k: pick };
        }
        if (t > 9.2) talkIdle(exec, T, 1);
        // 圍觀的人
        kid.reset(); kid.pos.copy(KID_SPOT); kid.yaw = 1.03; kid.look = head(exec);
        oldMan.reset(); oldLady.reset();
        oldMan.pos.copy(OM_SPOT); oldLady.pos.copy(OL_SPOT);
        oldMan.yaw = -0.94; oldLady.yaw = -1.1;
        if (t > 3) {
          oldMan.walk(OM_SPOT, V(-16, 0, -3.4), t, 3.2, 13);
          oldLady.walk(OL_SPOT, V(-15.4, 0, -3.05), t, 3, 13);
        } else {
          oldMan.look = head(exec); oldLady.look = head(exec);
        }
      }
    }
  };

  function callerOnPhone(T) {
    caller.reset();
    caller.pos.copy(CALLER_SPOT);
    caller.yaw = -Math.PI / 2;
    talkIdle(caller, T, 2);
    caller.reach.L = { target: earGrip(caller, 'L'), pole: () => caller.local(0.7, 1.0, 0.2) };
    handsetPose = { from: 'caller', to: 'caller', k: 0 };
  }
  function execTalking(T) {
    exec.reset(); exec.pos.copy(EXEC_SPOT); exec.yaw = -0.35 + Math.sin(T * 0.4) * 0.12;
    setPhone('ear', 'ear', 0);
    talkIdle(exec, T);
  }
  function crowdStare(t, T) {
    kid.reset(); kid.pos.copy(KID_SPOT);
    kid.yaw = lerp(Math.PI / 2, 1.03, span(t, 0.3, 1.2));
    kid.look = head(exec); kid.lookAmt = span(t, 0, 0.8);
    oldMan.reset(); oldMan.pos.copy(OM_SPOT);
    oldMan.yaw = lerp(-Math.PI / 2, -0.94, span(t, 0.4, 1.3));
    oldMan.look = head(exec); oldMan.lookAmt = span(t, 0.2, 1);
    oldLady.reset(); oldLady.pos.copy(OL_SPOT);
    oldLady.yaw = lerp(-Math.PI / 2, -1.1, span(t, 0.8, 1.6));
    // 老太太湊過去跟先生講悄悄話
    const w = span(t, 4.2, 4.8) * (1 - span(t, 7.4, 8));
    oldLady.look = w > 0.5 ? head(oldMan) : head(exec);
    oldLady.lookAmt = span(t, 0.6, 1.4);
    oldLady.lean = 0.12 * w;
    oldMan.headTilt = Math.sin(T * 2.4) * 0.03;
  }

  /* ---------- 每一格 ---------- */
  function ambient(T) {
    walkers.forEach((w) => {
      const L = 90;
      const d = ((w.off + T * Math.abs(w.v)) % L);
      const x = w.v > 0 ? d - L / 2 : L / 2 - d;
      w.p.reset();
      w.p.pos.set(x, 0, w.z);
      w.p.yaw = w.v > 0 ? Math.PI / 2 : -Math.PI / 2;
      w.p.walkAmt = 1;
      w.p.walkPhase = d * 4.4;
    });
    traffic.forEach((t) => {
      const L = 130;
      const d = (t.off + T * Math.abs(t.v)) % L;
      t.c.position.x = t.v > 0 ? d - L / 2 : L / 2 - d;
    });
    beacon.material.color.set(Math.sin(T * 3) > 0.3 ? '#ff3b2f' : '#5a1410');
  }
  function finish() {
    people.forEach((p) => p.apply());
    placePhone();
    placeBetween(handset, handsetAnchor[handsetPose.from], handsetAnchor[handsetPose.to], handsetPose.k);
    updateCord();
  }

  // 每段演出開始先把「？」藏起來，需要的段落再打開
  for (const b of Object.values(beats)) {
    const u = b.update;
    b.update = (t, T) => { q.visible = false; u(t, T); };
  }

  return {
    view: { pos: V(0, 1.62, 2.2), yaw: 0, pitch: -0.04 },
    beats,
    ambient,
    finish,
    focus: {
      street: () => V(0, 2.2, -14),
      payphone: () => V(PX, 1.4, PZ),
      exec: () => head(exec),
      crowd: () => head(kid).lerp(head(oldMan), 0.5)
    },
    hotspots: {
      phone: { pos: () => dyna.localToWorld(V(0, 0.06, 0)), size: 0.42 },
      payphone: { pos: () => V(PX, 2.35, PZ), size: 0.5 },
      car: { pos: () => parked.userData.antenna.localToWorld(V(0, 0.8, 0)), size: 0.6 },
      crowd: { pos: () => head(oldMan).lerp(head(oldLady), 0.5).add(V(0, 0.5, 0)), size: 0.55 },
      mast: { pos: () => mastTop, size: 2.6 },
      exec: { pos: () => head(exec).add(V(0, 0.45, 0)), size: 0.5 },
      news: { pos: () => V(4.2, 2.95, 1.0), size: 0.6 }
    }
  };
}

function sprite(text, color) {
  const t = textTexture(text, { w: 128, h: 128, bg: null, color, size: 96 });
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#fffaf0';
  x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
  x.drawImage(t.image, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
}
