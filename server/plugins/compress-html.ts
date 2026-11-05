// imports

import { brotliCompressSync, constants, gzipSync } from "node:zlib";

// Brotli's middle quality: most of the size win at a few milliseconds per page, since every
// request renders its HTML anew (static files are compressed once, at build time).
const BROTLI_QUALITY = 5;
const MIN_BYTES = 1024;

const pickEncoding = (acceptEncoding: string) => {
    const accepted = acceptEncoding.split(",").map((part) => part.split(";")[0]!.trim().toLowerCase());
    if (accepted.includes("br")) return "br";
    if (accepted.includes("gzip")) return "gzip";
    return null;
};

// Compresses server-rendered pages. Static files are served precompressed through
// `nitro.compressPublicAssets` instead. A reverse proxy in front leaves an already encoded
// response alone, so this stays safe if one is added later.
export default defineNitroPlugin((nitroApp) => {
    // lifecycle

    nitroApp.hooks.hook("render:response", (response, { event }) => {
        const headers = (response.headers ??= {});
        const contentType = String(headers["content-type"] ?? "");
        if (typeof response.body !== "string" || !contentType.startsWith("text/html")) return;
        if (headers["content-encoding"] || Buffer.byteLength(response.body) < MIN_BYTES) return;

        const encoding = pickEncoding(getRequestHeader(event, "accept-encoding") ?? "");
        headers.vary = headers.vary ? `${headers.vary}, Accept-Encoding` : "Accept-Encoding";
        if (!encoding) return;

        response.body =
            encoding === "br"
                ? brotliCompressSync(response.body, { params: { [constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY } })
                : gzipSync(response.body);
        headers["content-encoding"] = encoding;
    });
});
