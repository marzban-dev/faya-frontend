export const GLSL_PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

export type GlProgram = {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation | null>;
};

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error("[tunnel gl] shader failed to compile:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
};

// Attributes are bound to locations in the order given, so every program agrees on them.
export const createGlProgram = (
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string,
    attributes: string[],
    uniforms: string[],
): GlProgram | null => {
    const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = vertex && fragment ? gl.createProgram() : null;
    if (!program || !vertex || !fragment) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    attributes.forEach((name, index) => gl.bindAttribLocation(program, index, name));
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("[tunnel gl] program failed to link:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    const locations: GlProgram["uniforms"] = {};
    for (const name of uniforms) locations[name] = gl.getUniformLocation(program, name);
    return { program, uniforms: locations };
};
