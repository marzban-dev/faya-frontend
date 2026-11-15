// GLSL (WebGL 1) for what flies past in the tunnel, drawn over the deep space at full
// resolution: star streaks (additive light) and works as lit 3D panels.

import { GLSL_PRECISION } from "./webgl-program.util";

export const STAR_VERTEX = `
attribute vec2 aPosition;
attribute vec2 aLocal;
attribute vec2 aShape;
attribute vec4 aColor;
uniform vec2 uView;
varying vec2 vLocal;
varying vec2 vShape;
varying vec4 vColor;
void main() {
    vec2 clip = aPosition / uView * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    vLocal = aLocal;
    vShape = aShape;
    vColor = aColor;
}
`;

// A faint tail thickening toward a small, brighter head.
export const STAR_FRAGMENT = `${GLSL_PRECISION}
varying vec2 vLocal;
varying vec2 vShape;
varying vec4 vColor;
void main() {
    float len = vShape.x;
    float along = clamp(vLocal.x, 0.0, len);
    float share = len > 0.0001 ? along / len : 1.0;
    float width = vShape.y * mix(0.55, 1.0, share);
    vec2 away = vec2(vLocal.x - along, vLocal.y);
    float trail = exp(-dot(away, away) / (width * width)) * mix(0.2, 0.45, share);
    vec2 fromHead = vec2(vLocal.x - len, vLocal.y);
    float head = exp(-dot(fromHead, fromHead) / (vShape.y * vShape.y)) * 0.8;
    float light = max(trail, head) * vColor.a;
    gl_FragColor = vec4(vColor.rgb * light, light);
}
`;

// A work is a quad between its four 3D corners (top-left, top-right, bottom-right, bottom-left).
export const PANEL_VERTEX = `
attribute vec2 aUv;
uniform mat4 uProjection;
uniform vec3 uCorners[4];
varying vec2 vUv;
varying vec3 vWorld;
void main() {
    vec3 world = mix(mix(uCorners[0], uCorners[1], aUv.x), mix(uCorners[3], uCorners[2], aUv.x), aUv.y);
    vUv = aUv;
    vWorld = world;
    gl_Position = uProjection * vec4(world, 1.0);
}
`;

// A print catching light: softly shaded by its angle to a light above-left, darker seen at
// a glancing angle, a faint sheen sliding over it as it turns, a fine bright edge.
export const PANEL_FRAGMENT = `${GLSL_PRECISION}
uniform sampler2D uImage;
uniform vec3 uNormal;
uniform float uAlpha;
varying vec2 vUv;
varying vec3 vWorld;
void main() {
    vec3 color = texture2D(uImage, vUv).rgb;
    vec3 toEye = normalize(-vWorld);
    vec3 normal = normalize(uNormal);
    float facing = dot(normal, toEye);
    if (facing < 0.0) {
        normal = -normal;
        facing = -facing;
        color *= 0.4;
    }
    vec3 light = normalize(vec3(-0.35, -0.55, -1.0));
    float diffuse = 0.84 + 0.16 * max(dot(normal, light), 0.0);
    float glance = 0.5 + 0.5 * smoothstep(0.0, 0.65, facing);
    float sheen = pow(max(dot(reflect(-light, normal), toEye), 0.0), 20.0) * 0.12;
    vec2 edge = min(vUv, 1.0 - vUv);
    float rim = (1.0 - smoothstep(0.0, 0.006, min(edge.x, edge.y))) * 0.08;
    color = color * diffuse * glance + sheen + rim;
    gl_FragColor = vec4(color * uAlpha, uAlpha);
}
`;
