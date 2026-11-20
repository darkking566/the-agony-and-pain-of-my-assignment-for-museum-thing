// 第二批細節零件：讓原本較簡單的場景補到跟街景相近的精細度。
// 戶外：草地／泥土貼圖、草叢、石頭、A 字帳篷、吉普車、沙包牆、木箱、野戰電話線桿。
// 室內：辦公隔板、檔案櫃、飲水機、沙發、靠墊、地毯花紋、書架擺飾、廚房吧台、行李推車、候機椅等。
// 數量多的東西用 InstancedMesh；同一件家具的零件盡量合併。
import * as THREE from 'three';
import { mat, box, cyl, sign } from '../scene-kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  return t;
}
/** 把幾個 [geometry, x, y, z, rx, ry, rz] 合併成一個 mesh */
function merged(parts, material) {
  const gs = parts.map(([g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0]) => {
    const q = g.index ? g.toNonIndexed() : g.clone();
    if (rx || ry || rz) q.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
    q.translate(x, y, z);
    ['uv1', 'uv2'].forEach((a) => q.deleteAttribute(a));
    return q;
  });
  parts.forEach(([g]) => g.dispose());
  const m = new THREE.Mesh(mergeGeometries(gs, false), material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);

/* ================= 戶外 ================= */

/** 草地貼圖：深淺不一的草色、小斑點、乾草 */
export function grassTex(base = '#7d8a4e', seed = 3, repeat = [24, 24]) {
  return canvasTex(512, 512, (x, w, h) => {
    const r = rng(seed);
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); const v = r() < 0.5 ? 'rgba(40,60,20,' : 'rgba(170,170,90,'; g.addColorStop(0, v + (0.08 + r() * 0.1) + ')'); g.addColorStop(1, v + '0)'); x.save(); x.translate(r() * w, r() * h); x.scale(20 + r() * 60, 20 + r() * 60); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }
    for (let i = 0; i < 9000; i++) { const l = 2 + r() * 5; x.strokeStyle = r() < 0.7 ? `rgba(${50 + r() * 40},${80 + r() * 50},${30 + r() * 20},.5)` : `rgba(${170 + r() * 40},${160 + r() * 30},${90},.45)`; x.lineWidth = 1; x.beginPath(); const px = r() * w, py = r() * h; x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 2, py - l); x.stroke(); }
  }, repeat);
}
/** 泥土路貼圖：車轍、小石子 */
export function dirtTex(base = '#9c8660', seed = 5, repeat = [12, 1]) {
  return canvasTex(512, 256, (x, w, h) => {
    const r = rng(seed);
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 14000; i++) { const v = r() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${0.03 + r() * 0.06})`; x.fillRect(r() * w, r() * h, 2, 2); }
    [0.3, 0.7].forEach((k) => { const g = x.createLinearGradient(0, h * k - 18, 0, h * k + 18); g.addColorStop(0, 'rgba(60,45,25,0)'); g.addColorStop(0.5, 'rgba(60,45,25,.28)'); g.addColorStop(1, 'rgba(60,45,25,0)'); x.fillStyle = g; x.fillRect(0, h * k - 18, w, 36); });
    for (let i = 0; i < 220; i++) { x.fillStyle = `rgba(${120 + r() * 60},${110 + r() * 50},${90 + r() * 40},.8)`; x.beginPath(); x.ellipse(r() * w, r() * h, 1.5 + r() * 3, 1 + r() * 2, r() * 3, 0, 7); x.fill(); }
    const fade = x.createLinearGradient(0, 0, 0, h); fade.addColorStop(0, 'rgba(125,138,78,.85)'); fade.addColorStop(0.12, 'rgba(125,138,78,0)'); fade.addColorStop(0.88, 'rgba(125,138,78,0)'); fade.addColorStop(1, 'rgba(125,138,78,.85)'); x.fillStyle = fade; x.fillRect(0, 0, w, h);
  }, repeat);
}

/** 草叢：三片交叉的細長葉片，InstancedMesh。avoid(x,z) 回傳 true 的位置不放 */
export function grassTufts(scene, { cx = 0, cz = 0, w = 30, d = 20, count = 700, seed = 7, colors = ['#6f8a3c', '#83994a', '#5d7432', '#9aa258'], avoid = null } = {}) {
  const blade = (rot) => { const g = new THREE.PlaneGeometry(0.06, 0.32, 1, 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.16; p.setX(i, p.getX(i) * (1 - y / 0.36)); p.setZ(i, y * y * 0.6); p.setY(i, y); } g.rotateY(rot); return g; };
  const parts = [0, 1, 2, 3, 4].map((i) => { const g = blade(i * 1.26); g.translate(Math.cos(i * 2.1) * 0.03, 0, Math.sin(i * 2.1) * 0.03); return g; });
  const geo = mergeGeometries(parts.map((g) => g.toNonIndexed())); parts.forEach((g) => g.dispose()); geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(geo, m, count);
  const r = rng(seed), o = new THREE.Object3D(), c = new THREE.Color();
  let n = 0;
  for (let i = 0; i < count * 3 && n < count; i++) {
    const x = cx + (r() - 0.5) * w, z = cz + (r() - 0.5) * d;
    if (avoid && avoid(x, z)) continue;
    o.position.set(x, 0, z); o.rotation.set(0, r() * 6.28, 0); const s = 0.32 + r() * 0.5; o.scale.set(s, s * (0.7 + r() * 0.6), s); o.updateMatrix();
    im.setMatrixAt(n, o.matrix); im.setColorAt(n, c.set(colors[Math.floor(r() * colors.length)])); n++;
  }
  im.count = n; im.receiveShadow = true;
  scene.add(im); return im;
}

/** 散落的石頭 */
export function rocks(scene, { cx = 0, cz = 0, w = 30, d = 20, count = 40, seed = 9, color = '#8a857a', avoid = null } = {}) {
  const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.1, 0), mat(color, { roughness: 0.95 }), count);
  const r = rng(seed), o = new THREE.Object3D(); let n = 0;
  for (let i = 0; i < count * 3 && n < count; i++) {
    const x = cx + (r() - 0.5) * w, z = cz + (r() - 0.5) * d;
    if (avoid && avoid(x, z)) continue;
    const s = 0.4 + r() * r() * 3; o.position.set(x, s * 0.03, z); o.rotation.set(r() * 3, r() * 3, r() * 3); o.scale.set(s, s * 0.55, s * (0.8 + r() * 0.4)); o.updateMatrix(); im.setMatrixAt(n++, o.matrix);
  }
  im.count = n; im.castShadow = true; im.receiveShadow = true; scene.add(im); return im;
}

/** A 字形帳篷：三角柱帆布、深色門洞、前後支柱、拉繩與營釘 */
export function ridgeTent(scene, x, z, rot = 0, { w = 2.0, l = 2.6, h = 1.5, color = '#6b7248' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(0, h); shape.lineTo(w / 2, 0); shape.lineTo(-w / 2, 0);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: l, bevelEnabled: false }), mat(color, { roughness: 1 }));
  body.position.z = -l / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  // 帆布的接縫（兩條斜線）與門洞
  const door = new THREE.Shape(); door.moveTo(-w * 0.22, 0); door.lineTo(0, h * 0.78); door.lineTo(w * 0.22, 0);
  const dm = new THREE.Mesh(new THREE.ShapeGeometry(door), mat('#22261a', { roughness: 1 })); dm.position.z = l / 2 + 0.005; g.add(dm);
  const flapM = mat(new THREE.Color(color).multiplyScalar(0.85).getStyle(), { roughness: 1 });
  [-1, 1].forEach((sd) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.16, h * 0.7), flapM); f.position.set(sd * w * 0.2, h * 0.36, l / 2 + 0.02); f.rotation.set(0, sd * 0.5, sd * -0.25); g.add(f); });
  const pm = mat('#5a4630', { roughness: 0.9 }), rope = mat('#c9bc98', { roughness: 0.9 });
  [-1, 1].forEach((e) => {
    const p = cyl(0.025, 0.025, h + 0.15, pm, 6); p.position.set(0, (h + 0.15) / 2, e * (l / 2 + 0.05)); g.add(p);
    // 拉繩從頂端拉到地上的營釘
    const top = new THREE.Vector3(0, h + 0.1, e * (l / 2 + 0.05)), peg = new THREE.Vector3(0, 0.03, e * (l / 2 + 1.0));
    const len = top.distanceTo(peg), mid = top.clone().add(peg).multiplyScalar(0.5);
    const rp = cyl(0.006, 0.006, len, rope, 4); rp.position.copy(mid); rp.lookAt(peg); rp.rotateX(Math.PI / 2); rp.castShadow = false; g.add(rp);
    const pg = box(0.03, 0.08, 0.03, pm); pg.position.copy(peg); g.add(pg);
    [-1, 1].forEach((sd) => { // 側邊的拉繩
      const a = new THREE.Vector3(sd * w * 0.25, h * 0.5, e * l * 0.35), b2 = new THREE.Vector3(sd * (w / 2 + 0.55), 0.03, e * l * 0.35);
      const L2 = a.distanceTo(b2), m2 = a.clone().add(b2).multiplyScalar(0.5);
      const r2 = cyl(0.005, 0.005, L2, rope, 4); r2.position.copy(m2); r2.lookAt(b2); r2.rotateX(Math.PI / 2); r2.castShadow = false; g.add(r2);
      const p2 = box(0.025, 0.07, 0.025, pm); p2.position.copy(b2); g.add(p2);
    });
  });
  scene.add(g); return g;
}

/** 二戰吉普車：車斗、引擎蓋、擋泥板、格柵、車燈、擋風玻璃框、座椅、備胎、白星 */
export function willysJeep(scene, x, z, rot = 0, color = '#4a5234') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const bm = mat(color, { roughness: 0.75 });
  const body = merged([
    [B(1.7, 0.5, 1.32), -0.15, 0.62, 0], [B(0.95, 0.38, 1.0), 1.15, 0.68, 0],          // 車斗、引擎蓋
    [B(0.7, 0.05, 0.3), 1.05, 0.66, 0.6], [B(0.7, 0.05, 0.3), 1.05, 0.66, -0.6],     // 前擋泥板
    [B(0.7, 0.05, 0.22), -0.65, 0.62, 0.72], [B(0.7, 0.05, 0.22), -0.65, 0.62, -0.72],
    [B(0.06, 0.5, 1.0), 1.64, 0.62, 0],                                              // 格柵面
    [B(0.04, 0.5, 1.2), 0.62, 1.12, 0, 0, 0, -0.25],                                 // 擋風玻璃框
    [B(0.36, 0.06, 0.45), 0.1, 0.92, 0.3], [B(0.36, 0.06, 0.45), 0.1, 0.92, -0.3],   // 座墊
    [B(0.06, 0.38, 0.45), -0.08, 1.1, 0.3], [B(0.06, 0.38, 0.45), -0.08, 1.1, -0.3]
  ], bm);
  g.add(body);
  const dark = mat('#1e2018', { roughness: 0.6 });
  for (let i = -3; i <= 3; i++) { const s = box(0.02, 0.36, 0.05, dark); s.position.set(1.675, 0.64, i * 0.12); s.castShadow = false; g.add(s); }
  [-0.38, 0.38].forEach((zz) => { const hl = cyl(0.07, 0.07, 0.05, '#f0ead0', 12); hl.material = mat('#e8e2c8', { roughness: 0.2, metalness: 0.3 }); hl.rotation.z = Math.PI / 2; hl.position.set(1.69, 0.78, zz); g.add(hl); });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.42), new THREE.MeshStandardMaterial({ color: '#9fb0b8', transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.2, side: THREE.DoubleSide }));
  glass.position.set(0.63, 1.12, 0); glass.rotation.set(0, Math.PI / 2, -0.25); g.add(glass);
  const steer = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 6, 16), dark); steer.position.set(0.38, 1.0, 0.3); steer.rotation.set(0, Math.PI / 2, 0.5); g.add(steer);
  const tireM = mat('#1b1b1b', { roughness: 0.9 }), hubM = mat(color, { roughness: 0.7 });
  const wheel = (wx, wy, wz, ry = 0) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.1, 8, 18), tireM); t.position.set(wx, wy, wz); t.rotation.y = ry; t.castShadow = true; g.add(t); const hb = cyl(0.15, 0.15, 0.16, hubM, 12); hb.material = hubM; hb.rotation.x = Math.PI / 2; if (ry) hb.rotation.set(0, 0, Math.PI / 2); hb.position.set(wx, wy, wz); g.add(hb); };
  [[1.05, 0.62], [1.05, -0.62], [-0.65, 0.62], [-0.65, -0.62]].forEach(([wx, wz]) => wheel(wx, 0.34, wz));
  wheel(-1.06, 0.72, 0, Math.PI / 2);                                                // 備胎
  const star = sign('★', 0.45, 0.45, { bg: null, color: '#ece6d2', size: 230, w: 256, h: 256 }); star.material.transparent = true; star.position.set(1.15, 0.875, 0); star.rotation.x = -Math.PI / 2; star.rotation.z = Math.PI / 2; g.add(star);
  scene.add(g); return g;
}

/** 沙包牆：沿弧線交錯堆疊的扁圓沙包（InstancedMesh）。從 a0 到 a1 弧度、半徑 r */
export function sandbags(scene, cx, cz, { r = 1.6, a0 = -0.6, a1 = 0.6, rows = 3, color = '#8a7a55', seed = 11 } = {}) {
  const geo = new THREE.SphereGeometry(0.5, 12, 8); geo.scale(0.56, 0.2, 0.32);
  const arc = (a1 - a0) * r, per = Math.max(2, Math.round(arc / 0.5));
  const im = new THREE.InstancedMesh(geo, mat(color, { roughness: 1 }), per * rows + rows);
  const o = new THREE.Object3D(), c = new THREE.Color(), rr = rng(seed); let n = 0;
  for (let row = 0; row < rows; row++) {
    const k = row % 2 ? 0.5 : 0, cnt = per - (row % 2);
    for (let i = 0; i < cnt; i++) {
      const a = a0 + ((i + 0.5 + k) / per) * (a1 - a0);
      o.position.set(cx + Math.sin(a) * r, 0.09 + row * 0.17, cz - Math.cos(a) * r);
      o.rotation.set((rr() - 0.5) * 0.08, -a + (rr() - 0.5) * 0.1, (rr() - 0.5) * 0.08); o.scale.setScalar(0.95 + rr() * 0.1); o.updateMatrix();
      im.setMatrixAt(n, o.matrix); im.setColorAt(n, c.set(color).multiplyScalar(0.88 + rr() * 0.2)); n++;
    }
  }
  im.count = n; im.castShadow = true; im.receiveShadow = true; scene.add(im); return im;
}

/** 木箱：箱體加四邊木條與斜撐 */
export function plankCrate(scene, x, y, z, { w = 0.8, h = 0.6, d = 0.7, color = '#7a6040', rot = 0 } = {}) {
  const tm = mat(new THREE.Color(color).multiplyScalar(0.78).getStyle(), { roughness: 0.9 });
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot;
  g.add(box(w, h, d, color, { roughness: 0.9 }));
  const t = 0.05, o = 0.012;
  const parts = [];
  [-1, 1].forEach((sy) => [-1, 1].forEach((sz) => parts.push([B(w + o, t, t), 0, sy * (h / 2 - t / 2), sz * (d / 2 - t / 2 + o)])));
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => parts.push([B(t, h + o, t), sx * (w / 2 - t / 2 + o), 0, sz * (d / 2 - t / 2 + o)])));
  [-1, 1].forEach((sz) => parts.push([B(Math.hypot(w, h) * 0.86, t * 0.8, t * 0.6), 0, 0, sz * (d / 2 + o), 0, 0, Math.atan2(h, w)]));
  g.add(merged(parts, tm));
  scene.add(g); return g;
}

/** 野戰電話線桿：一排木桿、橫擔、礙子，桿與桿之間有下垂的電線 */
export function wirePoles(scene, pts, { h = 4.2, color = '#5a4630' } = {}) {
  const pm = mat(color, { roughness: 0.95 }), ins = mat('#e6e2d6', { roughness: 0.3 }), wm = new THREE.MeshBasicMaterial({ color: '#2a2a28' });
  pts.forEach(([x, z]) => {
    const p = cyl(0.07, 0.09, h, pm, 8); p.position.set(x, h / 2, z); scene.add(p);
    const arm = box(0.9, 0.07, 0.07, pm); arm.position.set(x, h - 0.3, z); scene.add(arm);
    [-0.38, 0.38].forEach((o) => { const i = cyl(0.03, 0.035, 0.08, ins, 8); i.position.set(x + o, h - 0.22, z); scene.add(i); });
  });
  for (let i = 0; i < pts.length - 1; i++) {
    [-0.38, 0.38].forEach((o) => {
      const a = new THREE.Vector3(pts[i][0] + o, h - 0.18, pts[i][1]), b = new THREE.Vector3(pts[i + 1][0] + o, h - 0.18, pts[i + 1][1]);
      const mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= a.distanceTo(b) * 0.05;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.008, 4), wm); scene.add(t);
    });
  }
}

/* ================= 室內 ================= */

/** 地毯：外框、內框花紋、流蘇 */
export function patternRug(scene, x, z, w, d, { base = '#7a2f2f', border = '#d8c39a', accent = '#2f3f5a', rot = 0, seed = 2 } = {}) {
  const t = canvasTex(512, Math.round(512 * d / w), (c, W, H) => {
    const r = rng(seed);
    c.fillStyle = border; c.fillRect(0, 0, W, H);
    c.fillStyle = base; c.fillRect(W * 0.06, H * 0.06, W * 0.88, H * 0.88);
    c.strokeStyle = border; c.lineWidth = 6; c.strokeRect(W * 0.11, H * 0.11, W * 0.78, H * 0.78);
    c.fillStyle = accent; c.beginPath(); c.ellipse(W / 2, H / 2, W * 0.2, H * 0.22, 0, 0, 7); c.fill();
    c.strokeStyle = border; c.lineWidth = 4; c.beginPath(); c.ellipse(W / 2, H / 2, W * 0.14, H * 0.15, 0, 0, 7); c.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28; c.fillStyle = border; c.beginPath(); c.arc(W / 2 + Math.cos(a) * W * 0.3, H / 2 + Math.sin(a) * H * 0.3, 7, 0, 7); c.fill(); }
    for (let i = 0; i < 9000; i++) { const v = r() < 0.5 ? 0 : 255; c.fillStyle = `rgba(${v},${v},${v},${0.03 + r() * 0.05})`; c.fillRect(r() * W, r() * H, 2, 2); }
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1);
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const rug = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, d), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); rug.position.y = 0.006; rug.receiveShadow = true; g.add(rug);
  const fm = mat(border, { roughness: 1 }), n = Math.round(w / 0.035);
  const parts = []; [-1, 1].forEach((e) => { for (let i = 0; i < n; i++) parts.push([B(0.012, 0.004, 0.06), -w / 2 + (i + 0.5) * w / n, 0.003, e * (d / 2 + 0.03)]); });
  const fr = merged(parts, fm); fr.castShadow = false; g.add(fr);
  scene.add(g); return g;
}

/** 三人沙發：座墊分三塊、扶手、靠背、木腳，可加靠墊 */
export function sofa(scene, x, z, rot = 0, { w = 2.1, color = '#4a5a7a', legs = '#3a2a1c', pillows = ['#d9b25a', '#5f8a6a'] } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const fm = mat(color, { roughness: 0.95 }), dm = mat(new THREE.Color(color).multiplyScalar(0.85).getStyle(), { roughness: 0.95 });
  g.add(merged([[B(w, 0.22, 0.85), 0, 0.27, 0], [B(w, 0.5, 0.2), 0, 0.62, -0.33], [B(0.18, 0.32, 0.85), -w / 2 + 0.09, 0.5, 0], [B(0.18, 0.32, 0.85), w / 2 - 0.09, 0.5, 0]], fm));
  const cw = (w - 0.36) / 3;
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.02, 0.12, 0.62), dm); c.position.set(-w / 2 + 0.18 + cw * (i + 0.5), 0.44, 0.08); c.castShadow = true; g.add(c);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.02, 0.36, 0.12), dm); b2.position.set(-w / 2 + 0.18 + cw * (i + 0.5), 0.7, -0.18); b2.rotation.x = -0.12; b2.castShadow = true; g.add(b2);
  }
  const lm = mat(legs, { roughness: 0.6 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b2]) => { const l = cyl(0.025, 0.018, 0.16, lm, 8); l.position.set(a * (w / 2 - 0.08), 0.08, b2 * 0.34); g.add(l); });
  pillows.forEach((pc, i) => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat(pc, { roughness: 1 })); p.scale.set(1, 0.95, 0.35); p.position.set((i ? 1 : -1) * (w / 2 - 0.42), 0.68, -0.08); p.rotation.set(-0.25, 0, (i ? -1 : 1) * 0.2); p.castShadow = true; g.add(p); });
  scene.add(g); return g;
}

/** 檔案櫃：四個抽屜、把手、標籤卡 */
export function filingCabinet(scene, x, z, rot = 0, { color = '#8f9499', drawers = 4, h = 1.32 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  g.add(box(0.46, h, 0.62, color, { roughness: 0.45, metalness: 0.35 }));
  g.children[0].position.y = h / 2;
  const dh = (h - 0.06) / drawers, hm = mat('#c9ccd0', { roughness: 0.25, metalness: 0.8 }), lab = mat('#f2efe6', { roughness: 0.8 });
  const fronts = [], handles = [], labels = [];
  for (let i = 0; i < drawers; i++) {
    const y = 0.04 + dh * (i + 0.5);
    fronts.push([B(0.42, dh - 0.025, 0.02), 0, y, 0.32]);
    handles.push([B(0.14, 0.022, 0.03), 0, y - dh * 0.1, 0.34]);
    labels.push([B(0.08, 0.04, 0.005), 0, y + dh * 0.22, 0.333]);
  }
  g.add(merged(fronts, mat(color, { roughness: 0.4, metalness: 0.35 })), merged(handles, hm), merged(labels, lab));
  scene.add(g); return g;
}

/** 辦公隔板：布面板、鋁框，L 形 */
export function cubicle(scene, x, z, rot = 0, { w = 1.8, d = 1.5, h = 1.35, fabric = '#7d8794', frame = '#b5b8bc' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const fm = mat(fabric, { roughness: 1 }), am = mat(frame, { roughness: 0.4, metalness: 0.5 });
  g.add(merged([[B(w, h, 0.05), 0, h / 2, -d / 2], [B(0.05, h, d), -w / 2, h / 2, 0]], fm));
  g.add(merged([[B(w + 0.04, 0.03, 0.07), 0, h + 0.015, -d / 2], [B(0.07, 0.03, d), -w / 2, h + 0.015, 0], [B(0.06, h, 0.06), w / 2, h / 2, -d / 2], [B(0.06, h, 0.06), -w / 2, h / 2, d / 2], [B(0.06, h, 0.06), -w / 2, h / 2, -d / 2]], am));
  scene.add(g); return g;
}

/** 飲水機：白色機身、藍色水桶、出水口 */
export function waterCooler(scene, x, z, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const b = box(0.32, 0.95, 0.32, '#ecebe6', { roughness: 0.4 }); b.position.y = 0.475; g.add(b);
  const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.36, 18), new THREE.MeshStandardMaterial({ color: '#7fb4e0', transparent: true, opacity: 0.65, roughness: 0.1 })); jug.position.y = 1.15; g.add(jug);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.08, 18), jug.material); neck.position.y = 0.94; g.add(neck);
  [['#3a7bd5', -0.06], ['#d5463a', 0.06]].forEach(([c, xx]) => { const t = box(0.04, 0.05, 0.04, c); t.position.set(xx, 0.72, 0.17); g.add(t); });
  const tray = box(0.24, 0.02, 0.08, '#9a9a96'); tray.position.set(0, 0.6, 0.18); g.add(tray);
  scene.add(g); return g;
}

/** 書架上的雜物：一排書加幾個擺飾（花瓶、相框、盒子）。沿 x 方向排，y 是層板高度 */
export function shelfClutter(scene, x0, y, z, len, { seed = 4, rot = 0, depth = 0.22 } = {}) {
  const r = rng(seed), g = new THREE.Group(); g.position.set(x0, y, z); g.rotation.y = rot;
  const cols = ['#7a2f2f', '#2f4a6a', '#3f6a4a', '#c9a24a', '#5a3f6a', '#d9d2c3', '#2a2a2e', '#a85a2a'];
  const books = []; let px = 0;
  while (px < len) {
    if (r() < 0.12 && px < len - 0.25) { // 擺飾
      const k = r();
      if (k < 0.4) { const v = cyl(0.04, 0.055, 0.18, cols[Math.floor(r() * 8)], 12); v.position.set(px + 0.07, 0.09, 0); g.add(v); }
      else if (k < 0.7) { const f = box(0.12, 0.15, 0.015, '#3a2a1c'); f.position.set(px + 0.07, 0.075, -depth * 0.2); f.rotation.x = -0.15; g.add(f); const ph = box(0.09, 0.11, 0.004, '#c9d6e0'); ph.position.set(px + 0.07, 0.077, -depth * 0.2 + 0.01); ph.rotation.x = -0.15; g.add(ph); }
      else { const bx = box(0.14, 0.08, 0.14, cols[Math.floor(r() * 8)]); bx.position.set(px + 0.07, 0.04, 0); g.add(bx); }
      px += 0.16; continue;
    }
    const bw = 0.025 + r() * 0.03, bh = 0.16 + r() * 0.1, lean = r() < 0.06 ? 0.25 : 0;
    const c = cols[Math.floor(r() * cols.length)];
    books.push({ c, part: [B(bw, bh, depth * (0.75 + r() * 0.2)), px + bw / 2, bh / 2, 0, 0, 0, lean] });
    px += bw + 0.003;
  }
  const byC = {}; books.forEach(({ c, part }) => (byC[c] = byC[c] || []).push(part));
  Object.entries(byC).forEach(([c, parts]) => g.add(merged(parts, mat(c, { roughness: 0.8 }))));
  scene.add(g); return g;
}

/** 牆上的掛鐘 */
export function wallClock(scene, x, y, z, rot = 0, { r = 0.17, rim = '#2a2a2e' } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot;
  const ring = cyl(r, r, 0.04, rim, 24); ring.rotation.x = Math.PI / 2; g.add(ring);
  const face = cyl(r * 0.9, r * 0.9, 0.045, '#f6f3ea', 24); face.rotation.x = Math.PI / 2; g.add(face);
  const dm = mat('#1c1c1c'); const ticks = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28; ticks.push([B(0.008, i % 3 ? 0.02 : 0.035, 0.005), Math.sin(a) * r * 0.78, Math.cos(a) * r * 0.78, 0.026, 0, 0, -a]); }
  ticks.push([B(0.01, r * 0.5, 0.005), r * 0.18, r * 0.12, 0.03, 0, 0, -0.95], [B(0.007, r * 0.72, 0.005), -r * 0.2, -r * 0.24, 0.032, 0, 0, 2.4]);
  g.add(merged(ticks, dm));
  scene.add(g); return g;
}

/** 候機椅：一排連在一起的座椅（鋁腳、塑膠座殼） */
export function seatRow(scene, x, z, rot = 0, { n = 5, color = '#2f4a7a' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const sm = mat(color, { roughness: 0.5 }), am = mat('#a9adb2', { roughness: 0.3, metalness: 0.7 });
  const seats = [], frame = [[B(n * 0.56, 0.05, 0.08), 0, 0.38, 0]];
  for (let i = 0; i < n; i++) {
    const sx = (i - (n - 1) / 2) * 0.56;
    seats.push([B(0.5, 0.05, 0.46), sx, 0.45, 0.04], [B(0.5, 0.44, 0.05), sx, 0.7, -0.2, -0.12]);
    if (i < n - 1) frame.push([B(0.04, 0.22, 0.4), sx + 0.28, 0.6, 0.0]);
  }
  [-1, 1].forEach((e) => frame.push([B(0.05, 0.38, 0.05), e * (n * 0.28 - 0.3), 0.19, 0], [B(0.05, 0.03, 0.5), e * (n * 0.28 - 0.3), 0.015, 0]));
  g.add(merged(seats, sm), merged(frame, am));
  scene.add(g); return g;
}

/** 行李推車加兩件行李 */
export function luggageCart(scene, x, z, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const am = mat('#b9bdc2', { roughness: 0.3, metalness: 0.7 });
  g.add(merged([[B(0.55, 0.03, 0.9), 0, 0.22, 0], [B(0.03, 0.8, 0.03), -0.26, 0.6, -0.44], [B(0.03, 0.8, 0.03), 0.26, 0.6, -0.44], [B(0.55, 0.03, 0.03), 0, 1.0, -0.44], [B(0.03, 0.3, 0.03), -0.26, 0.36, 0.44], [B(0.03, 0.3, 0.03), 0.26, 0.36, 0.44]], am));
  [[-0.24, -0.38], [0.24, -0.38], [-0.24, 0.38], [0.24, 0.38]].forEach(([a, b2]) => { const w = cyl(0.06, 0.06, 0.04, '#1c1c1c', 10); w.rotation.z = Math.PI / 2; w.position.set(a, 0.06, b2); g.add(w); });
  const s1 = box(0.48, 0.3, 0.7, '#5a2f2f', { roughness: 0.6 }); s1.position.set(0, 0.39, 0.0); g.add(s1);
  const s2 = box(0.36, 0.22, 0.48, '#2f3f4a', { roughness: 0.6 }); s2.position.set(0, 0.65, -0.05); s2.rotation.y = 0.1; g.add(s2);
  const h1 = box(0.16, 0.03, 0.03, '#1c1c1c'); h1.position.set(0, 0.56, 0.0); g.add(h1);
  scene.add(g); return g;
}

/** 垃圾桶（金屬圓桶） */
export function trashCan(scene, x, z, { color = '#6a6e72' } = {}) {
  const c = cyl(0.2, 0.17, 0.7, color, 16); c.material = mat(color, { roughness: 0.4, metalness: 0.5 }); c.position.set(x, 0.35, z); scene.add(c);
  const lid = cyl(0.21, 0.21, 0.04, '#3a3d40', 16); lid.position.set(x, 0.72, z); scene.add(lid);
  return c;
}

/** 落地燈與桌燈（燈罩發光） */
export function tableLamp(scene, x, y, z, { shade = '#efe3c4', base = '#3a3a3e', h = 0.42 } = {}) {
  const b = cyl(0.07, 0.09, 0.03, base, 14); b.position.set(x, y + 0.015, z); scene.add(b);
  const s = cyl(0.012, 0.012, h * 0.65, base, 6); s.position.set(x, y + h * 0.33, z); scene.add(s);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 0.16, 16, 1, true), new THREE.MeshStandardMaterial({ color: shade, emissive: '#ffcf87', emissiveIntensity: 0.55, side: THREE.DoubleSide, roughness: 0.9 }));
  sh.position.set(x, y + h * 0.72, z); scene.add(sh);
}

/** 盆栽小桌、馬克杯、紙堆、筆筒之類的桌上物 */
export function deskClutter(scene, x, y, z, { seed = 1, rot = 0 } = {}) {
  const r = rng(seed), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot;
  const paper = []; for (let i = 0; i < 6; i++) paper.push([B(0.21, 0.004, 0.297), 0, 0.002 + i * 0.005, 0, 0, (r() - 0.5) * 0.15, 0]);
  const pp = merged(paper, mat('#f4f2ec', { roughness: 0.9 })); pp.position.set(-0.25, 0, 0.05); g.add(pp);
  const mug = cyl(0.04, 0.035, 0.1, ['#c94a3a', '#3a6ac9', '#f0eee8'][seed % 3], 14); mug.position.set(0.2, 0.05, 0.08); g.add(mug);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 10), mug.material); hd.position.set(0.245, 0.055, 0.08); g.add(hd);
  const cup = cyl(0.035, 0.03, 0.1, '#2a2a2e', 12); cup.position.set(0.3, 0.05, -0.12); g.add(cup);
  ['#c94a3a', '#2a4a8a', '#1c1c1c'].forEach((c, i) => { const p = cyl(0.004, 0.004, 0.14, c, 5); p.position.set(0.3 + (i - 1) * 0.012, 0.12, -0.12); p.rotation.z = (i - 1) * 0.15; g.add(p); });
  scene.add(g); return g;
}

/** 開放式書櫃：側板、背板、層板，每層放書和擺飾。寬沿 x，正面朝 +z */
export function bookcase(scene, x, z, rot = 0, { w = 2.0, h = 2.0, d = 0.34, color = '#5a4030', shelves = 4, seed = 1, fill = 0.92 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const t = 0.035, wm = mat(color, { roughness: 0.65 });
  const parts = [[B(t, h, d), -w / 2 + t / 2, h / 2, 0], [B(t, h, d), w / 2 - t / 2, h / 2, 0], [B(w, t, d), 0, h - t / 2, 0], [B(w, 0.08, d), 0, 0.04, 0], [B(w, h, 0.012), 0, h / 2, -d / 2 + 0.006]];
  const gap = (h - 0.08 - t) / shelves;
  for (let i = 1; i < shelves; i++) parts.push([B(w - 2 * t, t * 0.8, d - 0.02), 0, 0.08 + gap * i, 0.005]);
  g.add(merged(parts, wm));
  scene.add(g);
  g.updateMatrixWorld(true);
  for (let i = 0; i < shelves; i++) {
    const inner = new THREE.Group(); g.add(inner);
    shelfClutter(inner, -w / 2 + t + 0.02, 0.08 + gap * i + (i ? t * 0.4 : 0), 0.0, (w - 2 * t - 0.04) * fill, { seed: seed * 7 + i, depth: d - 0.06 });
  }
  return g;
}

/** 廚房一字型流理台：下櫃（門片、把手）、檯面、水槽、爐子、上櫃、磁磚牆。沿 x 從 x0 開始，背靠 z 牆（朝 +z） */
export function kitchenRun(scene, x0, zWall, len, { cab = '#e8e2d4', top = '#3a3a40', tile = '#e9eef0', upper = true, sinkAt = 0.3, stoveAt = 0.72 } = {}) {
  const g = new THREE.Group(); g.position.set(x0, 0, zWall); scene.add(g);
  const cm = mat(cab, { roughness: 0.5 }), hm = mat('#b8bcc0', { roughness: 0.25, metalness: 0.8 }), tm = mat(top, { roughness: 0.25, metalness: 0.2 });
  const n = Math.max(2, Math.round(len / 0.6)), dw = len / n;
  const body = [[B(len, 0.82, 0.58), len / 2, 0.49, 0.3], [B(len, 0.08, 0.5), len / 2, 0.04, 0.27]];
  const doors = [], handles = [];
  for (let i = 0; i < n; i++) { const cx = (i + 0.5) * dw; doors.push([B(dw - 0.02, 0.72, 0.02), cx, 0.5, 0.6]); handles.push([B(0.012, 0.14, 0.02), cx + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), 0.72, 0.62]); }
  g.add(merged(body, cm), merged(doors, mat(new THREE.Color(cab).multiplyScalar(0.96).getStyle(), { roughness: 0.45 })), merged(handles, hm));
  const tp = box(len + 0.04, 0.04, 0.64, tm); tp.position.set(len / 2, 0.92, 0.32); g.add(tp);
  // 磁磚牆（貼圖）
  const tt = canvasTex(256, 128, (c, W, H) => { c.fillStyle = '#b9bfc2'; c.fillRect(0, 0, W, H); c.fillStyle = tile; for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) c.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29); }, [len / 0.6, 1]);
  const bs = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.6), new THREE.MeshStandardMaterial({ map: tt, roughness: 0.3 })); bs.position.set(len / 2, 1.24, 0.005); g.add(bs);
  // 水槽與水龍頭
  const sx = len * sinkAt;
  const sink = box(0.55, 0.02, 0.4, '#c9cdd2', { roughness: 0.2, metalness: 0.8 }); sink.position.set(sx, 0.945, 0.32); g.add(sink);
  const basin = box(0.48, 0.02, 0.34, '#7f858b', { roughness: 0.3, metalness: 0.6 }); basin.position.set(sx, 0.95, 0.32); g.add(basin);
  const tap = cyl(0.015, 0.015, 0.28, '#c9cdd2', 8); tap.material = hm; tap.position.set(sx, 1.08, 0.1); g.add(tap);
  const spout = cyl(0.012, 0.012, 0.18, '#c9cdd2', 8); spout.material = hm; spout.rotation.x = Math.PI / 2; spout.position.set(sx, 1.21, 0.18); g.add(spout);
  // 爐子（四個爐口）
  const kx = len * stoveAt;
  const hob = box(0.6, 0.012, 0.5, '#151518', { roughness: 0.15 }); hob.position.set(kx, 0.946, 0.32); g.add(hob);
  [[-0.14, -0.11], [0.14, -0.11], [-0.14, 0.11], [0.14, 0.11]].forEach(([a, b2]) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 20), mat('#3a3a3e', { roughness: 0.4, metalness: 0.5 })); r.rotation.x = Math.PI / 2; r.position.set(kx + a, 0.955, 0.32 + b2); g.add(r); });
  // 一只鍋子和砧板
  const pot = cyl(0.12, 0.11, 0.14, '#9aa0a6', 18); pot.material = mat('#9aa0a6', { roughness: 0.25, metalness: 0.8 }); pot.position.set(kx - 0.14, 1.03, 0.21); g.add(pot);
  const board = box(0.35, 0.02, 0.24, '#b8905a'); board.position.set(len * 0.5, 0.95, 0.35); board.rotation.y = 0.1; g.add(board);
  if (upper) {
    const ub = [[B(len, 0.7, 0.34), len / 2, 1.95, 0.17]], ud = [], uh = [];
    for (let i = 0; i < n; i++) { const cx = (i + 0.5) * dw; ud.push([B(dw - 0.02, 0.66, 0.02), cx, 1.95, 0.345]); uh.push([B(0.012, 0.12, 0.02), cx + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), 1.7, 0.36]); }
    g.add(merged(ub, cm), merged(ud, mat(new THREE.Color(cab).multiplyScalar(0.96).getStyle(), { roughness: 0.45 })), merged(uh, hm));
  }
  return g;
}

/** 雙門冰箱：上下兩門、長把手 */
export function fridge(scene, x, z, rot = 0, { color = '#d8dde2', h = 1.85 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const m = mat(color, { roughness: 0.3, metalness: 0.4 }), hm = mat('#8a9199', { roughness: 0.25, metalness: 0.8 });
  g.add(merged([[B(0.78, h, 0.66), 0, h / 2, 0]], m));
  g.add(merged([[B(0.76, h * 0.34, 0.03), 0, h - h * 0.17 - 0.01, 0.345], [B(0.76, h * 0.62, 0.03), 0, h * 0.31 + 0.01, 0.345]], mat(color, { roughness: 0.25, metalness: 0.45 })));
  g.add(merged([[B(0.025, h * 0.22, 0.04), 0.32, h * 0.78, 0.38], [B(0.025, h * 0.4, 0.04), 0.32, h * 0.44, 0.38]], hm));
  const note1 = box(0.1, 0.12, 0.004, '#f6e27a'); note1.position.set(-0.15, h * 0.5, 0.362); note1.rotation.z = 0.08; g.add(note1);
  const note2 = box(0.14, 0.1, 0.004, '#ffffff'); note2.position.set(0.05, h * 0.42, 0.362); note2.rotation.z = -0.05; g.add(note2);
  scene.add(g); return g;
}

/** 木頭椅子：四腳、座板、靠背橫條 */
export function chair(scene, x, z, rot = 0, { color = '#7a5a3a', seat = null } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const wm = mat(color, { roughness: 0.6 });
  g.add(merged([
    [B(0.42, 0.04, 0.42), 0, 0.46, 0],
    [B(0.04, 0.46, 0.04), -0.18, 0.23, 0.18], [B(0.04, 0.46, 0.04), 0.18, 0.23, 0.18],
    [B(0.04, 0.92, 0.04), -0.18, 0.46, -0.18], [B(0.04, 0.92, 0.04), 0.18, 0.46, -0.18],
    [B(0.36, 0.06, 0.025), 0, 0.88, -0.18], [B(0.36, 0.04, 0.025), 0, 0.72, -0.18],
    [B(0.36, 0.025, 0.025), 0, 0.12, 0.18], [B(0.025, 0.025, 0.36), -0.18, 0.12, 0], [B(0.025, 0.025, 0.36), 0.18, 0.12, 0]
  ], wm));
  if (seat) { const c = box(0.38, 0.04, 0.38, seat, { roughness: 1 }); c.position.y = 0.5; g.add(c); }
  scene.add(g); return g;
}

/** 平面電視：外框、螢幕、底座，加音響喇叭與機上盒 */
export function tvSet(scene, x, y, z, rot = 0, { w = 1.3, screen = '#1f2a36', speakers = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot;
  const h = w * 0.58;
  const frame = box(w, h, 0.06, '#111214', { roughness: 0.3 }); frame.position.y = h / 2 + 0.1; g.add(frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), new THREE.MeshStandardMaterial({ color: screen, roughness: 0.08, metalness: 0.4 })); glass.position.set(0, h / 2 + 0.1, 0.031); g.add(glass);
  const neck = box(0.08, 0.1, 0.05, '#1a1b1e'); neck.position.y = 0.05; g.add(neck);
  const foot = box(0.4, 0.02, 0.22, '#1a1b1e', { roughness: 0.3 }); foot.position.y = 0.01; g.add(foot);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.006), new THREE.MeshBasicMaterial({ color: '#ff4040' })); led.position.set(w / 2 - 0.06, 0.13, 0.032); g.add(led);
  if (speakers) [-1, 1].forEach((sd) => { const s = box(0.14, 0.3, 0.16, '#1c1c1f', { roughness: 0.6 }); s.position.set(sd * (w / 2 + 0.18), 0.15, 0); g.add(s); const cone = cyl(0.04, 0.04, 0.01, '#3a3a3e', 14); cone.rotation.x = Math.PI / 2; cone.position.set(sd * (w / 2 + 0.18), 0.19, 0.082); g.add(cone); });
  const stb = box(0.3, 0.05, 0.2, '#202124', { roughness: 0.4 }); stb.position.set(-w / 2 + 0.3, -0.0 + 0.025, 0.06); g.add(stb);
  scene.add(g); return g;
}

/** 辦公椅：五爪腳＋輪子、氣壓桿、座墊、椅背 */
export function officeChair(scene, x, z, rot = 0, { color = '#2e3340' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const fm = mat(color, { roughness: 0.9 }), am = mat('#55595f', { roughness: 0.35, metalness: 0.6 });
  const legs = [];
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; legs.push([B(0.3, 0.035, 0.05), Math.cos(a) * 0.15, 0.07, Math.sin(a) * 0.15, 0, -a, 0]); }
  legs.push([C(0.025, 0.025, 0.36, 8), 0, 0.27, 0], [B(0.08, 0.3, 0.04), 0, 0.62, -0.2]);
  g.add(merged(legs, am));
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const w = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat('#1c1c1c')); w.position.set(Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29); g.add(w); }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.46), fm); seat.position.y = 0.48; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.07), fm); back.position.set(0, 0.86, -0.24); back.rotation.x = -0.1; back.castShadow = true; g.add(back);
  [-1, 1].forEach((sd) => { const arm = box(0.05, 0.03, 0.3, am); arm.position.set(sd * 0.26, 0.68, -0.02); g.add(arm); const post = box(0.03, 0.18, 0.03, am); post.position.set(sd * 0.26, 0.58, -0.1); g.add(post); });
  scene.add(g); return g;
}

/** 90 年代的映像管螢幕（米色、後面很深）。screen 回傳發光面，方便場景改顏色 */
export function crtMonitor(scene, x, y, z, rot = 0, { color = '#d9d2bf', screen = '#0b1d33', w = 0.48 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot;
  const cm = mat(color, { roughness: 0.6 });
  const h = w * 0.85;
  g.add(merged([[B(w, h, 0.06), 0, h / 2 + 0.08, 0], [C(w * 0.32, w * 0.5, w * 0.75, 4), 0, h / 2 + 0.08, -w * 0.4, Math.PI / 2, Math.PI / 4, 0], [B(w * 0.5, 0.05, w * 0.5), 0, 0.025, -w * 0.25], [B(w * 0.2, 0.06, w * 0.2), 0, 0.06, -w * 0.25]], cm));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.82, h * 0.78), new THREE.MeshBasicMaterial({ color: screen })); scr.position.set(0, h / 2 + 0.09, 0.031); g.add(scr);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.012), new THREE.MeshBasicMaterial({ color: '#4cff6a' })); led.position.set(w / 2 - 0.04, 0.1, 0.032); g.add(led);
  scene.add(g); return { group: g, screen: scr };
}

/** 米色直立式主機 */
export function pcTower(scene, x, z, rot = 0, { color = '#d9d2bf' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const t = box(0.2, 0.45, 0.45, color, { roughness: 0.6 }); t.position.y = 0.225; g.add(t);
  const bay = box(0.15, 0.04, 0.01, '#bfb8a4'); bay.position.set(0, 0.38, 0.227); g.add(bay);
  const fl = box(0.12, 0.012, 0.01, '#2a2a2e'); fl.position.set(0, 0.32, 0.227); g.add(fl);
  const pw = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.01), new THREE.MeshBasicMaterial({ color: '#4cff6a' })); pw.position.set(0.05, 0.25, 0.231); g.add(pw);
  scene.add(g); return g;
}

/** 聖誕樹：三層錐形、彩球、小燈泡、星星、樹盆與禮物 */
export function christmasTree(scene, x, z, { h = 1.9, seed = 5 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const pot = cyl(0.22, 0.18, 0.28, '#8a2a2a', 14); pot.position.y = 0.14; g.add(pot);
  const trunk = cyl(0.05, 0.06, 0.3, '#5a3a20', 8); trunk.position.y = 0.38; g.add(trunk);
  const gm = mat('#2f6b3a', { roughness: 0.9 });
  [[0.62, 0.8, 0.85], [0.5, 0.7, 1.25], [0.36, 0.6, 1.62]].forEach(([r, ch, y]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r * h / 1.9, ch * h / 1.9, 14), gm); c.position.y = y * h / 1.9; c.castShadow = true; g.add(c); });
  const r = rng(seed), cols = ['#d63a3a', '#f1c40f', '#3a7bd5', '#e8e8e8', '#9b59b6'];
  for (let i = 0; i < 26; i++) {
    const t = r(), y = (0.55 + t * 1.25) * h / 1.9, rad = (0.6 - t * 0.42) * h / 1.9, a = r() * 6.28;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(cols[i % 5], { roughness: 0.25, metalness: 0.5 })); b.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); g.add(b);
  }
  for (let i = 0; i < 40; i++) {
    const t = i / 40, y = (0.5 + t * 1.3) * h / 1.9, rad = (0.6 - t * 0.44) * h / 1.9 + 0.01, a = t * 6.28 * 4;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), new THREE.MeshBasicMaterial({ color: ['#ffe28a', '#ff8a8a', '#8adcff'][i % 3] })); l.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); g.add(l);
  }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshBasicMaterial({ color: '#ffd968' })); star.position.y = 1.97 * h / 1.9; g.add(star);
  [[0.45, 0.12, '#c94a3a', '#f1c40f'], [-0.4, 0.2, '#3a6ac9', '#ffffff'], [0.15, -0.45, '#3a9a5a', '#d63a3a']].forEach(([px, pz, c, rib], i) => {
    const s = 0.22 + i * 0.04; const p = box(s, s * 0.8, s, c, { roughness: 0.6 }); p.position.set(px, s * 0.4, pz); p.rotation.y = i; g.add(p);
    const r1 = box(s + 0.005, s * 0.8 + 0.005, 0.03, rib); r1.position.copy(p.position); r1.rotation.y = i; g.add(r1);
    const r2 = box(0.03, s * 0.8 + 0.005, s + 0.005, rib); r2.position.copy(p.position); r2.rotation.y = i; g.add(r2);
  });
  scene.add(g); return g;
}
