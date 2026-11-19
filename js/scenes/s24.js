// 沉浸場景：2024 年夜晚的異國小巷，旅人用 Galaxy S24 的 AI 圈選翻譯招牌、即時口譯跟老闆點餐。
// 字幕和解說文字在 js/data.js 的 scenes['galaxy-s24']；這裡只負責場景和動作。
import { s24Insets } from './insets.js';
import * as THREE from 'three';
import { V, span, lerp, mat, box, cyl, Person, building, textTexture } from '../scene-kit.js';
import { loadPhone, makeHolder, finger } from './kit2.js';
import { asphaltTex, pavingTex, blobShadow, decal, manhole, bicycle, bin, lampPost, richBuilding, glowSprite, lightPool, vendingMachine, utilityPole, wire, steamPuffs, hydrantAndGrate } from './props.js';

export function build({ scene, phone }) {
  /* ---------- 夜晚的光線 ---------- */
  scene.background = new THREE.Color('#0e1428');
  scene.fog = new THREE.Fog('#141b34', 14, 60);
  scene.add(new THREE.HemisphereLight('#8aa0d8', '#3a2e34', 1.55));
  const moon = new THREE.DirectionalLight('#a9bcff', 1.0);
  moon.position.set(-8, 12, 6); moon.target.position.set(0, 0, 0); moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048); moon.shadow.radius = 3;
  Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  scene.add(moon, moon.target);
  const warm1 = new THREE.PointLight('#ffb35c', 22, 11, 1.6); warm1.position.set(3.0, 2.6, -2.6); scene.add(warm1);
  const warm2 = new THREE.PointLight('#ff8f6a', 12, 9, 1.6); warm2.position.set(-3.2, 2.4, -3.0); scene.add(warm2);

  /* ---------- 路面與兩側的店家 ---------- */
  const wetRoad = new THREE.MeshStandardMaterial({ map: asphaltTex([15, 4.5]), color: '#9a9aa4', roughness: 0.32, metalness: 0.15 });  // 剛下過雨的路面，會反光
  const asph = new THREE.Mesh(new THREE.BoxGeometry(60, 0.2, 14), [mat('#26262c'), mat('#26262c'), wetRoad, mat('#26262c'), mat('#26262c'), mat('#26262c')]);
  asph.position.set(0, -0.1, -2); asph.receiveShadow = true; scene.add(asph);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(60, 0.22, 3.2), [mat('#3a3a42'), mat('#3a3a42'), new THREE.MeshStandardMaterial({ map: pavingTex([30, 1.6]), color: '#7a7a88', roughness: 0.6 }), mat('#3a3a42'), mat('#3a3a42'), mat('#3a3a42')]);
  walk.position.set(0, -0.05, -5.4); walk.receiveShadow = true; scene.add(walk);
  const curbM = mat('#7a7a82', { roughness: 0.7 }); const curb = box(60, 0.14, 0.18, curbM); curb.position.set(0, 0.0, -3.72); curb.castShadow = false; scene.add(curb);
  for (let i = 0; i < 6; i++) { const zb = decal(0.5, 4.0, '#c9c8c0', 0.85); zb.position.set(-8 + i * 0.95, 0.003, -1.0); scene.add(zb); }
  [[-9, 0.5], [5, -1.5], [12, 1.5]].forEach(([x, z]) => manhole(scene, x, 0.0, z));
  const palette = ['#4a3a3a', '#3a4254', '#54483a', '#3a4a48', '#4a3a4a'];
  const shops = ['薬局', '居酒屋', '喫茶', 'ホテル', '書店', '寿司', 'カラオケ'];
  let n = 0;
  for (let x = -26; x < 26; x += 8.2) {
    richBuilding(scene, building, { x: x + 4, z: -11, w: 8, d: 8, floors: 3 + (n * 5) % 4, color: palette[n % palette.length], seed: n, shop: shops[n % shops.length], shopColor: ['#7a2a2a', '#2a4a7a', '#2a6a4a', '#6a4a2a'][n % 4], awn: n % 2 === 1, interior: n % 3, night: true, hours: ['営業中 10:00–22:00', '営業中 11:00–23:00', 'OPEN 24h'][n % 3] });
    n++;
  }
  // 路燈
  [-9.5, -2.2, 9.5].forEach((x) => { lampPost(scene, x, -3.9, 1); glowSprite(scene, '#ffe2a8', 2.4, x + 0.95, 5.3, -3.9, 0.7); lightPool(scene, '#ffd89a', 5.0, 4.0, x + 0.95, 0.0, -3.0, 0.3); });
  // 日本街頭的電線桿與電線
  const poleXs = [-12, 12]; poleXs.forEach((x) => utilityPole(scene, x, -3.95, 7.2));
  [-0.8, 0, 0.8].forEach((dx) => wire(scene, V(-12 + dx, 6.8, -3.95), V(12 + dx, 6.8, -3.95), 0.9));
  [-1, 1].forEach((dx) => wire(scene, V(-12 + dx * 0.5, 6.1, -3.95), V(12 + dx * 0.5, 6.1, -3.95), 1.2));
  vendingMachine(scene, -4.4, -6.55, 0, 1); vendingMachine(scene, -5.4, -6.55, 0, 2); vendingMachine(scene, 7.4, -6.55, 0, 3);
  bicycle(scene, -2.2, -4.5, 0.1, '#8a8f98'); bicycle(scene, 5.6, -4.4, -0.05, '#7a3a2a'); bin(scene, 10.4, -4.4); hydrantAndGrate(scene, -7.0, -4.2);
  // 發光的看板
  const glow = (text, w, h, o) => { const t = textTexture(text, { ...o, w: o.w * 2, h: o.h * 2, size: o.size * 2 }); t.anisotropy = 16; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); };
  const neon = [
    ['カラオケ', '#ff4f8a', -6.2, 3.0, -6.4], ['BAR', '#4fd1ff', -3.6, 2.6, -6.4], ['薬', '#5cff9a', -1.2, 3.2, -6.4],
    ['居酒屋', '#ffb347', 6.2, 3.0, -6.4], ['喫茶', '#c8a6ff', 8.8, 2.5, -6.4]
  ];
  neon.forEach(([t, c, x, y, z]) => {
    const g = glow(t, 1.5, 0.6, { bg: '#10131f', color: c, size: 84, w: 512, h: 205, weight: 900 });
    g.position.set(x, y, z); scene.add(g);
    glowSprite(scene, c, 3.4, x, y, z + 0.1, 0.45); lightPool(scene, c, 4.2, 3.2, x, 0.0, z + 4, 0.28);
  });

  // 拉麵攤：木招牌、暖簾、紅燈籠、櫃台
  const STALL = V(3.4, 0, -3.3);
  const counter = box(2.8, 1.0, 0.8, '#5a3b26'); counter.position.set(STALL.x, 0.5, STALL.z);
  const ctop = box(2.9, 0.05, 0.95, '#c9a066'); ctop.position.set(STALL.x, 1.02, STALL.z + 0.05);
  const roof = box(3.2, 0.12, 1.6, '#3a2a20'); roof.position.set(STALL.x, 3.0, STALL.z - 0.1);
  [-1.45, 1.45].forEach((dx) => { const p = box(0.08, 2.0, 0.08, '#3a2a20'); p.position.set(STALL.x + dx, 2.0, STALL.z + 0.5); scene.add(p); });
  const woodSign = box(2.3, 0.55, 0.06, '#c9a066'); woodSign.position.set(STALL.x, 2.55, STALL.z + 0.62);
  const SIGN_POS = V(STALL.x, 2.55, STALL.z + 0.7);
  const signText = glow('ラーメン　営業中', 2.1, 0.45, { bg: '#c9a066', color: '#3a1d12', size: 66, w: 1024, h: 220, weight: 900 });
  signText.position.copy(SIGN_POS);
  scene.add(counter, ctop, roof, woodSign, signText);
  ['ラ', 'ー', 'メ', 'ン'].forEach((ch, i) => {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.9), new THREE.MeshStandardMaterial({ map: textTexture(ch, { bg: '#20305a', color: '#f2f0ea', size: 96, w: 128, h: 256, weight: 900 }), roughness: 0.9 }));
    strip.position.set(STALL.x - 0.65 + i * 0.44, 2.0, STALL.z + 0.6); scene.add(strip);
  });
  [-1.35, 1.35].forEach((dx) => {
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshBasicMaterial({ color: '#ff5a3c' }));
    lan.scale.set(1, 1.25, 1); lan.position.set(STALL.x + dx, 2.5, STALL.z + 0.7); scene.add(lan);
  });
  // 櫃台上的拉麵
  [-0.7, 0.2, 0.9].forEach((dx) => {
    const bowl = cyl(0.16, 0.1, 0.12, '#f2efe8', 14); bowl.position.set(STALL.x + dx, 1.1, STALL.z + 0.1);
    const noodles = cyl(0.14, 0.14, 0.03, '#e9c46a', 14); noodles.position.set(STALL.x + dx, 1.17, STALL.z + 0.1);
    scene.add(bowl, noodles);
  });
  const stool = (x, z) => { const s = cyl(0.17, 0.17, 0.05, '#2c2f35', 12); s.position.set(x, 0.62, z); const l = cyl(0.03, 0.03, 0.6, '#555', 6); l.position.set(x, 0.3, z); scene.add(s, l); };
  stool(STALL.x - 0.7, STALL.z + 1.0); stool(STALL.x + 0.1, STALL.z + 1.0); stool(STALL.x + 0.9, STALL.z + 1.0);

  /* ---------- 人物與手機 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const A = add(new Person({ top: '#d9822b', bottom: '#2f3340', hair: '#1b1410', skin: '#e2b48e', height: 0.98 }));
  const B = add(new Person({ top: '#f2f0ea', bottom: '#2f3340', hair: '#222', skin: '#e0b494', height: 0.99 }));
  {
    const band = box(0.27, 0.05, 0.27, '#f2f0ea'); band.position.set(0, 0.18, 0); B.head.add(band);
  }
  const walkers = [
    { p: add(new Person({ top: '#5a6a8c', bottom: '#2a2a2e', hair: '#222' })), z: -5.0, v: 1.2, off: 0 },
    { p: add(new Person({ top: '#a85a5a', bottom: '#3a3a3a', hair: '#111', dress: true, height: 0.95 })), z: -5.6, v: -1.1, off: 30 }
  ];
  // 背包、帽子、腳下陰影
  { const pack = box(0.28, 0.34, 0.12, '#46567a'); pack.position.set(0, 0.28, -0.19); A.torso.add(pack);
    const strap = box(0.05, 0.4, 0.26, '#1f2430'); strap.position.set(0.12, 0.34, -0.02); A.torso.add(strap); const strap2 = strap.clone(); strap2.position.x = -0.12; A.torso.add(strap2);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.07, 14), mat('#1f2430', { roughness: 1 })); cap.position.set(0, 0.235, 0); walkers[0].p.head.add(cap); }
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.5); b.position.y = 0.012; p.root.add(b); });
  const steam = steamPuffs(scene, STALL.x + 0.15, 1.3, STALL.z + 0.1, 8);
  const s24 = loadPhone(scene, phone, 0.3);
  const hA = makeHolder(A, s24.obj, { ear: V(0, -0.08, 0), grip: V(0, -0.08, -0.02) });

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };
  const lookAt = (p, v, a = 1) => { p.look = v; p.lookAmt = a; };

  /* ---------- 圈選特效與對話泡泡 ---------- */
  const ringDots = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: '#8ec5ff' }));
    d.position.set(SIGN_POS.x + Math.cos(a - Math.PI / 2) * 1.35, SIGN_POS.y + Math.sin(a - Math.PI / 2) * 0.55, SIGN_POS.z + 0.08);
    d.visible = false; scene.add(d); ringDots.push(d);
  }
  function bubbleTex(text, fill, ink, w = 560, h = 150) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = fill; x.beginPath(); x.roundRect(6, 6, w - 12, h - 36, 34); x.fill();
    x.beginPath(); x.moveTo(w / 2 - 22, h - 32); x.lineTo(w / 2, h - 4); x.lineTo(w / 2 + 22, h - 32); x.fill();
    x.fillStyle = ink; x.font = '700 52px "Noto Sans TC","PingFang TC","Hiragino Sans",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, w / 2, (h - 36) / 2 + 6);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function bubble(text, fill, ink, scale = 1) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(text, fill, ink), depthTest: false, transparent: true }));
    s.scale.set(1.5 * scale, 0.4 * scale, 1); s.renderOrder = 20; s.visible = false; scene.add(s); return s;
  }
  const bJp1 = bubble('いらっしゃいませ！', '#ffffff', '#222');
  const bCn1 = bubble('歡迎光臨！', '#2b6cff', '#ffffff');
  const bCn2 = bubble('我要一碗拉麵', '#ffffff', '#222');
  const bJp2 = bubble('ラーメンを一杯ください', '#2b6cff', '#ffffff', 1.2);
  const bBye = bubble('ありがとう！', '#ffffff', '#222');
  const bBye2 = bubble('謝謝！', '#2b6cff', '#ffffff', 0.8);
  const bSign = bubble('拉麵　營業中', '#2b6cff', '#ffffff', 1.6);
  const bubbles = [bJp1, bCn1, bCn2, bJp2, bBye, bBye2, bSign];
  const showB = (b, on, pos) => { b.visible = on; if (on) b.position.copy(pos); };

  const A_START = V(-4.6, 0, 1.6), A_SPOT = V(0.9, 0, 0.9), A_STALL = V(2.4, 0, -1.1), B_SPOT = V(3.3, 0, -2.5);
  function bg(T) {
    B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, V(2.4, 0, 1)); idle(B, T, 2);
  }
  const hide = () => { ringDots.forEach((d) => { d.visible = false; }); bubbles.forEach((b) => { b.visible = false; }); };

  /* ---------- 劇本 ---------- */
  const beats = {
    street: {
      duration: 10,
      update(t, T) {
        hide();
        A.reset(); A.walk(A_START, A_SPOT, t, 0.3, 8.4);
        if (t > 8.4) A.yaw = lerp(A.yaw, faceTo(A, SIGN_POS), span(t, 8.4, 9.4));
        hA.go('pocket', 'pocket', 0);
        lookAt(A, V(3.4, 3.0, -3.3), span(t, 1.5, 3.5) * 0.8);
        bg(T);
      }
    },
    lost: {
      duration: 9,
      update(t, T) {
        hide();
        A.reset(); A.pos.copy(A_SPOT); A.yaw = faceTo(A, SIGN_POS) - 0.1; idle(A, T);
        lookAt(A, V(3.4, 3.0, -3.3), 0.9);
        A.headTilt += 0.12 * span(t, 1.0, 1.6);
        hA.go('pocket', 'chest', span(t, 4.4, 5.8));
        if (t > 5.8) lookAt(A, hA.pos(), span(t, 5.8, 6.6));
        bg(T);
      }
    },
    circle: {
      duration: 12,
      update(t, T) {
        hide();
        A.reset(); A.pos.copy(A_SPOT); A.yaw = faceTo(A, SIGN_POS) - 0.1; idle(A, T);
        hA.go('chest', 'chest', 0); lookAt(A, hA.pos(), 1);
        // 在螢幕上用手指圈起招牌
        const a = span(t, 1.2, 3.4) * Math.PI * 2;
        const draw = span(t, 1.0, 1.4) * (1 - span(t, 3.6, 4.0));
        finger(A, hA, Math.cos(a - Math.PI / 2) * 0.05, Math.sin(a - Math.PI / 2) * 0.07, draw);
        // 招牌上的圈選特效逐點亮起，再出現翻譯
        const n = Math.floor(span(t, 3.4, 5.2) * ringDots.length);
        ringDots.forEach((d, i) => { d.visible = i < n; });
        showB(bSign, t > 6.0, V(SIGN_POS.x, SIGN_POS.y + 0.85 + Math.sin(T * 2) * 0.03, SIGN_POS.z + 0.2));
        [bJp1, bCn1, bCn2, bJp2, bBye, bBye2].forEach((b) => { b.visible = false; });
        bg(T);
      }
    },
    order: {
      duration: 14,
      update(t, T) {
        hide();
        A.reset(); A.walk(A_SPOT, A_STALL, t, 0.2, 2.4);
        if (t > 2.4) A.yaw = faceTo(A, B_SPOT);
        hA.go('chest', 'chest', 0);
        lookAt(A, t < 3.4 ? head(B) : hA.pos(), 1);
        bg(T); B.look = head(A); B.lookAmt = 1;
        showB(bJp1, t > 2.8 && t < 5.8, head(B).add(V(0, 0.75, 0)));
        showB(bCn1, t > 4.4 && t < 7.4, hA.pos().add(V(0, 0.6, 0)));
        showB(bCn2, t > 7.6 && t < 10.6, head(A).add(V(0, 0.75, 0)));
        showB(bJp2, t > 9.0 && t < 12.4, hA.pos().add(V(0.3, 0.6, 0)));
        const nod = span(t, 10.6, 10.9) * (1 - span(t, 12.4, 12.8));
        B.headTilt = 0.18 * Math.abs(Math.sin(T * 5)) * nod;
      }
    },
    bye: {
      duration: 11,
      update(t, T) {
        hide();
        A.reset(); A.pos.copy(A_STALL); A.yaw = faceTo(A, B_SPOT);
        const k = span(t, 5.4, 6.8);
        hA.go('chest', 'pocket', k);
        lookAt(A, t < 5.4 ? hA.pos() : head(B), 1); idle(A, T);
        // 老闆揮手
        bg(T); B.look = head(A); B.lookAmt = 1;
        const wave = span(t, 1.0, 1.6) * (1 - span(t, 8.6, 9.2));
        if (wave > 0) B.reach.L = { target: () => B.local(0.35, 1.5 + Math.sin(T * 9) * 0.06, 0.1).lerp(B.local(0.3, 0.84, 0.08), 1 - wave), pole: () => B.local(0.8, 1.1, -0.1) };
        showB(bBye, t > 1.2 && t < 4.4, head(B).add(V(0, 0.75, 0)));
        showB(bBye2, t > 2.8 && t < 5.6, head(A).add(V(0, 0.7, 0)));
        const away = span(t, 7.4, 10.6);
        if (away > 0) { A.pos.lerpVectors(A_STALL, V(-1.5, 0, 1.2), away); A.yaw = lerp(faceTo(A, B_SPOT), Math.atan2(-3.9, 2.3), span(t, 7.4, 8.0)); A.walkAmt = 1; A.walkPhase = away * 22; }
      }
    }
  };

  function ambient(T) {
    steam(T);
    walkers.forEach((w) => {
      const L = 40, d = ((w.off + T * Math.abs(w.v)) % L), x = w.v > 0 ? d - L / 2 : L / 2 - d;
      w.p.reset(); w.p.pos.set(x, 0, w.z); w.p.yaw = w.v > 0 ? Math.PI / 2 : -Math.PI / 2; w.p.walkAmt = 1; w.p.walkPhase = d * 4.4;
    });
  }
  function finish() {
    people.forEach((p) => p.apply());
    hA.place();
  }

  return {
    view: { pos: V(0, 1.55, 3.8), yaw: 0, pitch: -0.02 },
    camSide: 1.3,
    beats, ambient, finish,
    insets: s24Insets,
    focus: {
      street: () => V(1.5, 1.8, -3),
      sign: () => V(SIGN_POS.x, SIGN_POS.y, SIGN_POS.z),
      phone: () => hA.pos(),
      stall: () => head(B).lerp(head(A), 0.5)
    },
    hotspots: {
      s24: { pos: () => hA.pos().add(V(0, 0.4, 0)), size: 0.34 },
      sign: { pos: () => V(SIGN_POS.x, SIGN_POS.y + 1.45, SIGN_POS.z), size: 0.5 },
      ai: { pos: () => head(A).add(V(0, 0.55, 0)), size: 0.4 },
      interp: { pos: () => hA.pos().add(V(0.35, 0.3, 0)), size: 0.32 },
      network: { pos: () => V(-1.5, 4.8, -6.4), size: 1.0 },
      noren: { pos: () => V(STALL.x - 1.2, 1.5, STALL.z + 0.7), size: 0.45 }
    }
  };
}
