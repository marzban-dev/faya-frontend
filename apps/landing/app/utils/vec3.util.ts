export type Vec3 = [number, number, number];

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const scale = (a: Vec3, by: number): Vec3 => [a[0] * by, a[1] * by, a[2] * by];

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

const length = (a: Vec3) => Math.sqrt(dot(a, a));

const normalize = (a: Vec3): Vec3 => {
    const size = length(a);
    return size > 1e-9 ? scale(a, 1 / size) : [0, 0, 0];
};

// Rodrigues' rotation of `v` around the unit `axis`.
const rotate = (v: Vec3, axis: Vec3, angle: number): Vec3 => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return add(add(scale(v, cos), scale(cross(axis, v), sin)), scale(axis, dot(axis, v) * (1 - cos)));
};

// functions

export const Vec3 = { add, subtract, scale, dot, cross, length, normalize, rotate };
