// imports

import {
    DEEP_SPACE_SCENE,
    DEEP_SPACE_STRETCH,
    DEEP_SPACE_VERTEX,
} from "../../utils/deep-space-shaders.util";
import { createGlProgram, type GlProgram } from "../../utils/webgl-program.util";

export type DeepSpaceFrame = {
    camera: number;
    pointer: { x: number; y: number };
    warmth: number;
    stretch: number;
    reveal: number;
    // The black hole at the screen's centre: how far it has faded in, and the camera's
    // distance from it in Schwarzschild radii.
    hole: number;
    holeDistance: number;
    // Seconds, for the black hole's disc to keep orbiting while the scroll rests; 0 holds it still.
    time: number;
};

// The scene is ray-traced into a buffer at a fraction of the CSS size (space is soft by
// nature, and this keeps the shader cheap); the canvas itself is full resolution so the
// works and stars drawn over it stay sharp.
const MAX_SCALE = 0.6;
const PIXEL_BUDGET = 500_000;
// The black hole's disc has fine detail, so once it shows the scene is drawn sharper.
const HOLE_SCALE = 0.85;
const HOLE_PIXEL_BUDGET = 1_000_000;
const MAX_PIXEL_RATIO = 2;
const MAX_CANVAS_PIXELS = 4_500_000;
// Kept dim on purpose: the deep space is atmosphere behind the works, not the subject.
const EXPOSURE = 0.85;
const INTENSITY = 0.7;

const SCENE_UNIFORMS = ["uResolution", "uPointer", "uParams", "uHoleParams", "uTime"];

// Paints the tunnel's deep space and black hole with WebGL, and owns the context the tunnel's
// stars and works are drawn into after it. Without WebGL it logs why and the tunnel stays black.
export const useTunnelDeepSpace = () => {
    // states

    let gl: WebGLRenderingContext | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let scene: GlProgram | null = null;
    let stretch: GlProgram | null = null;
    let quad: WebGLBuffer | null = null;
    let target: WebGLTexture | null = null;
    let framebuffer: WebGLFramebuffer | null = null;
    let buffer = { width: 1, height: 1 };
    let sky = { width: 1, height: 1 };
    let octaves = 5;
    let usable = false;

    // methods

    const createTarget = (context: WebGLRenderingContext) => {
        if (target) context.deleteTexture(target);
        if (framebuffer) context.deleteFramebuffer(framebuffer);
        target = context.createTexture();
        context.bindTexture(context.TEXTURE_2D, target);
        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, buffer.width, buffer.height, 0, context.RGBA, context.UNSIGNED_BYTE, null);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
        framebuffer = context.createFramebuffer();
        context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
        context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, target, 0);
        context.bindFramebuffer(context.FRAMEBUFFER, null);
    };

    const onContextLost = (event: Event) => {
        event.preventDefault();
        usable = false;
    };

    const attach = (element: HTMLCanvasElement) => {
        canvas = element;
        const context = element.getContext("webgl", { alpha: false, antialias: true, depth: false, powerPreference: "high-performance" });
        if (!context) {
            console.error("[tunnel gl] WebGL is not available; the tunnel stays black.");
            return null;
        }
        gl = context;
        element.addEventListener("webglcontextlost", onContextLost);
        scene = createGlProgram(context, DEEP_SPACE_VERTEX, DEEP_SPACE_SCENE, ["aPosition"], SCENE_UNIFORMS);
        stretch = createGlProgram(context, DEEP_SPACE_VERTEX, DEEP_SPACE_STRETCH, ["aPosition"], ["uScene", "uResolution", "uStretch", "uReveal", "uSceneRect"]);
        if (!scene || !stretch) return null;
        quad = context.createBuffer();
        context.bindBuffer(context.ARRAY_BUFFER, quad);
        context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), context.STATIC_DRAW);
        createTarget(context);
        usable = true;
        return context;
    };

    const resize = (cssWidth: number, cssHeight: number) => {
        if (!gl || !canvas || cssWidth < 1 || cssHeight < 1) return;
        const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO, Math.sqrt(MAX_CANVAS_PIXELS / (cssWidth * cssHeight)));
        canvas.width = Math.round(cssWidth * ratio);
        canvas.height = Math.round(cssHeight * ratio);
        const sized = (maxScale: number, budget: number) => {
            const scale = Math.min(maxScale, Math.sqrt(budget / (cssWidth * cssHeight)));
            return { width: Math.max(1, Math.round(cssWidth * scale)), height: Math.max(1, Math.round(cssHeight * scale)) };
        };
        sky = sized(MAX_SCALE, PIXEL_BUDGET);
        buffer = sized(HOLE_SCALE, HOLE_PIXEL_BUDGET);
        octaves = cssWidth < 768 ? 4 : 5;
        if (usable) createTarget(gl);
    };

    const bindQuad = (context: WebGLRenderingContext) => {
        context.bindBuffer(context.ARRAY_BUFFER, quad);
        context.enableVertexAttribArray(0);
        context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);
    };

    const render = (frame: DeepSpaceFrame) => {
        const context = gl;
        if (!context || !usable || !scene || !stretch || !canvas) return;
        const uniforms = scene.uniforms;
        context.disable(context.BLEND);
        bindQuad(context);

        context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
        const size = frame.hole > 0 ? buffer : sky;
        context.viewport(0, 0, size.width, size.height);
        context.useProgram(scene.program);
        context.uniform2f(uniforms.uResolution!, size.width, size.height);
        context.uniform2f(uniforms.uPointer!, frame.pointer.x, frame.pointer.y);
        context.uniform4f(uniforms.uParams!, frame.camera, frame.warmth, octaves, EXPOSURE);
        context.uniform4f(uniforms.uHoleParams!, frame.hole, frame.holeDistance, INTENSITY, frame.hole);
        context.uniform1f(uniforms.uTime!, frame.time);
        context.drawArrays(context.TRIANGLE_STRIP, 0, 4);

        context.bindFramebuffer(context.FRAMEBUFFER, null);
        context.viewport(0, 0, canvas.width, canvas.height);
        context.useProgram(stretch.program);
        context.activeTexture(context.TEXTURE0);
        context.bindTexture(context.TEXTURE_2D, target);
        context.uniform1i(stretch.uniforms.uScene!, 0);
        context.uniform2f(stretch.uniforms.uResolution!, canvas.width, canvas.height);
        context.uniform1f(stretch.uniforms.uStretch!, frame.stretch);
        context.uniform1f(stretch.uniforms.uReveal!, frame.reveal);
        context.uniform4f(
            stretch.uniforms.uSceneRect!,
            (size.width - 1) / buffer.width,
            (size.height - 1) / buffer.height,
            0.5 / buffer.width,
            0.5 / buffer.height,
        );
        context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
    };

    // lifecycle

    onBeforeUnmount(() => {
        canvas?.removeEventListener("webglcontextlost", onContextLost);
        if (gl) {
            if (target) gl.deleteTexture(target);
            if (framebuffer) gl.deleteFramebuffer(framebuffer);
            if (quad) gl.deleteBuffer(quad);
            if (scene) gl.deleteProgram(scene.program);
            if (stretch) gl.deleteProgram(stretch.program);
        }
        usable = false;
        gl = null;
    });

    return { attach, resize, render };
};
