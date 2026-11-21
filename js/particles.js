// 環境粒子：灰塵（室內）、花粉（戶外）、落葉（秋天）、夜霧微光（夜景）。
// 用一個 Points 就搞定，位置在 CPU 上更新（約 150 個點，很輕）。update(T) 只看時間，可跳轉。
import * as THREE from 'three';

const KIND_BY_MODULE = {
  walkie1940: 'pollen', 'g1-2008': 'pollen', proto1973: 'pollen', dynatac: 'pollen', micro1989: 'pollen',
  senator: 'leaves', s24: 'night',
  sms1992: 'dust', simon1994: 'dust', startac: 'dust', note: 'dust', iphone: 'dust', 'iphone4-2010': 'dust', 'iphone12-2020': 'dust', nokia3310: 'dust'
};
const CFG = {
  dust:   { n: 110, color: '#fff3d6', size: 0.045, opacity: 0.5, fall: 0.012, drift: 0.05, box: [7, 3.2, 7], leaf: false },
  pollen: { n: 90,  color: '#fffbe0', size: 0.05, opacity: 0.6, fall: 0.02, drift: 0.2, box: [14, 4.5, 14], leaf: false },
  leaves: { n: 46,  color: '#ffffff', size: 0.2, opacity: 0.95, fall: 0.45, drift: 0.5, box: [12, 6, 12], leaf: true },
  night:  { n: 130, color: '#b8c8ff', size: 0.05, opacity: 0.5, fall: 0.004, drift: 0.12, box: [12, 4.5, 12], leaf: false }
};

function dotTexture(leaf) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  if (leaf) {
    g.translate(32, 32); g.rotate(-0.6);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, 22, 11, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.stroke();
  } else {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** center：粒子範圍的中心（通常是場景視角位置）。回傳 { update(T), points } 或 null。 */
export function createParticles(scene, moduleName, center) {
  const kind = KIND_BY_MODULE[moduleName];
  const cfg = kind && CFG[kind];
  if (!cfg) return null;
  const [bx, by, bz] = cfg.box;
  const seed = new Float32Array(cfg.n * 4);
  let r = 12345; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < seed.length; i++) seed[i] = rnd();
  const pos = new Float32Array(cfg.n * 3), col = new Float32Array(cfg.n * 3);
  const leafCols = ['#c8501e', '#d9892b', '#b8862a', '#9a3a1c'].map((h) => new THREE.Color(h));
  for (let i = 0; i < cfg.n; i++) {
    const c = cfg.leaf ? leafCols[i % 4] : new THREE.Color(cfg.color);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: cfg.size, map: dotTexture(cfg.leaf), vertexColors: true, transparent: true, opacity: cfg.opacity,
    depthWrite: false, sizeAttenuation: true, fog: false, alphaTest: cfg.leaf ? 0.3 : 0
  });
  mat.userData = { shared: false };
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false; pts.renderOrder = 5;
  scene.add(pts);
  const wrap = (v, m) => ((v % m) + m) % m;
  return {
    points: pts,
    update(T) {
      for (let i = 0; i < cfg.n; i++) {
        const a = seed[i * 4], b = seed[i * 4 + 1], c = seed[i * 4 + 2], d = seed[i * 4 + 3];
        const x = wrap(a * bx + Math.sin(T * 0.3 + d * 6.28) * cfg.drift * 3 + T * cfg.drift * (b - 0.4), bx) - bx / 2;
        const y = wrap(b * by - T * cfg.fall * (0.5 + d), by);
        const z = wrap(c * bz + Math.cos(T * 0.25 + a * 6.28) * cfg.drift * 3, bz) - bz / 2;
        pos[i * 3] = center.x + x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = center.z + z;
      }
      geo.attributes.position.needsUpdate = true;
    }
  };
}
