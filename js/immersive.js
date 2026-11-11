// 沉浸體驗的播放器：全螢幕 3D 場景、拖曳或陀螺儀轉視角、演出與自由參觀交替、看向發光點出現解說。
// 劇情文字在 data.js 的 scenes，場景與動作在 js/scenes/<module>.js。
import * as THREE from 'three';
import { clearMatCache } from './scene-kit.js';

const DWELL = 1.1;   // 盯著發光點幾秒會打開解說
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function openExperience({ script, phone, onExit }) {
  /* ---------- 介面 ---------- */
  const root = document.createElement('div');
  root.className = 'imm';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', script.title);
  root.innerHTML = `
    <div class="imm-canvas"></div>
    <div class="imm-top">
      <button class="imm-btn" data-act="exit" aria-label="離開體驗">✕ 離開</button>
      <div class="imm-steps" aria-hidden="true">${script.beats.map(() => '<span></span>').join('')}</div>
      <button class="imm-btn" data-act="gyro" hidden>體感：關</button>
    </div>
    <div class="imm-reticle" aria-hidden="true">
      <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="4" class="dot"/><circle cx="22" cy="22" r="17" class="ring"/></svg>
      <div class="imm-peek"></div>
    </div>
    <div class="imm-arrow" aria-hidden="true"></div>
    <p class="imm-caption" aria-live="polite"></p>
    <div class="imm-explore" hidden>
      <p class="imm-prompt"></p>
      <div class="imm-explore-row">
        <span class="imm-count"></span>
        <button class="imm-btn primary" data-act="next">繼續劇情 →</button>
      </div>
    </div>
    <button class="imm-btn imm-skip" data-act="skip" hidden>跳過 ›</button>
    <div class="imm-card" hidden role="region" aria-live="polite">
      <p class="eyebrow">展品解說</p>
      <h3></h3>
      <p class="imm-card-text"></p>
      <button class="imm-btn" data-act="close-card">知道了</button>
    </div>
    <div class="imm-sheet imm-intro">
      <p class="eyebrow">沉浸體驗</p>
      <h2>${esc(script.title)}</h2>
      <p>${esc(script.intro)}</p>
      <ul class="imm-how">
        <li><b>轉動視角</b>用手指拖曳畫面${'ontouchstart' in window ? '，或開啟體感直接轉動手機' : '，或用方向鍵'}</li>
        <li><b>看解說</b>劇情中間會停下來讓你自由參觀，把畫面中央的準星對準發光的圓點</li>
      </ul>
      <p class="imm-note">${esc(script.note)}</p>
      <div class="imm-actions">
        <button class="btn primary" data-act="start">開始體驗</button>
        <button class="btn" data-act="start-gyro" hidden>用體感開始</button>
      </div>
      <p class="imm-loading">場景載入中…</p>
    </div>
    <div class="imm-sheet imm-end" hidden>
      <p class="eyebrow">體驗結束</p>
      <h2>回到現在</h2>
      <p>從那時候的「大哥大」，到現在人手一支的智慧型手機，只花了大約 40 年。</p>
      <div class="imm-actions">
        <button class="btn primary" data-act="exit">回到展廳</button>
        <button class="btn" data-act="replay">重看一次</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('imm-open');
  const $ = (s) => root.querySelector(s);
  const ui = {
    canvas: $('.imm-canvas'), steps: [...root.querySelectorAll('.imm-steps span')],
    caption: $('.imm-caption'), explore: $('.imm-explore'), prompt: $('.imm-prompt'), count: $('.imm-count'),
    next: $('[data-act="next"]'), skip: $('.imm-skip'), card: $('.imm-card'), ring: $('.imm-reticle .ring'),
    reticle: $('.imm-reticle'), peek: $('.imm-peek'), arrow: $('.imm-arrow'), intro: $('.imm-intro'), end: $('.imm-end'),
    gyroBtn: $('[data-act="gyro"]'), gyroStart: $('[data-act="start-gyro"]')
  };
  const RING = 2 * Math.PI * 17;
  ui.ring.style.strokeDasharray = RING;
  ui.ring.style.strokeDashoffset = RING;

  /* ---------- 3D ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  ui.canvas.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 400);
  camera.rotation.order = 'YXZ';

  let world;
  try {
    const mod = await import(`./scenes/${script.module}.js`);
    world = mod.build({ scene, phone });
  } catch (err) {
    root.remove();
    document.documentElement.classList.remove('imm-open');
    renderer.dispose();
    throw err;
  }
  $('.imm-loading').remove();
  camera.position.copy(world.view.pos);

  // 發光點
  const spotTex = glowTexture(false), doneTex = glowTexture(true);
  const spots = {};
  for (const [id, h] of Object.entries(world.hotspots)) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: spotTex, depthTest: false, transparent: true }));
    s.renderOrder = 10;
    s.visible = false;
    scene.add(s);
    spots[id] = { ...h, id, sprite: s, seen: false, info: script.hotspots[id] };
  }

  /* ---------- 視角：拖曳 + 陀螺儀 ---------- */
  let yaw = world.view.yaw, pitch = world.view.pitch;
  let gyro = false, gyroQ = null, yawOffset = 0, lastDrag = -1e9;
  let autoTurn = null; // { yaw, pitch }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = renderer.domElement;
  let drag = null;
  el.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const k = (camera.fov * Math.PI / 180) / el.clientHeight;
    const dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
    drag.x = e.clientX; drag.y = e.clientY;
    if (gyro) yawOffset += dx;
    else { yaw += dx; pitch = clampPitch(pitch + dy); }
    lastDrag = performance.now();
    autoTurn = null;
  });
  el.addEventListener('pointerup', (e) => {
    if (drag && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) tap(e);
    drag = null;
  });
  el.addEventListener('pointercancel', () => { drag = null; });
  const clampPitch = (p) => Math.max(-1.2, Math.min(1.25, p));

  const keys = new Set();
  function onKey(e) {
    if (e.type === 'keyup') { keys.delete(e.key); return; }
    if (e.key === 'Escape') { exit(); return; }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { keys.add(e.key); e.preventDefault(); autoTurn = null; lastDrag = performance.now(); }
    if ((e.key === ' ' || e.key === 'Enter') && mode === 'explore' && document.activeElement === document.body) { e.preventDefault(); nextBeat(); }
  }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  // 陀螺儀（iPhone 需要使用者按按鈕授權；Claude 預覽頁面裡會被擋，改用拖曳）
  const euler = new THREE.Euler(), q0 = new THREE.Quaternion(), qFix = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  const zee = new THREE.Vector3(0, 0, 1);
  function onOrient(e) {
    if (e.alpha == null) return;
    const d = Math.PI / 180;
    const orient = (screen.orientation ? screen.orientation.angle : window.orientation || 0) * d;
    euler.set(e.beta * d, e.alpha * d, -e.gamma * d, 'YXZ');
    gyroQ = (gyroQ || new THREE.Quaternion()).setFromEuler(euler).multiply(qFix).multiply(q0.setFromAxisAngle(zee, -orient));
  }
  const canGyro = 'ontouchstart' in window && typeof DeviceOrientationEvent !== 'undefined';
  if (canGyro) { ui.gyroStart.hidden = false; ui.gyroBtn.hidden = false; }
  async function enableGyro() {
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') throw new Error('denied');
      }
    } catch { return toast('沒有取得體感權限，請用手指拖曳畫面'); }
    gyroQ = null;
    window.addEventListener('deviceorientation', onOrient);
    // 等第一筆資料進來，再把現在的方向對齊目前視角
    const t0 = performance.now();
    const wait = () => {
      if (gyroQ) {
        const f = new THREE.Vector3(0, 0, -1).applyQuaternion(gyroQ);
        yawOffset = yaw - Math.atan2(-f.x, -f.z);
        gyro = true;
        ui.gyroBtn.textContent = '體感：開';
        return;
      }
      if (performance.now() - t0 > 1500) {
        window.removeEventListener('deviceorientation', onOrient);
        return toast('這個瀏覽器沒有提供陀螺儀資料，請用手指拖曳畫面');
      }
      requestAnimationFrame(wait);
    };
    wait();
  }
  function disableGyro() {
    if (!gyro) return;
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    yaw = Math.atan2(-f.x, -f.z);
    pitch = clampPitch(Math.asin(Math.max(-1, Math.min(1, f.y))));
    gyro = false;
    window.removeEventListener('deviceorientation', onOrient);
    ui.gyroBtn.textContent = '體感：關';
  }
  let toastTimer;
  function toast(msg) {
    let t = root.querySelector('.imm-toast');
    if (!t) { t = document.createElement('div'); t.className = 'imm-toast'; root.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ---------- 劇情進度 ---------- */
  let mode = 'intro', idx = 0, beatT = 0, lastPlay = null, focusId = null;
  let dwellId = null, dwell = 0, openCardId = null;
  const beats = script.beats;

  function startBeat(i) {
    idx = i;
    beatT = 0;
    closeCard();
    ui.steps.forEach((s, k) => s.className = k < i ? 'done' : k === i ? 'now' : '');
    if (i >= beats.length) return showEnd();
    const b = beats[i];
    mode = b.type;
    ui.explore.hidden = mode !== 'explore';
    ui.skip.hidden = mode !== 'play';
    ui.caption.textContent = '';
    ui.caption.classList.remove('show');
    Object.values(spots).forEach((s) => { s.sprite.visible = false; });
    if (mode === 'play') {
      lastPlay = b;
      focusId = null;
    } else {
      b.hotspots.forEach((id) => { spots[id].sprite.visible = true; });
      ui.prompt.textContent = b.prompt;
      updateCount();
    }
  }
  function nextBeat() { startBeat(idx + 1); }
  function updateCount() {
    const ids = beats[idx].hotspots;
    const n = ids.filter((id) => spots[id].seen).length;
    ui.count.textContent = `已看 ${n}／${ids.length}`;
    ui.next.classList.toggle('pulse', n === ids.length);
  }
  function showEnd() {
    mode = 'end';
    ui.explore.hidden = true;
    ui.skip.hidden = true;
    ui.caption.classList.remove('show');
    ui.end.hidden = false;
    ui.end.querySelector('.btn').focus();
  }
  function openCard(id) {
    const s = spots[id];
    openCardId = id;
    ui.card.querySelector('h3').textContent = s.info.title;
    ui.card.querySelector('.imm-card-text').textContent = s.info.text;
    ui.card.hidden = false;
    ui.explore.classList.add('dim');
    if (!s.seen) {
      s.seen = true;
      s.sprite.material.map = doneTex;
      updateCount();
    }
  }
  function closeCard() {
    openCardId = null;
    ui.card.hidden = true;
    ui.explore.classList.remove('dim');
  }

  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'exit') exit();
    if (act === 'start' || act === 'start-gyro') {
      ui.intro.hidden = true;
      if (act === 'start-gyro') enableGyro();
      startBeat(0);
    }
    if (act === 'gyro') gyro ? disableGyro() : enableGyro();
    if (act === 'next') nextBeat();
    if (act === 'skip' && mode === 'play') { beatT = playDuration(beats[idx]); }
    if (act === 'close-card') closeCard();
    if (act === 'replay') {
      ui.end.hidden = true;
      Object.values(spots).forEach((s) => { s.seen = false; s.sprite.material.map = spotTex; });
      startBeat(0);
    }
  });
  const playDuration = (b) => world.beats[b.scene].duration;

  /* ---------- 看向／點擊發光點 ---------- */
  const fwd = new THREE.Vector3(), tmp = new THREE.Vector3();
  function spotUnder(dir, loose = 1) {
    let best = null, bestA = Infinity;
    for (const id of beats[idx]?.hotspots || []) {
      const s = spots[id];
      tmp.copy(s.sprite.position).sub(camera.position);
      const dist = tmp.length();
      const a = tmp.normalize().angleTo(dir);
      const thr = Math.max(0.07, Math.atan(s.size * 0.7 / dist)) * loose;
      if (a < thr && a < bestA) { best = id; bestA = a; }
    }
    return best;
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function tap(e) {
    if (mode !== 'explore') return;
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const id = spotUnder(ray.ray.direction, 1.6);
    if (id) openCard(id);
  }

  /* ---------- 迴圈 ---------- */
  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 72 : 58;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();

  const dirTo = (p) => {
    tmp.copy(p).sub(camera.position);
    return { yaw: Math.atan2(-tmp.x, -tmp.z), pitch: Math.atan2(tmp.y, Math.hypot(tmp.x, tmp.z)) };
  };
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  let raf = 0, last = performance.now(), T = 0, running = true;
  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    T += dt;

    // 劇情
    if (mode === 'play') {
      const b = beats[idx];
      beatT += dt;
      const dur = playDuration(b);
      world.beats[b.scene].update(Math.min(beatT, dur), T);
      const cap = [...b.captions].reverse().find((c) => c.at <= beatT);
      if (cap && ui.caption.textContent !== cap.text) {
        ui.caption.textContent = cap.text;
        ui.caption.classList.add('show');
      }
      const f = [...(b.focus || [])].reverse().find((c) => c.at <= beatT);
      if (f && f.target !== focusId) {
        focusId = f.target;
        if (!gyro && now - lastDrag > 1500) autoTurn = true;
      }
      if (beatT >= dur + 0.6) nextBeat();
    } else if (lastPlay || mode === 'intro') {
      const b = lastPlay || beats[0];
      world.beats[b.scene].update(lastPlay ? playDuration(b) : 0, T);
    }
    world.ambient(T, dt);
    world.finish();

    // 鏡頭
    if (keys.size) {
      const s = dt * 1.6;
      if (keys.has('ArrowLeft')) gyro ? yawOffset += s : yaw += s;
      if (keys.has('ArrowRight')) gyro ? yawOffset -= s : yaw -= s;
      if (keys.has('ArrowUp') && !gyro) pitch = clampPitch(pitch + s);
      if (keys.has('ArrowDown') && !gyro) pitch = clampPitch(pitch - s);
    }
    if (mode === 'play' && focusId && autoTurn && !gyro) {
      const want = dirTo(world.focus[focusId]());
      const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 2.2);
      const dy = wrap(want.yaw - yaw), dp = want.pitch - pitch;
      yaw += dy * k;
      pitch = clampPitch(pitch + dp * k);
      if (Math.abs(dy) < 0.01 && Math.abs(dp) < 0.01) autoTurn = false;
    }
    if (gyro && gyroQ) {
      camera.quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yawOffset).multiply(gyroQ);
    } else {
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
    camera.getWorldDirection(fwd);

    // 發光點與準星
    const pulse = 1 + Math.sin(T * 4) * 0.08;
    for (const s of Object.values(spots)) {
      if (!s.sprite.visible) continue;
      s.sprite.position.copy(s.pos());
      const sz = s.size * (s.seen ? 0.8 : pulse);
      s.sprite.scale.set(sz, sz, 1);
      s.sprite.material.opacity = s.seen ? 0.7 : 1;
    }
    let peek = '';
    if (mode === 'explore') {
      const id = spotUnder(fwd);
      if (id !== dwellId) { dwellId = id; dwell = 0; }
      if (id && id !== openCardId) {
        dwell += dt;
        peek = spots[id].info.title;
        if (dwell >= DWELL) { openCard(id); dwell = 0; }
      } else dwell = 0;
    } else { dwellId = null; dwell = 0; }
    ui.ring.style.strokeDashoffset = RING * (1 - Math.min(1, dwell / DWELL));
    ui.reticle.classList.toggle('active', !!dwellId);
    ui.reticle.hidden = mode !== 'explore';
    if (ui.peek.textContent !== peek) ui.peek.textContent = peek;

    // 提示箭頭：要看的東西不在畫面上時，指出方向
    let arrow = '';
    let target = null;
    if (mode === 'play' && focusId) target = world.focus[focusId]();
    if (mode === 'explore' && !dwellId) {
      const left = beats[idx].hotspots.filter((id) => !spots[id].seen).map((id) => spots[id].sprite.position);
      if (left.length && !left.some((p) => onScreen(p))) {
        target = left.reduce((a, b) => (tmp.copy(a).sub(camera.position).normalize().angleTo(fwd) < tmp.copy(b).sub(camera.position).normalize().angleTo(fwd) ? a : b));
      }
    }
    if (target && !onScreen(target)) {
      const want = dirTo(target);
      const cur = Math.atan2(-fwd.x, -fwd.z);
      const d = wrap(want.yaw - cur);
      const hfov = 2 * Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
      if (Math.abs(d) > hfov * 0.42) arrow = d > 0 ? 'left' : 'right';
      else arrow = want.pitch > Math.asin(fwd.y) ? 'up' : 'down';
    }
    if (ui.arrow.dataset.dir !== arrow) {
      ui.arrow.dataset.dir = arrow;
      ui.arrow.textContent = { left: '‹ 看這邊', right: '看這邊 ›', up: '︿ 往上看', down: '往下看 ﹀' }[arrow] || '';
    }

    renderer.render(scene, camera);
  }
  const proj = new THREE.Vector3();
  function onScreen(p) {
    proj.copy(p).project(camera);
    return proj.z < 1 && Math.abs(proj.x) < 0.9 && Math.abs(proj.y) < 0.85;
  }
  raf = requestAnimationFrame(tick);

  // 嘗試全螢幕（手機瀏覽器支援時）
  try { if (window.matchMedia('(pointer: coarse)').matches) root.requestFullscreen?.().catch(() => {}); } catch {}

  /* ---------- 離開 ---------- */
  let closed = false;
  function exit() {
    if (closed) return;
    closed = true;
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
    window.removeEventListener('deviceorientation', onOrient);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach((m) => { if (m.map && !m.map.userData.shared) m.map.dispose(); m.dispose(); });
    });
    clearMatCache();
    renderer.dispose();
    root.remove();
    document.documentElement.classList.remove('imm-open');
    onExit && onExit();
  }
  ui.intro.querySelector('[data-act="start"]').focus();
  // 給測試用：跳到第 i 段的第 t 秒、設定視角
  const debug = {
    go(i, t = 0) { ui.intro.hidden = true; ui.end.hidden = true; startBeat(i); beatT = t; },
    look(y, p) { yaw = y; pitch = p; autoTurn = null; lastDrag = performance.now(); },
    lookAt(id) { const d = dirTo(spots[id] ? spots[id].pos() : world.focus[id]()); yaw = d.yaw; pitch = d.pitch; autoTurn = null; lastDrag = performance.now(); }
  };
  return { exit, debug };
}

function glowTexture(done) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 8, 64, 64, 64);
  g.addColorStop(0, done ? 'rgba(255,255,255,.9)' : 'rgba(255,214,150,1)');
  g.addColorStop(0.35, done ? 'rgba(200,200,200,.35)' : 'rgba(255,140,40,.65)');
  g.addColorStop(1, 'rgba(255,120,20,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  x.lineWidth = 6;
  x.strokeStyle = done ? 'rgba(255,255,255,.8)' : '#fff3e0';
  x.beginPath(); x.arc(64, 64, 30, 0, Math.PI * 2); x.stroke();
  if (done) {
    x.strokeStyle = '#3b7d3b';
    x.lineWidth = 9;
    x.beginPath(); x.moveTo(48, 65); x.lineTo(60, 77); x.lineTo(82, 52); x.stroke();
  } else {
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(64, 64, 11, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
