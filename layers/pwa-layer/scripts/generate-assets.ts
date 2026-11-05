// Builds the favicon, PWA icons and iOS splash screens from the Faya logo into
// public/icons/, and the splash screens' <link> tags into splash-links.json (read by
// nuxt.config.ts). Run `bun run pwa-assets` after changing the logo or the colors.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAppleSplashScreens } from "@vite-pwa/assets-generator/config";
import type { Preset } from "@vite-pwa/assets-generator/config";
import { instructions } from "@vite-pwa/assets-generator/api/instructions";
import { generateAssets } from "@vite-pwa/assets-generator/api/generate-assets";
import { generateHtmlMarkup } from "@vite-pwa/assets-generator/api/generate-html-markup";

// brand-50 and graphite-950 from layers/ui-layer/assets/css/theme.css. The logo has black
// outlines, so tiles sit on the light color; dark-mode splash screens use the dark one.
const LIGHT_BACKGROUND = "#fff6ed";
const DARK_BACKGROUND = "#111111";

const layerDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(layerDir, "assets/faya-logo.png");
const outDir = join(layerDir, "public/icons");

const preset: Preset = {
    transparent: {
        sizes: [64, 192, 512],
        favicons: [[48, "favicon.ico"]],
        padding: 0.05,
    },
    maskable: {
        sizes: [512],
        // Launchers crop maskable icons to a circle; this keeps the logo's corners inside it.
        padding: 0.42,
        resizeOptions: { background: LIGHT_BACKGROUND },
    },
    apple: {
        sizes: [180],
        padding: 0.2,
        resizeOptions: { background: LIGHT_BACKGROUND },
    },
    appleSplashScreens: createAppleSplashScreens({
        padding: 0.4,
        resizeOptions: { background: LIGHT_BACKGROUND, fit: "contain" },
        darkResizeOptions: { background: DARK_BACKGROUND, fit: "contain" },
        linkMediaOptions: { log: false, addMediaScreen: true, basePath: "/icons/", xhtml: false },
    }),
};

const main = async () => {
    const instruction = await instructions({
        imageResolver: () => readFile(source),
        imageName: join(outDir, "faya-logo.png"),
        originalName: "faya-logo.png",
        preset,
        faviconPreset: "2023",
        htmlLinks: { xhtml: false, includeId: false },
        basePath: "/icons/",
    });

    await generateAssets(instruction, true, outDir);

    const splashLinks = generateHtmlMarkup(instruction)
        .filter((link) => link.includes('rel="apple-touch-startup-image"'))
        .map((link) => ({
            rel: "apple-touch-startup-image",
            media: link.match(/media="([^"]+)"/)?.[1] ?? "",
            href: link.match(/href="([^"]+)"/)?.[1] ?? "",
        }));

    await writeFile(join(layerDir, "splash-links.json"), `${JSON.stringify(splashLinks, null, 4)}\n`);
};

await main();
