// 新場景共用的小零件：手機在手上、耳邊、胸前、腰間、口袋之間移動；手指在螢幕上滑；簡單的房間。
// 規則跟 scene-kit.js 一樣：每段演出的 update(t, T) 只看時間，所以可以跳到任何時間點。
import * as THREE from 'three';
import { V, span, lerp, box, cyl, placeBetween } from '../scene-kit.js';
import { buildPhone } from '../phones3d.js';

/** 把 3D 手機模型縮成指定大小（最長邊 maxDim 公尺），原點放在機身中心 */
export function loadPhone(scene, p, maxDim) {
  const rig = buildPhone(p);
  const model = rig.root;
  const b = new THREE.Box3().setFromObject(model);
  const s = new THREE.Vector3(); b.getSize(s);
  const c = b.getCenter(V());
  model.position.sub(c);
  const g = new THREE.Group(); g.add(model);
  g.scale.setScalar(maxDim / Math.max(s.x, s.y, s.z));
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const obj = new THREE.Group(); obj.add(g); scene.add(obj);
  // StarTAC 這類貝殼機有可以開闔的上蓋：由模型自己的「open」狀態控制
  return { obj, rig, lid: rig.t.open !== undefined };
}

/** 讓貝殼機的上蓋開闔。open：0＝闔上，1＝打開 */
export function setLid(h, open) {
  if (!h.lid) return;
  h.rig.s.open = h.rig.t.open = open;
  h.rig.update(0, 0);
}

/**
 * 拿手機的人。姿勢：hand（手放下）、chest（胸前看螢幕）、ear（貼耳朵）、belt（腰間）、pocket（口袋）。
 * h.go(from, to, k)：k 從 0 到 1，手機從 from 移到 to。h.place() 放在 finish() 最後。
 */
export function makeHolder(person, obj, { ear = V(0, -0.05, 0.0), grip = V(0, -0.04, -0.02) } = {}) {
  const hold = new THREE.Object3D(); hold.position.set(0, 0.02, 0.05); person.arms.R.grip.add(hold);
  const mk = (rx, ry, rz, x, y, z, parent = person.root) => {
    const o = new THREE.Object3D(); o.rotation.set(rx, ry, rz); o.position.set(x, y, z); parent.add(o); return o;
  };
  const earA = mk(0, 0, 0, ear.x, ear.y, ear.z, person.ear.R);
  const anchors = {
    hand: hold,
    chest: mk(0.55, Math.PI, 0, -0.08, 1.3, 0.36),
    belt: mk(0, Math.PI, 0, -0.2, 0.96, 0.15),
    pocket: mk(0, Math.PI, 0, -0.17, 1.26, 0.14),
    ear: earA
  };
  const gripOf = {
    hand: () => person.local(-0.3, 0.84, 0.08),
    chest: () => anchors.chest.localToWorld(grip.clone()),
    belt: () => person.local(-0.26, 0.86, 0.14),
    pocket: () => person.local(-0.2, 1.2, 0.2),
    ear: () => earA.localToWorld(V(grip.x, grip.y * 0.6, grip.z - 0.02))
  };
  const poleOf = {
    hand: () => person.local(-0.5, 0.6, -0.1),
    chest: () => person.local(-0.6, 0.85, 0.1),
    belt: () => person.local(-0.6, 0.6, -0.1),
    pocket: () => person.local(-0.55, 0.9, 0.0),
    ear: () => person.local(-0.75, 0.75, 0.3)
  };
  const st = { from: 'hand', to: 'hand', k: 0 };
  const h = {
    anchors, st,
    go(from, to, k) {
      st.from = from; st.to = to; st.k = k;
      if (from === 'hand' && to === 'hand') { person.reach.R = null; return; }
      person.reach.R = {
        target: () => gripOf[from]().lerp(gripOf[to](), k),
        pole: () => poleOf[from]().lerp(poleOf[to](), k)
      };
    },
    /** 一直放在同一個姿勢 */
    hold(pose) { h.go(pose, pose, 0); st.k = 0; if (pose !== 'hand') { person.reach.R = { target: gripOf[pose], pole: poleOf[pose] }; } },
    place() {
      const { from, to, k } = st;
      if (from === to) {
        if (from === 'hand') placeBetween(obj, hold, hold, 0);
        else placeBetween(obj, anchors[from], anchors[from], 0);
      } else if (from === 'hand') placeBetween(obj, hold, anchors[to], span(k, 0.6, 1));
      else if (to === 'hand') placeBetween(obj, anchors[from], hold, span(k, 0, 0.4));
      else placeBetween(obj, anchors[from], anchors[to], k);
    },
    pos: () => obj.getWorldPosition(V())
  };
  return h;
}

/** 左手的一根手指伸到某個姿勢的手機螢幕前面（ox, oy 是在手機面上的位置，單位公尺） */
export function finger(person, h, ox, oy, amt, pose = 'chest') {
  if (amt <= 0) { person.reach.L = null; return; }
  person.reach.L = {
    target: () => person.local(0.3, 0.84, 0.08).lerp(h.anchors[pose].localToWorld(V(ox, oy, 0.03)), amt),
    pole: () => person.local(0.7, 0.7, 0.1)
  };
}

/** 一個四面牆的房間（地板、天花板、四面牆），回傳各部分，方便再加窗戶和裝飾 */
export function room(scene, { w = 9, d = 8, h = 3.2, floor = '#b48a5a', ceil = '#eee9de', wall = '#e6e1d4', wallBack = null } = {}) {
  const parts = {
    floor: box(w, 0.2, d, floor, { roughness: 0.7 }),
    ceil: box(w, 0.2, d, ceil),
    back: box(w, h, 0.2, wallBack || wall),
    front: box(w, h, 0.2, wall),
    left: box(0.2, h, d, wall),
    right: box(0.2, h, d, wall)
  };
  parts.floor.position.set(0, -0.1, 0);
  parts.ceil.position.set(0, h + 0.1, 0);
  parts.back.position.set(0, h / 2, -d / 2);
  parts.front.position.set(0, h / 2, d / 2);
  parts.left.position.set(-w / 2, h / 2, 0);
  parts.right.position.set(w / 2, h / 2, 0);
  Object.values(parts).forEach((m) => scene.add(m));
  return { ...parts, w, d, h };
}

export { cyl, box };
