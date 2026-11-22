// 3D 展廳：用 Three.js 把每支手機做成簡化的立體模型，放在展台上排成一條時間走廊。
// 模型都是程式畫的（不用下載 3D 檔），外型由 data.js 裡每支手機的 shape 決定。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildPhone as buildRig } from './phones3d.js';

// 沉浸場景（scenes/*.js）直接拿手機的 3D 模型來用：維持原本「回傳一個 Group」的介面
export function buildPhone(p) {
  const rig = buildRig(p);
  rig.root.userData.rig = rig;
  return rig.root;
}

const SPACING = 3.4;   // 展台間距
const PED_H = 1.0;     // 展台高度
const WALL_Z = -2.6;   // 背牆位置
const BG = '#04070d';
const BLUE = '#60a5fa';

export function initHall(container, phones, { onSelect, onEnter, hasScene = () => false, eras = [] } = {}) {
  /* ---------- 基本場景 ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 8, 20);
  // 環境反射：讓手機機身、展台地板有真實的高光，不再是平的塑膠感
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 60);

  scene.add(new THREE.HemisphereLight('#cfe0ff', '#0a0f1c', 0.55));
  const fill = new THREE.DirectionalLight('#9db8ff', 0.35);
  fill.position.set(-4, 5, 5);
  scene.add(fill);
  const spot = new THREE.SpotLight('#fff3e0', 60, 12, Math.PI / 8, 0.55, 1.3);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0004;
  scene.add(spot, spot.target);

  const span = (phones.length - 1) * SPACING;
  const mid = span / 2;
  const L = span + 34;   // 走廊總長

  /* ---------- 地板：深色拋光磚，會反射展台與手機 ---------- */
  const floorTex = floorTexture();
  floorTex.repeat.set(L / 2.4, 20 / 2.4);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(L, 20),
    new THREE.MeshStandardMaterial({
      map: floorTex, color: '#ffffff', roughness: 0.28, metalness: 0.55,
      envMapIntensity: 0.9, transparent: true, opacity: 0.8
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(mid, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);
  // 地板下方放一個不透明的底，免得透過半透明地板看到背景
  const under = new THREE.Mesh(new THREE.PlaneGeometry(L, 20), new THREE.MeshBasicMaterial({ color: '#05080f' }));
  under.rotation.x = -Math.PI / 2;
  under.position.set(mid, -0.6, 0);
  scene.add(under);
  // 地板中線：沿著時間走廊的一條細藍光
  const guide = new THREE.Mesh(new THREE.PlaneGeometry(span + 6, 0.025), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.55 }));
  guide.rotation.x = -Math.PI / 2;
  guide.position.set(mid, 0.004, 1.45);
  scene.add(guide);

  /* ---------- 背牆：嵌板、頂部光槽、踢腳線 ---------- */
  const wallTex = wallTexture();
  wallTex.repeat.set(L / 3.2, 1);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(L, 7),
    new THREE.MeshStandardMaterial({ map: wallTex, color: '#ffffff', roughness: 0.85, metalness: 0.05, envMapIntensity: 0.25 })
  );
  wall.position.set(mid, 3.5, WALL_Z);
  wall.receiveShadow = true;
  scene.add(wall);
  const strip = (y, h, color, op = 1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, h), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op }));
    m.position.set(mid, y, WALL_Z + 0.01);
    scene.add(m);
  };
  strip(5.35, 0.03, '#cfe2ff', 0.9);     // 頂部光槽
  strip(0.09, 0.18, '#0a101c', 1);       // 踢腳線
  strip(0.19, 0.012, BLUE, 0.7);         // 踢腳線上緣細光
  // 頂部光槽向下的柔光
  const cove = new THREE.Mesh(new THREE.PlaneGeometry(L, 2.2), new THREE.MeshBasicMaterial({
    map: gradientTexture(['rgba(160,200,255,.28)', 'rgba(160,200,255,0)']), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  cove.position.set(mid, 4.25, WALL_Z + 0.012);
  scene.add(cove);

  /* ---------- 展品 ---------- */
  const rings = [];
  const pedMat = new THREE.MeshStandardMaterial({ color: '#e8ecf3', roughness: 0.5, metalness: 0.05, envMapIntensity: 0.5 });
  const capMat = new THREE.MeshStandardMaterial({ color: '#0b1018', roughness: 0.12, metalness: 0.6 });
  const glowMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.85 });
  const poolTex = radialTexture();
  const mirror = new THREE.Group();     // 地板倒影：上下翻轉的複製品
  mirror.scale.y = -1;
  scene.add(mirror);

  const exhibits = phones.map((p, i) => {
    const x = i * SPACING;
    const ped = new THREE.Mesh(new RoundedBoxGeometry(1.2, PED_H, 1.2, 3, 0.04), pedMat);
    ped.position.set(x, PED_H / 2, 0);
    ped.receiveShadow = true;
    ped.castShadow = true;
    scene.add(ped);
    // 台面的黑色壓克力板與底部光帶
    const cap = new THREE.Mesh(new RoundedBoxGeometry(1.24, 0.05, 1.24, 2, 0.015), capMat);
    cap.position.set(x, PED_H + 0.025, 0);
    scene.add(cap);
    const base = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.02), glowMat);
    base.position.set(x, 0.05, 0.602);
    scene.add(base);

    // 展台前方的一圈光暈（落在地板上）
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({
      map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55
    }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.006, 0.1);
    scene.add(pool);

    // 說明牌：深色底，年份用藍、名稱用白
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.42),
      new THREE.MeshBasicMaterial({
        map: textTexture([
          { text: String(p.year), size: 92, weight: 900, color: '#7db4ff' },
          { text: p.name, size: fitSize(p.name, 44, 460), weight: 700, color: '#f2f5fb' }
        ], { w: 512, h: 256, bg: '#0c1220' })
      })
    );
    label.position.set(x, PED_H * 0.56, 0.603);
    scene.add(label);

    const rig = buildRig(p);
    rig.update(0, 0);   // 先把天線、話筒這些零件擺到預設位置，量出來的尺寸才準
    const model = rig.root;
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

    // 倒影（展台 + 手機），只複製外觀，旋轉在動畫迴圈同步
    const reflPed = new THREE.Mesh(ped.geometry, pedMat);
    reflPed.position.copy(ped.position);
    const reflPivot = pivot.clone();
    mirror.add(reflPed, reflPivot);

    // 背牆上的大字年份（很淡，當作背景的時間印記）
    const yr = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 1.5),
      new THREE.MeshBasicMaterial({
        map: textTexture([{ text: String(p.year), size: 190, weight: 900, color: 'rgba(190,215,255,.09)' }], { w: 1024, h: 512, center: true }),
        transparent: true, depthWrite: false
      })
    );
    yr.position.set(x, 2.65, WALL_Z + 0.015);
    scene.add(yr);

    // 用一個透明大盒子方便點擊
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, PED_H + size.y + 0.2, 1.3),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(x, (PED_H + size.y + 0.2) / 2, 0);
    hit.userData.index = i;
    scene.add(hit);

    // 有沉浸體驗的展台，台面上加一圈發光環，外面再有一圈往外擴散的波紋
    let ring = null, wave = null;
    if (hasScene(p)) {
      ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.022, 8, 64), new THREE.MeshBasicMaterial({ color: '#3b82f6' }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, PED_H + 0.055, 0);
      scene.add(ring);
      wave = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true }));
      wave.rotation.x = -Math.PI / 2;
      wave.position.copy(ring.position);
      scene.add(wave);
      rings.push({ ring, wave, phase: i * 0.7 });
    }

    return { p, pivot, reflPivot, hit, size, rig, ped };
  });

  /* ---------- 年代標示與牆上時間軸 ---------- */
  const eraInfo = Object.fromEntries(eras.map((e) => [e.id, e]));
  const tl = new THREE.Mesh(new THREE.PlaneGeometry(span + 4, 0.014), new THREE.MeshBasicMaterial({ color: '#8fb4f0', transparent: true, opacity: 0.45 }));
  tl.position.set(mid, 4.0, WALL_Z + 0.02);
  scene.add(tl);
  const dotGeo = new THREE.CircleGeometry(0.045, 20);
  const dotMat = new THREE.MeshBasicMaterial({ color: '#cfe2ff' });
  phones.forEach((p, i) => {
    const d = new THREE.Mesh(dotGeo, dotMat);
    d.position.set(i * SPACING, 4.0, WALL_Z + 0.025);
    scene.add(d);
  });
  const seen = new Set();
  const eraSigns = []; // 窄螢幕會被上方 HUD 蓋住，resize 時整批隱藏
  phones.forEach((p, i) => {
    if (seen.has(p.era)) return;
    seen.add(p.era);
    const e = eraInfo[p.era] || {};
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.9),
      new THREE.MeshBasicMaterial({
        map: textTexture([
          { text: e.label || p.era.replace('s', ' 年代'), size: 128, weight: 900, color: '#f2f5fb' },
          { text: e.network || '', size: 50, weight: 500, color: '#8fb4f0' }
        ], { w: 1024, h: 270, left: true }),
        transparent: true
      })
    );
    sign.position.set(i * SPACING - 1.0 + 1.7 - 0.55, 4.62, WALL_Z + 0.03);
    scene.add(sign); eraSigns.push(sign);
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.78), new THREE.MeshBasicMaterial({ color: BLUE }));
    bar.position.set(i * SPACING - 1.0 - 0.55 + 0.0, 4.62, WALL_Z + 0.03);
    scene.add(bar); eraSigns.push(bar);
  });

  /* ---------- 聚光燈光束與漂浮的微塵 ---------- */
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 1.1, 3.6, 40, 1, true),
    new THREE.MeshBasicMaterial({
      map: gradientTexture(['rgba(255,240,215,0)', 'rgba(255,240,215,.55)']), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.16
    })
  );
  scene.add(beam);
  const DUST = 140;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST * 3), dustSeed = new Float32Array(DUST);
  for (let k = 0; k < DUST; k++) {
    dustPos[k * 3] = (Math.random() - 0.5) * 7;
    dustPos[k * 3 + 1] = Math.random() * 4.5;
    dustPos[k * 3 + 2] = (Math.random() - 0.5) * 5;
    dustSeed[k] = Math.random() * 6.28;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.03, color: '#dfe9ff', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(dust);

  // 說明牌、光條等不受光的材質：關掉色調映射，顏色才不會被洗白
  scene.traverse((o) => { if (o.material && o.material.isMeshBasicMaterial) o.material.toneMapped = false; });

  /* ---------- 鏡頭與互動 ---------- */
  let current = 0, zoom = 1, tilt = 0, viewYaw = null;
  const hallEl = container.parentElement;
  const tools = document.createElement('div'); tools.className = 'hall-tools'; hallEl.appendChild(tools);
  const pinsEl = document.createElement('div'); pinsEl.className = 'hall-pins'; hallEl.appendChild(pinsEl);
  let pins = [], toolLabels = [], partsEl = null, slider = null, preZoom = 1, exploded = false;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const wantPos = new THREE.Vector3(), wantLook = new THREE.Vector3();

  function frame(i) {
    const e = exhibits[i];
    const h = Math.max(e.size.y, e.size.x);
    const wide = container.clientWidth >= 720;
    const dist = Math.max(2.1, h * 1.9 + 0.9) * zoom * (wide ? 1 : 1.15);
    // 桌機：展品偏左一點（右邊有操作列、左下有說明框）；手機：展品偏上（下方有說明框）
    const { x, y } = e.pivot.position;
    const open = exploded && e.rig.t.explode > 0.3;
    const sx = (wide ? 0.12 : 0) + (open && wide ? -0.42 : 0), sy = wide ? 0.1 : (open ? 0.1 : 0.32);
    wantLook.set(x + sx, y - sy, 0);
    wantPos.set(x + sx + 0.2, y + 0.12, dist);
    spot.position.set(e.pivot.position.x + 0.6, 4.4, 1.8);
    spot.target.position.copy(e.pivot.position);
    beam.position.set(x, PED_H + 0.05 + 1.8, 0);
  }

  function setZoom(z) { zoom = Math.max(0.5, Math.min(1.6, z)); frame(current); }
  function syncExploded() {
    const rig = exhibits[current].rig, on = rig.t.explode > 0.5;
    hallEl.classList.toggle('exploded', on);
    if (partsEl) partsEl.hidden = !on;
    if (!on && rig.sel) rig.select(null);
    if (slider) slider.value = Math.round(rig.t.explode * 100);
    refreshTools();
  }
  function setExplode(v) {
    const rig = exhibits[current].rig;
    rig.t.explode = v;
    viewYaw = v > 0.2 ? -0.95 : null;
    if (v > 0.3 && !exploded) { preZoom = zoom; zoom = 0.8; exploded = true; }
    else if (v <= 0.3 && exploded) { zoom = preZoom; exploded = false; }
    frame(current);
    syncExploded();
  }
  function toggleExplode() { setExplode(exhibits[current].rig.t.explode > 0.5 ? 0 : 1); }
  function flipView() {
    const cur = exhibits[current].pivot;
    viewYaw = Math.cos(cur.rotation.y) < 0 ? -0.35 : Math.PI + 0.35;
  }
  function refreshTools() { toolLabels.forEach(([b, l]) => { b.textContent = l(); }); }

  // 每次換展品，重做右側的操作按鈕和零件說明的小圓點
  function buildUI(i) {
    const rig = exhibits[i].rig;
    tools.innerHTML = ''; pinsEl.innerHTML = ''; pins = []; toolLabels = [];
    if (partsEl) partsEl.remove();
    hallEl.classList.remove('exploded');
    const mk = (label, fn, cls = '', parent = tools) => {
      const l = typeof label === 'function' ? label : () => label;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hall-tool ' + cls; b.textContent = l();
      b.addEventListener('click', () => { fn(); refreshTools(); });
      parent.appendChild(b); toolLabels.push([b, l]);
      return b;
    };
    mk(() => (rig.t.explode > 0.5 ? '組合起來' : '分解檢視'), toggleExplode, 'primary');
    const sl = document.createElement('label'); sl.className = 'hall-slider';
    sl.innerHTML = '<span>分解程度</span><input type="range" min="0" max="100" value="0" aria-label="分解程度">';
    tools.appendChild(sl); slider = sl.querySelector('input');
    slider.addEventListener('input', () => setExplode(+slider.value / 100));
    mk('翻面看背後', flipView);
    if (rig.screen) mk(() => (rig.screen.on ? '關閉螢幕' : '開啟螢幕'), () => rig.screen.toggleOn());
    rig.acts.forEach((a) => mk(a.label, () => a.run()));
    const row = document.createElement('div'); row.className = 'hall-tool-row'; tools.appendChild(row);
    mk('−', () => setZoom(zoom / 1.2), 'round', row).setAttribute('aria-label', '縮小');
    mk('＋', () => setZoom(zoom * 1.2), 'round', row).setAttribute('aria-label', '放大');
    mk('⟲', () => { zoom = 1; tilt = 0; viewYaw = -0.35; frame(current); }, 'round', row).setAttribute('aria-label', '重設視角');
    // 零件清單與說明卡（分解時才顯示）
    const plist = rig.parts.filter((q) => q.title).slice().reverse();
    partsEl = document.createElement('div'); partsEl.className = 'hall-parts'; partsEl.hidden = true;
    partsEl.innerHTML = `<div class="hp-head"><b>${plist.length}</b> 個零件</div><div class="hp-list">${plist.map((q, n) =>
      `<button type="button" data-n="${n}"><i style="background:${q.color}"></i>${q.title}</button>`).join('')}</div>` +
      '<div class="hp-card"><p class="hp-hint">點 3D 裡的零件或這份清單，看它的作用。</p></div>';
    hallEl.appendChild(partsEl);
    const card = partsEl.querySelector('.hp-card');
    partsEl.querySelectorAll('.hp-list button').forEach((bt) => {
      const q = plist[+bt.dataset.n];
      bt.addEventListener('click', () => rig.select(rig.sel === q ? null : q));
      bt.addEventListener('pointerenter', () => { rig.hov = q; });
      bt.addEventListener('pointerleave', () => { rig.hov = null; });
    });
    rig.onSelect = (q) => {
      partsEl.querySelectorAll('.hp-list button').forEach((bt) => {
        const on = plist[+bt.dataset.n] === q;
        bt.classList.toggle('on', on);
        if (on) bt.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      pins.forEach((pn) => pn.el.classList.toggle('sel', pn.h.part === q));
      card.innerHTML = q ? `<b><i style="background:${q.color}"></i>${q.title}</b><p>${q.text}</p>` : '<p class="hp-hint">點 3D 裡的零件或這份清單，看它的作用。</p>';
    };
    rig.sel = null; rig.hov = null;

    rig.hot.forEach((h) => {
      const b = document.createElement('button');
      b.type = 'button'; b.hidden = true; b.setAttribute('aria-label', h.title);
      if (h.part) {
        b.className = 'hall-pin part';
        b.innerHTML = `<i style="background:${h.part.color}"></i><em class="pin-tag">${h.title}</em>`;
        b.addEventListener('click', () => rig.select(rig.sel === h.part ? null : h.part));
        b.addEventListener('pointerenter', () => { rig.hov = h.part; });
        b.addEventListener('pointerleave', () => { rig.hov = null; });
      } else {
        b.className = 'hall-pin';
        b.innerHTML = `<i></i><span class="pin-card"><b>${h.title}</b>${h.text}</span>`;
        b.addEventListener('click', () => {
          const on = !b.classList.contains('open');
          pins.forEach((q) => q.el.classList.remove('open'));
          if (on) {
            b.classList.add('open');
            b.classList.toggle('left', parseFloat(b.style.left) > hallEl.clientWidth * 0.5);
            b.classList.toggle('up', parseFloat(b.style.top) > hallEl.clientHeight * 0.45);
          }
        });
      }
      pinsEl.appendChild(b);
      pins.push({ el: b, h });
    });
  }
  const _w = new THREE.Vector3(), _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Vector3();
  function updatePins() {
    const rig = exhibits[current].rig;
    const cr = container.getBoundingClientRect(), hr = hallEl.getBoundingClientRect();
    rig.root.getWorldQuaternion(_q);
    const ie = hallEl.querySelector('.hall-info'), ir = ie && !hallEl.classList.contains('exploded') ? ie.getBoundingClientRect() : null;
    for (const { el, h } of pins) {
      h.anchor.getWorldPosition(_w);
      let vis = h.needs === 'explode' ? rig.s.explode > 0.7 : rig.s.explode < 0.3;
      if (vis && h.side) { _n.set(0, 0, h.side).applyQuaternion(_q); _c.copy(camera.position).sub(_w).normalize(); vis = _c.dot(_n) > 0.2; }
      _w.project(camera);
      if (_w.z > 1) vis = false;
      if (el.hidden === vis) el.hidden = !vis;
      if (!vis) { el.classList.remove('open'); continue; }
      const px = (_w.x * 0.5 + 0.5) * cr.width + (cr.left - hr.left), py = (-_w.y * 0.5 + 0.5) * cr.height + (cr.top - hr.top);
      // 圓點落在說明卡範圍內就先收起來，避免浮在卡片文字上
      if (ir && px > ir.left - hr.left - 8 && px < ir.right - hr.left + 8 && py > ir.top - hr.top - 8 && py < ir.bottom - hr.top + 8) { el.hidden = true; el.classList.remove('open'); continue; }
      el.hidden = false;
      el.style.left = px + 'px';
      el.style.top = py + 'px';
    }
  }

  function goTo(target, snap = false) {
    const i = typeof target === 'number' ? target : phones.findIndex((p) => p.id === target);
    if (i < 0 || i >= exhibits.length) return;
    if (i !== current) { exhibits[current].rig.reset(); exhibits[current].pivot.rotation.x = 0; }
    current = i; zoom = 1; tilt = 0; viewYaw = null; exploded = false;
    frame(i);
    if (snap) { camPos.copy(wantPos); camLook.copy(wantLook); }
    buildUI(i);
    onSelect && onSelect(phones[i], i);
  }
  const step = (d) => goTo(Math.max(0, Math.min(exhibits.length - 1, current + d)));

  goTo(0);
  camPos.copy(wantPos).add(new THREE.Vector3(-1.5, 0.6, 1.5));
  camLook.copy(wantLook);

  // 拖曳旋轉、雙指縮放；點零件互動，點其他展台則移動過去
  const el = renderer.domElement;
  const ptrs = new Map();
  let dragging = false, pinch = null, wasPinch = false, lastX = 0, lastY = 0, downX = 0, downY = 0, idleAt = 0, spin = 0;
  el.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    el.setPointerCapture(e.pointerId);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: zoom }; wasPinch = true; dragging = false;
    } else { dragging = true; wasPinch = false; lastX = downX = e.clientX; lastY = downY = e.clientY; }
  });
  el.addEventListener('pointermove', (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      setZoom(pinch.z * pinch.d / (Math.hypot(a.x - b.x, a.y - b.y) || 1));
      return;
    }
    if (!dragging) { hover(e); return; }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) viewYaw = null;
    spin = dx * 0.012;
    exhibits[current].pivot.rotation.y += spin;
    tilt = Math.max(-0.7, Math.min(0.7, tilt + dy * 0.006));
    idleAt = performance.now();
  });
  const release = (e, canPick) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) {
      dragging = false;
      if (canPick && !wasPinch && Math.hypot(e.clientX - downX, e.clientY - downY) < 6) pick(e);
    }
  };
  el.addEventListener('pointerup', (e) => release(e, true));
  el.addEventListener('pointercancel', (e) => release(e, false));
  // 觸控板雙指縮放（Ctrl／⌘ + 滾輪）；一般滾輪維持捲動頁面
  el.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom(zoom * Math.exp(e.deltaY * 0.01));
  }, { passive: false });
  el.addEventListener('dblclick', () => { zoom = 1; tilt = 0; frame(current); });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hitAt(e) {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(exhibits.map((x) => x.hit))[0];
  }
  // 滑鼠移到可以點的東西上時變成手指
  let hoverBusy = 0;
  function hover(e) {
    if (e.pointerType !== 'mouse' || performance.now() - hoverBusy < 60) return;
    hoverBusy = performance.now();
    const h = hitAt(e);
    let can = false;
    if (h) can = h.object.userData.index !== current || !!ray.intersectObjects(exhibits[current].rig.inter, false)[0] || (hasScene(phones[current]) && !!ray.intersectObject(exhibits[current].ped)[0]);
    el.style.cursor = can ? 'pointer' : '';
  }
  function pick(e) {
    const hit = hitAt(e);
    if (!hit) return;
    const i = hit.object.userData.index;
    if (i !== current) { goTo(i); return; }
    const cur = exhibits[current];
    if (cur.rig.t.explode > 0.5) {
      const shown = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
      const h = ray.intersectObject(cur.rig.root, true).find((q) => q.object.isMesh && shown(q.object));
      const pt = h && cur.rig.partOf(h.object);
      cur.rig.select(pt && cur.rig.sel !== pt ? pt : null);
      return;
    }
    const ih = ray.intersectObjects(cur.rig.inter, false)[0];
    if (ih) { ih.object.userData.onTap(ih); refreshTools(); return; }
    if (ray.intersectObject(cur.pivot, true)[0]) return;   // 點在機身上：沒有反應
    if (hasScene(phones[i]) && onEnter && ray.intersectObject(cur.ped)[0]) onEnter(phones[i]);   // 點展台：進入沉浸體驗
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
    eraSigns.forEach((m) => { m.visible = w >= 720; });
    camera.updateProjectionMatrix();
    frame(current);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ---------- 動畫迴圈 ---------- */
  let running = false, last = 0, raf = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dustHome = new THREE.Vector3();
  const pairCache = new Map();
  // 倒影要跟著零件動（開蓋、分解、螢幕畫面）：把目前展品每個零件的姿態複製給倒影
  function syncMirror(E) {
    let pr = pairCache.get(E);
    if (!pr) {
      const a = [], b = [];
      E.pivot.traverse((o) => a.push(o)); E.reflPivot.traverse((o) => b.push(o));
      pr = a.map((o, n) => [o, b[n]]); pairCache.set(E, pr);
    }
    for (const [s, d] of pr) {
      d.position.copy(s.position); d.quaternion.copy(s.quaternion); d.scale.copy(s.scale); d.visible = s.visible;
      if (s.isMesh && d.geometry !== s.geometry) d.geometry = s.geometry;
    }
  }

  function tick(t) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 4);
    camPos.lerp(wantPos, k);
    camLook.lerp(wantLook, k);
    // 鏡頭帶一點很慢的呼吸晃動
    const sway = reduceMotion ? 0 : Math.sin(t / 2600) * 0.05;
    camera.position.set(camPos.x + sway, camPos.y + sway * 0.4, camPos.z);
    camera.lookAt(camLook);

    const E = exhibits[current], cur = E.pivot;
    E.rig.update(dt, t / 1000);
    if (!dragging) {
      spin *= 0.92; // 放手後的慣性
      cur.rotation.y += spin;
      if (viewYaw !== null) {
        const d = ((viewYaw - cur.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        cur.rotation.y += d * k;
      } else if (!reduceMotion && performance.now() - idleAt > 2500 && E.rig.s.explode < 0.1) cur.rotation.y += dt * 0.4;
    }
    // 垂直拖曳造成的傾斜，放手後慢慢回正
    const restTilt = E.rig.t.explode > 0.5 ? 0.22 : 0;
    if (!dragging) tilt += (restTilt - tilt) * Math.min(1, dt * 1.2);
    cur.rotation.x += (tilt - cur.rotation.x) * Math.min(1, dt * 10);
    syncMirror(E);
    updatePins();

    // 發光環呼吸，外圈波紋往外擴散
    const s = t / 1000;
    rings.forEach((r) => {
      const g = 0.5 + Math.sin(s * 2.4 + r.phase) * 0.5;
      r.ring.material.color.setRGB(0.14 + 0.1 * g, 0.4 + 0.15 * g, 0.95);
      const w = reduceMotion ? 0.5 : ((s * 0.55 + r.phase) % 1);
      r.wave.scale.setScalar(1 + w * 0.55);
      r.wave.material.opacity = (1 - w) * 0.7;
    });

    // 微塵跟著目前的展台，緩慢飄動
    dustHome.set(cur.position.x, 0, 0.3);
    dust.position.lerp(dustHome, k);
    if (!reduceMotion) {
      const a = dustGeo.attributes.position;
      for (let n = 0; n < DUST; n++) {
        a.array[n * 3 + 1] += dt * 0.05;
        if (a.array[n * 3 + 1] > 4.5) a.array[n * 3 + 1] = 0;
        a.array[n * 3] += Math.sin(s * 0.4 + dustSeed[n]) * dt * 0.03;
      }
      a.needsUpdate = true;
    }
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
    dispose() { pause(); tools.remove(); pinsEl.remove(); if (partsEl) partsEl.remove(); ro.disconnect(); window.removeEventListener('keydown', onKey); pmrem.dispose(); renderer.dispose(); el.remove(); }
  };
}

/* ====================================================================
   場景貼圖：地板、牆面、光暈
   ==================================================================== */
function floorTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#0d1422'; x.fillRect(0, 0, 256, 256);
  const g = x.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, 'rgba(255,255,255,.035)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(160,190,255,.16)'; x.lineWidth = 2;
  x.strokeRect(1, 1, 254, 254);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
function wallTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#101a2e'); g.addColorStop(1, '#16223a');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  // 嵌板接縫：左右各一條暗縫加一條亮邊，看起來像裝了板子
  x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, 0, 3, 512);
  x.fillStyle = 'rgba(160,190,255,.07)'; x.fillRect(3, 0, 2, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function gradientTexture([top, bottom]) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 128;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  x.fillStyle = g; x.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
}
function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(120,170,255,.55)'); g.addColorStop(0.45, 'rgba(90,140,240,.16)'); g.addColorStop(1, 'rgba(90,140,240,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
function fitSize(text, max, width) {
  const x = document.createElement('canvas').getContext('2d');
  let s = max;
  do { x.font = `700 ${s}px ${FONT}`; s -= 2; } while (x.measureText(text).width > width && s > 18);
  return s + 2;
}
function textTexture(lines, { w, h, bg = null, left = false, center = false }) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  const alignLeft = left || (!center && lines.length === 1 && !bg);
  x.textAlign = alignLeft ? 'left' : 'center';
  x.textBaseline = 'middle';
  const total = lines.reduce((s, l) => s + l.size * 1.2, 0);
  let y = (h - total) / 2;
  lines.forEach((l) => {
    x.font = `${l.weight} ${l.size}px ${FONT}`;
    x.fillStyle = l.color;
    y += l.size * 0.6;
    x.fillText(l.text, alignLeft ? 28 : w / 2, y);
    y += l.size * 0.6;
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
