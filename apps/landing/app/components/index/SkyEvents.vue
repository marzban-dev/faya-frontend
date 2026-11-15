<script setup lang="ts">
// imports

const props = defineProps<{ active: boolean }>();

// states

type Meteor = { x: number; y: number; dx: number; dy: number; speed: number; tail: number; life: number; age: number; color: string; flicker: number };
type Flare = { x: number; y: number; reach: number; life: number; age: number; color: string; tilt: number };

// Seconds between events. Real meteors are rare and brief; star flares a little more common.
const METEOR_EVERY = [3.5, 9] as const;
const FLARE_EVERY = [0.9, 2.4] as const;
// Star and meteor light: near-white, slightly cool or warm, now and then the brand's amber.
const STAR_COLORS = ["228 234 242", "242 240 236", "255 238 222", "255 196 150"];
const METEOR_COLORS = ["232 238 246", "242 240 236", "255 232 214", "255 186 130"];
const MAX_PIXEL_RATIO = 2;

const canvas = ref<HTMLCanvasElement | null>(null);
let context: CanvasRenderingContext2D | null = null;
let meteors: Meteor[] = [];
let flares: Flare[] = [];
let width = 0;
let height = 0;
let pixelRatio = 1;
let nextMeteor = 1.5;
let nextFlare = 0.6;
let lastTime = 0;
let animationFrame = 0;
let running = false;
let sparse = false;
let resizeObserver: ResizeObserver | null = null;

// methods

const between = (min: number, max: number) => min + Math.random() * (max - min);

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;

const smoothstep = (from: number, to: number, value: number) => {
    const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
    return t * t * (3 - 2 * t);
};

const measure = () => {
    const element = canvas.value;
    if (!element) return;
    width = element.clientWidth;
    height = element.clientHeight;
    sparse = width < 768;
    pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    element.width = Math.round(width * pixelRatio);
    element.height = Math.round(height * pixelRatio);
};

// Mostly falling down-left, sometimes down-right, from the upper part of the sky.
const spawnMeteor = () => {
    const angle = between(0.7, 0.88) * Math.PI;
    const mirror = Math.random() < 0.4 ? -1 : 1;
    meteors.push({
        x: between(0.1, 1) * width,
        y: between(-0.02, 0.5) * height,
        dx: Math.cos(angle) * mirror,
        dy: Math.sin(angle),
        speed: between(900, 1700),
        tail: between(70, 190),
        life: between(0.35, 0.8),
        age: 0,
        color: pick(METEOR_COLORS),
        flicker: Math.random() * 100,
    });
};

const spawnFlare = () => {
    flares.push({
        x: between(0.04, 0.96) * width,
        y: between(0.04, 0.96) * height,
        reach: between(7, 16),
        life: between(1.6, 3),
        age: 0,
        color: pick(STAR_COLORS),
        tilt: between(-0.08, 0.08),
    });
};

// A thin streak that tapers to nothing behind a small hot head. It flares up fast, flickers
// as it burns and fades out; there is no outline or round blob, only light.
const drawMeteor = (draw: CanvasRenderingContext2D, meteor: Meteor) => {
    const progress = meteor.age / meteor.life;
    const flicker = 0.85 + 0.15 * Math.sin(meteor.flicker + meteor.age * 70);
    const alpha = smoothstep(0, 0.18, progress) * (1 - smoothstep(0.45, 1, progress)) * flicker;
    if (alpha <= 0.01) return;
    const travelled = meteor.speed * meteor.age;
    const tail = meteor.tail * (0.4 + 0.6 * smoothstep(0, 0.35, progress));
    const head = { x: meteor.x + meteor.dx * travelled, y: meteor.y + meteor.dy * travelled };
    const end = { x: head.x - meteor.dx * tail, y: head.y - meteor.dy * tail };
    const normal = { x: -meteor.dy, y: meteor.dx };

    const streak = (halfWidth: number, strength: number) => {
        const gradient = draw.createLinearGradient(head.x, head.y, end.x, end.y);
        gradient.addColorStop(0, `rgb(${meteor.color} / ${alpha * strength})`);
        gradient.addColorStop(0.25, `rgb(${meteor.color} / ${alpha * strength * 0.45})`);
        gradient.addColorStop(1, `rgb(${meteor.color} / 0)`);
        draw.fillStyle = gradient;
        draw.beginPath();
        draw.moveTo(head.x + normal.x * halfWidth, head.y + normal.y * halfWidth);
        draw.lineTo(end.x, end.y);
        draw.lineTo(head.x - normal.x * halfWidth, head.y - normal.y * halfWidth);
        draw.closePath();
        draw.fill();
    };
    streak(2.2, 0.18);
    streak(0.7, 0.95);

    const bloom = draw.createRadialGradient(head.x, head.y, 0, head.x, head.y, 3.5);
    bloom.addColorStop(0, `rgb(255 255 255 / ${alpha})`);
    bloom.addColorStop(0.35, `rgb(${meteor.color} / ${alpha * 0.5})`);
    bloom.addColorStop(1, `rgb(${meteor.color} / 0)`);
    draw.fillStyle = bloom;
    draw.fillRect(head.x - 3.5, head.y - 3.5, 7, 7);
};

// A distant star scintillating: a soft bloom and faint, hair-thin diffraction spikes that
// swell and fade without ever reading as a drawn shape.
const drawFlare = (draw: CanvasRenderingContext2D, flare: Flare) => {
    const progress = flare.age / flare.life;
    const twinkle = 0.9 + 0.1 * Math.sin(flare.age * 23);
    const strength = Math.sin(Math.PI * progress) ** 2 * twinkle;
    if (strength <= 0.01) return;

    const bloomRadius = 2 + flare.reach * 0.45 * strength;
    const bloom = draw.createRadialGradient(flare.x, flare.y, 0, flare.x, flare.y, bloomRadius);
    bloom.addColorStop(0, `rgb(255 255 255 / ${strength})`);
    bloom.addColorStop(0.2, `rgb(${flare.color} / ${strength * 0.55})`);
    bloom.addColorStop(1, `rgb(${flare.color} / 0)`);
    draw.fillStyle = bloom;
    draw.fillRect(flare.x - bloomRadius, flare.y - bloomRadius, bloomRadius * 2, bloomRadius * 2);

    const reach = flare.reach * strength;
    draw.save();
    draw.translate(flare.x, flare.y);
    draw.rotate(flare.tilt);
    for (const [dx, dy] of [
        [1, 0],
        [0, 1],
    ] as const) {
        const spike = draw.createLinearGradient(-dx * reach, -dy * reach, dx * reach, dy * reach);
        spike.addColorStop(0, `rgb(${flare.color} / 0)`);
        spike.addColorStop(0.5, `rgb(${flare.color} / ${strength * 0.32})`);
        spike.addColorStop(1, `rgb(${flare.color} / 0)`);
        draw.fillStyle = spike;
        draw.fillRect(dx ? -reach : -0.35, dy ? -reach : -0.35, dx ? reach * 2 : 0.7, dy ? reach * 2 : 0.7);
    }
    draw.restore();
};

const step = (delta: number) => {
    nextMeteor -= delta;
    nextFlare -= delta;
    const slower = sparse ? 1.4 : 1;
    if (nextMeteor <= 0) {
        spawnMeteor();
        nextMeteor = between(...METEOR_EVERY) * slower;
    }
    if (nextFlare <= 0) {
        spawnFlare();
        nextFlare = between(...FLARE_EVERY) * slower;
    }
    for (const meteor of meteors) meteor.age += delta;
    for (const flare of flares) flare.age += delta;
    meteors = meteors.filter((meteor) => meteor.age < meteor.life);
    flares = flares.filter((flare) => flare.age < flare.life);
};

const render = (time: number) => {
    animationFrame = requestAnimationFrame(render);
    const draw = context;
    if (!draw) return;
    const delta = lastTime ? Math.min(time - lastTime, 100) / 1000 : 0;
    lastTime = time;
    step(delta);

    draw.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    draw.clearRect(0, 0, width, height);
    draw.globalCompositeOperation = "lighter";
    for (const flare of flares) drawFlare(draw, flare);
    for (const meteor of meteors) drawMeteor(draw, meteor);
    draw.globalCompositeOperation = "source-over";
};

const start = () => {
    if (running || !props.active || document.hidden) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    running = true;
    lastTime = 0;
    animationFrame = requestAnimationFrame(render);
};

const stop = () => {
    running = false;
    cancelAnimationFrame(animationFrame);
};

const onVisibilityChange = () => (document.hidden ? stop() : start());

// watches

watch(
    () => props.active,
    (active) => (active ? start() : stop()),
);

// lifecycle

onMounted(() => {
    context = canvas.value?.getContext("2d") ?? null;
    measure();
    resizeObserver = new ResizeObserver(measure);
    if (canvas.value) resizeObserver.observe(canvas.value);
    document.addEventListener("visibilitychange", onVisibilityChange);
    start();
});

onBeforeUnmount(() => {
    stop();
    resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<template>
    <canvas ref="canvas" class="pointer-events-none absolute inset-0 size-full" aria-hidden="true" />
</template>
