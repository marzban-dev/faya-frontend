// Intro frames are built by `bun run intro-assets` into public/intro/. Pupil positions are
// in the source frame's pixels, measured on the logo's last frame and on each intro's first
// frame; they line the logo's pupil up with the intro's so the zoom can cut between them.

import { frameLoadOrder } from "./frame-sequence.util";

export type IntroVariant = "desktop" | "mobile";

export type IntroPupil = { x: number; y: number; radius: number };

export type IntroFrames = {
    width: number;
    height: number;
    count: number;
    pupil: IntroPupil;
    url: (index: number) => string;
};

const frameUrl = (variant: IntroVariant) => (index: number) =>
    `/intro/${variant}/${String(index).padStart(4, "0")}.webp`;

// The animated SVG logo (components/index/IntroLogo.vue) is drawn in this frame size.
export const INTRO_LOGO = {
    width: 1280,
    height: 660,
    pupil: { x: 581, y: 422, radius: 33.5 },
    // How far the drawing reaches into the frame, as fractions of its size.
    contentBottom: 0.95,
} as const;

export const INTRO_FRAMES: Record<IntroVariant, IntroFrames> = {
    desktop: {
        width: 1280,
        height: 660,
        count: 241,
        pupil: { x: 643, y: 348, radius: 132 },
        url: frameUrl("desktop"),
    },
    mobile: {
        width: 720,
        height: 1234,
        count: 241,
        pupil: { x: 362, y: 620, radius: 275 },
        url: frameUrl("mobile"),
    },
};

// Frame URLs are public paths; under a sub-path (GitHub Pages) the browser needs baseURL in front.
export const withBaseUrl = (baseURL: string, path: string) => baseURL + path.replace(/^\//, "");

export const toPublicPath = (baseURL: string, url: string) =>
    baseURL !== "/" && url.startsWith(baseURL) ? `/${url.slice(baseURL.length)}` : url;

// The frames the intro waits for before scrolling unlocks, in load order (public paths).
export const introReadyFrameUrls = (variant: IntroVariant) => {
    const frames = INTRO_FRAMES[variant];
    const { order, readyCount } = frameLoadOrder(frames.count);
    return order.slice(0, readyCount).map(frames.url);
};
