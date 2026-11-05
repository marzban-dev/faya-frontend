// imports

import publicAssetSizes from "#landing/public-asset-sizes";
import {
    introReadyFrameUrls,
    toPublicPath,
    withBaseUrl,
    type IntroVariant,
} from "../../app/utils/intro-assets.util";

type IntroLoadData = {
    assets: [string, number][];
    frames: Record<IntroVariant, [string, number][]>;
};

const BOOT_ASSET_TAG = /<(link|script)\b[^>]*>/g;
const ATTRIBUTE = (name: string) => new RegExp(`\\s${name}="([^"]*)"`);
const BOOT_LINK_RELS = new Set(["stylesheet", "modulepreload", "preload", "prefetch"]);

// Runs in the page's <head>, before the app: sums the bytes of every file the intro waits
// for (the app's own code, then the frames for this screen's shape) as each one finishes,
// and publishes the share on <style id="intro-load"> — as `--intro-load` for CSS, and as
// data-value for the app once it runs. A file without a known size (dev) counts as 1.
// Stringified into the page, so it must not reference anything outside itself.
const trackIntroLoad = (data: IntroLoadData) => {
    const variant = innerWidth < innerHeight ? "mobile" : "desktop";
    const weights = new Map<string, number>([...data.assets, ...data.frames[variant]]);
    let total = 0;
    weights.forEach((weight) => (total += weight));
    let done = 0;

    const style = document.createElement("style");
    style.id = "intro-load";
    document.head.append(style);
    const publish = () => {
        const share = total ? Math.min(1, done / total) : 1;
        style.dataset.value = String(share);
        style.textContent = `:root{--intro-load:${share}}`;
    };
    publish();

    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            const path = new URL(entry.name).pathname;
            const weight = weights.get(path);
            if (weight === undefined) continue;
            weights.delete(path);
            done += weight;
        }
        publish();
        if (!weights.size) observer.disconnect();
    });
    observer.observe({ type: "resource", buffered: true });
};

// Sizes are keyed by public path, but the browser reports paths with baseURL in front.
const withSize =
    (baseURL: string) =>
    (url: string): [string, number] => {
        const path = toPublicPath(baseURL, url);
        return [withBaseUrl(baseURL, path), publicAssetSizes[path] ?? 1];
    };

const bootAssetPaths = (head: string) => {
    const paths = new Set<string>();
    for (const [tag, name] of head.matchAll(BOOT_ASSET_TAG)) {
        const url = name === "link" ? tag.match(ATTRIBUTE("href"))?.[1] : tag.match(ATTRIBUTE("src"))?.[1];
        const rel = tag.match(ATTRIBUTE("rel"))?.[1] ?? "";
        if (!url?.startsWith("/") || (name === "link" && !BOOT_LINK_RELS.has(rel))) continue;
        paths.add(url.split("?")[0]!);
    }
    return [...paths];
};

export default defineNitroPlugin((nitroApp) => {
    // states

    const { baseURL } = useRuntimeConfig().app;
    const sized = withSize(baseURL);
    const frames: IntroLoadData["frames"] = {
        desktop: introReadyFrameUrls("desktop").map(sized),
        mobile: introReadyFrameUrls("mobile").map(sized),
    };

    // lifecycle

    nitroApp.hooks.hook("render:html", (html, { event }) => {
        const path = event.path.split("?")[0]!;
        if (path !== "/" && path !== baseURL && `${path}/` !== baseURL) return;
        const data: IntroLoadData = { assets: bootAssetPaths(html.head.join("")).map(sized), frames };
        const json = JSON.stringify(data).replaceAll("<", "\\u003c");
        html.head.push(`<script>(${trackIntroLoad.toString()})(${json})</script>`);
    });
});
