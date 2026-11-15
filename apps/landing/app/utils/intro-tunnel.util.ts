// The time tunnel after the intro video: the camera flies forward along the screen's axis
// while works and streaking stars pass around it. World units: depth 1 puts a point at its
// resting size; screen offsets scale with 1 / depth.

export type TunnelWork = {
    url: string;
    // Position around the axis (radians) and distance from it, as a share of half the screen.
    angle: number;
    radius: number;
    depth: number;
    // Width-and-height scale, as a share of the screen's shorter side at depth 1.
    size: number;
};

export type TunnelStar = { angle: number; radius: number; depth: number; warm: boolean };

export type TunnelPhase = {
    // How far the black has faded in over the intro video.
    cover: number;
    // How far the stars and works have faded in once the screen is black.
    reveal: number;
    // Camera depth along the axis.
    camera: number;
    // The black hole at the end of the tunnel appearing, with its disc and lensing, 0–1.
    hole: number;
    // Falling in: the event horizon growing over the whole screen, 0–1; the hub arrives out of
    // this darkness.
    fall: number;
};

export const TUNNEL_FAR = 7;
export const TUNNEL_NEAR = 0.12;
export const TUNNEL_STAR_COUNT = 520;

const WORK_COUNT = 23;
// The camera's path is laid out for one more work than is shown, so the last one has passed
// well before the black hole and none sits beside it.
const PATH_WORK_COUNT = 24;
const WORK_SPACING = 0.42;
// Close enough that works show soon after the stars, far enough that they still come out of
// the distance (and the tunnel's fade-in keeps them from popping in).
const FIRST_WORK_DEPTH = TUNNEL_FAR * 0.6;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const COVER_UNTIL = 0.1;
const REVEAL_UNTIL = 0.2;
const HOLE_FROM = 0.58;
const HOLE_UNTIL = 0.85;
// Complete just before INTRO_ARRIVE_AT, so the swap to the hub happens in total darkness.
const FALL_FROM = 0.86;
const FALL_UNTIL = 0.965;
const CAMERA_END = FIRST_WORK_DEPTH + PATH_WORK_COUNT * WORK_SPACING + 0.4;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (from: number, to: number, value: number) => {
    const t = clamp01((value - from) / (to - from));
    return t * t * (3 - 2 * t);
};

const fract = (value: number) => value - Math.floor(value);

const workUrl = (index: number) => `/samples/works/work-${String(index + 1).padStart(2, "0")}.jpg`;

// Spread around the axis by the golden angle so neighbours never line up, and kept off the
// centre so the way ahead stays clear.
export const TUNNEL_WORKS: TunnelWork[] = Array.from({ length: WORK_COUNT }, (_, index) => ({
    url: workUrl(index),
    angle: index * GOLDEN_ANGLE + 0.6,
    radius: 0.62 + 0.38 * fract(index * 0.618 + 0.3),
    depth: FIRST_WORK_DEPTH + index * WORK_SPACING,
    size: 0.3 + 0.1 * fract(index * 0.437),
}));

export const createTunnelStars = (random: () => number): TunnelStar[] =>
    Array.from({ length: TUNNEL_STAR_COUNT }, () => ({
        angle: random() * Math.PI * 2,
        radius: 0.08 + random() ** 0.7 * 1.9,
        depth: random() * TUNNEL_FAR,
        warm: random() < 0.12,
    }));

// Black fades in over the video first; then the stars fade in as the camera travels, linear in scroll so the
// sense of speed follows the hand; a black hole forms ahead, and in the end swallows the screen.
export const tunnelPhaseAt = (rawProgress: number): TunnelPhase => {
    const progress = clamp01(rawProgress);
    const travel = clamp01((progress - COVER_UNTIL) / (1 - COVER_UNTIL));
    const camera = travel * CAMERA_END;
    return {
        cover: smoothstep(0, COVER_UNTIL, progress),
        reveal: smoothstep(COVER_UNTIL, REVEAL_UNTIL, progress),
        camera,
        hole: smoothstep(HOLE_FROM, HOLE_UNTIL, progress),
        fall: smoothstep(FALL_FROM, FALL_UNTIL, progress),
    };
};

// Depth of a star ahead of the camera, wrapping so the field never runs out.
export const starDepth = (star: TunnelStar, camera: number) =>
    (((star.depth - camera) % TUNNEL_FAR) + TUNNEL_FAR) % TUNNEL_FAR;

// Fades a point in from the far plane and out just before it would fill the screen.
export const depthAlpha = (depth: number) =>
    smoothstep(TUNNEL_FAR, TUNNEL_FAR * 0.55, depth) * smoothstep(TUNNEL_NEAR, TUNNEL_NEAR * 3, depth);

// The camera's distance from the black hole, in Schwarzschild radii: far away as it forms,
// closing in, then falling — faster and faster — through the horizon (below 1 all is black).
export const blackHoleDistance = (phase: TunnelPhase) => {
    const approach = 70 - 52 * phase.hole ** 0.8;
    return approach + (0.9 - approach) * phase.fall ** 1.4;
};

// Radius of the hole's shadow on screen, in half-screen units (Infinity once it fills the view),
// from the photon sphere's critical impact parameter: works and stars vanish into it.
export const blackHoleShadowRadius = (phase: TunnelPhase, focal: number) => {
    if (phase.hole <= 0) return 0;
    const distance = blackHoleDistance(phase);
    if (distance <= 1) return Infinity;
    const sine = Math.min(1, (1.5 * Math.sqrt(3) * Math.sqrt(1 - 1 / distance)) / distance);
    const angle = distance < 1.5 ? Math.PI - Math.asin(sine) : Math.asin(sine);
    if (angle >= Math.PI / 2) return Infinity;
    return Math.tan(angle) * focal;
};
