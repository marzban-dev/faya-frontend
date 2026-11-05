<script setup lang="ts">
// imports

defineProps<{ visible: boolean }>();

// states

type StarLayer = {
    pixelsPerStar: number;
    shift: number;
    minSize: number;
    maxSize: number;
    minAlpha: number;
    maxAlpha: number;
};

type Star = {
    x: number;
    y: number;
    size: number;
    alpha: number;
    twinkleSpeed: number;
    twinklePhase: number;
};

const LAYERS: StarLayer[] = [
    { pixelsPerStar: 2600, shift: 4, minSize: 0.4, maxSize: 0.9, minAlpha: 0.25, maxAlpha: 0.6 },
    { pixelsPerStar: 9000, shift: 12, minSize: 0.8, maxSize: 1.3, minAlpha: 0.45, maxAlpha: 0.85 },
    { pixelsPerStar: 32000, shift: 30, minSize: 1.2, maxSize: 2, minAlpha: 0.7, maxAlpha: 1 },
];
const MARGIN = Math.max(...LAYERS.map((layer) => layer.shift));
const MAX_PIXEL_RATIO = 2;
const EASE_RATE = 4;
const DRIFT_SPEED = 1;

const canvas = ref<HTMLCanvasElement | null>(null);
let context: CanvasRenderingContext2D | null = null;
let layers: Star[][] = [];
let width = 0;
let height = 0;
let pixelRatio = 1;
let targetX = 0;
let offsetX = 0;
let drift = 0;
let lastTime = 0;
let animationFrame = 0;
let running = false;
let reducedMotion = false;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;

// methods

const between = (min: number, max: number) => min + Math.random() * (max - min);

const wrap = (value: number, size: number) => ((value % size) + size) % size;

const createStars = () => {
    const fieldWidth = width + MARGIN * 2;
    const fieldHeight = height + MARGIN * 2;
    layers = LAYERS.map((layer) =>
        Array.from({ length: Math.round((fieldWidth * fieldHeight) / layer.pixelsPerStar) }, () => ({
            x: Math.random() * fieldWidth,
            y: Math.random() * fieldHeight,
            size: between(layer.minSize, layer.maxSize),
            alpha: between(layer.minAlpha, layer.maxAlpha),
            twinkleSpeed: between(0.4, 1.6),
            twinklePhase: Math.random() * Math.PI * 2,
        })),
    );
};

const measure = () => {
    const element = canvas.value;
    if (!element) return;
    width = element.clientWidth;
    height = element.clientHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    element.width = Math.round(width * pixelRatio);
    element.height = Math.round(height * pixelRatio);
    createStars();
    draw(performance.now() / 1000);
};

const draw = (seconds: number) => {
    const context2d = context;
    if (!context2d) return;
    context2d.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context2d.clearRect(0, 0, width, height);
    context2d.fillStyle = "#fff";
    const fieldWidth = width + MARGIN * 2;
    const fieldHeight = height + MARGIN * 2;

    layers.forEach((stars, index) => {
        const shift = LAYERS[index]!.shift;
        const dx = offsetX * shift;
        const dy = -drift * shift;
        for (const star of stars) {
            const x = wrap(star.x + dx, fieldWidth) - MARGIN;
            const y = wrap(star.y + dy, fieldHeight) - MARGIN;
            if (x < -2 || x > width + 2 || y < -2 || y > height + 2) continue;
            const twinkle = reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(seconds * star.twinkleSpeed + star.twinklePhase);
            context2d.globalAlpha = star.alpha * twinkle;
            if (star.size < 1.1) {
                context2d.fillRect(x - star.size / 2, y - star.size / 2, star.size, star.size);
            } else {
                context2d.beginPath();
                context2d.arc(x, y, star.size / 2, 0, Math.PI * 2);
                context2d.fill();
            }
        }
    });
    context2d.globalAlpha = 1;
};

const tick = (time: number) => {
    animationFrame = requestAnimationFrame(tick);
    const seconds = time / 1000;
    const delta = lastTime ? Math.min(seconds - lastTime, 0.1) : 0;
    lastTime = seconds;

    const ease = 1 - Math.exp(-delta * EASE_RATE);
    offsetX += (targetX - offsetX) * ease;
    drift += delta * DRIFT_SPEED;
    draw(seconds);
};

const start = () => {
    if (running || reducedMotion) return;
    running = true;
    lastTime = 0;
    animationFrame = requestAnimationFrame(tick);
};

const stop = () => {
    running = false;
    cancelAnimationFrame(animationFrame);
};

const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    targetX = -((event.clientX / window.innerWidth) * 2 - 1);
};

// lifecycle

onMounted(() => {
    const element = canvas.value;
    if (!element) return;
    context = element.getContext("2d");
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    measure();
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    intersectionObserver = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()));
    intersectionObserver.observe(element);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
});

onBeforeUnmount(() => {
    stop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
});
</script>

<template>
    <canvas
        ref="canvas"
        class="absolute inset-0 size-full transition-opacity duration-1500 ease-out"
        :class="visible ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
    />
</template>
