<script setup lang="ts">
// imports

import { useTunnelDeepSpace } from "../../composables/index/use-tunnel-deep-space";
import { useTunnelObjects, type PanelDraw } from "../../composables/index/use-tunnel-objects";
import { DEEP_SPACE_FOCAL } from "../../utils/deep-space-shaders.util";
import {
    funnelAt,
    starsFade,
    workPanel,
    writeStarStreaks,
    type TunnelView,
} from "../../utils/tunnel-space.util";

const props = defineProps<{ load: boolean }>();

// states

type LoadedWork = TunnelWork & { aspect: number; ready: boolean };

const SPEED_EASE_RATE = 6;
const IDLE_DRIFT = 0.12;
const STREAK_PER_SPEED = 0.08;
// How far deep-space objects smear outward per unit of camera speed, and the most they may.
const STRETCH_PER_SPEED = 0.03;
const MAX_STRETCH = 0.3;
const POINTER_EASE_RATE = 2.5;

const layer = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const { baseURL } = useRuntimeConfig().app;
const deepSpace = useTunnelDeepSpace();
const objects = useTunnelObjects();
let works: LoadedWork[] = TUNNEL_WORKS.map((work) => ({ ...work, aspect: 16 / 9, ready: false }));
let stars: TunnelStar[] = [];
let width = 0;
let height = 0;
let progress = 0;
let lastCamera = 0;
let speed = 0;
let drift = 0;
let lastTime = 0;
let animationFrame = 0;
let running = false;
let reducedMotion = false;
let resizeObserver: ResizeObserver | null = null;
let pointerTarget = { x: 0, y: 0 };
let pointer = { x: 0, y: 0 };

// methods

const measure = () => {
    const element = canvas.value;
    if (!element) return;
    width = element.clientWidth;
    height = element.clientHeight;
    deepSpace.resize(width, height);
    objects.resize(width, height);
};

const loadWorks = () => {
    works.forEach((work, index) => {
        const image = new Image();
        image.decoding = "async";
        image.src = withBaseUrl(baseURL, work.url);
        image.decode().then(
            () => {
                work.aspect = image.naturalWidth / image.naturalHeight;
                work.ready = true;
                objects.setWorkImage(index, image);
            },
            () => undefined,
        );
    });
};

const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointerTarget = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
    };
};

// Works ahead, back to front.
const panelsAt = (view: TunnelView, camera: number, reveal: number): PanelDraw[] =>
    works
        .map((work, slot) => ({ work, slot, depth: work.depth - camera }))
        .filter(({ work, depth }) => work.ready && depth > TUNNEL_NEAR && depth < TUNNEL_FAR)
        .sort((a, b) => b.depth - a.depth)
        .map(({ work, slot, depth }) => ({ slot, panel: workPanel(view, work, depth, work.aspect), alpha: depthAlpha(depth) * reveal }));

const render = (time: number) => {
    animationFrame = requestAnimationFrame(render);
    const element = layer.value;
    if (!element) return;

    const seconds = time / 1000;
    const delta = lastTime ? Math.min(seconds - lastTime, 0.1) : 0;
    lastTime = seconds;

    const phase = tunnelPhaseAt(progress);
    const instant = delta > 0 ? Math.abs(phase.camera - lastCamera) / delta : 0;
    lastCamera = phase.camera;
    speed += (instant - speed) * (1 - Math.exp(-delta * SPEED_EASE_RATE));
    if (!reducedMotion) drift += delta * IDLE_DRIFT;
    const pointerEase = 1 - Math.exp(-delta * POINTER_EASE_RATE);
    pointer = {
        x: pointer.x + (pointerTarget.x - pointer.x) * pointerEase,
        y: pointer.y + (pointerTarget.y - pointer.y) * pointerEase,
    };
    element.style.opacity = `${phase.cover}`;

    const view: TunnelView = { width, height, pointer };
    const holeDistance = blackHoleDistance(phase);
    deepSpace.render({
        camera: phase.camera,
        pointer,
        warmth: Math.min(1, Math.max(0, (progress - 0.4) / 0.55)),
        stretch: reducedMotion ? 0 : Math.min(MAX_STRETCH, speed * STRETCH_PER_SPEED) + phase.fall * 0.3,
        reveal: phase.reveal,
        hole: phase.hole,
        holeDistance,
    });
    const funnel = funnelAt(phase.hole, phase.fall, blackHoleShadowRadius(phase, DEEP_SPACE_FOCAL));
    const streak = Math.min(1.2, 0.004 + speed * STREAK_PER_SPEED + phase.fall * 0.7);
    const starStrength = phase.reveal * 0.6 * starsFade(phase.hole, phase.fall);
    const starCount = writeStarStreaks(objects.starData, stars, view, phase.camera + drift, streak, starStrength, funnel);
    objects.render(starCount, panelsAt(view, phase.camera, phase.reveal));
};

const start = () => {
    if (running) return;
    running = true;
    lastTime = 0;
    animationFrame = requestAnimationFrame(render);
};

const stop = () => {
    running = false;
    cancelAnimationFrame(animationFrame);
};

// Called by useIntroStage on every scrolled frame. The canvas only runs while the tunnel
// is on screen.
const setProgress = (next: number) => {
    progress = next;
    const element = layer.value;
    if (!element) return;
    const visible = next > 0;
    element.style.visibility = visible ? "visible" : "hidden";
    if (visible) start();
    else stop();
};

defineExpose({ setProgress });

// watches

watch(
    () => props.load,
    (load) => {
        if (load) loadWorks();
    },
    { once: true },
);

// lifecycle

onMounted(() => {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stars = createTunnelStars(Math.random);
    if (!reducedMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });
    const context = canvas.value ? deepSpace.attach(canvas.value) : null;
    if (context) objects.attach(context);
    measure();
    resizeObserver = new ResizeObserver(measure);
    if (canvas.value) resizeObserver.observe(canvas.value);
    if (props.load) loadWorks();
});

onBeforeUnmount(() => {
    stop();
    resizeObserver?.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    works = [];
});
</script>

<template>
    <div ref="layer" class="invisible absolute inset-0 bg-black opacity-0" aria-hidden="true">
        <canvas ref="canvas" class="absolute inset-0 size-full" />
    </div>
</template>
