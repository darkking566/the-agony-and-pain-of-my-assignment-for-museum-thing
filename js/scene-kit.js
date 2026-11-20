// 沉浸場景共用的小工具：人物、材質、建築、汽車、文字貼圖。
// 人物是低多邊形的小人（不做臉），手臂用簡單的 IK 讓手可以「伸到」指定位置。
import * as THREE from 'three';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const ease = (x) => x * x * (3 - 2 * x);
/** t 在 a→b 之間時從 0 平滑變到 1 */
export const span = (t, a, b) => ease(clamp01((t - a) / (b - a)));
export const lerp = (a, b, k) => a + (b - a) * k;

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts }));
  return matCache.get(key);
}
export function clearMatCache() { matCache.clear(); }

export function box(w, h, d, color, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color, opts) : color);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export function cyl(rt, rb, h, color, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof color === 'string' ? mat(color) : color);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
export function textTexture(text, { w = 512, h = 128, bg = '#1d2a3a', color = '#f4efe6', size = 72, weight = 900, font = FONT } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = color;
  x.font = `${weight} ${size}px ${font}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function sign(text, w, h, opts) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: textTexture(text, opts), roughness: 0.7 }));
  return m;
}

/* ---------- 人物 ---------- */
const DOWN = V(0, -1, 0);
const _a = V(), _b = V(), _c = V(), _d = V(), _q = new THREE.Quaternion();

export class Person {
  constructor({ skin = '#d9a77f', top = '#3b4a5a', bottom = '#2a2a2e', hair = '#2b1d14', shoes = '#1b1b1b', height = 1, dress = false, sleeves } = {}) {
    this.s = height;
    const root = this.root = new THREE.Group();
    root.scale.setScalar(height);
    const hips = this.hips = new THREE.Group();
    hips.position.y = 0.92;
    root.add(hips);

    this.legs = [1, -1].map((side) => {
      const leg = new THREE.Group();
      leg.position.set(side * 0.1, 0, 0);
      const thigh = box(0.15, 0.86, 0.17, bottom);
      thigh.position.y = -0.43;
      const shoe = box(0.14, 0.08, 0.26, shoes);
      shoe.position.set(0, -0.88, 0.04);
      leg.add(thigh, shoe);
      hips.add(leg);
      return leg;
    });
    if (dress) {
      const skirt = cyl(0.2, 0.3, 0.52, bottom, 12);
      skirt.position.y = -0.2;
      hips.add(skirt);
    }

    const torso = this.torso = new THREE.Group();
    hips.add(torso);
    const chest = box(0.42, 0.56, 0.24, top);
    chest.position.y = 0.3;
    const neck = cyl(0.05, 0.06, 0.08, skin, 8);
    neck.position.y = 0.62;
    torso.add(chest, neck);

    const head = this.head = new THREE.Group();
    head.position.y = 0.64;
    torso.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), mat(skin));
    skull.position.y = 0.12;
    skull.castShadow = true;
    // 頭髮蓋住頭頂和後腦，讓人看得出臉朝哪裡
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), mat(hair));
    cap.position.y = 0.12;
    cap.rotation.x = -0.55;
    cap.castShadow = true;
    head.add(skull, cap);

    // 臉：眼睛、眉毛、鼻子、嘴（臉朝 +z）
    const dark = mat('#1a1410', { roughness: 0.5 });
    const skinDeep = mat(new THREE.Color(skin).multiplyScalar(0.86).getStyle());
    const white = mat('#f4f1ea', { roughness: 0.4 });
    const face = this.face = new THREE.Group();
    face.position.set(0, 0.12, 0);
    [1, -1].forEach((sd) => {
      const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), white);
      eyeW.scale.set(1, 0.8, 0.5); eyeW.position.set(sd * 0.044, 0.018, 0.108);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0115, 8, 6), dark);
      pupil.scale.set(1, 1, 0.6); pupil.position.set(sd * 0.044, 0.018, 0.116);
      const lid = box(0.04, 0.007, 0.012, hair); lid.castShadow = false;
      lid.position.set(sd * 0.044, 0.045, 0.108); lid.rotation.z = sd * -0.12;
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), mat(new THREE.Color(skin).lerp(new THREE.Color('#e07a6a'), 0.25).getStyle()));
      cheek.scale.set(1, 0.7, 0.4); cheek.position.set(sd * 0.07, -0.022, 0.098);
      face.add(eyeW, pupil, lid, cheek);
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), skinDeep);
    nose.scale.set(0.8, 1, 1); nose.position.set(0, -0.012, 0.12);
    const mouth = box(0.05, 0.006, 0.01, '#8c4a44', { roughness: 0.6 });
    mouth.castShadow = false; mouth.position.set(0, -0.05, 0.108);
    face.add(nose, mouth);
    face.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    head.add(face);

    // 頭兩側的掛點：拿電話、話筒時用
    this.ear = {};
    [1, -1].forEach((side) => {
      const a = new THREE.Object3D();
      a.position.set(side * 0.17, 0.09, 0.05);
      a.rotation.set(-0.45, -side * (Math.PI / 2 - 0.45), 0);
      head.add(a);
      this.ear[side > 0 ? 'L' : 'R'] = a;
    });

    this.arms = {};
    [1, -1].forEach((side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.27, 0.52, 0);
      const upper = box(0.11, 0.3, 0.12, sleeves || top);
      upper.position.y = -0.15;
      const elbow = new THREE.Group();
      elbow.position.y = -0.3;
      const fore = box(0.1, 0.27, 0.11, sleeves || top);
      fore.position.y = -0.135;
      const hand = new THREE.Group();
      hand.position.y = -0.3;
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mat(skin));
      palm.castShadow = true;
      hand.add(palm);
      // 手指：四指併攏、微彎，拇指在內側
      const fm = mat(skin);
      [[-0.024, 0.052], [-0.008, 0.06], [0.008, 0.058], [0.024, 0.046]].forEach(([fx, len]) => {
        const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, len, 3, 6), fm);
        f.position.set(fx, -0.06 - len * 0.3, 0.03);
        f.rotation.x = -0.5;
        hand.add(f);
      });
      const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.03, 3, 6), fm);
      th.position.set(-side * 0.045, -0.03, 0.04);
      th.rotation.set(-0.7, 0, -side * 0.7);
      hand.add(th);
      // 手上的掛點：拿東西時用
      const grip = new THREE.Object3D();
      grip.position.set(0, -0.03, 0.03);
      hand.add(grip);
      elbow.add(fore, hand);
      shoulder.add(upper, elbow);
      torso.add(shoulder);
      this.arms[side > 0 ? 'L' : 'R'] = { side, shoulder, elbow, hand, grip };
    });

    // 每一格動畫由劇本設定以下狀態，最後呼叫 apply()
    this.reset();
  }

  reset() {
    this.pos = V();
    this.yaw = 0;
    this.walkPhase = 0;
    this.walkAmt = 0;
    this.lean = 0;
    this.bob = 0;
    this.look = null;      // 世界座標，頭轉向那裡
    this.lookAmt = 1;
    this.headTilt = 0;     // 額外低頭（正值）
    this.reach = { L: null, R: null }; // { target: 世界座標, pole: 世界座標 }
  }

  /** 從 a 走到 b（地面座標），t 在 t0→t1 之間移動 */
  walk(a, b, t, t0, t1) {
    const k = clamp01((t - t0) / (t1 - t0));
    this.pos.lerpVectors(a, b, k);
    const moving = k > 0 && k < 1;
    this.walkAmt = moving ? Math.min(1, Math.min(k, 1 - k) * 12) : 0;
    this.walkPhase = a.distanceTo(this.pos) * 4.4;
    if (moving || k === 0) this.yaw = Math.atan2(b.x - a.x, b.z - a.z);
    return k;
  }

  /** 世界座標轉成這個人的身體座標（用來描述「胸前」「耳邊」之類的位置） */
  local(x, y, z, out = V()) {
    out.set(x, y, z);
    return this.root.localToWorld(out);
  }

  apply() {
    const { root, hips, torso, head } = this;
    root.position.copy(this.pos);
    root.rotation.y = this.yaw;
    const sw = Math.sin(this.walkPhase) * this.walkAmt;
    hips.position.y = 0.92 + Math.abs(Math.cos(this.walkPhase)) * 0.03 * this.walkAmt + this.bob;
    this.legs[0].rotation.x = -sw * 0.55;
    this.legs[1].rotation.x = sw * 0.55;
    torso.rotation.x = this.lean;

    // 頭轉向
    head.rotation.set(0, 0, 0);
    if (this.look) {
      root.updateMatrixWorld(true);
      const l = root.worldToLocal(_a.copy(this.look));
      l.y -= 1.62;
      const yaw = Math.max(-1.2, Math.min(1.2, Math.atan2(l.x, l.z)));
      const pitch = Math.max(-0.6, Math.min(0.7, Math.atan2(-l.y, Math.hypot(l.x, l.z))));
      head.rotation.y = yaw * this.lookAmt;
      head.rotation.x = pitch * this.lookAmt;
    }
    head.rotation.x += this.headTilt;

    // 手臂：沒有指定目標就自然擺動
    for (const k of ['L', 'R']) {
      const arm = this.arms[k];
      arm.shoulder.quaternion.identity();
      arm.elbow.quaternion.identity();
      if (!this.reach[k]) {
        arm.shoulder.rotation.set(sw * 0.45 * (k === 'L' ? 1 : -1), 0, arm.side * 0.07);
        arm.elbow.rotation.set(-0.2 - this.walkAmt * 0.25, 0, 0);
      }
    }
    root.updateMatrixWorld(true);
    for (const k of ['L', 'R']) if (this.reach[k]) this.solve(this.arms[k], this.reach[k]);
  }

  // 兩段式手臂 IK：給手的目標和手肘大概朝向的點
  solve(arm, { target, pole }) {
    if (typeof target === 'function') target = target();
    if (typeof pole === 'function') pole = pole();
    const L1 = 0.3 * this.s, L2 = 0.3 * this.s;
    const S = arm.shoulder.getWorldPosition(_a);
    const dir = _b.subVectors(target, S);
    const dist = Math.max(0.05, Math.min(dir.length(), (L1 + L2) * 0.999));
    dir.normalize();
    const cosA = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist);
    const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const p = _c.subVectors(pole, S);
    p.addScaledVector(dir, -p.dot(dir));
    if (p.lengthSq() < 1e-6) p.set(0, -1, 0);
    p.normalize();
    const E = _d.copy(S).addScaledVector(dir, Math.cos(A) * L1).addScaledVector(p, Math.sin(A) * L1);
    const H = S.clone().addScaledVector(dir, dist);
    const u = H.clone().sub(E).normalize(); // 前臂方向
    const up = E.clone().sub(S).normalize(); // 上臂方向

    arm.shoulder.parent.getWorldQuaternion(_q).invert();
    arm.shoulder.quaternion.setFromUnitVectors(DOWN, up.applyQuaternion(_q));
    arm.shoulder.updateMatrixWorld(true);
    arm.shoulder.getWorldQuaternion(_q).invert();
    arm.elbow.quaternion.setFromUnitVectors(DOWN, u.applyQuaternion(_q));
    arm.elbow.updateMatrixWorld(true);
  }
}

/* ---------- 道具：在兩個掛點之間移動 ---------- */
const _pa = V(), _pb = V(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _s = V();
export function placeBetween(obj, a, b, w = 0) {
  a.updateWorldMatrix(true, false);
  a.matrixWorld.decompose(_pa, _qa, _s);
  if (b && w > 0) {
    b.updateWorldMatrix(true, false);
    b.matrixWorld.decompose(_pb, _qb, _s);
    _pa.lerp(_pb, w);
    _qa.slerp(_qb, w);
  }
  obj.position.copy(_pa);
  obj.quaternion.copy(_qa);
}

/* ---------- 建築 ---------- */
function windowTexture(base, rows, cols, seed) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  let r = seed;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const cw = 256 / cols, rh = 256 / rows;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const lit = rnd();
    x.fillStyle = lit > 0.82 ? '#f3d9a0' : lit > 0.4 ? '#36414d' : '#4a5764';
    x.fillRect(j * cw + cw * 0.2, i * rh + rh * 0.18, cw * 0.6, rh * 0.6);
    x.fillStyle = 'rgba(0,0,0,.18)';
    x.fillRect(j * cw + cw * 0.2, i * rh + rh * 0.78, cw * 0.6, rh * 0.06);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** 一棟建築：正面朝 facing（+1 = 朝 +z，-1 = 朝 -z） */
export function building({ x, z, w, h, d = 10, color = '#8a4b38', facing = 1, seed = 1, shop, shopColor = '#1d2a3a' }) {
  const g = new THREE.Group();
  const floors = Math.max(2, Math.round(h / 3.2));
  const tex = windowTexture(color, 4, 4, seed);
  tex.repeat.set(w / 3.2, (floors - 1) / 4 * 1);
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const side = mat(color);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 3.6, d), [side, side, side, side, facing > 0 ? front : side, facing > 0 ? side : front]);
  body.position.set(0, 3.6 + (h - 3.6) / 2, 0);
  body.receiveShadow = true;
  g.add(body);
  // 一樓店面
  const ground = box(w, 3.6, d, '#3a3833');
  ground.position.y = 1.8;
  g.add(ground);
  const glass = box(w * 0.86, 2.4, 0.05, '#2c3a44', { roughness: 0.2, metalness: 0.3 });
  glass.position.set(0, 1.5, facing * (d / 2 + 0.03));
  g.add(glass);
  const cornice = box(w + 0.3, 0.35, d + 0.3, '#5b4c3d');
  cornice.position.y = h + 0.17;
  g.add(cornice);
  if (shop) {
    const s = sign(shop, Math.min(w * 0.7, 5), 0.7, { bg: shopColor, size: 74 });
    s.position.set(0, 3.15, facing * (d / 2 + 0.06));
    if (facing < 0) s.rotation.y = Math.PI;
    g.add(s);
  }
  g.position.set(x, 0, z);
  return g;
}

/* ---------- 80 年代的方正汽車 ---------- */
export function car(color, { antenna = false } = {}) {
  const g = new THREE.Group();
  const body = box(4.3, 0.62, 1.75, color, { roughness: 0.4, metalness: 0.3 });
  body.position.y = 0.55;
  const cabin = box(2.3, 0.55, 1.6, color, { roughness: 0.4, metalness: 0.3 });
  cabin.position.set(-0.15, 1.13, 0);
  const glassM = mat('#26323b', { roughness: 0.15, metalness: 0.4 });
  const wf = box(0.05, 0.45, 1.5, glassM); wf.position.set(1.01, 1.13, 0); wf.rotation.z = 0.35;
  const wr = box(0.05, 0.45, 1.5, glassM); wr.position.set(-1.31, 1.13, 0); wr.rotation.z = -0.35;
  const ws = box(1.9, 0.38, 1.62, glassM); ws.position.set(-0.15, 1.15, 0);
  const bumperF = box(0.12, 0.18, 1.8, '#9aa0a6', { metalness: 0.6, roughness: 0.3 }); bumperF.position.set(2.18, 0.4, 0);
  const bumperR = bumperF.clone(); bumperR.position.x = -2.18;
  g.add(body, cabin, wf, wr, ws, bumperF, bumperR);
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16);
  const tire = mat('#141414');
  [[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(wheelGeo, tire);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.33, wz);
    w.castShadow = true;
    g.add(w);
  });
  [0.55, -0.55].forEach((lz) => {
    const l = box(0.04, 0.14, 0.32, '#fff6d8', { emissive: '#fff1c4', emissiveIntensity: 0.4 });
    l.position.set(2.14, 0.66, lz);
    g.add(l);
  });
  if (antenna) {
    // 後車窗上的螺旋天線（車用電話的標誌）
    const a = new THREE.Group();
    const rod = cyl(0.008, 0.008, 0.55, '#202020', 6);
    rod.position.y = 0.28;
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12), mat('#202020'));
    coil.rotation.x = Math.PI / 2;
    coil.position.y = 0.22;
    a.add(rod, coil);
    a.position.set(-1.45, 1.32, 0);
    g.add(a);
    g.userData.antenna = a;
  }
  return g;
}
