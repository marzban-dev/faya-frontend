// imports

import { PANEL_FRAGMENT, PANEL_VERTEX, STAR_FRAGMENT, STAR_VERTEX } from "../../utils/tunnel-object-shaders.util";
import { STAR_VERTEX_FLOATS, tunnelProjection, type WorkPanel } from "../../utils/tunnel-space.util";
import { createGlProgram, type GlProgram } from "../../utils/webgl-program.util";

export type PanelDraw = { slot: number; panel: WorkPanel; alpha: number };

const MAX_ANISOTROPY = 8;

// Draws the tunnel's stars and works into the deep space's WebGL context, after it, at full
// resolution. Works are textures with mipmaps, so they stay clean far away.
export const useTunnelObjects = () => {
    // states

    let gl: WebGLRenderingContext | null = null;
    let stars: GlProgram | null = null;
    let panels: GlProgram | null = null;
    let starBuffer: WebGLBuffer | null = null;
    let starIndices: WebGLBuffer | null = null;
    let quadBuffer: WebGLBuffer | null = null;
    let quadIndices: WebGLBuffer | null = null;
    let anisotropy: { extension: EXT_texture_filter_anisotropic; level: number } | null = null;
    let textureSize = { width: 1024, height: 512 };
    let view = { width: 1, height: 1 };
    let projection = new Float32Array(16);
    const textures: (WebGLTexture | null)[] = [];
    const starData = new Float32Array(TUNNEL_STAR_COUNT * 4 * STAR_VERTEX_FLOATS);

    // methods

    const quadIndexList = (count: number) => {
        const indices = new Uint16Array(count * 6);
        for (let quad = 0; quad < count; quad++) indices.set([0, 1, 2, 0, 2, 3].map((corner) => quad * 4 + corner), quad * 6);
        return indices;
    };

    const createIndexBuffer = (context: WebGLRenderingContext, count: number) => {
        const indices = context.createBuffer();
        context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indices);
        context.bufferData(context.ELEMENT_ARRAY_BUFFER, quadIndexList(count), context.STATIC_DRAW);
        return indices;
    };

    const createQuad = (context: WebGLRenderingContext) => {
        quadBuffer = context.createBuffer();
        context.bindBuffer(context.ARRAY_BUFFER, quadBuffer);
        context.bufferData(context.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), context.STATIC_DRAW);
        quadIndices = createIndexBuffer(context, 1);
    };

    const attach = (context: WebGLRenderingContext) => {
        stars = createGlProgram(context, STAR_VERTEX, STAR_FRAGMENT, ["aPosition", "aLocal", "aShape", "aColor"], ["uView"]);
        panels = createGlProgram(context, PANEL_VERTEX, PANEL_FRAGMENT, ["aUv"], ["uProjection", "uCorners", "uImage", "uNormal", "uAlpha"]);
        if (!stars || !panels) return;
        gl = context;
        starBuffer = context.createBuffer();
        starIndices = createIndexBuffer(context, TUNNEL_STAR_COUNT);
        createQuad(context);
        const extension = context.getExtension("EXT_texture_filter_anisotropic");
        if (extension) {
            const level = context.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
            anisotropy = { extension, level: Math.min(MAX_ANISOTROPY, level) };
        }
        if (window.matchMedia("(max-width: 767px)").matches) textureSize = { width: 512, height: 256 };
    };

    const resize = (width: number, height: number) => {
        view = { width, height };
        projection = tunnelProjection(view);
    };

    // Mipmaps need power-of-two sizes in WebGL 1, so each work is resampled into one.
    const setWorkImage = (slot: number, image: HTMLImageElement) => {
        if (!gl) return;
        const resampled = document.createElement("canvas");
        resampled.width = textureSize.width;
        resampled.height = textureSize.height;
        const draw = resampled.getContext("2d");
        if (!draw) return;
        draw.imageSmoothingQuality = "high";
        draw.drawImage(image, 0, 0, resampled.width, resampled.height);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resampled);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.extension.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy.level);
        textures[slot] = texture;
    };

    const drawStars = (context: WebGLRenderingContext, count: number) => {
        if (!stars || count === 0) return;
        const stride = STAR_VERTEX_FLOATS * 4;
        context.useProgram(stars.program);
        context.uniform2f(stars.uniforms.uView!, view.width, view.height);
        context.bindBuffer(context.ARRAY_BUFFER, starBuffer);
        context.bufferData(context.ARRAY_BUFFER, starData.subarray(0, count * 4 * STAR_VERTEX_FLOATS), context.DYNAMIC_DRAW);
        [2, 2, 2, 4].forEach((size, location) => {
            context.enableVertexAttribArray(location);
            context.vertexAttribPointer(location, size, context.FLOAT, false, stride, location * 8);
        });
        context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, starIndices);
        context.blendFunc(context.ONE, context.ONE);
        context.drawElements(context.TRIANGLES, count * 6, context.UNSIGNED_SHORT, 0);
        [2, 3].forEach((location) => context.disableVertexAttribArray(location));
    };

    // Back to front, each with its own texture and lighting normal.
    const drawPanels = (context: WebGLRenderingContext, draws: PanelDraw[]) => {
        const visible = draws.filter((item) => textures[item.slot] && item.alpha > 0.005);
        if (!panels || visible.length === 0) return;
        const uniforms = panels.uniforms;
        context.useProgram(panels.program);
        context.uniformMatrix4fv(uniforms.uProjection!, false, projection);
        context.uniform1i(uniforms.uImage!, 0);
        context.bindBuffer(context.ARRAY_BUFFER, quadBuffer);
        context.enableVertexAttribArray(0);
        context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);
        context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, quadIndices);
        context.blendFunc(context.ONE, context.ONE_MINUS_SRC_ALPHA);
        context.activeTexture(context.TEXTURE0);
        for (const { slot, panel, alpha } of visible) {
            context.bindTexture(context.TEXTURE_2D, textures[slot]!);
            context.uniform3fv(uniforms.uCorners!, panel.corners.flat());
            context.uniform3f(uniforms.uNormal!, ...panel.normal);
            context.uniform1f(uniforms.uAlpha!, alpha);
            context.drawElements(context.TRIANGLES, 6, context.UNSIGNED_SHORT, 0);
        }
    };

    const render = (starCount: number, draws: PanelDraw[]) => {
        const context = gl;
        if (!context || context.isContextLost()) return;
        context.enable(context.BLEND);
        drawStars(context, starCount);
        context.disableVertexAttribArray(1);
        drawPanels(context, draws);
        context.disable(context.BLEND);
    };

    // lifecycle

    onBeforeUnmount(() => {
        if (gl) {
            for (const texture of textures) if (texture) gl.deleteTexture(texture);
            for (const item of [starBuffer, starIndices, quadBuffer, quadIndices]) if (item) gl.deleteBuffer(item);
            if (stars) gl.deleteProgram(stars.program);
            if (panels) gl.deleteProgram(panels.program);
        }
        gl = null;
    });

    return { attach, resize, render, setWorkImage, starData };
};
