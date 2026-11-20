// 沉浸場景：1989 年的城市街角，一位女士用 Motorola MicroTAC 接電話，翻開又闔上翻蓋。
// 字幕和解說文字在 js/data.js 的 scenes['microtac']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, building, Person, placeBetween } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { cloudSky, leafTree, GREEN, blobShadow, pavingTex, lampPost, bench, glowSprite, richBuilding, bin, hydrantAndGrate, postBox, bicycle, makeSedan } from './props.js';

const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';

export function build({ scene, phone }) {
  /* ---------- 白天的天空與光線 ---------- */
  const skyGeo = new THREE.SphereGeometry(220, 32, 16);
  const top = new THREE.Color('#6f9cc6'), hor = new THREE.Color('#e9e2cf');
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
  scene.fog = new THREE.Fog('#d9d4c4', 30, 120);

  scene.add(new THREE.HemisphereLight('#f4f2ea', '#6a6250', 1.4));
  const sun = new THREE.DirectionalLight('#fff1d6', 2.2);
  sun.position.set(-16, 22, 10);
  sun.target.position.set(0, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 80 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  /* ---------- 街角：人行道、馬路、樹、路燈、長椅 ---------- */
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#6f7f50', roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; grass.receiveShadow = true;
  scene.add(grass);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, 4), new THREE.MeshStandardMaterial({ map: pavingTex([15, 1]), roughness: 0.95 }));
  walk.position.set(0, 0.02, -0.4); walk.receiveShadow = true;
  scene.add(walk);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 6), new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 1 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.0, -6.5); road.receiveShadow = true;
  scene.add(road);
  // 馬路上停著一輛八〇年代的方正轎車
  const carBody = box(3.6, 0.9, 1.6, '#8c3b2e', { roughness: 0.4, metalness: 0.2 }); carBody.position.set(5.5, 0.55, -6.2); scene.add(carBody);
  const carCabin = box(2.2, 0.7, 1.4, '#8c3b2e', { roughness: 0.4, metalness: 0.2 }); carCabin.position.set(5.3, 1.3, -6.2); scene.add(carCabin);
  leafTree(scene, -7, -2.2, 4, 1.2, GREEN);
  leafTree(scene, 8, -2.6, 9, 1.1, GREEN);
  leafTree(scene, -12, -4, 13, 1.0, GREEN);
  [[-2.8, -1.8, 1], [3.8, -1.9, -1]].forEach(([x, z, d]) => {
    lampPost(scene, x, z, d);
    glowSprite(scene, '#ffe9b8', 0.6, x, 3.0, z, 0.25);
  });
  bench(scene, -0.6, -1.9, 0);

  // 馬路另一側的一整排樓房（磚造與石造，一樓是店面）
  {
    const palette = ['#7d4a3a', '#a9978a', '#6e5f52', '#94553f', '#5f5b55', '#b8a88f'];
    const shops = ['BANK', 'DELI', 'BOOKS', 'SHOES', 'CAFE', 'TAILOR', 'DINER'];
    let n = 0;
    for (let x = -34; x < 34;) {
      const w = 7 + ((n * 37) % 5);
      richBuilding(scene, building, {
        x: x + w / 2, z: -9 - 5, w, d: 10, facing: 1, floors: 3 + ((n * 53) % 3),
        color: palette[n % palette.length], seed: n + 3,
        shop: shops[n % shops.length], shopColor: ['#1d2a3a', '#5a1f1b', '#1f3b2c', '#3b2a4a'][n % 4],
        awn: n % 2 === 0, interior: n % 3, hours: 'OPEN  9–6'
      });
      x += w + 0.2; n++;
    }
  }
  // 馬路上來往的車（在 ambient 裡慢慢開過）
  const traffic = [
    { c: makeSedan('#c9b98f'), v: 7, off: 0 },
    { c: makeSedan('#2f4a6b'), v: -6, off: 30 },
    { c: makeSedan('#9a4a3a'), v: 5, off: 60 }
  ];
  traffic.forEach((t) => { t.c.position.set(0, -0.15, -6.9); if (t.v < 0) t.c.rotation.y = Math.PI; scene.add(t.c); });
  // 人行道上的小物：垃圾桶、消防栓、郵筒、靠著路燈的腳踏車
  bin(scene, -6.4, -3.9); bin(scene, 9.2, -3.9);
  hydrantAndGrate(scene, 2.9, -3.95);
  postBox(scene, -10.5, -3.9);
  bicycle(scene, 6.4, -3.7, 0.2);
  [-14, 4, 17].forEach((x) => leafTree(scene, x, -3.6, (Math.abs(x) | 0) + 2, 1.0, GREEN));

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const lady = add(new Person({ top: '#7a4b5a', bottom: '#2e2e36', hair: '#5a3a22', skin: '#e8c1a0', height: 0.96 }));
  {
    const scarf = box(0.22, 0.08, 0.2, '#e0c48a'); scarf.position.set(0, 0.6, 0.06); lady.torso.add(scarf);
    const bag = box(0.3, 0.26, 0.1, '#3a2a1c'); bag.position.set(0.28, -0.2, 0.02); lady.torso.add(bag);
  }
  const walker = add(new Person({ top: '#3c5c7c', bottom: '#2a2a2e', hair: '#111', skin: '#c99a72', height: 1.0 }));
  // 背景的路人：一直在人行道上來回走
  const pedA = add(new Person({ top: '#8a6a3a', bottom: '#3a3a44', hair: '#3a2a1c', skin: '#e0b494', height: 1.0 }));
  const pedB = add(new Person({ top: '#5a6b4f', bottom: '#2e2e36', dress: true, hair: '#7a5a3a', skin: '#edc6a2', height: 0.94 }));
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const LADY_SPOT = V(0.8, 0, 0.1);

  /* ---------- 手機（MicroTAC，翻蓋） ---------- */
  const micro = buildPhone(phone);
  const rig = micro.userData.rig;
  const microOuter = new THREE.Group();
  {
    const b = new THREE.Box3().setFromObject(micro);
    const s = new THREE.Vector3(); b.getSize(s);
    const c = b.getCenter(V());
    micro.position.sub(c);
    const sc = new THREE.Group();
    sc.add(micro);
    sc.scale.setScalar(0.17 / Math.max(s.x, s.y, s.z));
    sc.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    microOuter.add(sc);
  }
  scene.add(microOuter);
  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.1, 0.06);
  lady.arms.R.grip.add(handHold);
  const ear = lady.ear.R;
  const chest = new THREE.Object3D();
  chest.rotation.set(0.55, Math.PI, 0);
  chest.position.set(-0.08, 1.3, 0.36);
  lady.root.add(chest);
  const anchors = { ear, chest, hand: handHold };
  const gripOf = {
    ear: () => ear.localToWorld(V(0, -0.11, -0.06)),
    chest: () => chest.localToWorld(V(0, -0.14, -0.04)),
    hand: () => lady.local(-0.3, 0.84, 0.08)
  };
  const poleOf = {
    ear: () => lady.local(-0.75, 0.75, 0.3),
    chest: () => lady.local(-0.6, 0.85, 0.1),
    hand: () => lady.local(-0.5, 0.6, -0.1)
  };
  let pose = { from: 'hand', to: 'hand', k: 0 };
  function setPhone(from, to, k) {
    pose = { from, to, k };
    if (from === 'hand' && to === 'hand') { lady.reach.R = null; return; }
    lady.reach.R = {
      target: () => gripOf[from]().lerp(gripOf[to](), k),
      pole: () => poleOf[from]().lerp(poleOf[to](), k)
    };
  }
  function placePhone() {
    const { from, to, k } = pose;
    if (from === 'hand') placeBetween(microOuter, handHold, anchors[to], span(k, 0.6, 1));
    else if (to === 'hand') placeBetween(microOuter, anchors[from], handHold, span(k, 0, 0.4));
    else placeBetween(microOuter, anchors[from], anchors[to], k);
  }
  // 翻蓋：0＝闔上，1＝打開
  function setOpen(v) {
    rig.s.open = rig.t.open = v;
    rig.update(0, 0);
  }

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };

  /* ---------- 劇本 ---------- */
  const beats = {
    // 女士沿著人行道走來，手裡握著收起來的手機
    walk: {
      duration: 8,
      update(t, T) {
        lady.reset();
        lady.walk(V(-7, 0, 0.1), LADY_SPOT, t, 0, 5);
        if (t > 5) lady.yaw = lerp(Math.PI / 2, 0.2, span(t, 5, 6));
        setPhone('hand', 'hand', 0);
        setOpen(0);
        idle(lady, T);
        walker.reset(); walker.walk(V(-12, 0, -1.2), V(12, 0, -1.2), t, 0, 8);
        walker.yaw = Math.PI / 2;
      }
    },
    // 來電了：把手機舉到胸前、翻開，再貼到耳邊
    flip: {
      duration: 9,
      update(t, T) {
        lady.reset(); lady.pos.copy(LADY_SPOT); lady.yaw = 0.2;
        setPhone('hand', 'chest', span(t, 0.4, 1.4));
        if (t >= 1.4 && t < 3.6) setPhone('chest', 'chest', 0);
        if (t >= 3.6) setPhone('chest', 'ear', span(t, 3.6, 5.0));
        setOpen(span(t, 1.8, 2.8));
        lady.look = microOuter.getWorldPosition(V()); lady.lookAmt = span(t, 1.0, 2.0) * 0.7;
        idle(lady, T);
        walker.reset(); walker.pos.copy(V(40, 0, -1.2));
      }
    },
    // 通話結束：把手機闔上
    hang: {
      duration: 7,
      update(t, T) {
        lady.reset(); lady.pos.copy(LADY_SPOT); lady.yaw = 0.2;
        const down = span(t, 0.2, 1.8);
        if (t < 1.8) setPhone('ear', 'chest', down);
        else setPhone('chest', 'chest', 0);
        setOpen(1 - span(t, 2.6, 3.4));
        lady.look = microOuter.getWorldPosition(V()); lady.lookAmt = 0.5 * (1 - span(t, 2.6, 3.4));
        idle(lady, T, 2);
        walker.reset(); walker.pos.copy(V(40, 0, -1.2));
      }
    }
  };

  // 背景的路人：兩位各自沿著人行道走，走到另一端再回來
  function ambient(T) {
    traffic.forEach((t) => {
      const L = 70;
      const d = (t.off + T * Math.abs(t.v)) % L;
      t.c.position.x = t.v > 0 ? d - L / 2 : L / 2 - d;
    });
    [[pedA, 0, -1.4, 1.1], [pedB, 0.37, -0.8, -0.9]].forEach(([p, off, z, v]) => {
      const L = 40;
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

  /* ---------- 螢幕特寫：單色 LCD ---------- */
  function callInset(c, W, H, t) {
    const k = W / 240; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#b7c7a2'; c.fillRect(0, 0, 240, h);
    const ink = '#1f2a18';
    c.fillStyle = ink;
    // 訊號格
    for (let i = 0; i < 5; i++) { c.fillRect(10 + i * 6, 14 - (4 + i * 2), 4, 4 + i * 2); }
    c.font = `800 14px monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('IN USE', 120, 18);
    const s = Math.floor(Math.max(0, t - 1.2) * 1);
    const mm = String(Math.floor(s / 60)).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
    c.font = `800 30px monospace`; c.textAlign = 'center';
    c.fillText(`${mm}:${ss}`, 120, h / 2 - 4);
    c.font = `700 12px ${FONT}`;
    c.fillText('通話中', 120, h - 18);
  }
  function standbyInset(c, W, H) {
    const k = W / 240; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#b7c7a2'; c.fillRect(0, 0, 240, h);
    c.fillStyle = '#1f2a18'; c.font = `800 16px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('READY', 120, h / 2);
  }

  return {
    view: { pos: V(0, 1.55, 3.2), yaw: 0, pitch: -0.04 },
    beats,
    ambient,
    finish,
    insets: {
      flip: { aspect: 1.5, tone: 'lcd', label: 'MicroTAC 螢幕', draw: (c, W, H, t) => callInset(c, W, H, t) },
      hang: { aspect: 1.5, tone: 'lcd', label: 'MicroTAC 螢幕', draw: (c, W, H) => standbyInset(c, W, H) }
    },
    focus: {
      walk: () => V(-1.5, 1.3, 0),
      lady: () => head(lady),
      micro: () => microOuter.getWorldPosition(V()),
      street: () => V(0, 1.4, -6)
    },
    hotspots: {
      micro: { pos: () => microOuter.localToWorld(V(0, 0.06, 0)), size: 0.38 },
      hinge: { pos: () => microOuter.localToWorld(V(0, 0.02, 0.05)), size: 0.3 },
      antenna: { pos: () => microOuter.localToWorld(V(0, 0.26, 0)), size: 0.3 },
      street: { pos: () => V(5.5, 2.3, -6.2), size: 0.6 }
    }
  };
}
