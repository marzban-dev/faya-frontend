import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const currentDir = dirname(fileURLToPath(import.meta.url));
// Set at build time for a sub-path deploy (GitHub Pages: /faya-frontend/); app.head links aren't prefixed by Nuxt.
const baseURL = process.env.NUXT_APP_BASE_URL ?? "/";
const withBase = (path: string) => baseURL + path.replace(/^\//, "");

// Written by scripts/generate-assets.ts together with the images in public/icons/.
const splashLinks: { rel: string; media: string; href: string }[] = JSON.parse(
    readFileSync(join(currentDir, "splash-links.json"), "utf8"),
).map((link) => ({ ...link, href: withBase(link.href) }));

export default defineNuxtConfig({
    modules: ["@vite-pwa/nuxt"],

    pwa: {
        // injectManifest (not generateSW) so public/service-worker.ts can add Web Push later.
        strategies: "injectManifest",
        srcDir: join(currentDir, "public"),
        filename: "service-worker.ts",
        manifestFilename: "pwa.webmanifest",
        registerType: "autoUpdate",
        injectRegister: "auto",

        manifest: {
            // A stable id keeps an installed app the same app when start_url changes.
            id: baseURL,
            name: "Faya",
            short_name: "Faya",
            description: "Faya",
            theme_color: "#111111",
            background_color: "#111111",
            display: "standalone",
            start_url: baseURL,
            scope: baseURL,
            icons: [
                { src: withBase("/icons/pwa-64x64.png"), sizes: "64x64", type: "image/png" },
                { src: withBase("/icons/pwa-192x192.png"), sizes: "192x192", type: "image/png" },
                { src: withBase("/icons/pwa-512x512.png"), sizes: "512x512", type: "image/png" },
                { src: withBase("/icons/maskable-icon-512x512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
            ],
        },

        injectManifest: {
            globPatterns: ["**/*.{js,css,html,png,svg,ico,json,webp,woff2}"],
            // iOS reads its splash screen once, at launch; precaching all 80 would cost every
            // visitor about 3 MB. The landing intro's frames are ~15 MB and load on demand.
            globIgnores: ["**/icons/apple-splash-*", "**/intro/**"],
        },

        devOptions: {
            enabled: false,
            type: "module",
        },
    },

    app: {
        head: {
            meta: [
                { name: "mobile-web-app-capable", content: "yes" },
                { name: "apple-mobile-web-app-capable", content: "yes" },
                { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
                { name: "apple-mobile-web-app-title", content: "Faya" },
            ],
            link: [
                { rel: "icon", href: withBase("/icons/favicon.ico"), sizes: "48x48" },
                { rel: "icon", type: "image/png", sizes: "192x192", href: withBase("/icons/pwa-192x192.png") },
                { rel: "apple-touch-icon", href: withBase("/icons/apple-touch-icon-180x180.png") },
                ...splashLinks,
            ],
        },
    },
});
