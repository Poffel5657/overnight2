// Bühne, Kamera und Bildschirm: Die Welt wird klein gerendert (Pixel-Look) und dann durch
// einen CRT-Shader auf den Bildschirm gebracht (Wölbung, Scanlines, Glühen, Vignette).

import * as THREE from 'three';
import { FOG_GLSL, FOG_RGB, lightUniforms, litMaterial } from './light.js';

THREE.ColorManagement.enabled = false;

const CRT_FRAG = /* glsl */`
  uniform sampler2D tScene;
  uniform vec2 uSrc;
  uniform float uCrt;
  varying vec2 vUv;
  vec2 curve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 off = abs(uv.yx) / vec2(6.0, 5.0);
    uv = uv + uv * off * off;
    return uv * 0.5 + 0.5;
  }
  void main() {
    vec2 uv = mix(vUv, curve(vUv), uCrt);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    vec3 c = texture2D(tScene, uv).rgb;
    // Glühen: helle Nachbarn bluten leicht aus
    vec2 px = 1.0 / uSrc;
    vec3 b = vec3(0.0);
    for (int i = -2; i <= 2; i++) {
      for (int j = -2; j <= 2; j++) {
        vec3 s = texture2D(tScene, uv + vec2(float(i), float(j)) * px * 1.5).rgb;
        b += max(s - 0.55, 0.0);
      }
    }
    c += b / 25.0 * 1.6 * uCrt;
    // Scanlines im Takt der Quellpixel, damit sie zum Pixel-Look passen
    float scan = 0.5 + 0.5 * cos(uv.y * uSrc.y * 6.28318);
    c *= mix(1.0, 0.78 + 0.22 * scan, uCrt);
    // Vignette
    vec2 v = uv * (1.0 - uv.yx);
    float vig = pow(clamp(v.x * v.y * 18.0, 0.0, 1.0), 0.25);
    c *= mix(1.0, vig, uCrt);
    // Ein Hauch Bernstein
    c = mix(c, c * vec3(1.06, 0.98, 0.84), 0.6 * uCrt);
    gl_FragColor = vec4(c, 1.0);
  }
`;

export function createView(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG_RGB[0] * 0.75, FOG_RGB[1] * 0.75, FOG_RGB[2] * 0.75);
  scene.add(new THREE.HemisphereLight('#d8d0c0', '#3a3428', 1.6));
  const sun = new THREE.DirectionalLight('#fff0d8', 1.4);
  sun.position.set(-6, 10, 4);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const rig = { target: new THREE.Vector3(28, 0, 28), yaw: 0, pitch: 0.95, dist: 17 };

  const rt = new THREE.WebGLRenderTarget(2, 2, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, depthBuffer: true });
  const crtScene = new THREE.Scene();
  const crtCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const crtMat = new THREE.ShaderMaterial({
    uniforms: { tScene: { value: rt.texture }, uSrc: { value: new THREE.Vector2(2, 2) }, uCrt: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: CRT_FRAG,
    depthTest: false,
  });
  crtScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), crtMat));

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Hochkant (Handy) braucht ein weiteres Sichtfeld, sonst sieht man nur die eigene Figur.
    camera.fov = camera.aspect < 1 ? 38 * Math.pow(Math.min(1.7, 1 / camera.aspect), 0.75) : 38;
    camera.updateProjectionMatrix();
    // Etwa 500 Pixel hoch rendern, egal wie groß der Bildschirm ist: so bleibt der Pixel-Look gleich.
    const scale = Math.min(1, Math.max(0.4, 500 / h));
    rt.setSize(Math.max(2, Math.floor(w * scale)), Math.max(2, Math.floor(h * scale)));
    crtMat.uniforms.uSrc.value.set(rt.width, rt.height);
  }
  window.addEventListener('resize', resize);
  resize();

  function updateCamera() {
    const { target, yaw, pitch, dist } = rig;
    camera.position.set(
      target.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      target.y + Math.sin(pitch) * dist,
      target.z + Math.cos(yaw) * Math.cos(pitch) * dist,
    );
    camera.lookAt(target.x, target.y + 0.5, target.z);
  }

  function render() {
    updateCamera();
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(crtScene, crtCam);
  }

  function setCrt(on) {
    crtMat.uniforms.uCrt.value = on ? 1 : 0;
  }

  return { renderer, scene, camera, rig, render, setCrt, resize };
}

// Die Nebelwand am Rand der Welt: mehrere halb durchsichtige, wabernde Schichten.
export function buildGreyWall(W, H) {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: lightUniforms.uTime, uFog: lightUniforms.uFog },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vW;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uFog; varying vec2 vUv; varying vec3 vW;
      ${FOG_GLSL}
      void main() {
        float n = greyNoise(vec2(vW.x + vW.z, vW.y * 2.0), uTime * 2.0);
        float a = pow(1.0 - vUv.y, 0.8) * (0.55 + 0.45 * n);
        gl_FragColor = vec4(uFog * (0.8 + 0.5 * n), a * 0.85);
      }`,
  });
  for (const inset of [0.4, 1.6, 3.2]) {
    const hgt = 6;
    const sides = [
      [W - inset * 2, W / 2, inset, 0],
      [W - inset * 2, W / 2, H - inset, Math.PI],
      [H - inset * 2, inset, H / 2, Math.PI / 2],
      [H - inset * 2, W - inset, H / 2, -Math.PI / 2],
    ];
    for (const [len, x, z, rot] of sides) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, hgt), mat);
      m.position.set(x, hgt / 2 - 0.5, z);
      m.rotation.y = rot;
      m.renderOrder = 10;
      group.add(m);
    }
  }
  // Boden außerhalb der Karte: reiner Grey.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), litMaterial(new THREE.MeshBasicMaterial({ color: '#000000' }), 0));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(W / 2, -0.6, H / 2);
  group.add(floor);
  return group;
}
