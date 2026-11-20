// 沉浸場景：1992 年 12 月，英國一間辦公室裡的工程師用電腦寫下一句聖誕祝福，送到派對上一支手機。
// 字幕和解說文字在 js/data.js 的 scenes['orbitel-901']；這裡只負責場景和動作。
// 每段演出的 update(t, T) 只依照時間 t 算出所有人的狀態，所以可以直接「跳過」到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, sign, Person } from '../scene-kit.js';
import { richRoom, windowView, leafyPlant, framedPicture, blobShadow, ceilingLights, doorway } from './props.js';
import { officeChair, crtMonitor, pcTower, christmasTree, filingCabinet, waterCooler, cubicle, deskClutter, wallClock, bookcase, trashCan } from './props2.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const MSG = 'Merry Christmas';
const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';

export function build({ scene, phone }) {
  /* ---------- 光線與房間 ---------- */
  scene.background = new THREE.Color('#2a2420');
  scene.add(new THREE.HemisphereLight('#fff3e0', '#7a6650', 1.6));
  const key = new THREE.DirectionalLight('#ffe2b8', 2.0);
  key.position.set(-8, 7, 5);
  key.target.position.set(0, 0, -1);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 3;
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  key.shadow.bias = -0.0008;
  scene.add(key, key.target);
  const warm = new THREE.PointLight('#ffb766', 1.4, 9, 1.6);
  warm.position.set(2.6, 2.6, -2.6);
  scene.add(warm);

  const RW = 10, RD = 8, RH = 3.2;
  richRoom(scene, {
    w: RW, d: RD, h: RH,
    floor: { kind: 'parquet', color: '#6f4a2e', size: 2, rough: 0.45 },
    wall: { kind: 'plaster', color: '#d9d0bd', size: 3 },
    wallBack: { kind: 'plaster', color: '#c9bca4', size: 3 },
    wallRight: { kind: 'plaster', color: '#d9d0bd', size: 3 },
    ceil: { kind: 'ceil', color: '#e6dccb', size: 1.8 },
    base: '#3b2a1c', crown: '#e6dccb'
  });
  // 左牆窗戶：窗外是冬天的街
  windowView(scene, { pos: V(-RW / 2 + 0.11, 1.6, -0.6), yaw: Math.PI / 2, w: 2.4, h: 1.6, view: 'city', frame: '#3b2f27', blinds: 0.28 });

  ceilingLights(scene, [-2.5, 0.5, 3.5], [-1.6, 1.6], RH - 0.01, 1.2, 0.6, '#fff8e6');
  /* ---------- 辦公桌與電腦 ---------- */
  const DESK_Z = -0.6;
  const top = box(2.4, 0.07, 0.9, '#b08a5c'); top.position.set(-1.8, 0.78, DESK_Z);
  scene.add(top);
  [[-0.95, -0.3], [0.95, -0.3], [-0.95, 0.3], [0.95, 0.3]].forEach(([x, z]) => {
    const leg = box(0.07, 0.75, 0.07, '#6b4a2e'); leg.position.set(-1.8 + x, 0.37, DESK_Z + z); scene.add(leg);
  });
  const base = box(0.3, 0.02, 0.2, '#23262c'); base.position.set(-1.8, 0.83, DESK_Z - 0.1); scene.add(base);
  const stand = box(0.06, 0.2, 0.06, '#23262c'); stand.position.set(-1.8, 0.95, DESK_Z - 0.1); scene.add(stand);
  // 桌上型電腦的螢幕（螢幕朝向工程師）
  const monitor = box(0.8, 0.55, 0.06, '#23262c'); monitor.position.set(-1.8, 1.2, DESK_Z - 0.12); scene.add(monitor);
  const screenMat = new THREE.MeshBasicMaterial({ color: '#0b1d33' });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.46), screenMat);
  screen.position.set(-1.8, 1.2, DESK_Z - 0.08);
  scene.add(screen);
  { const back = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.42, 4), new THREE.MeshStandardMaterial({ color: '#23262c', roughness: 0.6 })); back.rotation.set(Math.PI / 2, Math.PI / 4, 0); back.position.set(-1.8, 1.2, DESK_Z - 0.36); scene.add(back); }
  pcTower(scene, -2.75, DESK_Z + 0.05, 0.1);
  cubicle(scene, -1.8, DESK_Z - 0.05, 0, { w: 2.7, d: 1.3, h: 1.3, fabric: '#6f7a86' });
  const keyboard = box(0.9, 0.025, 0.3, '#2a2d33'); keyboard.position.set(-1.8, 0.83, DESK_Z + 0.32); scene.add(keyboard);
  const mouse = box(0.08, 0.03, 0.12, '#2a2d33'); mouse.position.set(-1.25, 0.84, DESK_Z + 0.32); scene.add(mouse);

  // 桌上的一疊紙與咖啡杯
  const papers = box(0.5, 0.04, 0.4, '#f1ece0'); papers.position.set(-2.7, 0.83, DESK_Z - 0.05); scene.add(papers);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), new THREE.MeshStandardMaterial({ color: '#e8e0d0' }));
  mug.position.set(-1.0, 0.9, DESK_Z + 0.1); scene.add(mug);

  /* ---------- 派對角落：桌子、點心、聖誕樹 ---------- */
  const PARTY_TABLE = V(2.4, 0, -2.8);
  const ptop = box(1.8, 0.06, 0.9, '#e8dcc4'); ptop.position.set(PARTY_TABLE.x, 0.85, PARTY_TABLE.z); scene.add(ptop);
  const pleg = box(0.1, 0.85, 0.1, '#5a4030'); pleg.position.set(PARTY_TABLE.x, 0.42, PARTY_TABLE.z); scene.add(pleg);
  [-0.5, 0.2, 0.6].forEach((x, i) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 12), new THREE.MeshStandardMaterial({ color: ['#f2efe8', '#c9a46a', '#f2efe8'][i] }));
    cup.position.set(PARTY_TABLE.x + x, 0.97, PARTY_TABLE.z + 0.15); scene.add(cup);
  });
  christmasTree(scene, 4.0, -3.2, { h: 1.9 });
  leafyPlant(scene, -4.1, -3.0, 1.0, 1);
  framedPicture(scene, -2.6, 2.0, -RD / 2 + 0.17, 0, 0.7, 0.9, 1);

  /* ---------- 辦公室的其他陳設 ---------- */
  // 後牆的白板（寫著專案名稱）與紅色的月曆
  const boardFrame = box(2.3, 1.3, 0.04, '#9aa0a6'); boardFrame.position.set(-3.6, 1.7, -RD / 2 + 0.18); scene.add(boardFrame);
  const board = sign('Q4 PLAN', 2.1, 1.1, { bg: '#f4f6f8', color: '#2a4a7a', size: 120, w: 512, h: 270, weight: 800 });
  board.position.set(-3.6, 1.7, -RD / 2 + 0.21); scene.add(board);
  const cal = sign('DEC 1992', 0.7, 0.8, { bg: '#b8382c', color: '#fff7e6', size: 64, w: 360, h: 420, weight: 800 });
  cal.position.set(-0.4, 1.9, -RD / 2 + 0.21); scene.add(cal);
  // 檔案櫃（兩個）與飲水機
  // 檔案櫃（靠右牆、朝房間）與飲水機
  filingCabinet(scene, 4.6, -1.9, -Math.PI / 2); filingCabinet(scene, 4.6, -1.4, -Math.PI / 2, { color: '#8a8f96' });
  waterCooler(scene, 4.65, -0.6, -Math.PI / 2);
  bookcase(scene, RW / 2 - 0.27, 2.4, -Math.PI / 2, { w: 1.6, h: 1.9, color: '#6b5a48', shelves: 4, seed: 9 });
  wallClock(scene, 1.6, 2.55, -RD / 2 + 0.12, 0);
  trashCan(scene, -0.8, -1.0); trashCan(scene, 4.0, 1.6);
  // 第二張辦公桌：同事正在打字（同事的動作在 ambient 裡）
  const DESK2 = V(3.0, 0, 0.9);
  const d2 = box(2.0, 0.07, 0.8, '#b08a5c'); d2.position.set(DESK2.x, 0.78, DESK2.z); scene.add(d2);
  [[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.3], [0.9, 0.3]].forEach(([x, z]) => {
    const l = box(0.07, 0.75, 0.07, '#6b4a2e'); l.position.set(DESK2.x + x, 0.37, DESK2.z + z); scene.add(l);
  });
  const m2 = box(0.7, 0.5, 0.05, '#23262c'); m2.position.set(DESK2.x, 1.17, DESK2.z - 0.2); scene.add(m2);
  const s2 = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), new THREE.MeshBasicMaterial({ color: '#1b3b2a' }));
  s2.position.set(DESK2.x, 1.17, DESK2.z - 0.15); scene.add(s2);
  const k2 = box(0.9, 0.025, 0.3, '#2a2d33'); k2.position.set(DESK2.x, 0.83, DESK2.z + 0.22); scene.add(k2);
  { const back2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.38, 4), new THREE.MeshStandardMaterial({ color: '#23262c', roughness: 0.6 })); back2.rotation.set(Math.PI / 2, Math.PI / 4, 0); back2.position.set(DESK2.x, 1.17, DESK2.z - 0.43); scene.add(back2); }
  pcTower(scene, DESK2.x - 0.75, DESK2.z + 0.05, 0);
  deskClutter(scene, DESK2.x - 0.4, 0.815, DESK2.z + 0.05, { seed: 4 });
  const mug2 = cyl(0.05, 0.05, 0.1, '#c0392b', 12); mug2.position.set(DESK2.x + 0.75, 0.9, DESK2.z + 0.1); scene.add(mug2);

  /* ---------- 第三輪：椅子、印表機、紙堆、電話與植物 ---------- */
  // 兩把辦公椅（靠在桌子前）
  officeChair(scene, -0.1, -0.7, 0.3); officeChair(scene, 3.0, 1.45, Math.PI);
  // 桌上的電話、紙堆、馬克杯與小植物
  const deskPhone = box(0.3, 0.1, 0.22, '#2a2a2e'); deskPhone.position.set(-2.5, 0.85, -0.45); scene.add(deskPhone);
  const deskHandset = box(0.28, 0.05, 0.06, '#2a2a2e'); deskHandset.position.set(-2.5, 0.92, -0.45); scene.add(deskHandset);
  [[-2.9, -0.7, 0.16, '#f1ece0'], [-2.9, -0.55, 0.12, '#e8e0cc']].forEach(([x, z, h, c]) => {
    const stack = box(0.32, h, 0.26, c); stack.position.set(x, 0.86 + h / 2, z); scene.add(stack);
  });
  const deskPlant = cyl(0.09, 0.07, 0.14, '#8a5a3a', 12); deskPlant.position.set(-1.1, 0.9, -0.85); scene.add(deskPlant);
  const deskLeaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({ color: '#3f7a48', roughness: 1 }));
  deskLeaf.position.set(-1.1, 1.08, -0.85); scene.add(deskLeaf);
  // 角落的影印機（方形機身、紙匣、控制面板）
  const copier = box(0.9, 0.9, 0.7, '#d8dde2', { roughness: 0.5, metalness: 0.2 }); copier.position.set(-4.0, 0.45, 2.6); scene.add(copier);
  const copierTop = box(0.92, 0.05, 0.72, '#b8bec6'); copierTop.position.set(-4.0, 0.92, 2.6); scene.add(copierTop);
  const copierPanel = box(0.5, 0.12, 0.02, '#2a2d33'); copierPanel.position.set(-4.0, 0.96, 2.94); scene.add(copierPanel);
  const tray = box(0.6, 0.04, 0.5, '#e8e8e8'); tray.position.set(-4.0, 0.7, 3.0); scene.add(tray);
  // 牆上的備忘板（便利貼）與告示
  const memo = box(1.0, 0.7, 0.04, '#b08a5c'); memo.position.set(-0.5, 1.9, -RD / 2 + 0.15); scene.add(memo);
  [[-0.85, 1.95, '#f7e36b'], [-0.6, 2.05, '#f7a3b8'], [-0.3, 1.9, '#9fdcf7'], [-0.7, 1.7, '#b9f7a3'], [-0.2, 1.75, '#f7e36b']].forEach(([x, y, c]) => {
    const note = box(0.18, 0.18, 0.01, c); note.position.set(x, y, -RD / 2 + 0.18); scene.add(note);
  });
  const notice = sign('NO SMOKING · 請勿吸菸', 1.1, 0.3, { bg: '#f4f1e8', color: '#8a2a2a', size: 58, w: 512, h: 140, weight: 800 });
  notice.position.set(0.6, 1.3, -RD / 2 + 0.22); scene.add(notice);
  // 天花板下的彩帶與氣球（派對的氣氛）
  const garlandColors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
  for (let i = 0; i < 26; i++) {
    const x = -4.6 + i * 0.36;
    const g = box(0.14, 0.14, 0.14, garlandColors[i % garlandColors.length]);
    g.position.set(x, RH - 0.28 - Math.sin(i * 0.5) * 0.04, -RD / 2 + 0.4);
    g.castShadow = false; scene.add(g);
  }
  const balloonCols = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
  [[1.6, 1.6, -3.1], [2.0, 1.9, -3.4], [3.4, 1.7, -3.3], [2.8, 2.1, -3.0]].forEach(([x, y, z], i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), new THREE.MeshStandardMaterial({ color: balloonCols[i], roughness: 0.3 }));
    b.position.set(x, y, z); b.castShadow = true; scene.add(b);
    const str = box(0.01, 0.5, 0.01, '#ffffff'); str.position.set(x, y - 0.3, z); scene.add(str);
  });

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  // 工程師：毛衣、站在桌前打字
  const NEIL = V(-1.8, 0, 0.05);
  const eng = add(new Person({ top: '#4a5a6a', bottom: '#3a3a40', hair: '#3a2a1c', skin: '#e8c1a0', height: 1.0 }));
  // 主管：深色西裝，派對上拿著手機
  const boss = add(new Person({ top: '#2b2f3a', bottom: '#2b2f3a', hair: '#8a7a6a', skin: '#e2b48e', height: 1.02 }));
  {
    const tie = box(0.05, 0.28, 0.012, '#7a2a24'); tie.position.set(0, 0.42, 0.13); boss.torso.add(tie);
  }
  const guestW = add(new Person({ top: '#8c3b4a', bottom: '#8c3b4a', dress: true, hair: '#6b3b1f', skin: '#edc6a2', height: 0.95 }));
  const guestM = add(new Person({ top: '#5a6b4f', bottom: '#4a4035', hair: '#1f1712', skin: '#c99a72', height: 0.98 }));
  // 第二張桌子旁的同事：襯衫、袖子捲起來，一直在打字
  const coworker = add(new Person({ top: '#f2f0ea', bottom: '#3a3f4a', hair: '#6b4a2a', skin: '#e8c1a0', height: 0.97 }));
  const COWORKER_SPOT = V(3.0, 0, 1.75);
  const KEY2 = V(3.0, 0.86, 1.05);
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.45); b.position.y = 0.012; p.root.add(b); });
  const BOSS_SPOT = V(3.15, 0, -2.0);
  const GW_SPOT = V(1.0, 0, -2.3), GM_SPOT = V(4.2, 0, -1.3);

  /* ---------- 主管身旁的電話：Orbitel 901 是「可攜式」電話（主機加電池，整機約 2.1 公斤） ----------
     實物外型沒有可靠的描述，這裡只是示意：一台厚重的主機放在派對的桌上，
     上面有小螢幕、話筒座與天線。它太重，不會像一般手機那樣拿在手上看。 */
  const UNIT = V(2.35, 0.88, -2.55);
  const unit = new THREE.Group();
  {
    const shell = box(0.34, 0.1, 0.22, '#2c3036'); shell.position.y = 0.05; unit.add(shell);
    const lid = box(0.32, 0.012, 0.2, '#3a4048'); lid.position.y = 0.106; unit.add(lid);
    const lcd = box(0.13, 0.014, 0.05, '#a9bf8e'); lcd.position.set(0, 0.118, 0.06); unit.add(lcd);
    const rest = box(0.06, 0.03, 0.16, '#1b1d21'); rest.position.set(-0.1, 0.128, -0.01); unit.add(rest);
    const handset = box(0.045, 0.03, 0.15, '#26292e'); handset.position.set(-0.1, 0.155, -0.01); unit.add(handset);
    const grip = box(0.1, 0.02, 0.02, '#1b1d21'); grip.position.set(0, 0.06, 0.125); unit.add(grip);
    const ant = cyl(0.006, 0.006, 0.32, '#202226', 6); ant.position.set(0.14, 0.26, -0.08); unit.add(ant);
  }
  unit.position.copy(UNIT);
  scene.add(unit);
  const LCD = () => unit.localToWorld(V(0, 0.13, 0.06));
  const TOUCH = () => unit.localToWorld(V(0.08, 0.12, 0.1));
  const restGrip = () => boss.local(-0.3, 0.84, 0.08);

  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const lerpAngle = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };
  const KEYBOARD = V(-1.8, 0.86, DESK_Z + 0.3);
  const ENTER = V(-1.55, 0.86, DESK_Z + 0.36);
  const MONITOR_CENTER = V(-1.8, 1.2, DESK_Z - 0.1);

  // 派對上的其他人，站著聊天
  function partyIdle(T) {
    guestW.reset(); guestW.pos.copy(GW_SPOT); guestW.yaw = faceTo(guestW, BOSS_SPOT); idle(guestW, T, 3);
    guestM.reset(); guestM.pos.copy(GM_SPOT); guestM.yaw = faceTo(guestM, BOSS_SPOT); idle(guestM, T, 5);
    guestW.look = head(boss); guestW.lookAmt = 0.5;
  }
  function engAtDesk(T) {
    eng.reset(); eng.pos.copy(NEIL); eng.yaw = Math.PI;
    eng.look = MONITOR_CENTER; eng.lookAmt = 0.9;
    idle(eng, T);
  }

  /* ---------- 劇本 ---------- */
  const beats = {
    // 工程師在電腦前打字，寫下那句聖誕祝福
    desk: {
      duration: 9,
      update(t, T) {
        engAtDesk(T);
        const typing = t > 0.8;
        eng.reach.R = {
          target: () => KEYBOARD.clone().add(V(Math.sin(T * 11) * 0.03, 0, typing ? Math.cos(T * 9) * 0.02 : 0)),
          pole: () => eng.local(0.6, 0.7, -0.2)
        };
        partyIdle(T);
        boss.reset(); boss.pos.copy(BOSS_SPOT); boss.yaw = faceTo(boss, V(-1.8, 0, 0));
        boss.bob = Math.sin(T * 1.1) * 0.006;
      }
    },
    // 按下送出，訊息就這樣飛出去了
    send: {
      duration: 7,
      update(t, T) {
        engAtDesk(T);
        const press = span(t, 3.0, 3.4) * (1 - span(t, 3.8, 4.3));
        eng.reach.R = {
          target: () => (t < 3.0 ? KEYBOARD.clone().add(V(Math.sin(T * 11) * 0.03, 0, 0)) : ENTER.clone().lerp(KEYBOARD, 1 - press)),
          pole: () => eng.local(0.6, 0.7, -0.2)
        };
        if (t > 4.6) eng.reach.R = null;
        eng.lean = t > 4.6 ? -0.05 * span(t, 4.6, 5.4) : 0;
        partyIdle(T);
        boss.reset(); boss.pos.copy(BOSS_SPOT); boss.yaw = faceTo(boss, V(-1.8, 0, 0));
      }
    },
    // 派對上，桌上的電話響了一下，主管走近、彎下腰，看見螢幕上出現那行字
    party: {
      duration: 10,
      update(t, T) {
        engAtDesk(T);
        boss.reset(); boss.pos.copy(BOSS_SPOT);
        const toNeil = faceTo(boss, V(-1.8, 0, 0)), toUnit = faceTo(boss, UNIT);
        const ring = span(t, 1.4, 1.8) * (1 - span(t, 2.6, 3.0));   // 電話響了：主管轉頭看一眼
        const lean = span(t, 2.6, 3.8);                              // 轉身、彎下腰看螢幕
        boss.yaw = lerpAngle(toNeil, toUnit, Math.max(ring * 0.5, lean));
        if (ring > 0 || lean > 0) { boss.look = LCD(); boss.lookAmt = Math.max(ring, lean); }
        boss.lean = 0.32 * lean;
        if (lean > 0) boss.reach.R = { target: () => restGrip().lerp(TOUCH(), lean), pole: () => boss.local(-0.6, 0.9, 0.2) };
        idle(boss, T, 2);
        partyIdle(T);
        guestW.look = head(boss); guestW.lookAmt = 0.4;
        guestM.look = head(boss); guestM.lookAmt = 0.3;
      }
    }
  };

  function finish() {
    people.forEach((p) => p.apply());
  }

  /* ---------- 螢幕特寫：電腦與手機 ---------- */
  // 電腦螢幕：一行字一個字一個字打出來，按下送出後顯示「已送出」
  function monitorInset(c, W, H, t) {
    const k = W / 320; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#0b1d33'; c.fillRect(0, 0, 320, h);
    c.fillStyle = '#1f3b5c'; c.fillRect(0, 0, 320, 26);
    c.fillStyle = '#e8f1ff'; c.font = `700 13px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.fillText('新訊息', 10, 13);
    const n = clamp(Math.floor((t - 0.8) * 9), 0, MSG.length);
    c.font = '600 26px monospace'; c.fillStyle = '#9be7a5';
    c.fillText(MSG.slice(0, n) + (n < MSG.length && Math.floor(t * 3) % 2 ? '_' : ''), 16, 80);
    c.fillStyle = '#7f96b5'; c.font = `500 12px ${FONT}`;
    c.fillText('收件人：行動電話', 16, 120);
    if (t > 3.4) {
      const a = span(t, 3.4, 3.9);
      c.globalAlpha = a;
      c.fillStyle = '#3b7d3b'; c.fillRect(16, 150, 288, 44);
      c.fillStyle = '#ffffff'; c.font = `800 18px ${FONT}`; c.textAlign = 'center';
      c.fillText('✓ 已送出', 160, 172);
      c.globalAlpha = 1;
    }
  }
  // 手機螢幕：單色 LCD，收到訊息後一個字一個字顯示
  function phoneInset(c, W, H, t) {
    const k = W / 240; c.scale(k, k);
    const h = H / k;
    c.fillStyle = '#a9bf8e'; c.fillRect(0, 0, 240, h);
    c.fillStyle = '#26301c'; c.font = '800 13px monospace'; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.fillText('MESSAGE', 10, 16);
    c.fillRect(8, 30, 224, 2);
    if (t > 3.6) {
      const n = clamp(Math.floor((t - 4.0) * 6), 0, MSG.length);
      c.font = '800 19px monospace';
      c.fillText(MSG.slice(0, n) + (n < MSG.length && Math.floor(t * 3) % 2 ? '_' : ''), 12, 66);
      if (n >= MSG.length) { c.font = '700 12px monospace'; c.fillText('1 new', 12, 110); }
    } else {
      c.font = '700 12px monospace'; c.fillText('(no messages)', 12, 66);
    }
    c.fillRect(0, h - 22, 240, 2); c.font = '800 13px monospace'; c.fillText('Read', 10, h - 10); c.textAlign = 'right'; c.fillText('Back', 230, h - 10);
  }

  return {
    view: { pos: V(0, 1.55, 3.0), yaw: 0, pitch: -0.05 },
    beats,
    // 同事在打字：手一直在鍵盤上方小幅度移動，身體微微搖晃
    ambient(T) {
      coworker.reset();
      coworker.pos.copy(COWORKER_SPOT);
      coworker.yaw = Math.PI;
      coworker.lean = 0.04 + Math.sin(T * 2.2) * 0.01;
      coworker.look = V(3.0, 1.2, 0.5); coworker.lookAmt = 0.8;
      coworker.reach.R = {
        target: () => KEY2.clone().add(V(Math.sin(T * 13) * 0.03, 0, Math.cos(T * 9) * 0.02)),
        pole: () => coworker.local(0.6, 0.7, 0.2)
      };
      coworker.bob = Math.sin(T * 1.1) * 0.004;
    },
    finish,
    insets: {
      desk: { aspect: 1.6, tone: 'phone', label: '電腦螢幕', draw: (c, W, H, t) => monitorInset(c, W, H, t) },
      send: { aspect: 1.6, tone: 'phone', label: '電腦螢幕', draw: (c, W, H, t) => monitorInset(c, W, H, t) },
      party: { aspect: 1.25, tone: 'lcd', label: '電話螢幕', draw: (c, W, H, t) => phoneInset(c, W, H, t) }
    },
    focus: {
      desk: () => MONITOR_CENTER.clone(),
      neil: () => head(eng),
      pc: () => MONITOR_CENTER.clone(),
      boss: () => head(boss),
      phone: () => unit.localToWorld(V(0, 0.12, 0)),
      party: () => head(boss).lerp(head(guestW), 0.35)
    },
    hotspots: {
      pc: { pos: () => MONITOR_CENTER.clone().add(V(0, 0.45, 0)), size: 0.5 },
      party: { pos: () => head(boss).add(V(0, 0.45, 0)), size: 0.5 },
      phone: { pos: () => unit.localToWorld(V(0, 0.24, 0)), size: 0.45 },
      sms: { pos: () => LCD().add(V(0, 0.12, 0)), size: 0.3 }
    }
  };
}
