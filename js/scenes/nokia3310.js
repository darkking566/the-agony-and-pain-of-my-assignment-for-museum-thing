// 沉浸場景：2000 年的教室，下課十分鐘，同學圍著一支 Nokia 3310。
// 字幕和解說文字在 js/data.js 的 scenes['nokia-3310']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import { nokiaInsets } from './insets.js';
import * as THREE from 'three';
import { V, span, lerp, mat, box, cyl, sign, Person, placeBetween } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { richRoom, ceilingLights, windowView, leafyPlant, framedPicture, blobShadow, surfaceTex, doorway } from './props.js';

export function build({ scene, phone }) {
  /* ---------- 光線與房間 ---------- */
  scene.background = new THREE.Color('#d7dfe6');
  scene.add(new THREE.HemisphereLight('#f6f3ec', '#8d8271', 1.15));
  const sun = new THREE.DirectionalLight('#fff1d6', 2.3);
  sun.position.set(-9, 6.5, 2);
  sun.target.position.set(0, 0, -0.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  const RW = 9, RD = 8, RH = 3.2;
  richRoom(scene, { w: RW, d: RD, h: RH, floor: { kind: 'vinyl', color: '#d9cfb6', size: 2, rough: 0.35 }, wall: { kind: 'plaster', color: '#ebe7db', size: 3 }, ceil: { kind: 'ceil', color: '#f1efe8', size: 1.8 }, base: '#5b6a62', crown: '#f1efe8' });
  // 牆的下半部漆成學校常見的綠灰色
  { const dado = (len, px, py, pz, ry) => { const b = box(len, 0.95, 0.03, '#8aa395', { roughness: 0.8 }); b.position.set(px, py, pz); b.rotation.y = ry; b.castShadow = false; scene.add(b);
      const rail = box(len, 0.05, 0.05, '#e8e4d6'); rail.position.set(px, py + 0.5, pz); rail.rotation.y = ry; rail.castShadow = false; scene.add(rail); };
    dado(RW - 0.2, 0, 0.5, -RD / 2 + 0.12, 0); dado(RD - 0.2, -RW / 2 + 0.12, 0.5, 0, Math.PI / 2); dado(RD - 0.2, RW / 2 - 0.12, 0.5, 0, Math.PI / 2); }

  // 左牆的窗戶（陽光從這裡進來），窗外是操場旁的樹，掛著淺色窗簾
  [-2.6, 0.2, 3.0].forEach((z) => {
    windowView(scene, { pos: V(-RW / 2 + 0.11, 1.85, z), yaw: Math.PI / 2, w: 2.0, h: 1.4, view: 'trees', frame: '#8c9399', curtain: '#a9c4b0' });
    [-1, 1].forEach((sd) => { const cu = box(0.04, 1.55, 0.34, '#e9dfc4'); cu.position.set(-RW / 2 + 0.2, 1.85, z + sd * 1.0); cu.castShadow = false; scene.add(cu); });
  });

  // 日光燈
  ceilingLights(scene, [-1.6, 1.6], [-2, 1.6], RH - 0.01, 0.2, 1.5);

  // 黑板、時鐘
  const board = box(4.4, 1.25, 0.06, '#2f4a3c');
  board.position.set(-1.0, 1.75, -RD / 2 + 0.13);
  const frameB = box(4.55, 1.4, 0.04, '#8a6a43'); frameB.position.set(-1.0, 1.75, -RD / 2 + 0.1);
  const ledge = box(4.4, 0.05, 0.14, '#8a6a43'); ledge.position.set(-1.0, 1.1, -RD / 2 + 0.2);
  const boardText = sign('2000 年　第三節下課', 3.6, 0.5, { bg: '#2f4a3c', color: '#f0f0e6', size: 72, w: 1024, h: 150, weight: 700 });
  boardText.position.set(-1.0, 2.0, -RD / 2 + 0.165);
  const boardText2 = sign('下節：國文　　記得帶課本', 3.2, 0.36, { bg: '#2f4a3c', color: '#d9e6d2', size: 54, w: 1024, h: 120, weight: 500 });
  boardText2.position.set(-1.0, 1.55, -RD / 2 + 0.165);
  scene.add(frameB, board, ledge, boardText, boardText2);

  const clock = new THREE.Group();
  const face = cyl(0.3, 0.3, 0.04, '#f4f1ea', 24); face.rotation.x = Math.PI / 2;
  const rim = cyl(0.33, 0.33, 0.03, '#3b3f45', 24); rim.rotation.x = Math.PI / 2; rim.position.z = -0.01;
  const hHand = box(0.025, 0.17, 0.01, '#222'); hHand.position.set(0, 0.07, 0.03);
  const mHand = box(0.018, 0.25, 0.01, '#222'); mHand.position.set(0, 0.11, 0.035);
  const sHand = box(0.008, 0.27, 0.008, '#b3261e'); sHand.position.set(0, 0.11, 0.04);
  clock.add(rim, face, hHand, mHand, sHand);
  clock.position.set(2.4, 2.45, -RD / 2 + 0.2);
  scene.add(clock);
  hHand.rotation.z = -Math.PI * 0.5 - 0.3; hHand.position.set(0.07, 0.0, 0.03);
  const pivotM = new THREE.Group(); pivotM.position.set(0, 0, 0.035); mHand.position.set(0, 0.11, 0); pivotM.add(mHand); clock.add(pivotM);
  const pivotS = new THREE.Group(); pivotS.position.set(0, 0, 0.04); sHand.position.set(0, 0.11, 0); pivotS.add(sHand); clock.add(pivotS);
  pivotM.rotation.z = -Math.PI * 0.4;

  // 右牆：公佈欄與門
  const bb = box(0.05, 1.1, 2.4, '#b58b5a'); bb.position.set(RW / 2 - 0.13, 1.8, -1.6);
  scene.add(bb);
  ['#f2d16b', '#e58e8e', '#8fc1e3', '#f2f0ea', '#9fd3a6', '#f2b36b'].forEach((c, i) => {
    const note = box(0.02, 0.34, 0.3, c);
    note.position.set(RW / 2 - 0.16, 1.55 + Math.floor(i / 3) * 0.45, -2.5 + (i % 3) * 0.75);
    note.rotation.x = ((i * 37) % 7 - 3) * 0.03;
    scene.add(note);
  });
  doorway(scene, { pos: V(RW / 2 - 0.1, 0, 1.9), yaw: -Math.PI / 2, w: 1.0, h: 2.2, color: '#9a7b52', frame: '#d8d4c6' });

  /* ---------- 桌椅 ---------- */
  const woodTop = '#c9a46a', metal = '#6d747a';
  const dtex = surfaceTex('parquet', '#c9a46a').clone(); dtex.repeat.set(0.45, 0.3); dtex.needsUpdate = true;
  const deskTopMat = new THREE.MeshStandardMaterial({ map: dtex, roughness: 0.5 });
  const desks = [];
  const desk = (x, z, yaw = 0) => {
    const g = new THREE.Group();
    const top = box(0.9, 0.05, 0.6, deskTopMat); top.position.y = 0.74;
    g.add(top);
    [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]].forEach(([lx, lz]) => {
      const leg = box(0.04, 0.72, 0.04, metal); leg.position.set(lx, 0.36, lz); g.add(leg);
    });
    const seat = box(0.42, 0.04, 0.4, '#4a6a8a'); seat.position.set(0, 0.44, 0.62);
    const bk = box(0.42, 0.34, 0.04, '#4a6a8a'); bk.position.set(0, 0.64, 0.82);
    [[-0.17, 0.5], [0.17, 0.5], [-0.17, 0.78], [0.17, 0.78]].forEach(([lx, lz]) => {
      const leg = box(0.03, 0.44, 0.03, metal); leg.position.set(lx, 0.22, lz); g.add(leg);
    });
    g.add(seat, bk);
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    scene.add(g);
    desks.push(g);
    return g;
  };
  // 桌面朝黑板（-z），椅子在後方（+z）
  [-3.5, -2.4, -1.3].forEach((x) => [-2.9, -1.4, 0.1, 1.6].forEach((z) => desk(x, z)));
  [2.9, 3.8].forEach((x) => [-2.9, -1.4, 0.1, 1.6].forEach((z) => desk(x, z)));
  // 書包、課本
  const bag = (x, z, c) => {
    const b = box(0.32, 0.38, 0.14, c); b.position.set(x, 0.3, z); b.rotation.y = 0.2; scene.add(b);
  };
  bag(-3.0, -1.0, '#3b4a6b'); bag(-1.9, 0.5, '#8a3b3b'); bag(3.4, -0.9, '#3b6b4a'); bag(-2.4, 2.0, '#6b5a3b');
  const book = (x, y, z, c) => { const b = box(0.2, 0.03, 0.27, c); b.position.set(x, y, z); b.rotation.y = 0.3; scene.add(b); };
  book(-3.5, 0.78, -1.4, '#d9a441'); book(-1.3, 0.78, 0.1, '#7a9fc8'); book(3.8, 0.78, -1.4, '#b95a5a');

  // 可換外殼（Nokia 3310 的賣點之一）：放在右排的桌上
  const COVER_DESK = V(2.9, 0.77, -1.4);
  {
    const colors = ['#2f5aa8', '#c0392b', '#e8c13a', '#3b8f5a', '#6a4a9a', '#e0e0e0'];
    colors.forEach((c, i) => {
      const s = box(0.075, 0.012, 0.16, c, { roughness: 0.4 });
      s.position.set(COVER_DESK.x - 0.3 + (i % 3) * 0.1, COVER_DESK.y + Math.floor(i / 3) * 0.013, COVER_DESK.z - 0.05 + Math.floor(i / 3) * 0.03);
      s.rotation.y = (i - 2.5) * 0.12;
      scene.add(s);
    });
  }

  // 教室裡的小東西：垃圾桶、海報、窗台上的盆栽
  { const bin = cyl(0.17, 0.14, 0.4, '#5a6a72', 12); bin.position.set(4.2, 0.2, 2.9); scene.add(bin); }
  framedPicture(scene, RW / 2 - 0.12, 1.9, 0.3, -Math.PI / 2, 0.9, 0.65, 1);
  leafyPlant(scene, -4.2, -3.5, 0.9, 2, '#6a5a3b');

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const uniform = { top: '#e9ecef', bottom: '#26304a', shoes: '#f0f0f0' };
  const A = add(new Person({ ...uniform, hair: '#1b1410', skin: '#e2b48e', height: 0.95 }));
  const B = add(new Person({ ...uniform, hair: '#3a2a1c', skin: '#d9a77f', height: 0.97 }));
  const C = add(new Person({ ...uniform, dress: true, hair: '#1a1a1a', skin: '#edc6a2', height: 0.92 }));
  const D = add(new Person({ ...uniform, hair: '#2b1d14', skin: '#c68e63', height: 0.96 }));

  { const tie = (p, c) => { const t = box(0.05, 0.22, 0.012, c); t.position.set(0, 0.45, 0.127); p.torso.add(t); const col = box(0.2, 0.04, 0.02, '#f6f6f2'); col.position.set(0, 0.57, 0.12); p.torso.add(col); };
    tie(A, '#26304a'); tie(B, '#8a2a2a'); tie(D, '#26304a');
    const rib = box(0.18, 0.05, 0.02, '#8a2a2a'); rib.position.set(0, 0.45, 0.127); C.torso.add(rib); }
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  // 3310：原點放在機身中心，縮成真實大小（約 11 公分）
  const nokia = new THREE.Group();
  {
    const m = buildPhone(phone);
    const c = new THREE.Box3().setFromObject(m).getCenter(V());
    m.position.sub(c);
    const inner = new THREE.Group();
    inner.add(m);
    inner.scale.setScalar(0.26);
    inner.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    nokia.add(inner);
  }
  scene.add(nokia);

  const handHold = new THREE.Object3D();
  handHold.position.set(0, 0.02, 0.05);
  A.arms.R.grip.add(handHold);
  // 胸前拿著看螢幕：螢幕朝向自己
  const chest = new THREE.Object3D();
  chest.rotation.set(0.55, Math.PI, 0);
  A.root.add(chest);
  const CHEST_NEAR = V(-0.08, 1.3, 0.36);
  const CHEST_OUT = V(-0.1, 1.32, 0.62);
  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));

  const restR = () => A.local(-0.3, 0.84, 0.08);
  const gripChest = () => chest.localToWorld(V(0, -0.04, -0.02));
  const poleChest = () => A.local(-0.6, 0.85, 0.1);
  const poleRest = () => A.local(-0.5, 0.6, -0.1);

  let phoneK = 0;            // 0＝手放下，1＝拿在胸前
  let freePhone = null;       // 手機離手時的世界座標
  function holdPhone(k) {
    phoneK = k;
    freePhone = null;
    if (k <= 0) { A.reach.R = null; return; }
    A.reach.R = {
      target: () => restR().lerp(gripChest(), k),
      pole: () => poleRest().lerp(poleChest(), k)
    };
  }
  function placePhone() {
    if (freePhone) {
      nokia.position.copy(freePhone.pos);
      nokia.quaternion.copy(freePhone.quat);
    } else {
      placeBetween(nokia, handHold, chest, span(phoneK, 0.55, 1));
    }
  }

  const A_SPOT = V(1.0, 0, 0.9), B_SPOT = V(0.15, 0, 1.05), C_SPOT = V(1.95, 0, 1.0);
  const FLOOR_SPOT = V(1.15, 0.016, 1.55);
  const idle = (p, T, ph = 0) => {
    p.headTilt = Math.sin(T * 1.7 + ph) * 0.05;
    p.bob = Math.sin(T * 1.1 + ph) * 0.006;
  };
  const faceTo = (p, target) => Math.atan2(target.x - p.pos.x, target.z - p.pos.z);
  const phoneWorld = () => nokia.getWorldPosition(V());

  // 下蹲：把人往下放、大腿向前，鞋子會埋進地板一點點，鏡頭看不出來
  let crouch = 0;
  function applyCrouch() {
    if (crouch <= 0) return;
    A.root.position.y -= 0.24 * crouch;
    A.legs.forEach((l) => { l.rotation.x = -0.6 * crouch; });
  }

  /* ---------- 劇本 ---------- */
  const beats = {
    room: {
      duration: 9,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = 0.1; holdPhone(0); idle(A, T);
        A.look = V(1.0, 1.1, 2.4); A.lookAmt = 0.6;
        B.reset(); B.pos.set(-1.6, 0, 1.9); B.yaw = faceTo(B, V(0.2, 0, 1.4)); idle(B, T, 1);
        C.reset(); C.pos.set(2.2, 0, 2.1); C.yaw = faceTo(C, V(1.2, 0, 1.6)); idle(C, T, 2);
        D.reset(); D.pos.set(-0.4, 0, -0.2); D.yaw = 1.2; idle(D, T, 3);
        crouch = 0;
      }
    },
    snake: {
      duration: 11,
      update(t, T) {
        crouch = 0;
        A.reset(); A.pos.copy(A_SPOT); A.yaw = 0;
        const k = span(t, 0.2, 1.5);
        holdPhone(k);
        chest.position.copy(CHEST_NEAR);
        // 拇指按鍵：機身輕輕晃動
        const press = span(t, 1.8, 2.2);
        chest.position.y += Math.sin(t * 14) * 0.004 * press;
        chest.rotation.z = Math.sin(t * 9) * 0.03 * press;
        A.look = phoneWorld(); A.lookAmt = k;
        idle(A, T);
        // 同學走過來圍著看
        B.reset(); B.walk(V(-1.6, 0, 1.9), B_SPOT, t, 0.6, 3.6);
        if (t > 3.6) B.yaw = faceTo(B, A.pos);
        B.look = phoneWorld(); B.lookAmt = span(t, 2.2, 3.4); if (t > 3.6) idle(B, T, 1);
        C.reset(); C.walk(V(2.2, 0, 2.1), C_SPOT, t, 1.0, 3.9);
        if (t > 3.9) C.yaw = faceTo(C, A.pos);
        C.look = phoneWorld(); C.lookAmt = span(t, 2.4, 3.6); if (t > 3.9) idle(C, T, 2);
        D.reset(); D.pos.copy(V(-0.4, 0, -0.2)); D.yaw = lerp(1.2, faceTo(D, A.pos), span(t, 4, 5.5));
        D.look = phoneWorld(); D.lookAmt = span(t, 4.5, 6);
        // 貪吃蛇吃到東西：同學歡呼
        const cheer = span(t, 7.2, 7.5) * (1 - span(t, 8.6, 9));
        C.bob += Math.abs(Math.sin(T * 12)) * 0.03 * cheer;
        B.headTilt = -0.2 * cheer;
        chest.rotation.z += 0;
      }
    },
    sms: {
      duration: 10,
      update(t, T) {
        crouch = 0;
        A.reset(); A.pos.copy(A_SPOT); A.yaw = 0.15;
        holdPhone(1);
        chest.position.copy(CHEST_NEAR).add(V(0, -0.06 * span(t, 0, 1), 0.02));
        const typing = span(t, 1, 1.4);
        chest.position.y += Math.sin(t * 17) * 0.004 * typing;
        chest.rotation.z = Math.sin(t * 11) * 0.04 * typing;
        A.look = phoneWorld(); A.lookAmt = 1;
        A.lean = 0.06;
        idle(A, T);
        B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, A.pos); B.look = phoneWorld(); B.lookAmt = 0.8; idle(B, T, 1);
        C.reset(); C.pos.copy(C_SPOT); C.yaw = faceTo(C, A.pos); C.look = phoneWorld(); C.lookAmt = 0.8; idle(C, T, 2);
        // 最後兩人看著對方笑
        const grin = span(t, 6.2, 6.8);
        C.look = grin > 0.5 ? head(B) : phoneWorld();
        B.bob += Math.abs(Math.sin(T * 10)) * 0.02 * grin;
        D.reset(); D.pos.copy(V(-0.3, 0, 0.1)); D.yaw = faceTo(D, A.pos); D.look = head(A); D.lookAmt = 0.8; idle(D, T, 3);
      }
    },
    drop: {
      duration: 14,
      update(t, T) {
        A.reset(); A.pos.copy(A_SPOT); A.yaw = 0;
        B.reset(); B.pos.copy(B_SPOT); B.yaw = faceTo(B, A.pos);
        C.reset(); C.pos.copy(C_SPOT); C.yaw = faceTo(C, A.pos);
        D.reset(); D.pos.copy(V(-0.3, 0, 0.1)); D.yaw = faceTo(D, A.pos);
        crouch = 0;
        const out = span(t, 0, 1.2);            // 把手機伸出來給大家看
        const release = 2.6;                      // 手滑
        const pickDown = span(t, 6.2, 7.4) * (1 - span(t, 8.9, 9.8));  // 蹲下去撿
        const lift = span(t, 8.7, 10.0);          // 撿起來拿到胸前
        const outPos = A.local(-0.1, 1.2, 0.6);

        if (t < release) {
          holdPhone(1);
          chest.position.copy(CHEST_NEAR).lerp(CHEST_OUT, out);
          A.look = phoneWorld(); A.lookAmt = 1;
          B.look = phoneWorld(); B.lookAmt = 0.9; C.look = phoneWorld(); C.lookAmt = 0.9; D.look = phoneWorld(); D.lookAmt = 0.8;
        } else {
          const tau = t - release;
          // 自由落體＋兩次彈跳
          const y0 = outPos.y, g = 9.8, tf = Math.sqrt(2 * (y0 - 0.02) / g);
          let y;
          if (tau < tf) y = y0 - 0.5 * g * tau * tau;
          else {
            const u = tau - tf, v1 = 2.2, tb1 = 2 * v1 / g;
            if (u < tb1) y = 0.02 + v1 * u - 0.5 * g * u * u;
            else {
              const w = u - tb1, v2 = 0.9, tb2 = 2 * v2 / g;
              y = w < tb2 ? 0.02 + v2 * w - 0.5 * g * w * w : 0.02;
            }
          }
          const slide = span(tau, 0, 1.2);
          const pos = V(lerp(outPos.x, FLOOR_SPOT.x, slide), Math.max(0.016, y), lerp(outPos.z, FLOOR_SPOT.z, slide));
          const spin = span(tau, 0, 0.9);
          const e = new THREE.Euler(lerp(0.4, -Math.PI / 2, spin) + (1 - spin) * 2.4, lerp(0, 0.6, spin), (1 - spin) * 1.2);
          holdPhone(0);   // 這一行會清掉 freePhone，所以要放在前面
          A.reach.R = null;
          if (lift <= 0) freePhone = { pos, quat: new THREE.Quaternion().setFromEuler(e) };
          A.look = tau < 0.5 ? phoneWorld() : FLOOR_SPOT.clone().add(V(0, 0.2, 0)); A.lookAmt = 1;
          const gasp = span(tau, 0.45, 0.8) * (1 - span(tau, 2.6, 3.4));
          [B, C, D].forEach((p, i) => {
            p.look = FLOOR_SPOT.clone().add(V(0, 0.1, 0)); p.lookAmt = 1;
            p.lean = -0.1 * gasp; p.bob = gasp * 0.03 * Math.abs(Math.sin(T * 9 + i));
          });
        }
        // 蹲下撿
        crouch = pickDown;
        if (t >= 6.2) {
          A.lean = 0.8 * pickDown;
          A.look = FLOOR_SPOT.clone().add(V(0, 0.1, 0)); A.lookAmt = 1;
          A.reach.R = {
            target: () => {
              const floorGrip = FLOOR_SPOT.clone().add(V(0, 0.07, 0.03));
              return restR().lerp(floorGrip, pickDown).lerp(gripChest(), lift);
            },
            pole: () => A.local(-0.7, 0.4, 0.6)
          };
          if (t >= 7.6 && lift <= 0) {
            // 手握著手機：貼著地板
            freePhone = { pos: FLOOR_SPOT.clone().add(V(0, 0.03, 0.03)), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0.6, 0)) };
          }
          if (lift > 0) {
            holdPhone(lift);
            A.reach.R = {
              target: () => FLOOR_SPOT.clone().add(V(0, 0.07, 0.03)).lerp(gripChest(), lift),
              pole: () => A.local(-0.6, 0.6, 0.3)
            };
            chest.position.copy(CHEST_NEAR);
            A.look = phoneWorld(); A.lookAmt = lift;
            A.lean = 0.8 * (1 - lift);
            crouch = 1 - lift;
          }
          const relief = span(t, 10.4, 11);
          [B, C, D].forEach((p) => { p.look = phoneWorld(); p.lookAmt = 1; p.lean = 0; });
          C.bob += Math.abs(Math.sin(T * 12)) * 0.025 * relief * (1 - span(t, 12, 12.6));
        }
      }
    }
  };

  /* ---------- 每一格 ---------- */
  function ambient(T) {
    pivotS.rotation.z = -T * (Math.PI * 2 / 60) * 6;  // 秒針走快一點，看得出來
    pivotM.rotation.z = -Math.PI * 0.4 - T * 0.002;
  }
  function finish() {
    people.forEach((p) => p.apply());
    // 手和腳的最後調整要放在 apply() 之後
    applyCrouch();
    if (crouch > 0) A.root.updateMatrixWorld(true);
    placePhone();
  }

  return {
    view: { pos: V(0, 1.55, 3.3), yaw: 0, pitch: -0.05 },
    closeDist: 3.1,
    beats,
    ambient,
    finish,
    insets: nokiaInsets,
    focus: {
      room: () => V(0.3, 1.5, -2.5),
      group: () => head(A).lerp(head(C), 0.4),
      phone: () => phoneWorld(),
      floor: () => FLOOR_SPOT.clone().add(V(0, 0.1, 0)),
      board: () => V(-1.0, 1.75, -3.8)
    },
    hotspots: {
      phone: { pos: () => phoneWorld().add(V(0, 0.14, 0)), size: 0.3 },
      cover: { pos: () => COVER_DESK.clone().add(V(0, 0.2, 0)), size: 0.38 },
      board: { pos: () => V(-1.0, 2.55, -3.8), size: 0.6 },
      sms: { pos: () => phoneWorld().add(V(0.12, 0.02, 0)), size: 0.28 },
      tough: { pos: () => FLOOR_SPOT.clone().add(V(0, 0.32, 0)), size: 0.38 },
      friends: { pos: () => head(B).lerp(head(C), 0.5).add(V(0, 0.5, 0)), size: 0.5 }
    }
  };
}
