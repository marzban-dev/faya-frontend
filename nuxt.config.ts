export default defineNuxtConfig({
    compatibilityDate: "2026-11-01",

    devtools: { enabled: true },

    extends: ["./apps/landing"],

    // Precompressed .br/.gz copies of the built files, served to browsers that accept them.
    // Server-rendered pages are compressed by server/plugins/compress-html.ts.
    nitro: {
        compressPublicAssets: true,
    },

    colorMode: {
        preference: "dark",
    },

    icon: {
        clientBundle: {
            scan: true,
        },
    },
});
