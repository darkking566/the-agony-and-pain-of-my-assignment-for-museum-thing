// 3D 展廳：用 Three.js 把每支手機做成簡化的立體模型，放在展台上排成一條時間走廊。
// 模型都是程式畫的（不用下載 3D 檔），外型由 data.js 裡每支手機的 shape 決定。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const SPACING = 3.2;   // 展台間距
const PED_H = 1.0;     // 展台高度
const BG = '#15130f';

export function initHall(container, phones, { onSelect, onEnter, hasScene = () => false } = {}) {
  /* ---------- 基本場景 ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 7, 18);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 60);

  scene.add(new THREE.HemisphereLight('#fff1dc', '#2b241b', 1.4));
  const fill = new THREE.DirectionalLight('#ffffff', 0.6);
  fill.position.set(3, 6, 5);
  scene.add(fill);
  const spot = new THREE.SpotLight('#ffe2bd', 28, 12, Math.PI / 7, 0.6, 1.4);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  scene.add(spot, spot.target);

  const span = (phones.length - 1) * SPACING;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(span + 30, 20),
    new THREE.MeshStandardMaterial({ color: '#2a251f', roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.x = span / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(span + 30, 8),
    new THREE.MeshStandardMaterial({ color: '#3a332a', roughness: 1 })
  );
  wall.position.set(span / 2, 4, -2.4);
  wall.receiveShadow = true;
  scene.add(wall);

  /* ---------- 展品 ---------- */
  const rings = [];
  const pedMat = new THREE.MeshStandardMaterial({ color: '#ebe4d6', roughness: 0.7 });
  const exhibits = phones.map((p, i) => {
    const x = i * SPACING;
    const ped = new THREE.Mesh(new RoundedBoxGeometry(1.2, PED_H, 1.2, 3, 0.04), pedMat);
    ped.position.set(x, PED_H / 2, 0);
    ped.receiveShadow = true;
    ped.castShadow = true;
    scene.add(ped);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.5),
      new THREE.MeshBasicMaterial({
        map: textTexture([
          { text: String(p.year), size: 92, weight: 900, color: '#c2410c' },
          { text: p.name, size: fitSize(p.name, 44, 460), weight: 700, color: '#1f1b16' }
        ], { w: 512, h: 256 })
      })
    );
    label.position.set(x, PED_H * 0.62, 0.601);
    scene.add(label);

    const model = buildPhone(p);
    model.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    // 讓模型置中，底部站在展台上
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const pivot = new THREE.Group();
    pivot.add(model);
    pivot.position.set(x, PED_H + 0.06 + size.y / 2, 0);
    pivot.rotation.y = -0.35;
    scene.add(pivot);

    // 用一個透明大盒子方便點擊
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, PED_H + size.y + 0.2, 1.3),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(x, (PED_H + size.y + 0.2) / 2, 0);
    hit.userData.index = i;
    scene.add(hit);

    // 有沉浸體驗的展台，台面上加一圈發光環
    if (hasScene(p)) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 48), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, PED_H + 0.02, 0);
      scene.add(ring);
      rings.push(ring);
    }

    return { p, pivot, hit, size };
  });

  // 年代標示掛在牆上
  const seen = new Set();
  phones.forEach((p, i) => {
    if (seen.has(p.era)) return;
    seen.add(p.era);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.6),
      new THREE.MeshBasicMaterial({
        map: textTexture([{ text: p.era.replace('s', ' 年代'), size: 120, weight: 900, color: '#f4efe6' }], { w: 1024, h: 256 }),
        transparent: true
      })
    );
    sign.position.set(i * SPACING - 0.4, 2.2, -2.38);
    scene.add(sign);
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.7), new THREE.MeshBasicMaterial({ color: '#c2410c' }));
    bar.position.set(i * SPACING - 1.65, 2.2, -2.37);
    scene.add(bar);
  });

  /* ---------- 鏡頭與互動 ---------- */
  let current = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const wantPos = new THREE.Vector3(), wantLook = new THREE.Vector3();

  function frame(i) {
    const e = exhibits[i];
    const h = Math.max(e.size.y, e.size.x);
    const wide = container.clientWidth >= 720;
    const dist = Math.max(2.4, h * 2.1 + 1.1);
    // 桌機：展品偏右（左下有說明框）；手機：展品偏上（下方有說明框）
    const { x, y } = e.pivot.position;
    wantLook.set(x - (wide ? 0.55 : 0), y - (wide ? 0.25 : 0.75), 0);
    wantPos.set(x - (wide ? 0.4 : 0) + 0.2, y + 0.15, dist);
    spot.position.set(e.pivot.position.x + 0.6, 4.2, 1.8);
    spot.target.position.copy(e.pivot.position);
  }

  function goTo(target) {
    const i = typeof target === 'number' ? target : phones.findIndex((p) => p.id === target);
    if (i < 0 || i >= exhibits.length) return;
    current = i;
    frame(i);
    onSelect && onSelect(phones[i]);
  }
  const step = (d) => goTo(Math.max(0, Math.min(exhibits.length - 1, current + d)));

  goTo(0);
  camPos.copy(wantPos).add(new THREE.Vector3(-1.5, 0.6, 1.5));
  camLook.copy(wantLook);

  // 拖曳旋轉目前的手機，點擊其他展台則移動過去
  const el = renderer.domElement;
  let dragging = false, lastX = 0, downX = 0, downY = 0, idleAt = 0, spin = 0;
  el.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = downX = e.clientX; downY = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    spin = dx * 0.012;
    exhibits[current].pivot.rotation.y += spin;
    idleAt = performance.now();
  });
  el.addEventListener('pointerup', (e) => {
    dragging = false;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) pick(e);
  });
  el.addEventListener('pointercancel', () => { dragging = false; });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(exhibits.map((x) => x.hit))[0];
    if (!hit) return;
    const i = hit.object.userData.index;
    if (i !== current) goTo(i);
    else if (hasScene(phones[i]) && onEnter) onEnter(phones[i]); // 點目前這支手機 → 進入沉浸體驗
  }

  function onKey(e) {
    if (container.offsetParent === null) return; // 展廳沒顯示時不處理
    if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
  }
  window.addEventListener('keydown', onKey);

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 600 ? 55 : 42;
    camera.updateProjectionMatrix();
    frame(current);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ---------- 動畫迴圈 ---------- */
  let running = false, last = 0, raf = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(t) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 4);
    camPos.lerp(wantPos, k);
    camLook.lerp(wantLook, k);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    const cur = exhibits[current].pivot;
    if (!dragging) {
      spin *= 0.92; // 放手後的慣性
      cur.rotation.y += spin;
      if (!reduceMotion && performance.now() - idleAt > 2500) cur.rotation.y += dt * 0.4;
    }
    const glow = 0.6 + Math.sin(t / 300) * 0.4;
    rings.forEach((r) => r.material.color.setRGB(0.98, 0.57 * (0.8 + glow * 0.2), 0.24 * glow));
    renderer.render(scene, camera);
  }
  function resume() {
    if (running) return;
    running = true;
    last = performance.now();
    resize();
    raf = requestAnimationFrame(tick);
  }
  function pause() { running = false; cancelAnimationFrame(raf); }
  resume();

  return {
    goTo, step, pause, resume,
    dispose() { pause(); ro.disconnect(); window.removeEventListener('keydown', onKey); renderer.dispose(); el.remove(); }
  };
}

/* ====================================================================
   手機模型
   ==================================================================== */
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.1, ...opts });
}
function rbox(w, h, d, material, r = 0.02) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(r, 0.002)), material);
}
function screenMesh(w, h, kind) {
  const tex = screenTexture(kind);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.2 })
  );
  return m;
}
// 在 (cx, cy) 為中心排一組按鍵
function keypad(group, { cols, rows, w, h, cx = 0, cy, z, color = '#d8d4cc', kw, kh }) {
  const m = mat(color, { roughness: 0.6 });
  kw = kw || (w / cols) * 0.72;
  kh = kh || (h / rows) * 0.62;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = rbox(kw, kh, 0.02, m, 0.008);
      k.position.set(cx - w / 2 + (c + 0.5) * (w / cols), cy + h / 2 - (r + 0.5) * (h / rows), z);
      group.add(k);
    }
  }
}
function antenna(group, x, y, z, len, r = 0.018) {
  const a = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.3, len, 12), mat('#1a1a1a'));
  a.position.set(x, y + len / 2, z);
  group.add(a);
}

export function buildPhone(p) {
  const g = new THREE.Group();
  const body = mat(p.color);
  const dark = mat('#141414', { roughness: 0.3 });

  switch (p.shape) {
    case 'brick': { // DynaTAC 黑金剛
      const W = 0.5, H = 1.45, D = 0.26;
      g.add(rbox(W, H, D, body, 0.05));
      const lcd = screenMesh(0.3, 0.09, 'led');
      lcd.position.set(0, H * 0.27, D / 2 + 0.001);
      g.add(lcd);
      keypad(g, { cols: 3, rows: 5, w: 0.36, h: 0.55, cy: -0.12, z: D / 2 + 0.01, color: '#f1ede4' });
      const ear = rbox(0.28, 0.12, 0.02, dark, 0.02);
      ear.position.set(0, H * 0.42, D / 2 + 0.005);
      g.add(ear);
      antenna(g, 0.14, H / 2, -0.03, 0.42, 0.03);
      break;
    }
    case 'car': { // 車用電話：主機 + 話筒
      const base = rbox(0.95, 0.42, 0.62, body, 0.05);
      g.add(base);
      const panel = rbox(0.6, 0.18, 0.02, dark, 0.01);
      panel.position.set(0, 0.02, 0.32);
      g.add(panel);
      const handset = new THREE.Group();
      const hb = rbox(0.82, 0.12, 0.2, mat('#2b2b2b'), 0.05);
      handset.add(hb);
      [-0.36, 0.36].forEach((x) => {
        const cap = rbox(0.16, 0.15, 0.24, mat('#2b2b2b'), 0.06);
        cap.position.x = x;
        handset.add(cap);
      });
      handset.position.set(0, 0.3, 0.02);
      g.add(handset);
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 8, 24, Math.PI), mat('#222'));
      cord.position.set(0.48, 0.12, 0.1);
      cord.rotation.y = Math.PI / 2;
      g.add(cord);
      break;
    }
    case 'flip': { // MicroTAC 半掀蓋
      const W = 0.34, H = 0.95, D = 0.15;
      g.add(rbox(W, H, D, body, 0.04));
      const lcd = screenMesh(0.22, 0.08, 'led');
      lcd.position.set(0, H * 0.3, D / 2 + 0.001);
      g.add(lcd);
      keypad(g, { cols: 3, rows: 4, w: 0.25, h: 0.36, cy: -0.05, z: D / 2 + 0.01 });
      // 掀蓋從底部往下打開
      const hinge = new THREE.Group();
      hinge.position.set(0, -H / 2 + 0.05, D / 2);
      const flap = rbox(W * 0.96, 0.34, 0.03, body, 0.02);
      flap.position.set(0, -0.17, 0.015);
      hinge.add(flap);
      hinge.rotation.x = 0.55;
      g.add(hinge);
      antenna(g, 0.11, H / 2, -0.02, 0.18, 0.02);
      break;
    }
    case 'clam': { // StarTAC 貝殼機
      const W = 0.32, H = 0.5, D = 0.08;
      const bottom = rbox(W, H, D, body, 0.04);
      g.add(bottom);
      keypad(g, { cols: 3, rows: 4, w: 0.22, h: 0.28, cy: -0.04, z: D / 2 + 0.01, color: '#9aa0a8' });
      const top = new THREE.Group();
      top.position.set(0, H / 2, -D / 2);
      const lid = rbox(W, H * 0.92, D * 0.8, body, 0.04);
      lid.position.set(0, H * 0.46, 0);
      top.add(lid);
      const scr = screenMesh(0.2, 0.12, 'lcd');
      scr.position.set(0, H * 0.55, D * 0.4 + 0.001);
      top.add(scr);
      antenna(top, 0.1, H * 0.92, 0, 0.12, 0.018);
      top.rotation.x = -0.32;
      g.add(top);
      break;
    }
    case 'candybar': { // Nokia 直立機
      const W = 0.3, H = 0.7, D = 0.13;
      g.add(rbox(W, H, D, body, 0.06));
      const face = rbox(W * 0.86, H * 0.9, 0.02, mat('#d9dde3', { roughness: 0.35 }), 0.05);
      face.position.z = D / 2;
      g.add(face);
      const scr = screenMesh(0.19, 0.15, p.screen === 'color' ? 'color' : 'lcd');
      scr.position.set(0, H * 0.22, D / 2 + 0.012);
      g.add(scr);
      const nav = rbox(0.14, 0.05, 0.02, mat('#20304f'), 0.02);
      nav.position.set(0, 0.0, D / 2 + 0.015);
      g.add(nav);
      keypad(g, { cols: 3, rows: 4, w: 0.2, h: 0.22, cy: -0.18, z: D / 2 + 0.018, color: '#3b4a6b' });
      if (p.camera) {
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 24), dark);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, H * 0.3, -D / 2 - 0.01);
        g.add(lens);
      }
      break;
    }
    case 'slider': { // HTC Dream 滑蓋
      const W = 0.34, H = 0.62;
      const kb = rbox(W, H, 0.05, body, 0.04);
      g.add(kb);
      keypad(g, { cols: 5, rows: 4, w: 0.28, h: 0.2, cy: -0.18, z: 0.03, color: '#555' });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), mat('#ddd'));
      ball.position.set(0, -0.02, 0.035);
      g.add(ball);
      const top = rbox(W, H * 0.8, 0.05, mat('#eeeeee', { roughness: 0.3 }), 0.04);
      top.position.set(0, 0.22, 0.05);
      g.add(top);
      const scr = screenMesh(0.26, 0.36, 'android');
      scr.position.set(0, 0.24, 0.076);
      g.add(scr);
      break;
    }
    case 'touch': { // iPhone
      const W = 0.37, H = 0.69, D = 0.07;
      g.add(rbox(W, H, D, body, p.flat ? 0.015 : 0.05));
      const glass = rbox(W * 0.97, H * 0.98, 0.01, mat('#0c0c0c', { roughness: 0.1 }), 0.04);
      glass.position.z = D / 2;
      g.add(glass);
      const scr = screenMesh(0.3, 0.46, 'ios');
      scr.position.set(0, 0.015, D / 2 + 0.006);
      g.add(scr);
      const home = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.004, 8, 32), mat('#555'));
      home.position.set(0, -0.29, D / 2 + 0.006);
      g.add(home);
      const spk = rbox(0.06, 0.01, 0.005, mat('#333'), 0.002);
      spk.position.set(0, 0.29, D / 2 + 0.006);
      g.add(spk);
      break;
    }
    case 'phablet': { // Galaxy Note + S Pen
      const W = 0.5, H = 0.88, D = 0.06;
      g.add(rbox(W, H, D, body, 0.05));
      const scr = screenMesh(0.44, 0.74, 'android');
      scr.position.set(0, 0.0, D / 2 + 0.002);
      g.add(scr);
      const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 12), mat('#777'));
      pen.position.set(0.34, -0.05, 0.05);
      pen.rotation.z = 0.15;
      g.add(pen);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 12), mat('#333'));
      tip.position.set(0.295, -0.37, 0.05);
      tip.rotation.z = Math.PI + 0.15;
      g.add(tip);
      break;
    }
    case 'modern':
    default: { // 全螢幕手機
      const W = 0.43, H = 0.88, D = 0.05;
      g.add(rbox(W, H, D, body, 0.03));
      const glass = rbox(W * 0.98, H * 0.985, 0.006, mat('#0a0a0a', { roughness: 0.1 }), 0.05);
      glass.position.z = D / 2;
      g.add(glass);
      const scr = screenMesh(0.4, 0.84, p.shape === 'modern' && p.triple ? 'android' : 'ios');
      scr.position.set(0, 0, D / 2 + 0.004);
      g.add(scr);
      // 背面相機
      const lensCount = p.triple ? 3 : 2;
      if (!p.triple) {
        const bump = rbox(0.16, 0.16, 0.02, mat(p.color, { roughness: 0.2 }), 0.03);
        bump.position.set(-0.11, 0.32, -D / 2 - 0.01);
        g.add(bump);
      }
      for (let i = 0; i < lensCount; i++) {
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 24), dark);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(p.triple ? -0.13 : -0.13 + (i % 2) * 0.05, p.triple ? 0.34 - i * 0.08 : 0.35 - i * 0.07, -D / 2 - 0.02);
        g.add(lens);
      }
    }
  }
  return g;
}

/* ====================================================================
   貼圖（螢幕畫面、文字標籤）
   ==================================================================== */
const texCache = {};
function screenTexture(kind) {
  if (texCache[kind]) return texCache[kind];
  const c = document.createElement('canvas');
  const portrait = kind === 'ios' || kind === 'android';
  c.width = portrait ? 256 : 256;
  c.height = portrait ? 448 : 160;
  const x = c.getContext('2d');
  if (kind === 'led') {
    x.fillStyle = '#120404'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#ff3b2f'; x.font = 'bold 84px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('555-0173', c.width / 2, c.height / 2);
  } else if (kind === 'lcd') {
    x.fillStyle = '#a9bf8e'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#26301c'; x.font = 'bold 54px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('12:00', c.width / 2, c.height / 2 + 6);
    for (let i = 0; i < 4; i++) x.fillRect(14 + i * 12, 40 - i * 8, 8, 10 + i * 8);
  } else if (kind === 'color') {
    const gr = x.createLinearGradient(0, 0, 0, c.height);
    gr.addColorStop(0, '#2b6cff'); gr.addColorStop(1, '#0b1f66');
    x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
    ['#ff4b4b', '#4bff7a', '#ffffff'].forEach((col, i) => { x.fillStyle = col; x.fillRect(30 + i * 70, 60, 50, 50); });
  } else {
    const gr = x.createLinearGradient(0, 0, c.width, c.height);
    if (kind === 'ios') { gr.addColorStop(0, '#1e3a8a'); gr.addColorStop(1, '#7c3aed'); }
    else { gr.addColorStop(0, '#0f2b1f'); gr.addColorStop(1, '#14532d'); }
    x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
    const cols = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#06b6d4', '#a855f7', '#f43f5e'];
    let n = 0;
    for (let r = 0; r < 5; r++) for (let col = 0; col < 4; col++) {
      x.fillStyle = cols[n++ % cols.length];
      roundRect(x, 22 + col * 58, 40 + r * 64, 40, 40, 10);
    }
    x.fillStyle = 'rgba(255,255,255,.25)'; roundRect(x, 12, c.height - 70, c.width - 24, 58, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.userData.shared = true; // 展廳和沉浸場景共用，離開場景時不要釋放
  texCache[kind] = t;
  return t;
}
function roundRect(x, l, t, w, h, r) {
  x.beginPath(); x.roundRect ? x.roundRect(l, t, w, h, r) : x.rect(l, t, w, h); x.fill();
}

const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
function fitSize(text, max, width) {
  const x = document.createElement('canvas').getContext('2d');
  let s = max;
  do { x.font = `700 ${s}px ${FONT}`; s -= 2; } while (x.measureText(text).width > width && s > 18);
  return s + 2;
}
function textTexture(lines, { w, h, bg = '#ebe4d6' }) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  if (lines.length > 1) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.textAlign = lines.length > 1 ? 'center' : 'left';
  x.textBaseline = 'middle';
  const total = lines.reduce((s, l) => s + l.size * 1.2, 0);
  let y = (h - total) / 2;
  lines.forEach((l) => {
    x.font = `${l.weight} ${l.size}px ${FONT}`;
    x.fillStyle = l.color;
    y += l.size * 0.6;
    x.fillText(l.text, lines.length > 1 ? w / 2 : 20, y);
    y += l.size * 0.6;
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
