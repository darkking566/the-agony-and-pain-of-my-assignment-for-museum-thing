// 沉浸場景：1982 年的街邊，一輛裝了車載電話的車。後車廂是主機，話筒用電話線接出來，走遠就拉不到了。
// 字幕和解說文字在 js/data.js 的 scenes['senator']；這裡只負責場景和動作。
import * as THREE from 'three';
import { V, span, lerp, mat, box, cyl, sign, textTexture, Person, placeBetween, building } from '../scene-kit.js';
import { buildPhone } from '../hall3d.js';
import { facadeMaterial, plasterTex, asphaltTex, pavingTex, blobShadow, decal, cloudSky, leafTree, fallenLeaves, lampPost, bin, bollards, hydrantAndGrate, manhole, bench, bicycle, phoneBooth, postBox, shopInteriorTex, awning, parkedCar, sedanProfile, extrudeSide } from './props.js';

export function build({ scene, phone }) {
  /* ---------- 天空與光線：灰藍色的秋天午後 ---------- */
  const skyGeo = new THREE.SphereGeometry(220, 32, 16);
  const top = new THREE.Color('#7f9ab4'), hor = new THREE.Color('#e3dccd');
  const cols = []; const pos = skyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const k = Math.max(0, Math.min(1, pos.getY(i) / 220 * 1.8)); const c = hor.clone().lerp(top, Math.pow(k, 0.8)); cols.push(c.r, c.g, c.b); }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
  cloudSky(scene);
  scene.fog = new THREE.Fog('#d9d5cb', 40, 130);
  scene.add(new THREE.HemisphereLight('#dfe8f2', '#7a6b58', 1.25));
  const sun = new THREE.DirectionalLight('#ffe9c8', 2.1);
  sun.position.set(-18, 26, 14); sun.target.position.set(0, 0, -2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 70 });
  sun.shadow.bias = -0.0005; sun.shadow.radius = 3;
  const fill = new THREE.DirectionalLight('#aebfd6', 0.35); fill.position.set(14, 10, 18); // 背光面補一點藍色天光
  scene.add(sun, sun.target, fill);

  /* ---------- 路面、人行道、路緣 ---------- */
  const faceMat = (tex, side) => [side, side, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), side, side, side];
  const asphaltM = mat('#2e2d2f', { roughness: 1 }), slabM = mat('#8e877b');
  const road = new THREE.Mesh(new THREE.BoxGeometry(140, 0.2, 5.4), faceMat(asphaltTex([35, 1.35]), asphaltM));
  road.position.set(0, -0.22, -2.7); road.receiveShadow = true; scene.add(road);                      // 路面頂 y=-0.12，比人行道低 12 公分
  const walkNear = new THREE.Mesh(new THREE.BoxGeometry(140, 0.3, 4.5), faceMat(pavingTex([140 / 2, 4.5 / 2]), slabM));
  walkNear.position.set(0, -0.15, 2.0); walkNear.receiveShadow = true;
  const walkFar = new THREE.Mesh(new THREE.BoxGeometry(140, 0.3, 4.0), faceMat(pavingTex([140 / 2, 2]), slabM));
  walkFar.position.set(0, -0.15, -7.3); walkFar.receiveShadow = true;
  scene.add(walkNear, walkFar);
  // 花崗岩路緣石：頂面比人行道高 5 毫米，突出到馬路一點
  const curbM = mat('#a2a09a', { roughness: 0.8 });
  const curbN = box(140, 0.16, 0.2, curbM); curbN.position.set(0, -0.04, -0.3); curbN.castShadow = false; curbN.position.y = -0.045 + 0.0;
  const curbF = box(140, 0.16, 0.2, curbM); curbF.position.set(0, -0.045, -5.2); curbF.castShadow = false;
  curbN.scale.y = 1.0; curbN.position.y = -0.045; scene.add(curbN, curbF);
  // 路上的標線與設施
  for (let i = 0; i < 7; i++) { const z = decal(0.5, 3.6, '#e8e4d8'); z.rotation.z = 0; z.position.set(14 + i * 0.95, -0.118, -2.7); scene.add(z); }   // 斑馬線
  const stopL = decal(0.4, 2.4, '#e8e4d8'); stopL.position.set(12.4, -0.118, -1.55); scene.add(stopL);                                              // 停止線
  [-3.2, -12.5, 21].forEach((x) => manhole(scene, x, -0.12, -3.4));
  manhole(scene, 6.4, -0.12, -1.5, 0.3);
  const grate = decal(0.7, 0.16, '#1c1c1e'); grate.position.set(-7.5, -0.118, -0.55); scene.add(grate);
  const stain = decal(2.2, 1.0, '#1a1a1c', 0.25); stain.position.set(-0.55, -0.118, -1.8); scene.add(stain);                                       // 停車位上長期滴的油漬
  const patch = decal(3.0, 1.2, '#323133', 0.9); patch.position.set(9.5, -0.118, -3.4); scene.add(patch);                                           // 補過的路面
  const cobble = decal(140, 0.06, '#8c887c', 0.55); cobble.position.set(0, 0.006, -0.12); scene.add(cobble);                                        // 人行道邊的排水縫

  /* ---------- 建築：磚色立面加店面細節 ---------- */
  const palette = ['#8a6a58', '#a89c86', '#6d6a63', '#9a7a62', '#7b6a58'];
  const shops = ['KIOSKI', 'APTEEKKI', 'KAHVILA', 'KIRJA', 'PANKKI', 'KENKÄ'];
  const awnCol = [['#9c2f2a', '#efe9da'], ['#2f5d4a', '#efe9da'], ['#c98a2b', '#efe9da'], ['#2f4a7a', '#efe9da']];
  const interiorTex = [0, 1, 2].map(shopInteriorTex);
  let bn = 0;
  for (let x = -60; x < 60; x += 8.2) {
    const w = 8, d = 10, bx = x + 4, bz = -14.5;
    const floors = 3 + ((bn * 5) % 5);                      // 3~7 層，窗戶剛好對齊樓層
    const bld = building({ x: bx, z: bz, w, h: 3.6 + floors * 3.2, d, facing: 1, color: palette[bn % palette.length], seed: bn + 3, shop: shops[bn % shops.length], shopColor: ['#1d2a3a', '#5a1f1b', '#1f3b2c', '#3b2a4a'][bn % 4] });
    const body = bld.children[0];
    const sgn = bld.children.find((m) => m.geometry && m.geometry.type === 'PlaneGeometry');
    if (sgn) { const sc = ['#1d2a3a', '#5a1f1b', '#1f3b2c', '#3b2a4a'][bn % 4]; sgn.material.map = textTexture(shops[bn % shops.length], { w: 1792, h: 250, bg: sc, color: '#f4efe6', size: 168 }); sgn.material.map.anisotropy = 16; sgn.material.needsUpdate = true; }
    body.material[4] = facadeMaterial(palette[bn % palette.length], bn, floors);
    const sideM = new THREE.MeshStandardMaterial({ map: plasterTex(palette[bn % palette.length], [d / 4, floors * 3.2 / 4]), roughness: 0.95 });
    body.material[0] = body.material[1] = sideM;
    scene.add(bld);
    const fz = bz + d / 2;                           // 立面的 z
    // 櫥窗裡面：有貨架、有燈（貼在原本的黑玻璃前面）
    const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.84, 2.2), new THREE.MeshStandardMaterial({ map: interiorTex[bn % 3], emissive: '#ffffff', emissiveMap: interiorTex[bn % 3], emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.1 }));
    win.position.set(bx, 1.5, fz + 0.062); scene.add(win);
    // 窗框直條、門
    for (let k = -2; k <= 2; k++) { const m = box(0.06, 2.3, 0.07, '#23201c'); m.position.set(bx + k * (w * 0.84 / 4), 1.5, fz + 0.075); m.castShadow = false; scene.add(m); }
    const sill = box(w * 0.88, 0.1, 0.18, '#4a4036'); sill.position.set(bx, 0.35, fz + 0.1); scene.add(sill);
    // 遮陽篷（每隔一家有）
    if (bn % 2 === 0) { const a = awning(w * 0.84, ...awnCol[(bn >> 1) % 4]); a.position.set(bx, 2.95, fz + 0.75); scene.add(a); }
    // 水管
    const pipe = cyl(0.05, 0.05, 9, '#4a4640', 8); pipe.position.set(bx + w / 2 - 0.2, 4.5, fz + 0.1); pipe.castShadow = false; scene.add(pipe);
    // 懸掛式招牌
    if (bn % 3 === 1) { const br = box(0.7, 0.03, 0.03, '#23262a'); br.position.set(bx + 1.8, 3.9, fz + 0.4); const bd = box(0.04, 0.5, 0.5, shopsCol(bn)); bd.position.set(bx + 2.15, 3.65, fz + 0.4); scene.add(br, bd); }
    bn++;
  }
  function shopsCol(i) { return ['#c98a2b', '#2f5d7a', '#9c2f2a'][i % 3]; }

  /* ---------- 街道上的東西 ---------- */
  [[-6, -5.8, 1, 1], [7.5, -5.8, 2, 1.05], [-14, -5.8, 3, 0.95], [16, -5.8, 4, 1.1], [-22, -5.8, 5, 1], [26, -5.8, 6, 1]].forEach(([x, z, s, k]) => leafTree(scene, x, z, s, k));
  [-10, 4, 18, -24].forEach((x) => lampPost(scene, x, -5.55, 1));
  fallenLeaves(scene, [[-30, 30, -9.2, -5.4, 0], [-30, 30, -5.2, -0.3, -0.12], [-30, 30, 0, 3.5, 0]], 420);
  phoneBooth(scene, -12.5, -8.6, 0);
  postBox(scene, 11.0, -6.5);
  bin(scene, 2.2, -6.0); bin(scene, -8.0, -6.0); bin(scene, -5.2, 0.5);
  bench(scene, -3.0, -6.6, Math.PI);
  bicycle(scene, 5.6, -5.9, 0.05); bicycle(scene, -9.3, -5.9, -0.1, '#8a3b2a');
  bollards(scene, [20, 21.4, 22.8, 24.2], -6.4);
  hydrantAndGrate(scene, 9.0, -5.9);
  { const pole = cyl(0.05, 0.05, 2.3, '#7a7e84', 8); pole.position.set(-1.2, 1.15, -5.85); const sg = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshStandardMaterial({ map: textTexture('P', { w: 128, h: 128, bg: '#1a4f9a', color: '#fff', size: 100 }), roughness: 0.5 })); sg.position.set(-1.2, 2.25, -5.85); scene.add(pole, sg); }
  parkedCar(scene, -9.5, -4.3, Math.PI, '#2f4a5f');
  parkedCar(scene, 13.5, -4.3, Math.PI, '#c9c2ac');

  /* ---------- 車子：自己組，後車廂才能打開 ---------- */
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: '#6b2f2a', roughness: 0.38, metalness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const carBody = paint, carMat = undefined;
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#1b262d', roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.55 });
  const chrome = mat('#c8ccd0', { metalness: 0.85, roughness: 0.25 }), black = mat('#141414', { roughness: 0.7 });
  const { cabin: cabinShape } = sedanProfile();
  const lowerShape = new THREE.Shape(); // 前半車身：從後車廂前緣 (x=-0.85) 到車頭
  [[-0.85, 0.26], [2.12, 0.26], [2.16, 0.52], [2.08, 0.72], [1.2, 0.86], [-0.85, 0.88]].forEach(([x, y], i) => (i ? lowerShape.lineTo(x, y) : lowerShape.moveTo(x, y)));
  const fbody = new THREE.Mesh(extrudeSide(lowerShape, 1.76, 0.05), paint); fbody.castShadow = fbody.receiveShadow = true;
  const cabinGlass = new THREE.Mesh(extrudeSide(cabinShape, 1.5, 0.02), glassM); cabinGlass.castShadow = false;
  const roof = box(1.14, 0.07, 1.58, paint); roof.position.set(0.05, 1.45, 0);
  const pillar = (ax, ay, bx, by, z) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); const p = box(L, 0.07, 0.05, paint); p.position.set((ax + bx) / 2, (ay + by) / 2, z); p.rotation.z = Math.atan2(dy, dx); return p; };
  const pillars = [];
  [-0.77, 0.77].forEach((z) => {
    pillars.push(pillar(1.18, 0.88, 0.6, 1.44, z), pillar(-0.5, 1.44, -0.98, 0.9, z)); // A 柱、C 柱
    const b = box(0.07, 0.56, 0.05, paint); b.position.set(-0.1, 1.16, z); pillars.push(b);  // B 柱
  });
  // 後車廂：底、兩側、後板，上方開口
  const tFloor = box(0.85, 0.06, 1.75, paint); tFloor.position.set(-1.275, 0.26, 0);
  const tL = box(0.85, 0.62, 0.05, paint); tL.position.set(-1.275, 0.58, -0.85);
  const tR = box(0.85, 0.62, 0.05, paint); tR.position.set(-1.275, 0.58, 0.85);
  const tBack = box(0.05, 0.62, 1.75, paint); tBack.position.set(-1.7, 0.58, 0);
  const tFront = box(0.05, 0.56, 1.75, '#241412'); tFront.position.set(-0.85, 0.57, 0);
  const tInside = box(0.8, 0.02, 1.64, '#5a5a5e'); tInside.position.set(-1.275, 0.3, 0);
  const bumperF = box(0.14, 0.2, 1.82, chrome); bumperF.position.set(2.2, 0.4, 0);
  const bumperR = box(0.14, 0.2, 1.82, chrome); bumperR.position.set(-1.8, 0.4, 0);
  const rubF = box(0.145, 0.04, 1.6, black); rubF.position.set(2.2, 0.4, 0); const rubR = rubF.clone(); rubR.position.x = -1.8;
  car.add(fbody, cabinGlass, roof, ...pillars, tFloor, tL, tR, tBack, tFront, tInside, bumperF, bumperR, rubF, rubR);
  // 車頭：水箱護罩、大燈、車牌；車尾：尾燈、車牌
  const grille = box(0.04, 0.17, 0.95, '#101214'); grille.position.set(2.18, 0.6, 0);
  for (let i = 0; i < 4; i++) { const s = box(0.05, 0.015, 0.93, chrome); s.position.set(2.2, 0.55 + i * 0.04, 0); car.add(s); }
  [0.64, -0.64].forEach((lz) => {
    const h = box(0.05, 0.15, 0.36, '#fff6d8', { emissive: '#fff1c4', emissiveIntensity: 0.5 }); h.position.set(2.17, 0.64, lz);
    const hr = box(0.055, 0.19, 0.4, chrome); hr.position.set(2.165, 0.64, lz);
    const tl = box(0.05, 0.14, 0.4, '#a01e18', { emissive: '#6a0c08', emissiveIntensity: 0.4 }); tl.position.set(-1.73, 0.68, lz * 1.02);
    car.add(hr, h, tl);
  });
  const plateF = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.12), new THREE.MeshStandardMaterial({ map: textTexture('KLM-421', { w: 256, h: 64, bg: '#f4f2ea', color: '#1a1a1a', size: 44, weight: 700 }), roughness: 0.5 })); plateF.position.set(2.275, 0.4, 0); plateF.rotation.y = Math.PI / 2;
  const plateR = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.12), new THREE.MeshStandardMaterial({ map: textTexture('PHE-903', { w: 256, h: 64, bg: '#e6b92c', color: '#1a1a1a', size: 44, weight: 700 }), roughness: 0.5 })); plateR.position.set(-1.728, 0.58, 0); plateR.rotation.y = -Math.PI / 2;
  car.add(grille, plateF, plateR);
  // 車身側面的細節：腰線、護條、車門縫、門洞（車門打開時看到的黑色門洞）
  const trimDark = mat('#1c1b1b', { roughness: 0.6 });
  [-1, 1].forEach((sd) => {
    const zz = sd * 0.884;
    const belt = box(2.9, 0.03, 0.012, chrome); belt.position.set(0.55, 0.86, zz); belt.castShadow = false;
    const mold = box(3.4, 0.07, 0.014, trimDark); mold.position.set(0.15, 0.52, zz); mold.castShadow = false;
    const sill = box(2.6, 0.06, 0.02, trimDark); sill.position.set(0.6, 0.29, zz); sill.castShadow = false;
    car.add(belt, mold, sill);
    [0.9, -0.1].forEach((gx) => { const gap = box(0.012, 0.58, 0.01, '#120a0a'); gap.position.set(gx, 0.6, zz); gap.castShadow = false; car.add(gap); });
    const gapB = box(1.0, 0.012, 0.01, '#120a0a'); gapB.position.set(0.4, 0.31, zz); gapB.castShadow = false; car.add(gapB);
  });
  const doorWell = box(1.0, 0.56, 0.012, '#0d0b0b'); doorWell.position.set(0.4, 0.58, -0.882); doorWell.castShadow = false; car.add(doorWell);   // 車門後面的門洞
  const seatInDoor = box(0.5, 0.4, 0.02, seatM0()); seatInDoor.position.set(0.1, 0.62, -0.87); car.add(seatInDoor);
  function seatM0() { return mat('#3a2a22', { roughness: 0.9 }); }
  // 車輪：輪胎、鋁圈、輪拱的黑影
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 20), rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.225, 16), capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.23, 10);
  const tire = mat('#121212', { roughness: 0.9 }), rimM = mat('#b9bcc0', { metalness: 0.8, roughness: 0.3 });
  [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(wheelGeo, tire), rim = new THREE.Mesh(rimGeo, rimM), cap = new THREE.Mesh(capGeo, chrome);
    [w, rim, cap].forEach((m) => { m.rotation.x = Math.PI / 2; m.position.set(wx, 0.33, wz); });
    w.castShadow = true; car.add(w, rim, cap);
    const arch = new THREE.Mesh(new THREE.CircleGeometry(0.42, 22), new THREE.MeshBasicMaterial({ color: '#070707', polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    arch.position.set(wx, 0.36, Math.sign(wz) * 0.888); if (wz < 0) arch.rotation.y = Math.PI; car.add(arch);
  });
  // 後視鏡、門把（副駕駛側；駕駛側的在車門上）
  const mirR = box(0.1, 0.09, 0.16, paint); mirR.position.set(0.95, 1.22, 0.96); car.add(mirR);
  const hdlR = box(0.14, 0.03, 0.03, chrome); hdlR.position.set(0.0, 0.8, 0.9); car.add(hdlR);
  // 車內：儀表板、座椅、方向盤、話筒座
  const seatM = mat('#3a2a22', { roughness: 0.9 });
  const dash = box(0.35, 0.18, 1.5, '#1e1c1a'); dash.position.set(0.95, 0.96, 0);
  [-0.4, 0.4].forEach((sz) => { const s = box(0.5, 0.1, 0.55, seatM); s.position.set(0.35, 0.8, sz); const b = box(0.1, 0.5, 0.52, seatM); b.position.set(0.08, 1.05, sz); b.rotation.z = -0.2; car.add(s, b); });
  const bench2 = box(0.55, 0.1, 1.4, seatM); bench2.position.set(-0.55, 0.8, 0); const bench2b = box(0.1, 0.45, 1.4, seatM); bench2b.position.set(-0.85, 1.0, 0); bench2b.rotation.z = -0.2;
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 6, 20), black); sw.position.set(0.82, 1.1, -0.4); sw.rotation.y = Math.PI / 2; sw.rotation.x = 0.2;
  const console_ = box(0.5, 0.12, 0.2, '#2a2826'); console_.position.set(0.5, 0.85, 0);
  car.add(dash, bench2, bench2b, sw, console_);
  // 後車窗上的螺旋天線（車用電話的標誌），裝在車頂後方
  const ant = new THREE.Group();
  {
    const rod = cyl(0.008, 0.008, 0.7, '#202020', 6); rod.position.y = 0.35;
    const base = cyl(0.035, 0.04, 0.03, '#202020', 8); base.position.y = 0.01;
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), mat('#202020')); coil.rotation.x = Math.PI / 2; coil.position.y = 0.3;
    ant.add(rod, base, coil); ant.position.set(-0.4, 1.47, -0.45); car.add(ant);
  }
  // 後車廂蓋：繞前緣轉動
  const lid = new THREE.Group(); lid.position.set(-0.85, 0.86, 0);
  const lidBox = box(0.9, 0.05, 1.75, paint); lidBox.position.set(-0.45, 0, 0); lid.add(lidBox); car.add(lid);
  // 駕駛座車門：繞前緣轉動，往車外開
  const door = new THREE.Group(); door.position.set(0.9, 0.9, -0.88);
  const doorBox = box(1.0, 0.56, 0.05, paint); doorBox.position.set(-0.5, -0.3, 0);
  const handle = box(0.14, 0.03, 0.04, chrome); handle.position.set(-0.8, -0.1, -0.04);
  const mirL = box(0.1, 0.09, 0.16, paint); mirL.position.set(0.05, 0.32, -0.1);
  const sillL = box(1.0, 0.025, 0.012, chrome); sillL.position.set(-0.5, -0.5, -0.031);
  door.add(doorBox, handle, mirL, sillL); car.add(door);
  // 後車廂裡的主機（大黑箱）加話筒的外型，用展品的模型
  const unit = new THREE.Group();
  {
    const m = buildPhone(phone);
    const b = new THREE.Box3().setFromObject(m); const c = b.getCenter(V()); m.position.sub(c);
    const inner = new THREE.Group(); inner.add(m); inner.scale.setScalar(0.6);
    inner.rotation.x = -0.3;                         // 往駕駛側（鏡頭這邊）傾斜，從路邊看得到正面
    inner.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const tray = box(0.7, 0.05, 0.9, '#2a2c2e', { metalness: 0.5 }); tray.position.set(-1.275, 0.33, 0);   // 固定主機的托盤
    const trunkLight = new THREE.PointLight('#fff2dc', 0.7, 3, 1.6); trunkLight.position.set(-1.275, 0.8, -0.3);   // 後車廂的小燈，讓主機看得清楚
    unit.add(inner); unit.position.set(-1.275, 0.6, -0.02); car.add(unit, tray, trunkLight);
  }
  // 話筒線的掛點（駕駛座旁）
  const hook = new THREE.Object3D(); hook.position.set(0.25, 0.95, -0.6); car.add(hook);
  const cradle = box(0.1, 0.18, 0.07, '#222'); cradle.position.set(0.25, 0.88, -0.66); car.add(cradle);
  const shadowBlob = blobShadow(5.2, 2.5, 0.6); shadowBlob.rotation.z = 0; shadowBlob.position.set(0.15, 0.012, 0); car.add(shadowBlob);
  car.rotation.y = Math.PI; scene.add(car);
  const ZC = -1.8, X_PARK = -0.6;
  let carX = X_PARK;
  function setCar(x, doorOpen, lidOpen) {
    carX = x; car.position.set(x, -0.11, ZC);
    door.rotation.y = -1.05 * doorOpen;
    lid.rotation.z = -1.3 * lidOpen;
  }
  // 走到車子某個位置時用的世界座標（車子面向 -x，所以車頭在左、車尾在右，駕駛座在靠鏡頭這一側）
  const W = (lx, ly, lz) => V(carX - lx, ly, ZC - lz);
  const DOOR_SPOT = () => W(0.1, 0, -1.6);
  const TRUNK_SPOT = () => W(-2.5, 0, 0.1);

  /* ---------- 話筒與電話線 ---------- */
  const handset = new THREE.Group();
  {
    const hm = mat('#1c1c1c', { roughness: 0.5 });
    const ear = box(0.075, 0.06, 0.07, hm); ear.position.set(0, 0, 0.015);
    const bar = box(0.04, 0.19, 0.04, hm); bar.position.set(0, -0.1, 0);
    const mouth = box(0.07, 0.06, 0.07, hm); mouth.position.set(0, -0.2, 0.015);
    handset.add(ear, bar, mouth); handset.scale.setScalar(1.3);
  }
  scene.add(handset);
  // 電話線：十幾小段圓柱接起來，每一格依兩端位置更新
  const CORD_N = 18, cordMat = new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.7 });
  const cordSegs = Array.from({ length: CORD_N }, () => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 6), cordMat); m.castShadow = true; scene.add(m); return m;
  });
  const cordPts = Array.from({ length: CORD_N + 1 }, () => V());
  const UP = V(0, 1, 0), tmpD = V(), tmpM = V();
  const CORD_LEN = 2.3;
  function updateCord() {
    const a = hook.getWorldPosition(V()), b = handset.localToWorld(V(0, -0.22, 0));
    const d = a.distanceTo(b);
    const sag = Math.max(0.01, (CORD_LEN - d) * 0.45);
    cordPts.forEach((p, i) => { const k = i / CORD_N; p.lerpVectors(a, b, k); p.y -= Math.sin(Math.PI * k) * sag; });
    cordSegs.forEach((m, i) => {
      tmpD.subVectors(cordPts[i + 1], cordPts[i]); const len = tmpD.length();
      m.position.copy(tmpM.addVectors(cordPts[i], cordPts[i + 1]).multiplyScalar(0.5));
      m.quaternion.setFromUnitVectors(UP, tmpD.normalize()); m.scale.set(1, Math.max(len, 0.001), 1);
    });
  }

  /* ---------- 人物 ---------- */
  const people = [];
  const add = (p) => { people.push(p); scene.add(p.root); return p; };
  const A = add(new Person({ top: '#7a5a3a', bottom: '#33302c', hair: '#3a2a1c', skin: '#e2b48e', height: 1.02, sleeves: '#7a5a3a' }));
  const C = add(new Person({ top: '#556b4f', bottom: '#4a4038', hair: '#a8a8a8', skin: '#e0b494', height: 0.98 }));
  const D = add(new Person({ top: '#7a5a8c', bottom: '#7a5a8c', dress: true, hair: '#d2d2d2', skin: '#e6c0a0', height: 0.94 }));
  const walkers = [
    { p: add(new Person({ top: '#8c3b3b', bottom: '#2a2a2e', hair: '#222' })), z: -7.0, v: 1.3, off: 0 },
    { p: add(new Person({ top: '#3c5c7c', bottom: '#2a2a2e', hair: '#111', dress: false })), z: -8.0, v: -1.2, off: 22 }
  ];
  // 衣著小細節：駕駛戴針織帽、穿厚外套；路人圍圍巾、戴帽子
  {
    const wool = mat('#2c3a4a', { roughness: 1 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.07, 14), wool); cap.position.set(0, 0.235, 0.0); cap.castShadow = true; A.head.add(cap);
    const brim = box(0.2, 0.02, 0.08, wool); brim.position.set(0, 0.215, 0.13); A.head.add(brim);
    const coatHem = box(0.46, 0.34, 0.27, '#7a5a3a'); coatHem.position.set(0, -0.07, 0); A.torso.add(coatHem);
    const collar = box(0.3, 0.07, 0.2, '#4a3a28'); collar.position.set(0, 0.6, 0); A.torso.add(collar);
    const scarf = box(0.3, 0.1, 0.27, '#8a2f2a'); scarf.position.set(0, 0.61, 0); C.torso.add(scarf);
    const tail = box(0.07, 0.3, 0.03, '#8a2f2a'); tail.position.set(0.06, 0.45, 0.135); C.torso.add(tail);
    const cap2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.07, 14), mat('#43483f', { roughness: 1 })); cap2.position.set(0, 0.24, 0); C.head.add(cap2);
    const beret = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), mat('#a83a52', { roughness: 1 })); beret.position.set(0, 0.17, 0); beret.rotation.x = -0.25; beret.castShadow = true; D.head.add(beret);
  }
  people.forEach((p) => { const b = blobShadow(0.9, 0.7, 0.5); b.position.y = 0.012; p.root.add(b); });
  const earA = new THREE.Object3D(); earA.position.set(0, -0.11, -0.06); A.ear.L.add(earA);
  const head = (p) => p.head.localToWorld(V(0, 0.12, 0));
  const faceTo = (p, t) => Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
  const lookAt = (p, v, a = 1) => { p.look = v; p.lookAmt = a; };
  const idle = (p, T, ph = 0) => { p.headTilt = Math.sin(T * 1.7 + ph) * 0.05; p.bob = Math.sin(T * 1.1 + ph) * 0.006; };

  // 話筒：hook（掛著）→ ear（左耳）
  let hk = 0, hookedOn = true;
  function setHandset(k) { hk = k; hookedOn = k <= 0; }
  function placeHandset() {
    if (hookedOn) { placeBetween(handset, hook, hook, 0); return; }
    placeBetween(handset, hook, earA, hk);
  }
  const hookGrip = () => hook.getWorldPosition(V()).add(V(0, -0.1, 0));
  const earGrip = () => earA.localToWorld(V(0, -0.11, -0.06));
  function handsetReach(k, pole = () => A.local(0.8, 1.0, 0.2)) {
    A.reach.L = k > 0 ? { target: () => hookGrip().lerp(earGrip(), k), pole } : null;
  }
  const restL = () => A.local(0.3, 0.84, 0.08);
  const poleRestL = () => A.local(0.5, 0.6, -0.1);
  // 手伸到後車廂蓋的前緣再往上推
  const lidFree = () => lid.localToWorld(V(-0.9, 0.04, 0.0));

  /* ---------- 劇本 ---------- */
  const beats = {
    park: {
      duration: 12,
      update(t, T) {
        const k = span(t, 0.3, 5.6);
        setCar(lerp(24, X_PARK, 1 - Math.pow(1 - k, 2.2)), span(t, 6.0, 7.4), 0);
        A.reset(); setHandset(0); handsetReach(0);
        const exit = span(t, 7.0, 9.6);
        if (t < 7.2) { A.pos.set(0, -20, 0); } else { A.walk(V(carX - 0.1, 0, ZC + 0.7), V(carX - 0.3, 0, ZC + 1.9), t, 7.2, 9.6); }
        C.reset(); C.pos.set(-30, 0, 0); D.reset(); D.pos.set(30, 0, 0);
      }
    },
    trunk: {
      duration: 12,
      update(t, T) {
        setCar(X_PARK, 1, span(t, 4.6, 6.4));
        A.reset(); setHandset(0); handsetReach(0);
        const spot = V(carX + 2.6, 0, ZC + 1.9);
        const wk = A.walk(V(carX - 0.3, 0, ZC + 1.9), spot, t, 0.4, 4.2);
        if (wk >= 1) { A.yaw = lerp(A.yaw, faceTo(A, V(carX + 2.2, 0, ZC)), span(t, 4.2, 4.6)); }
        if (t > 4.2) A.reach.R = { target: () => A.local(-0.3, 0.84, 0.08).lerp(lidFree(), Math.min(1, span(t, 4.2, 4.8))), pole: () => A.local(-0.7, 0.9, 0.3) };
        if (t > 6.6) { A.reach.R = null; lookAt(A, W(-1.3, 0.7, 0), span(t, 6.6, 7.6)); }
        C.reset(); C.pos.set(-30, 0, 0); D.reset(); D.pos.set(30, 0, 0);
      }
    },
    handset: {
      duration: 14,
      update(t, T) {
        setCar(X_PARK, 1, 1);
        A.reset();
        const walkBack = A.walk(V(carX + 2.6, 0, ZC + 1.9), V(carX - 0.3, 0, ZC + 1.9), t, 0.2, 3.0);
        if (walkBack >= 1) A.yaw = lerp(A.yaw, faceTo(A, W(0.3, 0.9, -0.7)), span(t, 3.0, 3.6));
        // 拿起話筒、貼到耳朵
        const k = span(t, 4.2, 5.6);
        setHandset(k); handsetReach(k);
        if (t > 3.4 && t < 4.2) lookAt(A, W(0.3, 0.9, -0.7), 1);
        if (t >= 5.6) { idle(A, T); A.headTilt += 0.03; }
        // 路人好奇地停下來看
        C.reset(); D.reset();
        const cw = C.walk(V(14, 0, ZC + 3.1), V(4.2, 0, ZC + 3.0), t, 4.0, 10.0);
        if (cw >= 1) { C.yaw = faceTo(C, A.pos); lookAt(C, head(A), 1); idle(C, T, 2); } else lookAt(C, head(A), span(t, 7, 9) * 0.6);
        const dw = D.walk(V(15, 0, ZC + 3.2), V(5.1, 0, ZC + 3.0), t, 4.4, 10.6);
        if (dw >= 1) { D.yaw = faceTo(D, A.pos); lookAt(D, head(A), 1); idle(D, T, 3); } else lookAt(D, head(A), span(t, 7.4, 9.4) * 0.6);
      }
    },
    range: {
      duration: 13,
      update(t, T) {
        setCar(X_PARK, 1, 1);
        setHandset(1); handsetReach(1);
        const home = V(carX - 0.3, 0, ZC + 1.9);
        const far = V(carX - 3.0, 0, ZC + 2.1);
        A.reset();
        // 往外走，走到線拉直就停住；再被拉回來
        const out = span(t, 1.2, 5.2);
        const stop = Math.min(out, 0.78);
        const back = span(t, 8.0, 11.2);
        const prog = stop * (1 - back);
        A.pos.lerpVectors(home, far, prog);
        const moving = (out > 0 && out < 0.78) || (back > 0 && back < 1);
        A.yaw = back > 0 ? Math.atan2(home.x - far.x, home.z - far.z) : Math.atan2(far.x - home.x, far.z - home.z);
        A.walkAmt = moving ? 1 : 0; A.walkPhase = prog * 18;
        const taut = span(t, 5.1, 5.5) * (1 - span(t, 7.4, 7.9));
        A.lean = -0.18 * taut;
        A.headTilt = 0.1 * taut;
        if (t > 6.2 && t < 8.0) lookAt(A, hook.getWorldPosition(V()), 0.9);
        C.reset(); C.pos.set(4.2, 0, ZC + 3.0); C.yaw = faceTo(C, V(carX - 1.5, 0, ZC + 2)); lookAt(C, head(A), 1); idle(C, T, 2);
        D.reset(); D.pos.set(5.1, 0, ZC + 3.0); D.yaw = faceTo(D, V(carX - 1.5, 0, ZC + 2)); lookAt(D, head(A), 1); idle(D, T, 3);
      }
    },
    leave: {
      duration: 16,
      update(t, T) {
        // 掛上話筒、關後車廂、上車、開走
        const door0 = V(carX - 0.3, 0, ZC + 1.9);
        const hang = span(t, 0.2, 1.4);
        const carGone = span(t, 11.0, 15.4);
        const closeLid = 1 - span(t, 4.6, 6.0);
        const doorK = t < 6.6 ? 1 : 1 - span(t, 10.0, 10.8);
        setCar(lerp(X_PARK, -30, carGone * carGone), doorK, t < 4.4 ? 1 : closeLid);
        A.reset();
        // 掛上話筒
        const k = 1 - hang; setHandset(k); handsetReach(k);
        if (t < 1.6) { A.pos.copy(door0); A.yaw = faceTo(A, W(0.3, 0.9, -0.7)); }
        // 走到車尾關後車廂
        const toRear = A.walk(door0, V(carX + 2.6, 0, ZC + 1.9), t, 1.6, 3.8);
        if (t >= 1.6) { A.reach.L = null; }
        if (t >= 3.8) A.yaw = lerp(A.yaw, faceTo(A, V(carX + 2.2, 0, ZC)), span(t, 3.8, 4.3));
        if (t > 4.2 && t < 6.2) A.reach.R = { target: () => lidFree(), pole: () => A.local(-0.7, 0.9, 0.3) };
        // 走回駕駛座、上車（人消失在車裡）
        if (t >= 6.4) { A.reach.R = null; A.walk(V(carX + 2.6, 0, ZC + 1.9), V(carX - 0.1, 0, ZC + 0.9), t, 6.4, 9.6); }
        if (t > 9.8) A.pos.set(carX, -20, ZC);
        C.reset(); C.pos.set(4.2, 0, ZC + 3.0); C.yaw = faceTo(C, V(0, 0, ZC)); lookAt(C, W(0.3, 1.0, 0), t < 11 ? 0.7 : 1);
        D.reset(); D.pos.set(5.1, 0, ZC + 3.0); D.yaw = faceTo(D, V(0, 0, ZC)); lookAt(D, W(0.3, 1.0, 0), 0.7);
        if (t > 11) { C.look = W(0, 1.0, 0); D.look = W(0, 1.0, 0); }
      }
    }
  };

  function ambient(T) {
    walkers.forEach((w) => {
      const L = 90, d = ((w.off + T * Math.abs(w.v)) % L), x = w.v > 0 ? d - L / 2 : L / 2 - d;
      w.p.reset(); w.p.pos.set(x, 0, w.z); w.p.yaw = w.v > 0 ? Math.PI / 2 : -Math.PI / 2; w.p.walkAmt = 1; w.p.walkPhase = d * 4.4;
    });
  }
  function finish() {
    people.forEach((p) => p.apply());
    placeHandset(); updateCord();
  }

  return {
    view: { pos: V(0, 1.55, 3.6), yaw: 0, pitch: -0.05 },
    closeDist: 4.2,
    focusCam: { trunk: () => V(carX + 4.0, 2.7, ZC - 0.2) },
    exploreCam: () => V(carX + 3.9, 2.4, ZC - 0.8),
    beats, ambient, finish,
    focus: {
      street: () => V(0, 1.4, -2),
      car: () => W(0, 1.0, 0),
      trunk: () => W(-1.3, 0.9, 0),
      door: () => W(0.3, 1.0, -0.8),
      a: () => head(A)
    },
    hotspots: {
      unit: { pos: () => W(-1.275, 1.1, -0.02), size: 0.5 },
      antenna: { pos: () => W(-0.4, 2.3, -0.45), size: 0.45 },
      senator: { pos: () => W(0.3, 2.0, 0), size: 0.55 },
      handset: { pos: () => handset.getWorldPosition(V()).add(V(0.0, 0.3, 0)), size: 0.32 },
      cord: { pos: () => hook.getWorldPosition(V()).add(V(0, 0.45, 0)), size: 0.4 },
      network: { pos: () => V(-4, 6.0, -14), size: 1.4 }
    }
  };
}
