<script setup lang="ts">
// imports

import { DEEP_SPACE_VERTEX, HUB_NEBULA } from "../../utils/deep-space-shaders.util";
import { createGlProgram, type GlProgram } from "../../utils/webgl-program.util";

// states

const MAX_SCALE = 0.5;
const PIXEL_BUDGET = 400_000;
const FRAME_INTERVAL_MS = 1000 / 30;
const INTENSITY = 0.55;
const WARMTH = 0.15;
const POINTER_EASE_RATE = 2.5;

const canvas = ref<HTMLCanvasElement | null>(null);
let gl: WebGLRenderingContext | null = null;
let program: GlProgram | null = null;
let quad: WebGLBuffer | null = null;
let octaves = 5;
let usable = false;
let reducedMotion = false;
let target = { x: 0, y: 0 };
let pointer = { x: 0, y: 0 };
let startTime = 0;
let lastFrame = 0;
let lastTime = 0;
let animationFrame = 0;
let resizeObserver: ResizeObserver | null = null;

// methods

const draw = (seconds: number) => {
    const context = gl;
    if (!context || !usable || !program || !canvas.value) return;
    context.viewport(0, 0, canvas.value.width, canvas.value.height);
    context.useProgram(program.program);
    context.bindBuffer(context.ARRAY_BUFFER, quad);
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);
    context.uniform2f(program.uniforms.uResolution!, canvas.value.width, canvas.value.height);
    context.uniform2f(program.uniforms.uPointer!, pointer.x, pointer.y);
    context.uniform4f(program.uniforms.uParams!, seconds, octaves, INTENSITY, WARMTH);
    context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
};

const measure = () => {
    const element = canvas.value;
    if (!element) return;
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (width < 1 || height < 1) return;
    const scale = Math.min(MAX_SCALE, Math.sqrt(PIXEL_BUDGET / (width * height)));
    element.width = Math.max(1, Math.round(width * scale));
    element.height = Math.max(1, Math.round(height * scale));
    octaves = width < 768 ? 4 : 5;
    draw(lastTime);
};

const tick = (time: number) => {
    animationFrame = requestAnimationFrame(tick);
    if (time - lastFrame < FRAME_INTERVAL_MS) return;
    const delta = lastFrame ? Math.min(time - lastFrame, 100) / 1000 : 0;
    lastFrame = time;
    if (!startTime) startTime = time;
    const ease = 1 - Math.exp(-delta * POINTER_EASE_RATE);
    pointer = { x: pointer.x + (target.x - pointer.x) * ease, y: pointer.y + (target.y - pointer.y) * ease };
    lastTime = (time - startTime) / 1000;
    draw(lastTime);
};

const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    target = { x: (event.clientX / window.innerWidth) * 2 - 1, y: 1 - (event.clientY / window.innerHeight) * 2 };
};

const onContextLost = (event: Event) => {
    event.preventDefault();
    usable = false;
};

// lifecycle

onMounted(() => {
    const element = canvas.value;
    if (!element) return;
    const context = element.getContext("webgl", { alpha: false, antialias: false, depth: false });
    if (!context) {
        console.error("[hub gl] WebGL is not available; the hub's sky stays without gas.");
        return;
    }
    gl = context;
    element.addEventListener("webglcontextlost", onContextLost);
    program = createGlProgram(context, DEEP_SPACE_VERTEX, HUB_NEBULA, ["aPosition"], ["uResolution", "uPointer", "uParams"]);
    if (!program) return;
    quad = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, quad);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), context.STATIC_DRAW);
    usable = true;

    reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    if (reducedMotion) return;
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
    }
    animationFrame = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    canvas.value?.removeEventListener("webglcontextlost", onContextLost);
    if (gl) {
        if (quad) gl.deleteBuffer(quad);
        if (program) gl.deleteProgram(program.program);
    }
    usable = false;
    gl = null;
});
</script>

<template>
    <canvas ref="canvas" class="size-full" aria-hidden="true" />
</template>
