// The tunnel as a 3D scene in camera space: x right, y down, z ahead, in units of half the
// screen's shorter side, so a point at depth z lands at centre + (x, y) / z of those units.
// Works are flat pictures turned toward the tunnel's axis; stars are streaks. As the black
// hole forms, the stars are pulled into it (the funnel).

import { Vec3 } from "./vec3.util";

export type TunnelView = { width: number; height: number; pointer: { x: number; y: number } };
export type ScreenPoint = { x: number; y: number };
export type WorkPanel = { corners: Vec3[]; normal: Vec3 };
// `pull` is how much of the screen, as a squared distance from the centre, has been drawn in;
// `shadow` is the hole's radius (both in half-screen units, Infinity once it fills the view).
export type Funnel = { pull: number; shadow: number };

// How far the camera leans with the mouse, as a share of half the screen.
const POINTER_SHIFT = { x: 0.035, y: 0.025 };
const NEAR_CLIP = 0.04;
const FAR_CLIP = 40;
// How far works turn to face the tunnel's axis (radians).
const WORK_TURN = 0.42;

// Per vertex: position, position along/across the streak, length and width, colour.
export const STAR_VERTEX_FLOATS = 10;
const MAX_STREAK = 90;
const STAR_COLOURS: Vec3[] = [
    [0.89, 0.92, 0.95],
    [0.95, 0.95, 0.93],
    [0.95, 0.95, 0.93],
    [1, 0.75, 0.56],
];

const smoothstep = (from: number, to: number, value: number) => {
    const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
    return t * t * (3 - 2 * t);
};

const halfOf = (view: { width: number; height: number }) => Math.min(view.width, view.height) / 2;

export const tunnelPoint = (view: TunnelView, angle: number, radius: number, depth: number): Vec3 => {
    const half = halfOf(view);
    return [
        ((Math.cos(angle) * radius - view.pointer.x * POINTER_SHIFT.x) * view.width) / 2 / half,
        ((Math.sin(angle) * radius - view.pointer.y * POINTER_SHIFT.y) * view.height) / 2 / half,
        depth,
    ];
};

export const projectPoint = (view: { width: number; height: number }, point: Vec3): ScreenPoint => {
    const half = halfOf(view);
    return { x: view.width / 2 + (point[0] * half) / point[2], y: view.height / 2 + (point[1] * half) / point[2] };
};

// Column-major perspective matrix for the same projection (y flipped to WebGL's up).
export const tunnelProjection = (view: { width: number; height: number }) => {
    const half = halfOf(view);
    const depth = (FAR_CLIP + NEAR_CLIP) / (FAR_CLIP - NEAR_CLIP);
    const offset = (-2 * FAR_CLIP * NEAR_CLIP) / (FAR_CLIP - NEAR_CLIP);
    return new Float32Array([(2 * half) / view.width, 0, 0, 0, 0, (-2 * half) / view.height, 0, 0, 0, 0, depth, 1, 0, 0, offset, 0]);
};

// How far the flow into the hole curls around it (radians per unit travelled inward).
export const FUNNEL_SWIRL = 0.2;

export const funnelAt = (hole: number, fall: number, shadow: number): Funnel => ({
    pull: 1.6 * smoothstep(0.55, 1, hole) ** 1.5 + 6 * fall,
    shadow,
});

export const starsFade = (hole: number, fall: number) => (1 - 0.35 * smoothstep(0.15, 0.7, hole)) * (1 - 0.5 * fall);

// A point flowing into the hole: everything moves inward, faster the closer it is
// (d'² = d² − pull), keeping its direction, so a streak stretches toward the centre and narrows
// as it goes; the flow curls slightly. Returns the new point and its distance from the centre.
export const funnelPoint = (view: { width: number; height: number }, point: ScreenPoint, funnel: Funnel) => {
    const half = halfOf(view);
    const x = (point.x - view.width / 2) / half;
    const y = (point.y - view.height / 2) / half;
    const distance = Math.hypot(x, y);
    const pulled = Math.sqrt(Math.max(0, distance * distance - funnel.pull));
    // Screen y points down here, up in the shader, hence the minus.
    const angle = Math.atan2(y, x) - FUNNEL_SWIRL * (distance - pulled);
    return { x: view.width / 2 + Math.cos(angle) * pulled * half, y: view.height / 2 + Math.sin(angle) * pulled * half, radius: pulled };
};

// Fades light out as it crosses the hole's shadow.
export const horizonFade = (radius: number, shadow: number) =>
    Number.isFinite(shadow) ? smoothstep(shadow * 0.98, shadow * 1.15 + 0.01, radius) : 0;


// A work turned toward the tunnel's axis by the same angle as every other, so it shows its
// angle in perspective as it passes. It only swings and leans (never rolls), so it stays upright.
export const workPanel = (view: TunnelView, work: TunnelWork, depth: number, aspect: number): WorkPanel => {
    const centre = tunnelPoint(view, work.angle, work.radius, depth);
    const swing = WORK_TURN * Math.cos(work.angle);
    const lean = -WORK_TURN * Math.sin(work.angle);
    const right = Vec3.rotate(Vec3.rotate([1, 0, 0], [0, 1, 0], swing), [1, 0, 0], lean);
    const down = Vec3.rotate(Vec3.rotate([0, 1, 0], [0, 1, 0], swing), [1, 0, 0], lean);
    const normal = Vec3.cross(down, right);
    const halfWidth = work.size * Math.sqrt(aspect);
    const halfHeight = work.size / Math.sqrt(aspect);
    const corners = (
        [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
        ] as const
    ).map(([x, y]) => Vec3.add(centre, Vec3.add(Vec3.scale(right, x * halfWidth), Vec3.scale(down, y * halfHeight))));
    return { corners, normal };
};

// Long-exposure streaks: from where a star was a little way back to where it is now. Writes
// 4 vertices per visible star into `data` and returns how many stars it wrote.
export const writeStarStreaks = (
    data: Float32Array,
    stars: TunnelStar[],
    view: TunnelView,
    camera: number,
    streak: number,
    strength: number,
    funnel: Funnel,
) => {
    let count = 0;
    stars.forEach((star, index) => {
        const depth = starDepth(star, camera);
        if (depthAlpha(depth) * strength <= 0.01) return;
        const head = funnelPoint(view, projectPoint(view, tunnelPoint(view, star.angle, star.radius, depth)), funnel);
        const alpha = depthAlpha(depth) * strength * (funnel.pull > 0 ? horizonFade(head.radius, funnel.shadow) : 1);
        if (alpha <= 0.01) return;
        const far = streak > 0.01 ? funnelPoint(view, projectPoint(view, tunnelPoint(view, star.angle, star.radius, depth + streak)), funnel) : head;
        // The pull can fling a tail across the screen; keep streaks short.
        const reach = Math.hypot(head.x - far.x, head.y - far.y);
        const keep = reach > MAX_STREAK ? MAX_STREAK / reach : 1;
        const tail = { x: head.x + (far.x - head.x) * keep, y: head.y + (far.y - head.y) * keep };
        const width = Math.min(1.8, Math.max(0.6, 1.1 / depth)) * 0.6;
        const colour = star.warm ? STAR_COLOURS[3]! : STAR_COLOURS[index % 3]!;
        const dx = head.x - tail.x;
        const dy = head.y - tail.y;
        const length = Math.hypot(dx, dy);
        const along = length > 0.01 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
        const pad = width * 3 + 1;
        const vertices = [
            [-pad, -pad],
            [length + pad, -pad],
            [length + pad, pad],
            [-pad, pad],
        ] as const;
        vertices.forEach(([x, y], corner) => {
            const at = (count * 4 + corner) * STAR_VERTEX_FLOATS;
            data[at] = tail.x + along.x * x - along.y * y;
            data[at + 1] = tail.y + along.y * x + along.x * y;
            data[at + 2] = x;
            data[at + 3] = y;
            data[at + 4] = length;
            data[at + 5] = width;
            data[at + 6] = colour[0];
            data[at + 7] = colour[1];
            data[at + 8] = colour[2];
            data[at + 9] = alpha;
        });
        count += 1;
    });
    return count;
};
