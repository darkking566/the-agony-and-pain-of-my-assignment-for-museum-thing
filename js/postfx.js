// 後製：Bloom（只讓真正很亮的燈、螢幕、招牌發光）+ 暗角 + 輕微色彩分級 + 極細的顆粒。
// 全部包在 try/catch：任何一步失敗就回傳 null，播放器照舊直接 renderer.render。
// 場景可以在 build() 回傳的 world 上放 world.fx = { bloom, threshold, radius, vignette, saturation, contrast, warm } 覆蓋預設。
import * as THREE from 'three';

const DEFAULTS = { bloom: 0.32, threshold: 0.88, radius: 0.55, vignette: 0.32, saturation: 1.08, contrast: 1.06, warm: 0.0, grain: 0.018 };

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: DEFAULTS.vignette },
    saturation: { value: DEFAULTS.saturation },
    contrast: { value: DEFAULTS.contrast },
    warm: { value: DEFAULTS.warm },
    grain: { value: DEFAULTS.grain },
    time: { value: 0 }
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignette, saturation, contrast, warm, grain, time;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb;
      // 對比：以中灰 0.18（線性）為軸
      col = max((col - 0.18) * contrast + 0.18, 0.0);
      // 飽和度
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, saturation);
      // 冷暖：正值偏暖，負值偏冷
      col *= vec3(1.0 + warm * 0.10, 1.0, 1.0 - warm * 0.10);
      // 暗角
      vec2 d = vUv - 0.5;
      float v = smoothstep(0.85, 0.2, length(d * vec2(1.0, 0.9)));
      col *= mix(1.0 - vignette, 1.0, v);
      // 顆粒（只在暗部明顯，避免大片亮面起雜訊）
      col += (hash(vUv * 1024.0) - 0.5) * grain * (1.0 - clamp(l * 2.0, 0.0, 1.0) * 0.6);
      gl_FragColor = vec4(col, c.a);
    }`
};

/** 建立後製管線。回傳 { render(), setSize(w,h), setPixelRatio(pr), dispose(), tune(fx) }，失敗回傳 null。 */
export async function createPostFX(renderer, scene, camera, { coarse = false, fx = {} } = {}) {
  try {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/ShaderPass.js'),
      import('three/addons/postprocessing/OutputPass.js')
    ]);
    const size = renderer.getSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: coarse ? 2 : 4 });
    const composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.addPass(new RenderPass(scene, camera));

    const o = { ...DEFAULTS, ...fx };
    // 手機：不開 Bloom（太吃效能），只做分級與暗角
    let bloom = null;
    if (!coarse && o.bloom > 0) {
      bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), o.bloom, o.radius, o.threshold);
      composer.addPass(bloom);
    }
    const grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
    composer.addPass(new OutputPass());

    const tune = (f) => {
      const p = { ...DEFAULTS, ...f };
      if (bloom) { bloom.strength = p.bloom; bloom.threshold = p.threshold; bloom.radius = p.radius; }
      const u = grade.uniforms;
      u.vignette.value = p.vignette; u.saturation.value = p.saturation; u.contrast.value = p.contrast;
      u.warm.value = p.warm; u.grain.value = p.grain;
    };
    tune(o);

    let T = 0;
    return {
      composer, tune,
      render(dt = 0.016) { T += dt; grade.uniforms.time.value = (T * 7) % 100; composer.render(dt); },
      setSize(w, h) { composer.setSize(w, h); },
      setPixelRatio(pr) { composer.setPixelRatio(pr); },
      dispose() { composer.dispose && composer.dispose(); rt.dispose(); }
    };
  } catch (err) {
    console.warn('後製載入失敗，改用直接繪製', err);
    return null;
  }
}
