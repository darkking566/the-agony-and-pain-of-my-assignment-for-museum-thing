// 沉浸場景：2008 年秋天的城市公園，一位年輕人用 HTC Dream（G1）的滑蓋鍵盤，在 Android Market 下載一個小程式。
// 字幕和解說文字在 js/data.js 的 scenes['htc-dream']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, sign, Person, placeBetween } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { cloudSky, leafTree, GREEN, blobShadow, pavingTex, lampPost, bench, glowSprite, richBuilding, bicycle } from './props.js';
import { building } from '../scene-kit.js';

const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };

export function build({ scene, phone }) {
  /* ---------- 傍晚的天空與光線 ---------- */
  const skyGeo = new THREE.SphereGeometry(220, 32, 16);
  const top = new THREE.Color('#2b3f63'), hor = new THREE.Color('#f2b38a');
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
  scene.fog = new THREE.Fog('#3a4a68', 30, 120);

  scene.add(new THREE.HemisphereLight('#c9d6ff', '#4a4050', 1.0));
  const sun = new THREE.DirectionalLight('#ffb987', 1.6);   // 夕陽
  sun.position.set(-18, 9, 8);
  sun.target.position.set(0, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 80 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  /* ---------- 公園：草地、步道、樹、路燈 ---------- */
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#4c6040', roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; grass.receiveShadow = true;
  scene.add(grass);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, 3.2), new THREE.MeshStandardMaterial({ map: pavingTex([15, 1]), roughness: 0.95 }));
  walk.position.set(0, 0.02, -0.4); walk.receiveShadow = true;
  scene.add(walk);
  leafTree(scene, -6, -6, 3, 1.3, GREEN);
  leafTree(scene, 5, -7, 8, 1.2, GREEN);
  leafTree(scene, -10, -3, 12, 1.1, GREEN);
  leafTree(scene, 9, -2.5, 5, 1.0, GREEN);
  // 路燈：燈罩發出暖黃色的光
  [[-3.0, -1.6, 1], [3.6, -1.8, -1]].forEach(([x, z, d]) => {
    lampPost(scene, x, z, d);
    glowSprite(scene, '#ffd58a', 1.1, x, 3.0, z, 0.9);
  });

  // 公園外圍的一排樓房（傍晚時有幾扇窗亮著燈）
  {
    const palette = ['#7d4a3a', '#a9978a', '#6e5f52', '#94553f', '#5f5b55'];
    const shops = ['CAFE', 'BOOKS', 'DELI', 'BANK', 'TAILOR'];
    let n = 0;
    for (let x = -40; x < 40;) {
      const w = 8 + ((n * 37) % 5);
      richBuilding(scene, building, {
        x: x + w / 2, z: -16 - 5, w, d: 10, facing: 1, floors: 4 + ((n * 53) % 3),
        color: palette[n % palette.length], seed: n + 5, night: true,
        shop: shops[n % shops.length], shopColor: ['#1d2a3a', '#5a1f1b', '#1f3b2c', '#3b2a4a'][n % 4],
        awn: n % 2 === 0, interior: n % 3, hours: 'OPEN  9–10'
      });
      x += w + 0.2; n++;
    }
  }
  bicycle(scene, -4.6, -1.2, 0.6);
  /* ---------- 第三輪：花圃、噴水池、指示牌、第二張長椅 ---------- */
  // 花圃：木框裡的一排花（紅、黃、粉）
  {
    const frame = box(3.2, 0.25, 0.7, '#7a5a3a'); frame.position.set(-1.6, 0.12, -2.9); scene.add(frame);
    const soil = box(3.0, 0.05, 0.56, '#3a2a1c'); soil.position.set(-1.6, 0.26, -2.9); scene.add(soil);
    const cols = ['#e74c3c', '#f1c40f', '#f78fb3', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const x = -3.0 + (i % 8) * 0.38 + ((i * 7) % 3) * 0.04, z = -3.05 + Math.floor(i / 8) * 0.28;
      const stem = cyl(0.01, 0.01, 0.2, '#3f6b3a', 4); stem.position.set(x, 0.42, z); scene.add(stem);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.8 }));
      bloom.position.set(x, 0.55, z); scene.add(bloom);
    }
  }
  // 噴水池：圓形的石池、中央的水柱（用一顆淡藍的球代表水）
  {
    const pool = cyl(1.0, 1.05, 0.35, '#b8b4aa', 28); pool.position.set(4.6, 0.17, -2.2); scene.add(pool);
    const water = cyl(0.9, 0.9, 0.04, '#6fa8cf', 28); water.position.set(4.6, 0.34, -2.2); scene.add(water);
    const spout = cyl(0.05, 0.05, 0.7, '#c9c3b0', 8); spout.position.set(4.6, 0.7, -2.2); scene.add(spout);
    const spray = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: '#cfe7f5', transparent: true, opacity: 0.6, roughness: 0.1 }));
    spray.position.set(4.6, 1.1, -2.2); scene.add(spray);
  }
  // 入口的指示牌（木牌）
  {
    const post = cyl(0.04, 0.04, 1.5, '#5a4030', 8); post.position.set(-6.2, 0.75, 0.9); scene.add(post);
    const board = sign('CITY PARK', 1.2, 0.36, { bg: '#2f5a3a', color: '#f3ead6', size: 84, w: 512, h: 160, weight: 800 });
    board.position.set(-6.2, 1.45, 0.92); scene.add(board);
  }
  // 第二張長椅，靠在小路另一側
  bench(scene, 6.4, 0.9, Math.PI);
  // 長椅與旁邊的垃圾桶
  bench(scene, 1.0, -1.7, 0);
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.7, 12), new THREE.MeshStandardMaterial({ color: '#2f3a34' }));
  bin.position.set(2.4, 0.35, -1.5); bin.castShadow = true; scene.add(bin);

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const user = add(new Person({ top: '#2d3b50', bottom: '#2a2a30', hair: '#2b1d14', skin: '#e8c1a0', height: 1.0 }));
  const walker = add(new Person({ top: '#8a4b38', bottom: '#3a3a44', dress: true, hair: '#1f1712', skin: '#c99a72', height: 0.95 }));
  // 背景的散步的人（只在 ambient 裡移動，不影響劇情）
  const pedA = add(new Person({ top: '#4a6a8a', bottom: '#2e2e36', hair: '#3a2a1c', skin: '#e0b494', height: 1.0 }));
  const pedB = add(new Person({ top: '#b8a878', bottom: '#4a4a52', dress: true, hair: '#6b4a2a', skin: '#edc6a2', height: 0.94 }));
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const USER_SPOT = V(0.1, 0, 0.0);

  /* ---------- 手機（HTC Dream，滑蓋式） ---------- */
  const dream = buildPhone(phone);
  const rig = dream.userData.rig;
  const dreamOuter = new THREE.Group();
  {
    const b = new THREE.Box3().setFromObject(dream);
    const s = new THREE.Vector3(); b.getSize(s);
    const c = b.getCenter(V());
    dream.position.sub(c);
    const sc = new THREE.Group();
    sc.add(dream);
    sc.scale.setScalar(0.2 / Math.max(s.x, s.y, s.z));   // 最長邊約 20 公分
    sc.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    dreamOuter.add(sc);
  }
  scene.add(dreamOuter);
  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.1, 0.06);
  user.arms.R.grip.add(handHold);
  const chest = new THREE.Object3D();
  chest.rotation.set(0.55, Math.PI, 0);
  chest.position.set(-0.08, 1.3, 0.36);
  user.root.add(chest);
  const anchors = { chest, hand: handHold };
  const gripOf = {
    chest: () => chest.localToWorld(V(0, -0.14, -0.04)),
    hand: () => user.local(-0.3, 0.84, 0.08)
  };
  const poleOf = {
    chest: () => user.local(-0.6, 0.85, 0.1),
    hand: () => user.local(-0.5, 0.6, -0.1)
  };
  let pose = { from: 'hand', to: 'hand', k: 0 };
  function setPhone(from, to, k) {
    pose = { from, to, k };
    if (from === 'hand' && to === 'hand') { user.reach.R = null; return; }
    user.reach.R = {
      target: () => gripOf[from]().lerp(gripOf[to](), k),
      pole: () => poleOf[from]().lerp(poleOf[to](), k)
    };
  }
  function placePhone() {
    const { from, to, k } = pose;
    if (from === 'hand') placeBetween(dreamOuter, handHold, anchors[to], span(k, 0.6, 1));
    else if (to === 'hand') placeBetween(dreamOuter, anchors[from], handHold, span(k, 0, 0.4));
    else placeBetween(dreamOuter, anchors[from], anchors[to], k);
  }
  // 滑蓋：0＝闔上，1＝滑出鍵盤
  function setSlide(v) {
    rig.s.slide = rig.t.slide = v;
    rig.update(0, 0);
  }

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };
  const WALKER_SPOT = V(-2.6, 0, 0.6);

  /* ---------- 劇本 ---------- */
  const beats = {
    // 年輕人走到長椅旁，拿出那支滑蓋手機
    walk: {
      duration: 8,
      update(t, T) {
        user.reset();
        user.walk(V(-6, 0, 0.4), USER_SPOT, t, 0, 5);
        if (t > 5) user.yaw = lerp(Math.PI / 2, -0.3, span(t, 5, 6));
        setPhone('hand', 'hand', 0);
        setSlide(0);
        idle(user, T);
        walker.reset(); walker.walk(V(-12, 0, 0.6), WALKER_SPOT, t, 0, 4);
        walker.yaw = Math.PI / 2;
      }
    },
    // 把螢幕往上推，露出鍵盤，點進 Android Market 按下下載
    slide: {
      duration: 9,
      update(t, T) {
        user.reset(); user.pos.copy(USER_SPOT); user.yaw = -0.3;
        setPhone('hand', 'chest', span(t, 0, 1.0));
        if (t >= 1.0) setPhone('chest', 'chest', 0);
        setSlide(span(t, 1.6, 2.6) * (1 - span(t, 8.4, 9)));
        const tapK = span(t, 3.4, 3.8) * (1 - span(t, 4.2, 4.6));
        user.look = dreamOuter.getWorldPosition(V()); user.lookAmt = 0.6;
        user.headTilt = Math.sin(T * 1.2) * 0.02 + tapK * 0.05;
        idle(user, T);
        walker.reset(); walker.pos.copy(V(40, 0, 0.6));   // 路人已經走遠
      }
    },
    // 下載完成，圖示出現，點開它
    done: {
      duration: 8,
      update(t, T) {
        user.reset(); user.pos.copy(USER_SPOT); user.yaw = -0.3;
        setPhone('chest', 'chest', 0);
        setSlide(0);
        user.look = dreamOuter.getWorldPosition(V()); user.lookAmt = 0.5;
        idle(user, T, 1);
        walker.reset(); walker.pos.copy(V(40, 0, 0.6));
      }
    }
  };

  // 背景的散步的人：兩人沿著步道慢慢走，走到另一端再回來
  function ambient(T) {
    [[pedA, 0, -1.2, 0.8], [pedB, 0.5, -0.6, -0.7]].forEach(([p, off, z, v]) => {
      const L = 36;
      const d = (off * L + T * Math.abs(v)) % L;
      const x = v > 0 ? d - L / 2 : L / 2 - d;
      p.reset();
      p.pos.set(x, 0, z);
      p.yaw = v > 0 ? Math.PI / 2 : -Math.PI / 2;
      p.walkAmt = 1;
      p.walkPhase = d * 4.4;
    });
  }
  function finish() {
    people.forEach((p) => p.apply());
    placePhone();
  }

  /* ---------- 螢幕特寫 ---------- */
  // Android Market：列表與下載進度條
  function marketInset(c, W, H, t) {
    const k = W / 320; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#f5f7fa'; c.fillRect(0, 0, 320, h);
    c.fillStyle = '#2f7d4f'; c.fillRect(0, 0, 320, 36);
    c.fillStyle = '#fff'; c.font = `700 15px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('Android Market', 12, 18);
    const apps = ['天氣小工具', '便條紙', '地圖導覽'];
    apps.forEach((name, i) => {
      const y = 56 + i * 58;
      c.fillStyle = ['#4f86c6', '#e0a040', '#c05a5a'][i]; rr(c, 12, y, 40, 40, 8); c.fill();
      c.fillStyle = '#1f2937'; c.font = `600 14px ${FONT}`; c.fillText(name, 62, y + 14);
      c.fillStyle = '#6b7280'; c.font = `500 11px ${FONT}`; c.fillText('免費', 62, y + 30);
    });
    // 第一個程式的下載進度
    const p = span(t, 4.4, 8.0);
    c.fillStyle = '#e5e7eb'; rr(c, 250, 64, 58, 24, 12); c.fill();
    c.fillStyle = '#2f7d4f'; rr(c, 250, 64, 58 * Math.max(0.02, p), 24, 12); c.fill();
    c.fillStyle = '#374151'; c.font = `600 11px ${FONT}`; c.textAlign = 'center';
    c.fillText(p >= 1 ? '已安裝' : p > 0 ? '下載中' : '下載', 279, 76);
    c.textAlign = 'left';
    c.fillStyle = '#9ca3af'; c.font = `500 11px ${FONT}`;
    c.fillText('下載進度', 12, h - 14);
  }
  // 桌面：新的程式圖示出現，點開後顯示內容
  function homeInset(c, W, H, t) {
    const k = W / 320; c.scale(k, k);
    const h = H / k;
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b3f63'); g.addColorStop(1, '#1a2438');
    c.fillStyle = g; c.fillRect(0, 0, 320, h);
    const icons = [['撥號', '#3b7a4f'], ['簡訊', '#4f86c6'], ['瀏覽器', '#c05a5a'], ['設定', '#6b7280']];
    icons.forEach(([name, col], i) => {
      const x = 32 + (i % 4) * 72, y = 50;
      c.fillStyle = col; rr(c, x, y, 52, 52, 12); c.fill();
      c.fillStyle = '#e5e7eb'; c.font = `600 11px ${FONT}`; c.textAlign = 'center'; c.fillText(name, x + 26, y + 66);
    });
    const a = span(t, 2.4, 3.4);
    if (a > 0) {
      c.globalAlpha = a;
      c.fillStyle = '#e0a040'; rr(c, 32 + 72 * 2 + 0, 150, 52, 52, 12); c.fill();
      c.fillStyle = '#e5e7eb'; c.font = `600 11px ${FONT}`; c.textAlign = 'center'; c.fillText('便條紙', 32 + 144 + 26, 216);
      c.globalAlpha = 1;
    }
    const open = span(t, 4.6, 5.4);
    if (open > 0) {
      c.globalAlpha = open;
      c.fillStyle = '#fffbe9'; rr(c, 16, 40, 288, h - 80, 14); c.fill();
      c.fillStyle = '#7c5a16'; c.font = `700 14px ${FONT}`; c.textAlign = 'left';
      c.fillText('便條紙', 30, 64);
      c.fillStyle = '#374151'; c.font = `500 13px ${FONT}`;
      c.fillText('記得買牛奶', 30, 100);
      c.fillText('晚上八點打給媽媽', 30, 126);
      c.globalAlpha = 1;
    }
  }

  return {
    view: { pos: V(0, 1.55, 3.2), yaw: 0, pitch: -0.05 },
    beats,
    ambient,
    finish,
    insets: {
      slide: { aspect: 0.66, tone: 'phone', label: 'Android Market', draw: (c, W, H, t) => marketInset(c, W, H, t) },
      done: { aspect: 0.66, tone: 'phone', label: 'HTC Dream 桌面', draw: (c, W, H, t) => homeInset(c, W, H, t) }
    },
    focus: {
      walk: () => V(-1.5, 1.3, 0),
      user: () => head(user),
      slider: () => dreamOuter.getWorldPosition(V()),
      app: () => dreamOuter.getWorldPosition(V())
    },
    hotspots: {
      slider: { pos: () => dreamOuter.localToWorld(V(0, 0.08, 0.04)), size: 0.4 },
      trackball: { pos: () => dreamOuter.localToWorld(V(0, -0.1, 0.05)), size: 0.3 },
      app: { pos: () => dreamOuter.localToWorld(V(0, 0.12, 0.05)), size: 0.3 },
      park: { pos: () => V(-3.0, 3.4, -1.6), size: 0.6 }
    }
  };
}
