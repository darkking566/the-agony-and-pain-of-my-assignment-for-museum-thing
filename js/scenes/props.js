// 街景用的細節零件：程序貼圖（柏油、鋪面）、有葉子的樹、路燈、腳踏車、停著的車、電話亭、店面玻璃櫥窗等。
// 全部是靜態的，建好就不用更新；數量多的東西用 InstancedMesh 合併繪製。
import * as THREE from 'three';
import { V, mat, box, cyl, textTexture } from '../scene-kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ---------- 程序貼圖 ---------- */
// 固定亂數：每次進場景看到的路面都一樣
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(w, h, draw, repeat = [1, 1], aniso = 8) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]); t.anisotropy = aniso;
  return t;
}
/** 柏油：細碎顆粒、補過的痕跡和幾道裂縫。一張貼圖約 4 公尺 */
export function asphaltTex(repeat) {
  return canvasTex(512, 512, (x, w, h) => {
    const r = rng(7);
    x.fillStyle = '#3f3e40'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { // 大片的深淺不均
      x.fillStyle = `rgba(${r() < 0.5 ? '20,20,22' : '90,88,86'},${0.05 + r() * 0.06})`;
      x.beginPath(); x.ellipse(r() * w, r() * h, 20 + r() * 70, 14 + r() * 40, r() * 3, 0, 7); x.fill();
    }
    for (let i = 0; i < 9000; i++) {
      const v = 40 + r() * 70 | 0; x.fillStyle = `rgba(${v},${v},${v + 3},${0.35 + r() * 0.4})`;
      x.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6);
    }
    x.strokeStyle = 'rgba(15,15,16,0.7)'; x.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      let px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 9; k++) { px += (r() - 0.4) * 38; py += (r() - 0.5) * 30; x.lineTo(px, py); }
      x.stroke();
    }
  }, repeat);
}
/** 人行道：一格一格的水泥磚，縫裡有一點髒污 */
export function pavingTex(repeat, base = '#b6ae9f') {
  return canvasTex(512, 512, (x, w, h) => {
    const r = rng(11), n = 4, cw = w / n; // 4 x 4 塊，一塊約 0.5m
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const k = (r() - 0.5) * 22;
      x.fillStyle = `rgb(${182 + k | 0},${174 + k | 0},${159 + k | 0})`; x.fillRect(i * cw, j * cw, cw, cw);
    }
    for (let i = 0; i < 7000; i++) { const v = r() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${0.04 + r() * 0.06})`; x.fillRect(r() * w, r() * h, 1.5, 1.5); }
    x.strokeStyle = 'rgba(70,64,56,0.75)'; x.lineWidth = 2.5;
    for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * cw, 0); x.lineTo(i * cw, h); x.stroke(); x.beginPath(); x.moveTo(0, i * cw); x.lineTo(w, i * cw); x.stroke(); }
    for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(60,52,40,${0.05 + r() * 0.07})`; x.beginPath(); x.ellipse(r() * w, r() * h, 12 + r() * 30, 8 + r() * 22, r() * 3, 0, 7); x.fill(); }
  }, repeat);
}
/** 磚牆／粉刷牆：給建築側面和後面用 */
export function plasterTex(color, repeat = [1, 1]) {
  return canvasTex(256, 256, (x, w, h) => {
    const r = rng(23); x.fillStyle = color; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { const v = r() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${0.03 + r() * 0.05})`; x.fillRect(r() * w, r() * h, 2, 2); }
    for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(30,24,18,${0.03 + r() * 0.05})`; x.fillRect(r() * w, 0, 2 + r() * 8, h * (0.3 + r() * 0.7)); } // 雨水流過的痕跡
  }, repeat);
}
/** 柔邊的圓形陰影，墊在車子和人腳下，讓東西「踩」在地上 */
export function blobShadow(w, d, opacity = 0.55) {
  const t = canvasTex(128, 128, (x, cw) => {
    const g = x.createRadialGradient(cw / 2, cw / 2, 4, cw / 2, cw / 2, cw / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, cw, cw);
  }, [1, 1], 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: true }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1; m.receiveShadow = false;
  return m;
}
/** 貼在地面上的標線／痕跡，用 polygonOffset 避免跟路面打架 */
export function decal(w, d, color, opacity = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: 0.8, transparent: opacity < 1, opacity, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  return m;
}

/* ---------- 天空 ---------- */
/** 幾層淡淡的雲，掛在天空球裡面 */
export function cloudSky(scene) {
  const tex = canvasTex(512, 256, (x, w, h) => {
    const r = rng(5); x.clearRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const cx = r() * w, cy = h * (0.3 + r() * 0.4), rad = 24 + r() * 46;
      const g = x.createRadialGradient(cx, cy, 2, cx, cy, rad);
      g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rad * 1.8, rad * 0.55, 0, 0, 7); x.fill();
    }
  }, [1, 1], 4);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(500, 250), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.8 }));
  m.rotation.x = Math.PI / 2; m.position.y = 90; scene.add(m);
  const m2 = m.clone(); m2.position.set(40, 130, -30); m2.rotation.z = 1.2; m2.material = m.material.clone(); m2.material.opacity = 0.5; scene.add(m2);
}

/* ---------- 樹、落葉 ---------- */
export const LEAF = ['#c98a2b', '#b8651e', '#d9a93a', '#9e4a1c', '#a8892c'];
export const GREEN = ['#4f7a3a', '#5d8a42', '#6b9648', '#3f6a34', '#78a04e'];
/** 秋天的樹：樹幹加幾團黃橘色的葉子，樹下有一圈鐵柵欄 */
export function leafTree(scene, x, z, seed = 1, scale = 1, palette = LEAF) {
  const r = rng(seed * 13 + 3), g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale);
  const trunkM = mat('#4a3a2c', { roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 3.4, 9), trunkM); trunk.position.y = 1.7; trunk.castShadow = true; g.add(trunk);
  [[0.7, 3.2, 0.2, -0.9], [-0.6, 3.5, -0.3, 0.9], [0.1, 3.9, 0.5, -0.1]].forEach(([dx, y, dz, rz]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 1.6, 6), trunkM); b.position.set(dx * 0.6, y, dz * 0.6); b.rotation.z = rz; b.castShadow = true; g.add(b);
  });
  // 葉團：低面數的二十面體，每面各自一個顏色，看起來像一簇一簇的葉子
  for (let i = 0; i < 9; i++) {
    const rad = 0.75 + r() * 0.65;
    const geo = new THREE.IcosahedronGeometry(rad, 1).toNonIndexed();
    const col = []; const base = new THREE.Color(palette[(r() * palette.length) | 0]);
    for (let f = 0; f < geo.attributes.position.count / 3; f++) {
      const c = base.clone().offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.12); for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    const a = r() * 6.28, d = 0.3 + r() * 1.1;
    m.position.set(Math.cos(a) * d, 4.3 + r() * 1.6, Math.sin(a) * d); m.scale.y = 0.8; m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  // 樹穴：一圈泥土和鐵柵
  const pit = cyl(0.62, 0.62, 0.02, '#4b4034', 14); pit.position.y = 0.01; pit.castShadow = false; g.add(pit);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 6, 20), mat('#2a2d30', { metalness: 0.5, roughness: 0.5 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  scene.add(g); return g;
}
/** 滿地落葉：一個 InstancedMesh 畫幾百片 */
export function fallenLeaves(scene, areas, count = 260, seed = 4) {
  const r = rng(seed), geo = new THREE.PlaneGeometry(0.1, 0.07); geo.rotateX(-Math.PI / 2);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.DoubleSide }), count);
  const o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const [x0, x1, z0, z1, y] = areas[(r() * areas.length) | 0];
    o.position.set(x0 + r() * (x1 - x0), y + 0.004, z0 + r() * (z1 - z0)); o.rotation.set(0, r() * 6.28, 0); o.scale.setScalar(0.7 + r() * 0.9); o.updateMatrix();
    im.setMatrixAt(i, o.matrix); c.set(LEAF[(r() * LEAF.length) | 0]).offsetHSL(0, 0, (r() - 0.5) * 0.1); im.setColorAt(i, c);
  }
  im.receiveShadow = true; scene.add(im); return im;
}

/* ---------- 街道設施 ---------- */
export function lampPost(scene, x, z, dir = 1) {
  const metal = mat('#3b4148', { metalness: 0.5, roughness: 0.5 }), g = new THREE.Group(); g.position.set(x, 0, z);
  const base = cyl(0.14, 0.18, 0.5, metal, 10); base.position.y = 0.25;
  const pole = cyl(0.055, 0.085, 5.0, metal, 10); pole.position.y = 2.9;
  const arm2 = box(0.8, 0.05, 0.05, metal); arm2.position.set(dir * 0.5, 5.52, 0);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 0.18, 12), metal); head.position.set(dir * 0.95, 5.5, 0); head.castShadow = true;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6), new THREE.MeshStandardMaterial({ color: '#fff3d0', emissive: '#fff0c0', emissiveIntensity: 0.6 })); bulb.position.set(dir * 0.95, 5.4, 0);
  g.add(base, pole, arm2, head, bulb); scene.add(g); return g;
}
export function bin(scene, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const body = cyl(0.22, 0.2, 0.7, mat('#2f4a3a', { roughness: 0.6, metalness: 0.3 }), 14); body.position.y = 0.55;
  const lid = cyl(0.24, 0.24, 0.05, '#222', 14); lid.position.y = 0.93;
  const post = cyl(0.03, 0.03, 0.3, '#222', 6); post.position.y = 0.15;
  const band = cyl(0.225, 0.225, 0.04, '#d9d3c3', 14); band.position.y = 0.72;
  g.add(body, lid, post, band); scene.add(g); return g;
}
export function bollards(scene, xs, z) {
  xs.forEach((x) => { const b = cyl(0.07, 0.07, 0.7, mat('#2a2d30', { metalness: 0.4, roughness: 0.5 }), 10); b.position.set(x, 0.35, z); const t = cyl(0.071, 0.071, 0.06, '#d8b13a', 10); t.position.set(x, 0.62, z); scene.add(b, t); });
}
export function hydrantAndGrate(scene, x, z) {
  const h = new THREE.Group(); h.position.set(x, 0, z);
  const b = cyl(0.09, 0.1, 0.55, '#b0322b', 10); b.position.y = 0.3; const c = cyl(0.11, 0.11, 0.06, '#b0322b', 10); c.position.y = 0.6;
  const n1 = cyl(0.04, 0.04, 0.3, '#b0322b', 8); n1.rotation.z = Math.PI / 2; n1.position.y = 0.38;
  h.add(b, c, n1); scene.add(h);
}
/** 下水道蓋、排水格：貼在地上的小圓盤 */
export function manhole(scene, x, y, z, rad = 0.38) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(rad, 18), new THREE.MeshStandardMaterial({ color: '#2b2b2d', roughness: 0.6, metalness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.002, z); m.receiveShadow = true; scene.add(m);
  const ring = new THREE.Mesh(new THREE.RingGeometry(rad * 0.55, rad * 0.62, 18), new THREE.MeshBasicMaterial({ color: '#555', polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + 0.003, z); scene.add(ring);
}
export function bench(scene, x, z, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw;
  const wood = mat('#7a5a3a', { roughness: 0.9 }), iron = mat('#26292c', { metalness: 0.5, roughness: 0.5 });
  for (let i = 0; i < 4; i++) { const s = box(1.7, 0.035, 0.09, wood); s.position.set(0, 0.46, -0.17 + i * 0.115); g.add(s); }
  for (let i = 0; i < 3; i++) { const s = box(1.7, 0.09, 0.03, wood); s.position.set(0, 0.7 + i * 0.12, 0.2 - i * 0.03); s.rotation.x = -0.12; g.add(s); }
  [-0.75, 0.75].forEach((dx) => { const l = box(0.05, 0.46, 0.45, iron); l.position.set(dx, 0.23, 0.02); const bk = box(0.05, 0.4, 0.04, iron); bk.position.set(dx, 0.66, 0.2); g.add(l, bk); });
  scene.add(g); return g;
}
/** 靠在路燈邊的腳踏車 */
export function bicycle(scene, x, z, yaw = 0, color = '#2f5d7a') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw;
  const tireM = mat('#151515'), fr = mat(color, { metalness: 0.4, roughness: 0.4 });
  const wheel = (px) => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.022, 6, 22), tireM); w.position.set(px, 0.36, 0); w.castShadow = true; g.add(w); const hub = cyl(0.03, 0.03, 0.05, '#999', 8); hub.rotation.x = Math.PI / 2; hub.position.set(px, 0.36, 0); g.add(hub); };
  wheel(-0.52); wheel(0.52);
  const tube = (a, b) => { const d = V().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, d.length(), 6), fr); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.castShadow = true; g.add(m); };
  const bb = V(0, 0.3, 0), seat = V(-0.18, 0.78, 0), head = V(0.38, 0.74, 0);
  tube(V(-0.52, 0.36, 0), bb); tube(bb, seat); tube(bb, head); tube(seat, head); tube(V(-0.52, 0.36, 0), seat); tube(head, V(0.52, 0.36, 0));
  const sd = box(0.2, 0.04, 0.09, '#222'); sd.position.set(-0.2, 0.82, 0);
  const bar = cyl(0.012, 0.012, 0.5, '#999', 6); bar.rotation.x = Math.PI / 2; bar.position.set(0.4, 0.84, 0);
  g.add(sd, bar); scene.add(g); return g;
}
/** 電話亭：1982 年大家出門在外打電話的方式，跟車上那支電話放在一起看 */
export function phoneBooth(scene, x, z, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw;
  const fr = mat('#1f5d8a', { roughness: 0.5, metalness: 0.3 }), glass = new THREE.MeshStandardMaterial({ color: '#9fb8c4', transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.2, side: THREE.DoubleSide });
  const base = box(1.0, 0.06, 1.0, fr); base.position.y = 0.03; g.add(base);
  [[-0.46, -0.46], [0.46, -0.46], [-0.46, 0.46], [0.46, 0.46]].forEach(([px, pz]) => { const p = box(0.07, 2.3, 0.07, fr); p.position.set(px, 1.18, pz); g.add(p); });
  const roof = box(1.04, 0.1, 1.04, fr); roof.position.y = 2.38; g.add(roof);
  [[0, -0.46, 0.9, 2.1], [-0.46, 0, 0.9, 2.1], [0.46, 0, 0.9, 2.1]].forEach(([px, pz, w, h], i) => {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); gl.position.set(px, 1.2, pz); if (i) gl.rotation.y = Math.PI / 2; gl.castShadow = false; g.add(gl);
  });
  const mid = box(0.9, 0.05, 0.05, fr); mid.position.set(0, 1.2, 0.46); g.add(mid);
  const mid2 = box(0.9, 0.05, 0.05, fr); mid2.position.set(0, 0.7, 0.46); g.add(mid2);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.22), new THREE.MeshStandardMaterial({ map: textTexture('PUHELIN', { w: 256, h: 70, bg: '#f2f0e8', color: '#1f5d8a', size: 46 }), emissive: '#ffffff', emissiveMap: null, emissiveIntensity: 0 }));
  sg.position.set(0, 2.2, 0.53); g.add(sg);
  const unit = box(0.3, 0.42, 0.12, '#44484c', { metalness: 0.4 }); unit.position.set(0, 1.35, -0.4); g.add(unit);
  const hs = box(0.07, 0.24, 0.05, '#111'); hs.position.set(-0.17, 1.38, -0.32); g.add(hs);
  scene.add(g); return g;
}
/** 郵筒（黃色） */
export function postBox(scene, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const b = box(0.38, 0.9, 0.3, mat('#e0a82b', { roughness: 0.5 })); b.position.y = 1.0;
  const top = cyl(0.19, 0.19, 0.3, mat('#e0a82b', { roughness: 0.5 }), 14); top.rotation.x = Math.PI / 2; top.position.y = 1.45;
  const slot = box(0.26, 0.03, 0.02, '#222'); slot.position.set(0, 1.28, 0.16);
  const leg = box(0.1, 0.55, 0.1, '#3a3d40'); leg.position.y = 0.28;
  g.add(b, top, slot, leg); scene.add(g); return g;
}

/* ---------- 店面：遮陽篷、櫥窗內部、招牌、陽台 ---------- */
const _shopCache = new Map();
export function shopInteriorTex(kind, label) {
  const ck = kind + '|' + label; if (_shopCache.has(ck)) return _shopCache.get(ck);
  const tex = canvasTex(1024, 352, (x, w, h) => {
    const r = rng(kind * 17 + 3);
    const wall = [['#f3e2b4', '#a07a4a'], ['#e9eadf', '#8a9a86'], ['#f1d9b0', '#9a6a46']][kind % 3];
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, wall[0]); g.addColorStop(1, wall[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    // 天花板的燈：暖黃色的光暈
    for (let i = 0; i < 6; i++) { const cx = 90 + i * 168, gl = x.createRadialGradient(cx, 8, 2, cx, 8, 110); gl.addColorStop(0, 'rgba(255,244,205,0.95)'); gl.addColorStop(1, 'rgba(255,244,205,0)'); x.fillStyle = gl; x.fillRect(cx - 110, 0, 220, 130); x.fillStyle = '#fff8e0'; x.fillRect(cx - 28, 4, 56, 8); }
    const pal = [['#b53a2a', '#e8c24a', '#2f5d7a', '#e9e3d3', '#4a7a4a'], ['#e8e2d4', '#7aa46a', '#c46a3a', '#2a3f5a', '#d9a93a'], ['#6a3a5a', '#d9a93a', '#e8e2d4', '#3f6a4a', '#b8552e']][kind % 3];
    const shelfY = [84, 150, 216];
    shelfY.forEach((sy, row) => {
      let px = 16;
      while (px < w - 30) {
        const c = pal[(r() * pal.length) | 0], bw = 18 + r() * 28, bh = 22 + r() * 30, t = r();
        x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(px + 3, sy - bh + 3, bw, bh);               // 影子
        x.fillStyle = c;
        if (kind % 3 === 1 && t > 0.4) { x.fillRect(px + bw * 0.3, sy - bh, bw * 0.4, bh); x.fillRect(px + bw * 0.15, sy - bh * 0.62, bw * 0.7, bh * 0.62); x.fillStyle = '#e8e2d4'; x.fillRect(px + bw * 0.3, sy - bh - 6, bw * 0.4, 6); } // 瓶子
        else if (kind % 3 === 2 && t > 0.5) { x.beginPath(); x.ellipse(px + bw / 2, sy - bh * 0.4, bw / 2, bh * 0.4, 0, 0, 7); x.fill(); }                 // 麵包
        else { x.fillRect(px, sy - bh, bw, bh); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(px + 3, sy - bh * 0.7, bw - 6, bh * 0.22); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(px + 3, sy - bh * 0.35, bw * 0.5, 3); } // 盒子、書：有標籤
        px += bw + 3 + r() * 8;
      }
      x.fillStyle = '#5a4026'; x.fillRect(8, sy, w - 16, 7); x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(8, sy + 7, w - 16, 5);   // 層板和它的影子
    });
    // 櫃檯與店員背影
    x.fillStyle = '#3a2a1c'; x.fillRect(0, h - 56, w, 56); x.fillStyle = '#6a4a2c'; x.fillRect(0, h - 60, w, 6);
    x.fillStyle = '#2b3138'; x.fillRect(w * 0.62, h - 190, 54, 134); x.beginPath(); x.arc(w * 0.62 + 27, h - 205, 20, 0, 7); x.fill();
    // 玻璃上的反光斜條與金色小字
    x.fillStyle = 'rgba(255,255,255,0.10)'; x.beginPath(); x.moveTo(60, 0); x.lineTo(210, 0); x.lineTo(70, h); x.lineTo(-80, h); x.fill();
    x.beginPath(); x.moveTo(520, 0); x.lineTo(600, 0); x.lineTo(460, h); x.lineTo(380, h); x.fill();
    x.fillStyle = 'rgba(240,210,120,0.9)'; x.font = '700 22px "Noto Sans TC","PingFang TC","Hiragino Sans","Microsoft JhengHei",sans-serif'; x.textAlign = 'left'; x.fillText(label || ['AVOINNA  MA–PE 9–17', 'OPEN  9–17', 'AUKI  9–17'][kind % 3], 18, h - 18);
  }, [1, 1], 16);
  _shopCache.set(ck, tex); return tex;
}
export function awning(w, color1 = '#9c2f2a', color2 = '#efe9da') {
  const t = canvasTex(256, 64, (x, cw, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? color2 : color1; x.fillRect(i * cw / 8, 0, cw / 8, h); } }, [Math.max(1, w / 2.2), 1], 8);
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 1.3), [mat(color1), mat(color1), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), mat(color1), mat(color1), mat(color1)]);
  top.rotation.x = 0.28; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const front = box(w, 0.2, 0.03, color1); front.position.set(0, -0.28, 0.65); g.add(front);
  return g;
}
export function balcony(w) {
  const g = new THREE.Group(), iron = mat('#23262a', { metalness: 0.5, roughness: 0.5 });
  const slab = box(w, 0.1, 0.9, '#6a6358'); g.add(slab);
  const top = box(w, 0.04, 0.04, iron); top.position.set(0, 0.95, 0.43); g.add(top);
  for (let i = 0; i <= Math.round(w / 0.16); i++) { const b = box(0.02, 0.9, 0.02, iron); b.position.set(-w / 2 + i * (w / Math.round(w / 0.16)), 0.5, 0.43); b.castShadow = false; g.add(b); }
  return g;
}

/* ---------- 停在路邊的車（沒有任何動作，只是讓街看起來有車） ---------- */
export function sedanProfile(ext = 0) {
  const lower = new THREE.Shape(); // 車身下半部：側面輪廓（x 車頭方向，y 往上）。ext：車頭、車尾加長的長度
  [[-1.75, 0.26], [2.12, 0.26], [2.16, 0.52], [2.08, 0.72], [1.2, 0.86], [-0.9, 0.88], [-1.72, 0.84], [-1.77, 0.56]]
    .map(([x, y]) => [x > 1.5 ? x + ext : x < -1.5 ? x - ext : x, y])
    .forEach(([x, y], i) => (i ? lower.lineTo(x, y) : lower.moveTo(x, y)));
  const cabin = new THREE.Shape(); // 車窗那一圈
  [[1.18, 0.86], [0.6, 1.44], [-0.5, 1.44], [-0.98, 0.88]].forEach(([x, y], i) => (i ? cabin.lineTo(x, y) : cabin.moveTo(x, y)));
  return { lower, cabin };
}
export function extrudeSide(shape, width, bevel = 0.04) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -(width - bevel * 2) / 2); return g;
}
/** 一輛方正轎車（車頭朝 +x，預設是 80 年代的長度）。antenna：後車廂上加一根車用電話天線；
 *  ext：車頭車尾各加長幾公尺（七〇年代的美國車有很長的引擎蓋和行李廂）；taxi：車頂加計程車燈、車身加條紋 */
export function makeSedan(color, { antenna = false, ext = 0, taxi = false } = {}) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, metalness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#1b262d', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.65 });
  const chrome = mat('#c8ccd0', { metalness: 0.85, roughness: 0.25 }), dark = mat('#1c1b1b', { roughness: 0.6 });
  const { lower, cabin } = sedanProfile(ext);
  const body = new THREE.Mesh(extrudeSide(lower, 1.76, 0.05), paint); body.castShadow = body.receiveShadow = true; g.add(body);
  const cab = new THREE.Mesh(extrudeSide(cabin, 1.5, 0.02), glass); g.add(cab);
  const roof = box(1.14, 0.07, 1.58, paint); roof.position.set(0.05, 1.45, 0); g.add(roof);
  const pil = (ax, ay, bx, by, z) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); const p = box(L, 0.07, 0.05, paint); p.position.set((ax + bx) / 2, (ay + by) / 2, z); p.rotation.z = Math.atan2(dy, dx); g.add(p); };
  [-0.77, 0.77].forEach((z) => {
    pil(1.18, 0.88, 0.6, 1.44, z); pil(-0.5, 1.44, -0.98, 0.9, z); const b = box(0.07, 0.56, 0.05, paint); b.position.set(-0.1, 1.16, z); g.add(b);
    const belt = box(2.9, 0.03, 0.012, chrome); belt.position.set(0.3, 0.86, z * 1.148); belt.castShadow = false;
    const mold = box(3.4, 0.07, 0.014, dark); mold.position.set(0.15, 0.52, z * 1.148); mold.castShadow = false;
    const gap = box(0.012, 0.58, 0.01, '#120a0a'); gap.position.set(0.9, 0.6, z * 1.148); const gap2 = gap.clone(); gap2.position.x = -0.1; g.add(belt, mold, gap, gap2);
    const mir = box(0.1, 0.09, 0.16, paint); mir.position.set(0.95, 1.22, z * 1.25); g.add(mir);
  });
  // 內裝：一點座椅，從車窗看進去不是空的
  const seat = mat('#3a2a22', { roughness: 0.9 });
  [-0.4, 0.4].forEach((sz) => { const s1 = box(0.5, 0.1, 0.55, seat); s1.position.set(0.35, 0.8, sz); const b1 = box(0.1, 0.5, 0.52, seat); b1.position.set(0.08, 1.05, sz); b1.rotation.z = -0.2; g.add(s1, b1); });
  const bench = box(0.55, 0.1, 1.4, seat); bench.position.set(-0.55, 0.8, 0); const bb = box(0.1, 0.45, 1.4, seat); bb.position.set(-0.85, 1.0, 0); bb.rotation.z = -0.2; g.add(bench, bb);
  const dash = box(0.35, 0.18, 1.5, '#1e1c1a'); dash.position.set(0.95, 0.96, 0); g.add(dash);
  const tire = mat('#141414', { roughness: 0.9 }), rim = mat('#b9bcc0', { metalness: 0.8, roughness: 0.3 });
  [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 20), tire); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.33, wz); w.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.225, 16), rim); hub.rotation.x = Math.PI / 2; hub.position.set(wx, 0.33, wz); g.add(w, hub);
    const arch = new THREE.Mesh(new THREE.CircleGeometry(0.42, 22), new THREE.MeshBasicMaterial({ color: '#070707', polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    arch.position.set(wx, 0.36, Math.sign(wz) * 0.888); if (wz < 0) arch.rotation.y = Math.PI; g.add(arch);
  });
  [0.64, -0.64].forEach((lz) => {
    const hr = box(0.055, 0.19, 0.4, chrome); hr.position.set(2.165 + ext, 0.64, lz);
    const h = box(0.05, 0.15, 0.36, '#fff6d8', { emissive: '#fff1c4', emissiveIntensity: 0.4 }); h.position.set(2.17 + ext, 0.64, lz);
    const t = box(0.05, 0.14, 0.4, '#a01e18', { emissive: '#6a0c08', emissiveIntensity: 0.4 }); t.position.set(-1.78 - ext, 0.68, lz);
    g.add(hr, h, t);
  });
  const grille = box(0.04, 0.17, 0.95, '#101214'); grille.position.set(2.18 + ext, 0.6, 0); g.add(grille);
  const bf = box(0.14, 0.2, 1.82, chrome); bf.position.set(2.2 + ext, 0.4, 0); const br = bf.clone(); br.position.x = -1.82 - ext; g.add(bf, br);
  if (taxi) {
    const lamp = box(0.34, 0.15, 0.62, '#f3ecc4', { emissive: '#f6e7a0', emissiveIntensity: 0.55 }); lamp.position.set(0.05, 1.56, 0); g.add(lamp);
    const lampBase = box(0.2, 0.05, 0.4, '#2a2a2a'); lampBase.position.set(0.05, 1.5, 0); g.add(lampBase);
    [-1, 1].forEach((sd) => { for (let i = 0; i < 14; i++) { const ck = box(0.14, 0.07, 0.012, i % 2 ? '#f2f0ea' : '#1b1b1b'); ck.position.set(-1.0 + i * 0.14, 0.62 + (i % 2) * 0.07 - 0.035, sd * 0.894); ck.castShadow = false; g.add(ck); } });
  }
  if (antenna) {
    const rod = cyl(0.008, 0.008, 0.7, '#202020', 6); rod.position.set(-0.4, 1.8, 0.45);
    const base = cyl(0.035, 0.04, 0.03, '#202020', 8); base.position.set(-0.4, 1.48, 0.45); g.add(rod, base);
    const tip = new THREE.Object3D(); tip.position.set(-0.4, 1.48, 0.45); g.add(tip); g.userData.antenna = tip;
  }
  return g;
}
export function parkedCar(scene, x, z, yaw, color) {
  const g = makeSedan(color); g.position.set(x, 0, z); g.rotation.y = yaw; scene.add(g); return g;
}

/** 一棟有細節的建築：高解析度立面、有貨的櫥窗、招牌、遮陽篷、水管。facing：+1 立面朝 +z，-1 朝 -z */
export function richBuilding(scene, building, { x, z, w, d = 10, floors, color, seed, shop, shopColor, facing = 1, awn = true, interior = 0, night = false, hours }) {
  const h = 3.6 + floors * 3.2;
  const bld = building({ x, z, w, h, d, facing, color, seed: seed + 3, shop, shopColor });
  const body = bld.children[0], fi = facing > 0 ? 4 : 5;
  body.material[fi] = facadeMaterial(color, seed, floors, night);
  body.material[0] = body.material[1] = new THREE.MeshStandardMaterial({ map: plasterTex(color, [d / 4, floors * 3.2 / 4]), roughness: 0.95 });
  const sgn = bld.children.find((m) => m.geometry && m.geometry.type === 'PlaneGeometry');
  if (sgn) { sgn.material.map = textTexture(shop, { w: 1792, h: 250, bg: shopColor, color: '#f4efe6', size: 168 }); sgn.material.map.anisotropy = 16; sgn.material.needsUpdate = true; }
  scene.add(bld);
  const fz = z + facing * d / 2;                                    // 立面所在的 z
  const tex = shopInteriorTex(interior, hours);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.84, 2.2), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: night ? 0.38 : 0.5, roughness: 0.3, metalness: 0.1 }));
  win.position.set(x, 1.5, fz + facing * 0.062); if (facing < 0) win.rotation.y = Math.PI; scene.add(win);
  for (let k = -2; k <= 2; k++) { const m = box(0.06, 2.3, 0.07, '#23201c'); m.position.set(x + k * (w * 0.84 / 4), 1.5, fz + facing * 0.075); m.castShadow = false; scene.add(m); }
  const sill = box(w * 0.88, 0.1, 0.18, '#4a4036'); sill.position.set(x, 0.35, fz + facing * 0.1); scene.add(sill);
  if (awn) { const a = awning(w * 0.84, ...AWN[seed % 4]); a.position.set(x, 2.95, fz + facing * 0.75); if (facing < 0) a.rotation.y = Math.PI; scene.add(a); }
  const pipe = cyl(0.05, 0.05, h, '#4a4640', 8); pipe.position.set(x + w / 2 - 0.42, h / 2, fz + facing * 0.12); pipe.castShadow = false; scene.add(pipe);
  facadeRelief(scene, { x, z, w, d, floors, facing, seed });
  return bld;
}

/* ---------- 立面的立體層次 ---------- */
// 對齊 facadeTextures 的窗格（每層 4 格、每格 w/4 寬、窗洞在格子中間）：
// 凸出的窗台與過樑、每層樓的飾帶、轉角壁柱、女兒牆與壓頂，偶爾屋頂上有水塔。
// 同一棟的零件合併成一個 mesh（一次繪製）。
export function facadeRelief(scene, { x, z, w, d = 10, floors, facing = 1, seed = 1, trim = '#d8d1c1' }) {
  const geos = [], roofGeos = [];
  const fz = z + facing * d / 2;
  const add = (list, bw, bh, bd, px, py, pz) => { const g = new THREE.BoxGeometry(bw, bh, bd); g.translate(px, py, pz); list.push(g); };
  const h = 3.6 + floors * 3.2;
  const cw = w / 4, ww = cw * 176 / 320;
  for (let k = 0; k < floors; k++) {
    const top = 3.6 + 3.2 * (k + 1) - 3.2 * 90 / 512, sill = top - 3.2 * 290 / 512;
    for (let c = 0; c < 4; c++) {
      const cx = x - w / 2 + (c + 0.5) * cw;
      add(geos, ww + 0.2, 0.07, 0.16, cx, sill - 0.02, fz + facing * 0.08);        // 窗台
      add(geos, ww + 0.14, 0.13, 0.08, cx, top + 0.1, fz + facing * 0.04);         // 過樑
      add(geos, 0.06, 0.035, 0.12, cx - ww / 2 - 0.04, sill - 0.07, fz + facing * 0.06); // 窗台托架
      add(geos, 0.06, 0.035, 0.12, cx + ww / 2 + 0.04, sill - 0.07, fz + facing * 0.06);
    }
    add(geos, w + 0.04, 0.1, 0.07, x, 3.6 + 3.2 * k + 0.02, fz + facing * 0.035);  // 樓層飾帶
  }
  [-1, 1].forEach((sd) => add(geos, 0.32, h - 3.6, 0.1, x + sd * (w / 2 - 0.16), 3.6 + (h - 3.6) / 2, fz + facing * 0.05)); // 轉角壁柱
  // 女兒牆（前面一道）與壓頂
  add(geos, w + 0.3, 0.55, 0.22, x, h + 0.62, fz + facing * 0.04);
  add(geos, w + 0.42, 0.08, 0.32, x, h + 0.93, fz + facing * 0.04);
  // 屋頂水塔（大約三棟一個）
  if (seed % 3 === 0) {
    const tx = x + (seed % 2 ? 1 : -1) * w * 0.22, tz = z - facing * d * 0.1;
    const tank = new THREE.CylinderGeometry(0.75, 0.75, 1.5, 14); tank.translate(tx, h + 2.0, tz); roofGeos.push(tank);
    const cap = new THREE.ConeGeometry(0.82, 0.4, 14); cap.translate(tx, h + 2.95, tz); roofGeos.push(cap);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(roofGeos, 0.08, 0.9, 0.08, tx + a * 0.5, h + 0.8, tz + b * 0.5));
  }
  const out = [];
  const mk = (list, color, rough) => {
    if (!list.length) return;
    const g = mergeGeometries(list.map((q) => q.toNonIndexed()), false);
    list.forEach((q) => q.dispose());
    const m = new THREE.Mesh(g, mat(color, { roughness: rough }));
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m); out.push(m);
  };
  mk(geos, trim, 0.85);
  mk(roofGeos, '#6e6a63', 0.7);
  return out;
}
const AWN = [['#9c2f2a', '#efe9da'], ['#2f5d4a', '#efe9da'], ['#c98a2b', '#efe9da'], ['#2f4a7a', '#efe9da']];

/* ---------- 高解析度的建築立面 ---------- */
// 一張貼圖 = 4 格寬 × 2 層樓（8m × 6.4m）。每格 2m × 3.2m：窗框、玻璃反光、窗簾、窗台、飾帶。
const facadeCache = new Map();
export function facadeTextures(color, seed = 1, night = false) {
  const key = color + seed + (night ? 'n' : '');
  if (facadeCache.has(key)) return facadeCache.get(key);
  const CW = 320, CH = 512, COLS = 4, ROWS = 2, W = CW * COLS, H = CH * ROWS;
  const r = rng(seed * 31 + 7);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const b = document.createElement('canvas'); b.width = W / 2; b.height = H / 2; const y = b.getContext('2d');
  const ec = document.createElement('canvas'); ec.width = W / 2; ec.height = H / 2; const ex = ec.getContext('2d'); ex.fillStyle = '#000'; ex.fillRect(0, 0, W / 2, H / 2);   // 夜晚發光的窗戶   // 凹凸圖：窗戶凹進去
  x.fillStyle = color; x.fillRect(0, 0, W, H);
  y.fillStyle = '#808080'; y.fillRect(0, 0, W / 2, H / 2);
  for (let i = 0; i < 30000; i++) { const v = r() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${0.02 + r() * 0.05})`; x.fillRect(r() * W, r() * H, 2, 2); } // 粉刷的顆粒
  const trim = '#e6e0d2';
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    const ox = col * CW, oy = row * CH;
    const wx = ox + 72, wy = oy + 90, ww = 176, wh = 290;            // 窗洞
    // 過樑與窗台
    x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(wx - 14, wy - 30, ww + 28, 22);
    x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(wx - 14, wy - 8, ww + 28, 5);
    x.fillStyle = '#cfc8b8'; x.fillRect(wx - 16, wy + wh, ww + 32, 18);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(wx - 16, wy + wh + 18, ww + 32, 10);
    // 玻璃
    const lit = r(), curtain = r();
    const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh);
    const thr = night ? 0.42 : 0.84, warm = r() > 0.3;
    if (lit > thr) { g.addColorStop(0, warm ? '#f6dfa6' : '#d6ecff'); g.addColorStop(1, warm ? '#c99a54' : '#8fb6d8'); ex.fillStyle = warm ? '#ffd48a' : '#cfe6ff'; ex.fillRect(wx / 2, wy / 2, ww / 2, wh / 2); }
    else { g.addColorStop(0, '#5f7487'); g.addColorStop(0.5, '#2f3d4a'); g.addColorStop(1, '#232d37'); }
    x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
    if (lit <= thr && !night) { // 玻璃上反射的天空斜條
      x.save(); x.beginPath(); x.rect(wx, wy, ww, wh); x.clip(); x.fillStyle = 'rgba(210,225,240,0.16)';
      x.beginPath(); x.moveTo(wx - 20, wy + wh * 0.5); x.lineTo(wx + ww * 0.7, wy - 10); x.lineTo(wx + ww, wy - 10); x.lineTo(wx + ww, wy + 20); x.lineTo(wx + 40, wy + wh); x.lineTo(wx - 20, wy + wh); x.fill(); x.restore();
    }
    if (curtain > 0.55) { // 窗簾
      x.fillStyle = curtain > 0.8 ? 'rgba(236,226,204,0.85)' : 'rgba(190,150,120,0.8)';
      x.fillRect(wx, wy, ww * 0.34, wh * (0.55 + curtain * 0.3)); x.fillRect(wx + ww * 0.66, wy, ww * 0.34, wh * (0.5 + curtain * 0.3));
    }
    // 窗框：外框、中直框、上方氣窗橫框
    x.strokeStyle = trim; x.lineWidth = 9; x.strokeRect(wx, wy, ww, wh);
    x.fillStyle = trim; x.fillRect(wx + ww / 2 - 4, wy, 8, wh); x.fillRect(wx, wy + wh * 0.28, ww, 7);
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 2; x.strokeRect(wx - 5, wy - 5, ww + 10, wh + 10);
    // 樓層飾帶
    x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(ox, oy + CH - 6, CW, 6); x.fillStyle = 'rgba(255,255,255,0.16)'; x.fillRect(ox, oy + CH - 12, CW, 6);
    // 凹凸：窗洞往內凹、框和窗台凸出
    const s = 0.5; y.fillStyle = '#303030'; y.fillRect(wx * s, wy * s, ww * s, wh * s);
    y.fillStyle = '#c0c0c0'; y.fillRect((wx - 14) * s, (wy - 30) * s, (ww + 28) * s, 22 * s); y.fillRect((wx - 16) * s, (wy + wh) * s, (ww + 32) * s, 18 * s);
    y.fillStyle = '#b0b0b0'; y.fillRect((wx + ww / 2 - 4) * s, wy * s, 8 * s, wh * s); y.fillRect(wx * s, (wy + wh * 0.28) * s, ww * s, 7 * s);
    y.fillStyle = '#a0a0a0'; y.fillRect(ox * s, (oy + CH - 12) * s, CW * s, 12 * s);
  }
  for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(30,24,18,${0.04 + r() * 0.05})`; x.fillRect(r() * W, 0, 3 + r() * 14, H * (0.4 + r() * 0.6)); } // 雨痕
  const mk = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; return t; };
  const out = { map: mk(c, true), bump: mk(b, false), emi: night ? mk(ec, true) : null };
  facadeCache.set(key, out); return out;
}
/** 立面材質。floors＝這棟有幾層（每層 3.2m）；一張貼圖是兩層，所以垂直方向重複 floors/2 次 */
export function facadeMaterial(color, seed, floors, night = false) {
  const t = facadeTextures(color, seed % 3, night);
  const map = t.map.clone(), bump = t.bump.clone(), emi = t.emi ? t.emi.clone() : null;
  [map, bump, emi].forEach((m) => { if (m) { m.repeat.set(1, floors / 2); m.needsUpdate = true; } });
  const m = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2.2, roughness: 0.92 });
  if (emi) { m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = emi; m.emissiveIntensity = 1.1; }
  return m;
}

/* ---------- 夜景用：光暈、光斑、自動販賣機、電線桿、電線 ---------- */
let _glowTex = null;
function glowTex() {
  if (!_glowTex) _glowTex = canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }, [1, 1], 1);
  _glowTex.wrapS = _glowTex.wrapT = THREE.ClampToEdgeWrapping; return _glowTex;
}
/** 朝向鏡頭的光暈（加亮混合），放在燈、招牌的位置 */
export function glowSprite(scene, color, size, x, y, z, opacity = 0.8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.set(size, size, 1); s.position.set(x, y, z); s.renderOrder = 5; scene.add(s); return s;
}
/** 地上的一塊彩色光（招牌、攤位照在路面上的光） */
export function lightPool(scene, color, w, d, x, y, z, opacity = 0.5) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 2; scene.add(m); return m;
}
export function vendingMachine(scene, x, z, yaw = 0, seed = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw;
  const body = box(0.9, 1.85, 0.75, '#c9c9cf', { metalness: 0.4, roughness: 0.4 }); body.position.y = 0.93;
  const tex = canvasTex(256, 512, (c, w, h) => {
    const r = rng(seed * 9 + 1); c.fillStyle = '#f3f6fa'; c.fillRect(0, 0, w, h);
    const cols = ['#d8453a', '#2f7ad8', '#3aa860', '#e8a33a', '#8a4ad8', '#d8d8d8'];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 5; i++) { c.fillStyle = cols[(r() * cols.length) | 0]; c.fillRect(14 + i * 46, 28 + row * 76, 34, 56); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(18 + i * 46, 34 + row * 76, 8, 40); c.fillStyle = '#fff'; c.fillRect(14 + i * 46, 86 + row * 76, 34, 12); }
    c.fillStyle = '#1b1d24'; c.fillRect(0, 340, w, 172); c.fillStyle = '#ffd24a'; for (let i = 0; i < 5; i++) c.fillRect(20 + i * 46, 352, 30, 16);
    c.fillStyle = '#333'; c.fillRect(30, 420, 196, 50);
  }, [1, 1], 8);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.7), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.9, roughness: 0.4 }));
  front.position.set(0, 0.95, 0.378); g.add(body, front);
  glowSprite(scene, '#cfe6ff', 3.0, x + Math.sin(yaw) * 0.6, 1.1, z + Math.cos(yaw) * 0.6, 0.25);
  lightPool(scene, '#cfe6ff', 3.2, 2.2, x + Math.sin(yaw) * 1.2, 0.0, z + Math.cos(yaw) * 1.2, 0.35);
  scene.add(g); return g;
}
export function utilityPole(scene, x, z, h = 7.5) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const pole = cyl(0.1, 0.14, h, '#6a655c', 10); pole.position.y = h / 2;
  const ca = box(1.8, 0.08, 0.1, '#4a4640'); ca.position.y = h - 0.4; const ca2 = box(1.4, 0.08, 0.1, '#4a4640'); ca2.position.y = h - 1.1;
  const tr = cyl(0.25, 0.25, 0.7, '#7a7f84', 12); tr.position.set(0.5, h - 1.9, 0.35);
  g.add(pole, ca, ca2, tr);
  [-0.8, 0, 0.8].forEach((dx) => { const ins = cyl(0.04, 0.04, 0.12, '#d8d4c8', 6); ins.position.set(dx, h - 0.3, 0); g.add(ins); });
  scene.add(g); return g;
}
/** 兩點之間下垂的電線 */
export function wire(scene, a, b, sag = 0.4, color = '#15161a') {
  const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16; const p = V().lerpVectors(a, b, k); p.y -= Math.sin(Math.PI * k) * sag; pts.push(p); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.012, 4), new THREE.MeshBasicMaterial({ color }));
  scene.add(m); return m;
}
/** 會飄的蒸氣（update(T) 只看時間，可以跳時間） */
export function steamPuffs(scene, x, y, z, n = 7) {
  const sprites = Array.from({ length: n }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false, fog: false })); s.renderOrder = 6; scene.add(s); return s; });
  return (T) => sprites.forEach((s, i) => { const k = ((T * 0.35 + i / n) % 1); s.position.set(x + Math.sin(T * 0.8 + i * 2) * 0.1 * k * 2, y + k * 1.1, z); const sc = 0.2 + k * 0.7; s.scale.set(sc, sc, 1); s.material.opacity = 0.34 * (1 - k) * Math.min(1, k * 6); });
}

/* ======================================================================
   室內場景用：地板／牆面／天花板貼圖、有踢腳板的房間、窗外景色、盆栽、掛畫
   ====================================================================== */
const _surf = new Map();
/** 各種室內表面的貼圖。size＝貼圖涵蓋幾公尺（用來算重複次數） */
export function surfaceTex(kind, color = '#cfc8bb', seed = 1) {
  const key = kind + color + seed; if (_surf.has(key)) return _surf.get(key);
  const r = rng(seed * 101 + 13), base = new THREE.Color(color);
  const shade = (k) => '#' + base.clone().offsetHSL(0, 0, k).getHexString();
  const S = 1024;
  const t = canvasTex(S, S, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    const speck = (n, a, sz = 2) => { for (let i = 0; i < n; i++) { const v = r() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${a * (0.3 + r() * 0.7)})`; x.fillRect(r() * w, r() * h, sz, sz); } };
    if (kind === 'terrazzo' || kind === 'vinyl') {
      const n = kind === 'terrazzo' ? 4 : 8, cw = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = shade((r() - 0.5) * 0.05 + (kind === 'vinyl' && (i + j) % 2 ? -0.06 : 0)); x.fillRect(i * cw, j * cw, cw, cw); }
      if (kind === 'terrazzo') for (let i = 0; i < 900; i++) { x.fillStyle = ['rgba(120,110,100,0.5)', 'rgba(255,255,255,0.55)', 'rgba(170,150,130,0.5)', 'rgba(90,100,110,0.4)'][(r() * 4) | 0]; x.beginPath(); x.ellipse(r() * w, r() * h, 2 + r() * 6, 1.5 + r() * 4, r() * 3, 0, 7); x.fill(); }
      else speck(6000, 0.18, 3);
      x.strokeStyle = kind === 'terrazzo' ? 'rgba(80,72,64,0.55)' : 'rgba(60,60,60,0.35)'; x.lineWidth = kind === 'terrazzo' ? 3 : 2;
      for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * cw, 0); x.lineTo(i * cw, h); x.stroke(); x.beginPath(); x.moveTo(0, i * cw); x.lineTo(w, i * cw); x.stroke(); }
    } else if (kind === 'parquet') {
      const ph = h / 14; // 木地板：一條條木板，長短錯開
      for (let row = 0; row < 14; row++) {
        let px = -r() * 300; while (px < w) {
          const pw = 240 + r() * 260; x.fillStyle = shade((r() - 0.5) * 0.09); x.fillRect(px, row * ph, pw - 2, ph - 2);
          x.strokeStyle = 'rgba(40,20,5,0.18)'; x.lineWidth = 1; for (let g = 0; g < 4; g++) { const gy = row * ph + 4 + r() * (ph - 8); x.beginPath(); x.moveTo(px, gy); x.bezierCurveTo(px + pw * 0.3, gy + (r() - 0.5) * 6, px + pw * 0.7, gy + (r() - 0.5) * 6, px + pw, gy); x.stroke(); }
          px += pw;
        }
      }
      x.strokeStyle = 'rgba(30,15,5,0.45)'; x.lineWidth = 2; for (let row = 0; row <= 14; row++) { x.beginPath(); x.moveTo(0, row * ph); x.lineTo(w, row * ph); x.stroke(); }
    } else if (kind === 'brick') {
      const bw = 112, bh = 38;
      for (let row = 0; row * bh < h; row++) for (let i = -1; i * bw < w + bw; i++) { const off = (row % 2) * bw / 2; x.fillStyle = shade((r() - 0.5) * 0.12); x.fillRect(i * bw + off + 2, row * bh + 2, bw - 4, bh - 4); }
      speck(7000, 0.22, 2); x.fillStyle = 'rgba(210,200,185,0.22)'; // 灰漿縫
      for (let row = 0; row * bh < h; row++) { x.fillRect(0, row * bh, w, 3); for (let i = -1; i * bw < w + bw; i++) x.fillRect(i * bw + (row % 2) * bw / 2, row * bh, 3, bh); }
    } else if (kind === 'ceil') {
      const n = 3, cw = w / n; speck(9000, 0.07, 2);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.03})`; x.fillRect(i * cw, j * cw, cw, cw); }
      x.strokeStyle = 'rgba(90,90,90,0.4)'; x.lineWidth = 4; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * cw, 0); x.lineTo(i * cw, h); x.stroke(); x.beginPath(); x.moveTo(0, i * cw); x.lineTo(w, i * cw); x.stroke(); }
    } else if (kind === 'carpet') { speck(30000, 0.25, 2); }
    else { speck(18000, 0.06, 2); for (let i = 0; i < 10; i++) { x.fillStyle = `rgba(0,0,0,${0.006 + r() * 0.01})`; x.beginPath(); x.ellipse(r() * w, r() * h, 60 + r() * 160, 40 + r() * 120, r() * 3, 0, 7); x.fill(); } }   // plaster：只有很淡的雲狀髒污
  }, [1, 1], 16);
  _surf.set(key, t); return t;
}
function surfMat(kind, color, w, h, size, extra = {}) {
  const t = surfaceTex(kind, color).clone(); t.repeat.set(w / size, h / size); t.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, ...extra });
}
/** 有貼圖、踢腳板、頂線的房間。傳回的部件跟 kit2.room 一樣（floor/ceil/back/front/left/right/w/d/h） */
export function richRoom(scene, { w = 9, d = 8, h = 3.2, floor = { kind: 'terrazzo', color: '#d6d0c4', size: 2, rough: 0.35 }, wall = { kind: 'plaster', color: '#e2ddd0', size: 3 }, wallBack = null, wallLeft = null, wallRight = null, ceil = { kind: 'ceil', color: '#ecebe6', size: 1.8 }, base = '#6a5a48', crown = '#f2efe8' } = {}) {
  const plain = mat('#cfcfcf');
  const wb = wallBack || wall;
  const face = (spec, a, b) => surfMat(spec.kind, spec.color, a, b, spec.size || 2, { roughness: spec.rough ?? 0.85 });
  const mk = (geo, mats) => { const m = new THREE.Mesh(geo, mats); m.receiveShadow = true; m.castShadow = false; scene.add(m); return m; };
  const parts = {
    floor: mk(new THREE.BoxGeometry(w, 0.2, d), [plain, plain, face(floor, w, d), plain, plain, plain]),
    ceil: mk(new THREE.BoxGeometry(w, 0.2, d), [plain, plain, plain, (() => { const m = face(ceil, w, d); m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = m.map; m.emissiveIntensity = 0.4; return m; })(), plain, plain]),   // 天花板自己亮一點（地板反射上來的光）
    back: mk(new THREE.BoxGeometry(w, h, 0.2), [plain, plain, plain, plain, face(wb, w, h), plain]),
    front: mk(new THREE.BoxGeometry(w, h, 0.2), [plain, plain, plain, plain, plain, face(wall, w, h)]),
    left: mk(new THREE.BoxGeometry(0.2, h, d), [face(wallLeft || wall, d, h), plain, plain, plain, plain, plain]),
    right: mk(new THREE.BoxGeometry(0.2, h, d), [plain, face(wallRight || wall, d, h), plain, plain, plain, plain])
  };
  parts.floor.position.set(0, -0.1, 0); parts.ceil.position.set(0, h + 0.1, 0);
  parts.back.position.set(0, h / 2, -d / 2); parts.front.position.set(0, h / 2, d / 2);
  parts.left.position.set(-w / 2, h / 2, 0); parts.right.position.set(w / 2, h / 2, 0);
  // 踢腳板與頂線沿著四面牆
  const bm = mat(base, { roughness: 0.6 }), cm = mat(crown, { roughness: 0.7 }), iw = w / 2 - 0.1, id = d / 2 - 0.1;
  [[2 * iw, 0.03, 0, -id + 0.015, 0], [2 * iw, 0.03, 0, id - 0.015, 0]].forEach(([len, , px, pz]) => { const b = box(len, 0.14, 0.03, bm); b.position.set(px, 0.07, pz); b.castShadow = false; scene.add(b); const c = box(len, 0.1, 0.06, cm); c.position.set(px, h - 0.05, pz > 0 ? pz - 0.015 : pz + 0.015); c.castShadow = false; scene.add(c); });
  [-iw + 0.015, iw - 0.015].forEach((px) => { const b = box(0.03, 0.14, 2 * id, bm); b.position.set(px, 0.07, 0); b.castShadow = false; scene.add(b); const c = box(0.06, 0.1, 2 * id, cm); c.position.set(px > 0 ? px - 0.015 : px + 0.015, h - 0.05, 0); c.castShadow = false; scene.add(c); });
  return { ...parts, w, d, h };
}
/** 天花板上的日光燈（有框的發光面板） */
export function ceilingLights(scene, xs, zs, y, w = 1.2, d = 0.3, warm = '#fffbe8') {
  xs.forEach((x) => zs.forEach((z) => {
    const fr = box(w + 0.1, 0.03, d + 0.1, '#d8d6cf'); fr.position.set(x, y + 0.012, z); fr.castShadow = false;
    const l = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), new THREE.MeshBasicMaterial({ color: warm })); l.position.set(x, y - 0.005, z);
    scene.add(fr, l);
  }));
}
/** 窗外景色貼圖：city（遠方的樓）、trees（綠樹草地）、campus */
export function outsideTex(kind) {
  return canvasTex(512, 384, (x, w, h) => {
    const r = rng(kind.length * 7 + 5);
    const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#8fb8e8'); sky.addColorStop(0.7, '#dfeaf4'); sky.addColorStop(1, '#f3efe4'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) { const cx = r() * w, cy = 30 + r() * 120, rad = 20 + r() * 40, g = x.createRadialGradient(cx, cy, 2, cx, cy, rad); g.addColorStop(0, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rad * 1.8, rad * 0.6, 0, 0, 7); x.fill(); }
    if (kind === 'city') {
      for (let i = 0; i < 16; i++) { const bw = 30 + r() * 50, bh = 90 + r() * 200, bx = i * 34 + r() * 10; x.fillStyle = `rgb(${120 + r() * 50 | 0},${130 + r() * 40 | 0},${150 + r() * 40 | 0})`; x.fillRect(bx, h - bh - 30, bw, bh + 30); x.fillStyle = 'rgba(255,255,255,0.35)'; for (let wy = h - bh - 20; wy < h - 40; wy += 14) for (let wx = bx + 5; wx < bx + bw - 8; wx += 11) x.fillRect(wx, wy, 6, 8); }
      x.fillStyle = '#6d7a82'; x.fillRect(0, h - 30, w, 30);
    } else {
      x.fillStyle = '#7fa860'; x.fillRect(0, h - 70, w, 70);
      for (let i = 0; i < 9; i++) { const tx = i * 60 + r() * 30, th = 70 + r() * 70; x.fillStyle = '#5a4430'; x.fillRect(tx, h - 70 - th * 0.35, 6, th * 0.35); x.fillStyle = ['#4f8a3a', '#5f9a44', '#6aa44c'][(r() * 3) | 0]; x.beginPath(); x.arc(tx + 3, h - 70 - th * 0.55, th * 0.38, 0, 7); x.fill(); }
      x.fillStyle = '#c9c2a8'; x.fillRect(0, h - 28, w, 28);
    }
  }, [1, 1], 4);
}
/** 一扇有窗框、窗格、窗台和窗外景色的窗戶。放在 pos，面向 yaw 的方向（0＝面向 +z） */
export function windowView(scene, { pos, yaw = 0, w = 2.1, h = 1.9, view = 'city', frame = '#8c9399', blinds = 0 }) {
  const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = yaw;
  const out = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: outsideTex(view), fog: false })); out.position.z = 0.0; g.add(out);
  const fm = mat(frame, { roughness: 0.5 }), t = 0.07;
  [[0, h / 2, w + t * 2, t], [0, -h / 2, w + t * 2, t]].forEach(([px, py, ww, hh]) => { const b = box(ww, hh, 0.1, fm); b.position.set(px, py, 0.03); b.castShadow = false; g.add(b); });
  [-w / 2, w / 2].forEach((px) => { const b = box(t, h, 0.1, fm); b.position.set(px, 0, 0.03); b.castShadow = false; g.add(b); });
  const mv = box(0.045, h, 0.08, fm); mv.position.z = 0.04; const mh = box(w, 0.045, 0.08, fm); mh.position.set(0, h * 0.18, 0.04); g.add(mv, mh);
  const sl = box(w + 0.3, 0.06, 0.28, '#e8e3d6'); sl.position.set(0, -h / 2 - 0.05, 0.13); sl.castShadow = false; g.add(sl);
  const glassM = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, depthWrite: false })); glassM.position.z = 0.05; g.add(glassM);
  if (blinds > 0) { const n = Math.round(h * blinds * 14); for (let i = 0; i < n; i++) { const s = box(w - 0.05, 0.035, 0.012, '#e4dfd2'); s.position.set(0, h / 2 - 0.05 - i * (h * blinds / n), 0.07); s.rotation.x = 0.35; s.castShadow = false; g.add(s); } }
  scene.add(g); return g;
}
/** 室內盆栽：花盆加一叢葉子（低面數，每片有深淺） */
export function leafyPlant(scene, x, z, scale = 1, seed = 1, pot = '#8a5a3a') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); const r = rng(seed * 17 + 2);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.2, 0.5, 14), mat(pot, { roughness: 0.7 })); p.position.y = 0.25; p.castShadow = true; g.add(p);
  const soil = cyl(0.25, 0.25, 0.02, '#3a2c20', 12); soil.position.y = 0.5; g.add(soil);
  // 一叢叢的葉團（低面數、每面深淺不同），比單片葉子自然
  for (let i = 0; i < 7; i++) {
    const rad = 0.22 + r() * 0.2, geo = new THREE.IcosahedronGeometry(rad, 1).toNonIndexed(), col = [];
    const base = new THREE.Color(['#3f7a3a', '#4f8a42', '#2f6a34', '#5f9a48'][(r() * 4) | 0]);
    for (let f = 0; f < geo.attributes.position.count / 3; f++) { const c = base.clone().offsetHSL(0, 0, (r() - 0.5) * 0.12); for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true }));
    const a = r() * 6.28, d = r() * 0.22; m.position.set(Math.cos(a) * d, 0.75 + r() * 0.55, Math.sin(a) * d); m.scale.y = 1.15; m.castShadow = true; g.add(m);
    if (i < 3) { const st = cyl(0.012, 0.015, 0.4 + r() * 0.2, '#4a5a32', 5); st.position.set(Math.cos(a) * d * 0.5, 0.7, Math.sin(a) * d * 0.5); g.add(st); }
  }
  scene.add(g); return g;
}
/** 掛畫：相框加一幅抽象畫 */
export function framedPicture(scene, x, y, z, yaw, w = 0.9, h = 0.6, seed = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; const r = rng(seed * 29 + 3);
  const tex = canvasTex(256, 170, (c, cw, ch) => { c.fillStyle = ['#efe6d2', '#dfe8ee', '#f0dede'][seed % 3]; c.fillRect(0, 0, cw, ch); for (let i = 0; i < 6; i++) { c.fillStyle = ['#c0503a', '#2f5d8a', '#d9a93a', '#4a7a5a', '#3a3a44'][(r() * 5) | 0]; const ww = 30 + r() * 90, hh = 20 + r() * 70; c.globalAlpha = 0.75; c.fillRect(r() * (cw - ww), r() * (ch - hh), ww, hh); } c.globalAlpha = 1; }, [1, 1], 8);
  const fr = box(w + 0.1, h + 0.1, 0.04, '#3a2c20'); const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); pic.position.z = 0.025; fr.castShadow = false;
  g.add(fr, pic); scene.add(g); return g;
}
