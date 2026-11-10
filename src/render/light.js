// Licht und Nebel für alle Materialien: Was kein Licht trifft, verschwindet im Grey.
// Statt echter Lichtquellen rechnet ein kleiner Shader-Zusatz pro Pixel, wie nah die nächste
// Lampe ist (Leuchtfeuer, Feuer, Laterne), und mischt sonst die wabernde Nebelfarbe hinein.

import * as THREE from 'three';

export const MAX_LIGHTS = 12;
export const FOG_RGB = [0.19, 0.2, 0.235];

export const lightUniforms = {
  uLights: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4()) },
  uLightCount: { value: 0 },
  uFog: { value: new THREE.Vector3(...FOG_RGB) },
  uTime: { value: 0 },
  // Position des Spielers: Baumkronen zwischen Kamera und Spieler werden durchsichtig.
  uSee: { value: new THREE.Vector3() },
  // Tageslicht 0 (Nacht) bis 1 (Tag), echte Uhrzeit in Berlin.
  uDay: { value: 0 },
  // PS1-Wackeln: Eckpunkte springen auf ein grobes Pixelraster (halbe Auflösung des Bildes).
  uSnap: { value: new THREE.Vector2(160, 120) },
};

const FOG_NIGHT = [0.15, 0.16, 0.2];
const FOG_DAY = [0.6, 0.62, 0.64];
const FOG_DUSK = [0.62, 0.4, 0.32];

// Nebelfarbe für einen Himmelszustand (siehe shared/daylight.js).
export function skyFog(day, dusk) {
  return FOG_NIGHT.map((n, i) => {
    const base = n + (FOG_DAY[i] - n) * day;
    return base + (FOG_DUSK[i] * (0.45 + 0.55 * day) - base) * dusk * 0.55;
  });
}

export const FOG_GLSL = /* glsl */`
  float lHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float lNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(lHash(i), lHash(i + vec2(1, 0)), u.x), mix(lHash(i + vec2(0, 1)), lHash(i + vec2(1, 1)), u.x), u.y);
  }
  float greyNoise(vec2 p, float t) {
    return lNoise(p * 0.35 + vec2(t * 0.06, t * 0.035)) * 0.65 + lNoise(p * 0.9 - vec2(t * 0.05, 0.0)) * 0.35;
  }
`;

// Hängt Licht und Nebel an ein normales three.js-Material. ambient = Restlicht im Dunkeln.
// seeThrough: Teile zwischen Kamera und Spieler werden gerastert ausgeschnitten (Baumkronen).
export function litMaterial(material, ambient = 0.14, seeThrough = false) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lightUniforms, { uAmbient: { value: ambient } });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLWPos;\nuniform vec2 uSnap;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 lwp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          lwp = instanceMatrix * lwp;
        #endif
        vLWPos = (modelMatrix * lwp).xyz;
        if (gl_Position.w > 0.0) {
          gl_Position.xy = floor(gl_Position.xy / gl_Position.w * uSnap + 0.5) / uSnap * gl_Position.w;
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vLWPos;
        uniform vec4 uLights[${MAX_LIGHTS}];
        uniform int uLightCount;
        uniform vec3 uFog;
        uniform float uTime;
        uniform float uAmbient;
        uniform vec3 uSee;
        uniform float uDay;
        ${FOG_GLSL}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        ${seeThrough ? `{
          vec3 a = cameraPosition;
          vec3 b = uSee + vec3(0.0, 0.6, 0.0);
          vec3 ab = b - a;
          float t = clamp(dot(vLWPos - a, ab) / dot(ab, ab), 0.0, 1.0);
          float d = distance(vLWPos, a + ab * t);
          if (t > 0.05 && t < 0.97 && d < 1.0) {
            vec2 g = mod(floor(gl_FragCoord.xy), 2.0);
            if (d < 0.65 || g.x == g.y) discard;
          }
        }` : ''}`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float lit = uAmbient;
        float warmth = 0.0;
        for (int i = 0; i < ${MAX_LIGHTS}; i++) {
          if (i >= uLightCount) break;
          vec4 L = uLights[i];
          float d = distance(vLWPos.xz, L.xy);
          float k = (1.0 - smoothstep(L.z * 0.35, L.z, d)) * L.w;
          lit = max(lit, k);
          warmth = max(warmth, k * (1.0 - smoothstep(0.0, L.z, d)));
        }
        // Tagsüber sieht man weit, nur in der Ferne bleibt der Grey als Dunst.
        float far = smoothstep(9.0, 26.0, distance(vLWPos.xz, uSee.xz));
        lit = max(lit, uDay * (0.95 - 0.55 * far));
        warmth *= 1.0 - 0.75 * uDay;
        float n = greyNoise(vLWPos.xz, uTime);
        vec3 fogc = uFog * (0.7 + 0.6 * n);
        vec3 c = gl_FragColor.rgb * mix(vec3(1.0), vec3(1.12, 1.0, 0.8), warmth);
        gl_FragColor.rgb = mix(fogc, c, clamp(lit, 0.0, 1.0));`);
  };
  // Eigener Schlüssel, damit three.js die Shader-Variante nicht mit anderen Materialien teilt.
  material.customProgramCacheKey = () => `lit-${ambient}-${seeThrough}`;
  return material;
}

// lights: [{x, y, r, w}] in Weltkoordinaten (y = Welt-z).
export function setLights(lights, time) {
  const arr = lightUniforms.uLights.value;
  const n = Math.min(lights.length, MAX_LIGHTS);
  for (let i = 0; i < n; i++) arr[i].set(lights[i].x, lights[i].y, lights[i].r, lights[i].w ?? 1);
  lightUniforms.uLightCount.value = n;
  lightUniforms.uTime.value = time;
}
