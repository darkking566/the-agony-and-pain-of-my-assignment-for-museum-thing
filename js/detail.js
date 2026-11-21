// 材質細節：替「只有顏色、沒有貼圖」的材質加上依世界座標計算的細微變化。
// - 顏色斑駁（像粉刷、布料、木頭的不均勻）
// - 細小凹凸（用螢幕空間導數擾動法線，不需要 UV，大牆面也不會被拉長）
// - 粗糙度起伏（反光不會是一整片均勻的）
// 手機（coarse）只做顏色斑駁，省掉法線計算。材質可設 userData.noDetail = true 排除。
import * as THREE from 'three';

const NOISE = `
  float dt_hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float dt_noise(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(dt_hash(i), dt_hash(i + vec3(1,0,0)), f.x), mix(dt_hash(i + vec3(0,1,0)), dt_hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(dt_hash(i + vec3(0,0,1)), dt_hash(i + vec3(1,0,1)), f.x), mix(dt_hash(i + vec3(0,1,1)), dt_hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float dt_fbm(vec3 p){ return dt_noise(p) * 0.55 + dt_noise(p * 2.13) * 0.3 + dt_noise(p * 4.7) * 0.15; }
`;

function eligible(m) {
  if (!m || !m.isMeshStandardMaterial || m.userData.noDetail || m.userData.__detail) return false;
  if (m.map || m.transparent || m.metalness > 0.5) return false;
  if (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.05 && m.emissiveIntensity > 0.05) return false;
  return true;
}

function patch(m, { coarse, amount }) {
  m.userData.__detail = true;
  const rough = m.roughness;
  // 光滑的東西（塑膠、漆面）凹凸要更小
  const bump = coarse || rough < 0.6 ? 0 : 0.012 * amount;
  const mottle = (rough > 0.6 ? 0.09 : 0.05) * amount;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.dtMottle = { value: mottle };
    sh.uniforms.dtBump = { value: bump };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDtW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vDtW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    let f = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDtW;\nuniform float dtMottle, dtBump;\n' + NOISE)
      .replace('#include <color_fragment>', `#include <color_fragment>
  float dtN = dt_fbm(vDtW * 1.3);
  float dtF = dt_noise(vDtW * 9.0);
  diffuseColor.rgb *= 1.0 + (dtN - 0.5) * dtMottle * 2.0 + (dtF - 0.5) * dtMottle * 0.6;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = clamp(roughnessFactor * (0.88 + dtN * 0.24), 0.04, 1.0);`);
    if (bump > 0) {
      f = f.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  {
    float h = dt_noise(vDtW * 7.0) * 0.7 + dt_noise(vDtW * 16.0) * 0.3;
    vec3 q0 = dFdx(-vViewPosition), q1 = dFdy(-vViewPosition);
    float hx = dFdx(h), hy = dFdy(h);
    vec3 r1 = cross(q1, normal), r2 = cross(normal, q0);
    float det = dot(q0, r1);
    vec3 grad = sign(det) * (hx * r1 + hy * r2);
    normal = normalize(abs(det) * normal - grad * dtBump * 2.5);
  }`);
    }
    sh.fragmentShader = f;
  };
  const prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => '';
  m.customProgramCacheKey = () => prevKey() + '|dt' + (bump > 0 ? 'b' : '');
  m.needsUpdate = true;
}

/** 掃過整個場景，替符合條件的材質加細節。amount：整體強度（預設 1）。回傳處理了幾個材質。 */
export function applyDetail(scene, { coarse = false, amount = 1 } = {}) {
  let n = 0;
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach((m) => { if (eligible(m)) { patch(m, { coarse, amount }); n++; } });
  });
  return n;
}
