import { fileURLToPath } from "url";
import { dirname, join } from "path";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
    modules: ["@nuxt/ui", "@nuxt/fonts"],

    css: [join(currentDir, "./assets/css/main-tailwind.css"), join(currentDir, "./assets/css/vue-animations.css")],

    // Fonts are served from the site itself, never from a font CDN.
    fonts: {
        providers: {
            google: false,
            bunny: false,
            fontshare: false,
            fontsource: false,
            adobe: false,
            googleicons: false,
        },
        families: [
            { name: "YekanBakh", provider: "local", weights: [100, 300, 400, 600, 700, 800, 900] },
            // Declared in assets/css/global-configs.css: a variable font the local provider can't describe.
            { name: "Inter", provider: "none" },
            { name: "Geist Mono", provider: "none" },
            { name: "Segoe UI", provider: "none" },
            { name: "Helvetica Neue", provider: "none" },
            { name: "Arial", provider: "none" },
        ],
    },
});
