// GLSL (WebGL 1 / GLSL ES 1.00) for the tunnel's deep-space layer. Two passes:
// 1. SCENE paints nebula layers and, at the end of the tunnel, a ray-traced
//    Schwarzschild black hole that bends all of it, already tone-mapped, into a small framebuffer.
// 2. STRETCH scales that frame up to the canvas, blurring it radially toward the centre by
//    `uStretch` (0 = untouched) and fading it by `uReveal`.
// Everything depends on the camera and pointer only, never on time, so scrolling back plays
// it in reverse. Loops have constant bounds and uniform arrays are indexed by the loop
// counter only, as GLSL ES 1.00 requires.

import { GLSL_PRECISION } from "./webgl-program.util";

// The camera looks at the hole from slightly above its disc (radians).
export const BLACK_HOLE_INCLINATION = 0.1;

// Field of view of the black hole's camera: a direction (x, y, 1) lands at screen offset
// (x, y) * FOCAL, in units of half the screen's shorter side. The 2D layer uses it to size
// the hole's shadow.
export const DEEP_SPACE_FOCAL = 1.2;

export const DEEP_SPACE_VERTEX = `
attribute vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const PRECISION = GLSL_PRECISION;

const NOISE = `
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p, float octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) {
        if (float(i) >= octaves) break;
        value += amplitude * noise(p);
        p = turn * p;
        amplitude *= 0.5;
    }
    return value;
}

// Interleaved gradient noise: a cheap, even per-pixel jitter that hides sampling steps.
float ign(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}
`;

// Expects a `uWarmth` (0–1) in scope: how far the colours lean toward the brand orange.
const PALETTE = `
// Faya's palette: the brand orange (#ff6b0a) and its relatives — amber, copper, burnt umber —
// set against deep petrol blue and slate teal, the cool colours that pair with orange. Toward
// the black hole the space warms further toward the brand colour.
vec3 palette(float hue) {
    vec3 petrol = vec3(0.05, 0.14, 0.24);
    vec3 slate = vec3(0.1, 0.27, 0.32);
    vec3 umber = vec3(0.42, 0.17, 0.07);
    vec3 copper = vec3(0.78, 0.32, 0.08);
    vec3 brand = vec3(1.0, 0.42, 0.04);
    vec3 amber = vec3(1.0, 0.66, 0.28);
    vec3 cool = mix(petrol, slate, smoothstep(0.25, 0.5, hue));
    vec3 warm = mix(umber, copper, smoothstep(0.35, 0.55, hue));
    warm = mix(warm, mix(brand, amber, smoothstep(0.7, 0.9, hue)), smoothstep(0.55, 0.75, hue));
    float warmShare = mix(smoothstep(0.42, 0.62, hue) * 0.65, 0.95, uWarmth);
    return mix(cool, warm, warmShare);
}
`;

export const DEEP_SPACE_SCENE = `${PRECISION}
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec4 uParams;
uniform vec4 uHoleParams;
uniform float uTime;
#define uCamera uParams.x
#define uWarmth uParams.y
#define uOctaves uParams.z
#define uExposure uParams.w
#define uHole uHoleParams.x
#define uHoleDistance uHoleParams.y
#define uIntensity uHoleParams.z
#define uSkyStars uHoleParams.w
${NOISE}
const float LAYER_SPAN = 6.0;
const float LAYER_NEAR = 0.6;

${PALETTE}
// Three cloud layers, each travelling from far to near and starting again far away with new
// noise. A layer is fully transparent at both ends of its trip, so the restart never shows.
vec3 nebula(vec2 p) {
    vec3 color = vec3(0.0);
    for (int k = 0; k < 3; k++) {
        float layer = float(k);
        float travel = uCamera + layer * LAYER_SPAN / 3.0;
        float cycle = floor(travel / LAYER_SPAN);
        float depth = LAYER_SPAN - mod(travel, LAYER_SPAN) + LAYER_NEAR;
        float fade = smoothstep(LAYER_SPAN + LAYER_NEAR, LAYER_SPAN * 0.6, depth) * smoothstep(LAYER_NEAR, LAYER_NEAR + 1.4, depth);
        if (fade <= 0.001) continue;
        vec2 seed = vec2(mod(cycle * 17.3 + layer * 41.7, 97.0), mod(cycle * 9.1 + layer * 23.5, 89.0));
        vec2 q = p * depth * 0.5 + uPointer * vec2(0.035, 0.025) + seed;
        // Warping the noise by itself turns blobs into the wisps and filaments of real gas.
        q += vec2(fbm(q * 0.8 + 1.7, 3.0), fbm(q * 0.8 + 8.3, 3.0)) * 1.4 - 0.7;
        float cloud = smoothstep(0.4, 0.88, fbm(q, uOctaves));
        float dust = fbm(q * 2.3 + 7.0, uOctaves - 1.0);
        cloud *= 1.0 - 0.6 * smoothstep(0.48, 0.72, dust);
        float glow = fbm(q * 0.6 + 3.0, 3.0);
        color += palette(glow + layer * 0.17) * cloud * fade * 0.6;
    }
    return color;
}

// A faint band of distant gas behind everything, drawing slowly closer.
vec3 backdrop(vec2 p) {
    vec2 q = p / (1.0 + uCamera * 0.02);
    float band = exp(-pow((q.y + q.x * 0.25) * 2.2, 2.0));
    float grain = fbm(q * 2.5 + 11.0, uOctaves);
    return palette(grain * 0.6) * band * smoothstep(0.3, 0.8, grain) * 0.22;
}

const float FOCAL = ${DEEP_SPACE_FOCAL.toFixed(3)};
// Black hole units: the Schwarzschild radius is 1. The disc runs from the innermost stable
// orbit (3) outward; rays that never come closer than MARCH_LIMIT are bent analytically.
const float DISC_INNER = 3.0;
const float DISC_OUTER = 12.0;
const float MARCH_LIMIT = 22.0;
const float INCLINATION = ${BLACK_HOLE_INCLINATION.toFixed(3)};
const int MAX_STEPS = 240;

// Distant stars, fixed to the direction of view so the hole can lens them: one star in some
// cells of a grid, never smaller than a pixel so they don't shimmer as the lensing moves them.
float starLayer(vec2 p, float cell, float seed) {
    vec2 grid = p / cell + seed;
    vec2 id = floor(grid);
    if (hash(id) > 0.3) return 0.0;
    vec2 centre = 0.2 + 0.6 * vec2(hash(id + 3.7), hash(id + 9.1));
    vec2 offset = (fract(grid) - centre) * cell;
    float size = max(cell * 0.05, 2.2 / min(uResolution.x, uResolution.y));
    return exp(-dot(offset, offset) / (size * size)) * pow(hash(id + 1.3), 3.0);
}

vec3 skyStars(vec2 p) {
    float light = starLayer(p, 0.05, 0.0) + starLayer(p, 0.12, 17.0) * 1.5;
    return vec3(1.0, 0.92, 0.84) * light * 0.8;
}

// The sky behind the hole at a screen position: backdrop, nebulae and, once the hole forms,
// the distant stars it lenses.
vec3 sky(vec2 p) {
    vec3 color = backdrop(p) + nebula(p);
    if (uSkyStars > 0.0) color += skyStars(p) * uSkyStars;
    return color;
}

// Glowing gas by temperature: ember red, brand orange, amber-white, and near-white where
// Doppler beaming pushes it hotter.
vec3 heatColour(float t) {
    vec3 color = mix(vec3(0.75, 0.14, 0.02), vec3(1.0, 0.42, 0.04), smoothstep(0.0, 0.45, t));
    color = mix(color, vec3(1.0, 0.8, 0.55), smoothstep(0.45, 0.85, t));
    return mix(color, vec3(1.0, 0.96, 0.9), smoothstep(0.95, 1.5, t));
}

// One orbit "cycle" of the disc gas, in spin units (the inner edge turns ORBIT_CYCLE / 5.2 rad
// per cycle).
const float ORBIT_CYCLE = 12.0;

// Arcs and clumps of gas orbiting the hole, faster inward; the orbit turns with the scroll and,
// so the hole stays alive when the scroll rests, with time. Differential rotation winds any
// pattern into rings finer than a pixel, which look still and alias into blocks, so two copies
// of the gas take turns (flow noise): each is sheared for one cycle only and fades out before it
// winds up while a fresh one fades in. The blend keeps the contrast constant, so it never pulses.
float discGas(float angle, float r) {
    float spin = (uCamera * 5.0 + uTime * 6.0) / ORBIT_CYCLE;
    float omega = pow(r, -1.5);
    float sum = 0.0;
    float weights = 0.0;
    for (int k = 0; k < 2; k++) {
        float cycle = spin + float(k) * 0.5;
        float phase = fract(cycle);
        float id = floor(cycle) * 2.0 + float(k);
        vec2 seed = vec2(mod(id * 17.3, 97.0), mod(id * 9.1, 89.0));
        float swirl = angle - phase * ORBIT_CYCLE * omega;
        vec2 q = vec2(cos(swirl), sin(swirl)) * 1.8 + vec2(log(r) * 4.5, 0.0) + seed;
        float weight = 1.0 - abs(2.0 * phase - 1.0);
        sum += (fbm(q, 3.0) - 0.5) * weight;
        weights += weight * weight;
    }
    float gas = 0.5 + sum / sqrt(max(weights, 0.0001));
    return 0.15 + 0.85 * smoothstep(0.32, 0.72, gas);
}

// Light given off where a ray crosses the disc plane: a thin Keplerian disc, hotter inward,
// Doppler-beamed (the side orbiting toward the camera is brighter and bluer) and
// gravitationally redshifted.
vec4 discLight(vec3 hit, vec3 travel) {
    float r = length(hit.xz);
    if (r < DISC_INNER || r > DISC_OUTER) return vec4(0.0);
    float speed = sqrt(0.5 / (r - 1.0));
    vec3 orbit = normalize(vec3(-hit.z, 0.0, hit.x)) * speed;
    float gamma = 1.0 / sqrt(1.0 - speed * speed);
    float doppler = 1.0 / (gamma * (1.0 - dot(orbit, -normalize(travel))));
    float shift = doppler * sqrt(1.0 - 1.0 / r);
    float temperature = pow(DISC_INNER / r, 0.75);
    float density = discGas(atan(hit.z, hit.x), r);
    float edges = smoothstep(DISC_INNER, DISC_INNER + 0.5, r) * smoothstep(DISC_OUTER, DISC_OUTER * 0.5, r);
    float intensity = pow(shift, 3.5) * temperature * temperature * density * edges * 3.2;
    return vec4(heatColour(temperature * shift) * intensity, clamp(density * edges * 1.3, 0.0, 1.0));
}

// Traces one camera ray backwards along its photon path around the hole (Schwarzschild
// geodesic, integrated with steps that shrink near the hole), collecting disc light at each
// pass through the disc plane, until it falls in (black) or escapes to the sky.
vec3 blackHole(vec2 p) {
    vec3 camera = vec3(0.0, uHoleDistance * sin(INCLINATION), uHoleDistance * cos(INCLINATION));
    vec3 forward = normalize(-camera);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 direction = normalize(forward * FOCAL + right * p.x + up * p.y);

    float impact = length(cross(camera, direction));
    if (impact > MARCH_LIMIT) {
        float bend = 2.0 / impact;
        return sky(p - normalize(p + 0.00001) * bend * FOCAL);
    }

    vec3 position = camera;
    vec3 velocity = direction;
    vec3 momentum = cross(position, velocity);
    float h2 = dot(momentum, momentum);
    vec3 light = vec3(0.0);
    float cover = 0.0;
    bool escaped = false;
    for (int i = 0; i < MAX_STEPS; i++) {
        float r2 = dot(position, position);
        float r = sqrt(r2);
        if (r < 1.0) break;
        if (r > MARCH_LIMIT + 3.0 && dot(position, velocity) > 0.0) {
            escaped = true;
            break;
        }
        float step = clamp(0.05 * r, 0.012, 2.0);
        vec3 previous = position;
        velocity += -1.5 * h2 * position / (r2 * r2 * r) * step;
        position += velocity * step;
        if (previous.y * position.y < 0.0) {
            vec3 hit = mix(previous, position, previous.y / (previous.y - position.y));
            vec4 disc = discLight(hit, velocity);
            light += disc.rgb * (1.0 - cover);
            cover += disc.a * (1.0 - cover);
            if (cover > 0.98) break;
        }
    }
    // Rays that fell in, hit opaque gas, or are still circling the photon sphere when the steps
    // run out (which, physically, they never leave) show no sky.
    if (!escaped || cover > 0.98) return light;

    vec3 escape = normalize(velocity);
    vec3 local = vec3(dot(escape, right), dot(escape, up), dot(escape, forward));
    // Rays bent round to point backwards see the sky behind the camera; keep them on a calm,
    // fading patch of sky instead of sampling noise far out (which shimmers into a comb).
    vec2 seen = local.xy / max(local.z, 0.3) * FOCAL;
    return light + sky(seen) * smoothstep(-0.4, 0.3, local.z) * (1.0 - cover);
}

void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 p = (frag - 0.5 * uResolution) / (0.5 * min(uResolution.x, uResolution.y));
    vec3 color;
    if (uHole <= 0.0) {
        color = sky(p);
    } else {
        color = blackHole(p);
        if (uHole < 0.25) color = mix(sky(p), color, uHole / 0.25);
    }
    color = (1.0 - exp(-color * uExposure)) * uIntensity;
    color += (ign(frag) - 0.5) / 255.0;
    gl_FragColor = vec4(color, 1.0);
}
`;

export const DEEP_SPACE_STRETCH = `${PRECISION}
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uStretch;
uniform float uReveal;
// The scene fills only part of its buffer (more of it once the black hole shows): xy scales
// and zw offsets a 0–1 screen position into it, half a texel in from the edges.
uniform vec4 uSceneRect;
${NOISE}
const int SAMPLES = 14;

vec3 scene(vec2 uv) {
    return texture2D(uScene, uSceneRect.zw + clamp(uv, 0.0, 1.0) * uSceneRect.xy).rgb;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 color;
    if (uStretch < 0.0005) {
        color = scene(uv);
    } else {
        vec2 fromCenter = uv - 0.5;
        float jitter = ign(gl_FragCoord.xy);
        vec3 sum = vec3(0.0);
        for (int i = 0; i < SAMPLES; i++) {
            float t = (float(i) + jitter) / float(SAMPLES);
            sum += scene(0.5 + fromCenter * (1.0 - uStretch * t));
        }
        color = sum / float(SAMPLES);
    }
    color *= uReveal;
    color += (ign(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;
    gl_FragColor = vec4(color, 1.0);
}
`;

// The hub's sky: the tunnel's gas, seen at rest. Two layers drift slowly with time (the hub
// doesn't scroll) and shift a little with the pointer, the nearer one more. Kept faint and
// thinned toward the centre, where the hub's frames sit.
export const HUB_NEBULA = `${PRECISION}
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec4 uParams;
#define uTime uParams.x
#define uOctaves uParams.y
#define uIntensity uParams.z
#define uWarmth uParams.w
${NOISE}
${PALETTE}
vec3 gas(vec2 p) {
    vec3 color = vec3(0.0);
    for (int k = 0; k < 2; k++) {
        float layer = float(k);
        vec2 drift = vec2(0.011, 0.004) * (1.0 + layer * 0.8) * uTime;
        vec2 q = p * (0.9 + layer * 0.55) + uPointer * vec2(0.03, 0.02) * (1.0 + layer) + drift + vec2(13.1, 7.7) * (layer + 1.0);
        // The same self-warp as the tunnel's clouds, turning slowly so the wisps churn.
        vec2 churn = vec2(uTime * 0.006, -uTime * 0.004);
        q += vec2(fbm(q * 0.8 + 1.7 + churn, 3.0), fbm(q * 0.8 + 8.3 - churn, 3.0)) * 1.4 - 0.7;
        float cloud = smoothstep(0.42, 0.9, fbm(q, uOctaves));
        float dust = fbm(q * 2.3 + 7.0, uOctaves - 1.0);
        cloud *= 1.0 - 0.6 * smoothstep(0.48, 0.72, dust);
        float glow = fbm(q * 0.6 + 3.0, 3.0);
        color += palette(glow + layer * 0.17) * cloud * 0.6;
    }
    // A faint band of distant gas across the sky, as in the tunnel.
    float band = exp(-pow((p.y + p.x * 0.25) * 2.2, 2.0));
    float grain = fbm(p * 2.5 + 11.0 + uTime * 0.003, uOctaves);
    color += palette(grain * 0.6) * band * smoothstep(0.3, 0.8, grain) * 0.22;
    return color;
}

void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 p = (frag - 0.5 * uResolution) / (0.5 * min(uResolution.x, uResolution.y));
    vec3 color = gas(p);
    color *= mix(0.35, 1.0, smoothstep(0.25, 1.2, length(p * vec2(0.8, 1.0))));
    color = (1.0 - exp(-color * 0.85)) * uIntensity;
    color += (ign(frag) - 0.5) / 255.0;
    gl_FragColor = vec4(color, 1.0);
}
`;
