// 沉浸場景：1973 年 4 月的紐約街頭，Motorola 工程師馬丁·庫珀拿著 DynaTAC 原型機打出第一通手持行動電話。
// 字幕和解說文字在 js/data.js 的 scenes['dynatac-proto']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, sign, Person, placeBetween, building } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { asphaltTex, pavingTex, blobShadow, decal, cloudSky, leafTree, GREEN, manhole, makeSedan, richBuilding, lampPost, hydrantAndGrate, phoneBooth, postBox } from './props.js';

export function build({ scene, phone }) {
  /* ---------- 天空、光線、地面 ---------- */
  const skyGeo = new THREE.SphereGeometry(220, 32, 16);
  const top = new THREE.Color('#7d93a6'), hor = new THREE.Color('#e7cfae');
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
  scene.fog = new THREE.Fog('#dcc6a6', 40, 130);

  scene.add(new THREE.HemisphereLight('#e4e9ef', '#6b5a48', 1.2));
  const sun = new THREE.DirectionalLight('#ffd6a0', 2.3);
  sun.position.set(-22, 28, 14);
  sun.target.position.set(0, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  const fill = new THREE.DirectionalLight('#b4c4da', 0.3); fill.position.set(14, 10, 18); scene.add(fill);
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
  // 路緣石、斑馬線、下水道蓋
  const curbM = new THREE.MeshStandardMaterial({ color: '#a2a09a', roughness: 0.8 });
  [-4.6, -12.4].forEach((z) => { const c = box(140, 0.16, 0.2, curbM); c.position.set(0, -0.07, z); c.castShadow = false; scene.add(c); });
  for (let i = 0; i < 8; i++) { const zb = decal(0.5, 3.4, '#e8e4d8'); zb.position.set(-9 + i * 0.95, -0.138, -6.3); scene.add(zb); const zb2 = decal(0.5, 3.4, '#e8e4d8'); zb2.position.set(-9 + i * 0.95, -0.138, -10.7); scene.add(zb2); }
  [[-14, -6.4], [8, -10.6], [20, -6.5]].forEach(([x, z]) => manhole(scene, x, -0.15, z));

  /* ---------- 建築：1970 年代曼哈頓的磚造與石造樓房 ---------- */
  const palette = ['#7d4a3a', '#a9978a', '#6e5f52', '#94553f', '#5f5b55', '#b8a88f', '#86503d'];
  const shops = ['DELI', 'SHOES', 'BANK', 'HOTEL', 'BOOKS', 'TAILOR', 'CAFE', 'DINER'];
  let n = 0;
  const row = (z, facing) => {
    let x = -60;
    while (x < 60) {
      const w = 7 + ((n * 37) % 5);
      const fl = 3 + ((n * 53) % 4);
      richBuilding(scene, building, {
        x: x + w / 2, z: z + facing * -5, w, d: 10, facing, floors: fl,
        color: palette[n % palette.length], seed: n,
        shop: shops[n % shops.length], shopColor: ['#1d2a3a', '#5a1f1b', '#1f3b2c', '#3b2a4a'][n % 4], awn: n % 2 === 0, interior: n % 3, hours: 'OPEN  MON–SAT  9–6'
      });
      x += w + 0.2;
      n++;
    }
  };
  row(-17, 1);
  row(6, -1);

  /* ---------- 街道小物 ---------- */
  [-14, 0.5, 15].forEach((x) => { const g = lampPost(scene, x - 6, -4.1, 1); g.rotation.y = Math.PI / 2; });
  [-20, 2, 22].forEach((x) => { const g = lampPost(scene, x, -12.9, 1); g.rotation.y = -Math.PI / 2; });
  hydrantAndGrate(scene, 2.9, -3.95);
  // 街角的電話亭與郵筒（1973 年的紐約街頭）
  phoneBooth(scene, -9.6, -3.4, 0);
  postBox(scene, 9.4, -3.6);
  // 路牌（6th AVE）與公車站亭（玻璃與木框、頂上的招牌）
  const signPole = cyl(0.04, 0.04, 2.6, '#3a3a3e', 8); signPole.position.set(-4.6, 1.3, -4.6); scene.add(signPole);
  const streetSign = sign('6th AVE', 1.1, 0.3, { bg: '#1f5d3a', color: '#f4f0e6', size: 74, w: 512, h: 140, weight: 800 });
  streetSign.position.set(-4.6, 2.5, -4.55); scene.add(streetSign);
  {
    const shelter = new THREE.Group();
    const roof = box(2.4, 0.08, 1.0, '#2b2f36'); roof.position.set(0, 2.2, 0); shelter.add(roof);
    [[-1.1, -0.4], [1.1, -0.4], [-1.1, 0.4], [1.1, 0.4]].forEach(([x, z]) => {
      const post = cyl(0.03, 0.03, 2.1, '#2b2f36', 6); post.position.set(x, 1.05, z); shelter.add(post);
    });
    const glass = box(2.2, 1.3, 0.02, '#9fb8c4', { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.35 });
    glass.position.set(0, 1.2, -0.4); shelter.add(glass);
    const bench2 = box(1.6, 0.06, 0.4, '#7a5a3a'); bench2.position.set(0, 0.5, -0.25); shelter.add(bench2);
    const adv = sign('ROUTE 7', 1.2, 0.3, { bg: '#c9a03a', color: '#2a2a2a', size: 70, w: 512, h: 128, weight: 800 });
    adv.position.set(0, 2.05, 0.52); shelter.add(adv);
    shelter.position.set(-12.2, 0, -3.2); scene.add(shelter);
  }
  // 路邊的第二輛停車
  const parked2 = makeSedan('#3a3f4a'); parked2.position.set(-6.4, -0.15, -5.35); scene.add(parked2);
  const bin = cyl(0.28, 0.25, 0.9, '#3f4a3f', 12);
  bin.position.set(-6.2, 0.45, -3.9);
  scene.add(bin);
  const tree = (x, z) => leafTree(scene, x, z, (Math.abs(x * 3 + z) | 0) + 1, 1, GREEN);
  tree(-11, -3.7); tree(11.5, -3.7); tree(-16, -13.5); tree(9, -13.5);

  // 路邊停著一輛普通轎車，車旁有一個停車計時器
  const parked = makeSedan('#5b5a4a');
  parked.position.set(6.8, -0.15, -5.35);
  scene.add(parked);
  const traffic = [
    { c: makeSedan('#c9b98f'), z: -7.5, v: 8, off: 0 },
    { c: makeSedan('#2f4a6b'), z: -10.4, v: -9, off: 40 },
    { c: makeSedan('#9a8a6a'), z: -7.5, v: 7.5, off: 65 }
  ];
  traffic.forEach((t) => { t.c.position.set(0, -0.15, t.z); if (t.v < 0) t.c.rotation.y = Math.PI; scene.add(t.c); });

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  // 馬丁·庫珀：深色西裝、白襯衫、打領帶
  const cooper = add(new Person({ top: '#3a3f4a', bottom: '#2d3038', hair: '#4a3a2a', skin: '#e2b48e', height: 1.0 }));
  {
    const shirt = box(0.14, 0.32, 0.01, '#f2f0ea');
    shirt.position.set(0, 0.42, 0.122);
    const tie = box(0.05, 0.28, 0.012, '#7a2a24');
    tie.position.set(0, 0.42, 0.13);
    cooper.torso.add(shirt, tie);
  }
  // 停下來看的路人
  const lady = add(new Person({ top: '#8c5a6a', bottom: '#8c5a6a', dress: true, hair: '#6b3b1f', skin: '#edc6a2', height: 0.95 }));
  const man = add(new Person({ top: '#5a6b4f', bottom: '#4a4035', hair: '#9a9a9a', skin: '#e0b494', height: 1.0 }));
  {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.07, 14), new THREE.MeshStandardMaterial({ color: '#43483f', roughness: 1 }));
    cap.position.set(0, 0.24, 0);
    man.head.add(cap);
  }
  const walkers = [
    { p: add(new Person({ top: '#8c3b3b', bottom: '#2a2a2e', hair: '#222' })), z: -14.2, v: 1.3, off: 0 },
    { p: add(new Person({ top: '#d6cbb5', bottom: '#4a3f35', hair: '#5a3a22', dress: true, height: 0.95 })), z: -15.4, v: -1.2, off: 20 },
    { p: add(new Person({ top: '#3c5c7c', bottom: '#2a2a2e', hair: '#111' })), z: -13.8, v: -1.4, off: 45 }
  ];
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.5); b.position.y = 0.012; p.root.add(b); });

  // 原型機：原點設在機身中心，依 phone 資料建模，尺寸比 1984 年的 8000X 略大
  const dyna = new THREE.Group();
  {
    const m = buildPhone(phone);
    const b = new THREE.Box3().setFromObject(m);
    const c = b.getCenter(V());
    m.position.sub(c);
    const inner = new THREE.Group();
    inner.add(m);
    inner.scale.setScalar(0.19);
    inner.position.y = -0.1;
    inner.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    dyna.add(inner);
  }
  scene.add(dyna);
  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.1, 0.06);
  cooper.arms.R.grip.add(handHold);
  const chest = new THREE.Object3D();
  chest.rotation.set(0.6, Math.PI, 0);
  chest.position.set(-0.08, 1.3, 0.36);   // 胸前的位置（相對於身體）
  cooper.root.add(chest);

  /* ---------- 手機的位置（同 1984 年的做法） ---------- */
  const anchors = { ear: cooper.ear.R, chest, hand: handHold };
  const earGrip = () => cooper.ear.R.localToWorld(V(0, -0.11, -0.06));
  const gripOf = {
    ear: earGrip,
    chest: () => chest.localToWorld(V(0, -0.14, -0.04)),
    hand: () => cooper.local(-0.3, 0.84, 0.08)
  };
  const poleOf = {
    ear: () => cooper.local(-0.75, 0.75, 0.3),
    chest: () => cooper.local(-0.6, 0.85, 0.1),
    hand: () => cooper.local(-0.5, 0.6, -0.1)
  };
  let phonePose = { from: 'hand', to: 'hand', k: 0 };
  function setPhone(from, to, k) {
    phonePose = { from, to, k };
    if (from === 'hand' && to === 'hand') { cooper.reach.R = null; return; }
    cooper.reach.R = {
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

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const talkIdle = (p, T, phase = 0) => { p.headTilt = Math.sin(T * 1.9 + phase) * 0.05; p.bob = Math.sin(T * 1.1 + phase) * 0.006; };

  const COOPER_SPOT = V(-1.8, 0, -1.2);
  const LADY_SPOT = V(1.2, 0, -0.5), MAN_SPOT = V(2.5, 0, -1.4);

  /* ---------- 劇本 ---------- */
  const beats = {
    // 庫珀沿著人行道走來，手上拿著原型機
    walk: {
      duration: 8,
      update(t, T) {
        cooper.reset();
        cooper.walk(V(-14, 0, -1.2), COOPER_SPOT, t, 0, 6);
        if (t > 6) cooper.yaw = lerp(Math.PI / 2, 0.35, span(t, 6, 7));
        setPhone('hand', 'hand', 0);
        talkIdle(cooper, T);
        lady.reset(); lady.walk(V(14, 0, -0.5), LADY_SPOT, t, 1, 7);
        man.reset(); man.walk(V(15, 0, -1.3), MAN_SPOT, t, 2, 7.5);
        if (t > 7) { lady.yaw = faceTo(lady, COOPER_SPOT); man.yaw = faceTo(man, COOPER_SPOT); }
      }
    },
    // 站定，把原型機舉到胸前按號碼，再貼到耳邊
    dial: {
      duration: 9,
      update(t, T) {
        cooper.reset(); cooper.pos.copy(COOPER_SPOT); cooper.yaw = 0.35;
        if (t < 1.2) setPhone('hand', 'chest', span(t, 0, 1.2));
        else if (t < 3.4) setPhone('chest', 'chest', 0);
        else setPhone('chest', 'ear', span(t, 3.4, 5.0));
        // 按號碼時手指微微點動
        if (t < 3.4) cooper.headTilt = Math.sin(T * 9) * 0.02;
        else talkIdle(cooper, T);
        lady.reset(); lady.pos.copy(LADY_SPOT); lady.yaw = faceTo(lady, COOPER_SPOT);
        man.reset(); man.pos.copy(MAN_SPOT); man.yaw = faceTo(man, COOPER_SPOT);
        lady.look = head(cooper); lady.lookAmt = 0.6;
        man.look = head(cooper); man.lookAmt = 0.6;
      }
    },
    // 通話中：在路邊講電話，路人停下來看
    talk: {
      duration: 10,
      update(t, T) {
        cooper.reset(); cooper.pos.copy(COOPER_SPOT); cooper.yaw = 0.35 + Math.sin(T * 0.4) * 0.1;
        setPhone('ear', 'ear', 0);
        talkIdle(cooper, T);
        lady.reset(); lady.pos.copy(LADY_SPOT); lady.yaw = faceTo(lady, COOPER_SPOT);
        man.reset(); man.pos.copy(MAN_SPOT); man.yaw = faceTo(man, COOPER_SPOT);
        const w = span(t, 5.2, 6.4) * (1 - span(t, 8.8, 9.6));
        lady.look = head(cooper); lady.lookAmt = 0.8;
        man.look = head(lady); man.lookAmt = 0.6 + 0.3 * w;
        man.lean = 0.1 * w;
        man.headTilt = Math.sin(T * 2.2) * 0.03;
      }
    },
    // 通話結束：放下手機，看看它的重量
    hang: {
      duration: 8,
      update(t, T) {
        cooper.reset(); cooper.pos.copy(COOPER_SPOT); cooper.yaw = 0.35;
        const down = span(t, 0.4, 2.2);
        if (t < 2.2) setPhone('ear', 'chest', down);
        else setPhone('chest', 'hand', span(t, 3.6, 5.0));
        if (t >= 3.6 && t < 5.2) cooper.look = dyna.getWorldPosition(V());
        cooper.lookAmt = span(t, 2.6, 3.4) * (1 - span(t, 5.4, 6.2));
        talkIdle(cooper, T, 3);
        lady.reset(); lady.pos.copy(LADY_SPOT); lady.yaw = faceTo(lady, COOPER_SPOT);
        man.reset(); man.pos.copy(MAN_SPOT); man.yaw = faceTo(man, COOPER_SPOT);
        lady.look = head(cooper); lady.lookAmt = 0.4;
        man.look = head(cooper); man.lookAmt = 0.4;
      }
    }
  };

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
  }
  function finish() {
    people.forEach((p) => p.apply());
    placePhone();
  }

  return {
    view: { pos: V(0, 1.62, 2.2), yaw: 0, pitch: -0.04 },
    beats,
    ambient,
    finish,
    focus: {
      street: () => V(0, 2.2, -14),
      phone: () => dyna.localToWorld(V(0, 0, 0)),
      cooper: () => head(cooper),
      crowd: () => head(lady).lerp(head(man), 0.5)
    },
    hotspots: {
      proto: { pos: () => dyna.localToWorld(V(0, 0.06, 0)), size: 0.42 },
      antenna: { pos: () => dyna.localToWorld(V(0, 0.5, 0)), size: 0.4 },
      crowd: { pos: () => head(lady).lerp(head(man), 0.5).add(V(0, 0.5, 0)), size: 0.55 },
      cooper: { pos: () => head(cooper).add(V(0, 0.45, 0)), size: 0.5 }
    }
  };
}
