// A frame flying between the hub and a field's page. It lives in the landing layout
// (CategoryMorphLayer), above both pages, so it keeps moving while the page changes under it.

export type MorphRect = { x: number; y: number; width: number; height: number };

// How the picture looks at either end: its filter, its scale inside the frame, and the
// frame's corner radius (a CSS border-radius value).
export type MorphLook = { filter: string; scale: number; radius: string };

export type CategoryMorph = {
    id: HubCategoryId;
    // "open": hub frame → the field's first slide. "close": the field's current slide → its hub frame.
    direction: "open" | "close";
    rect: MorphRect;
    src: string;
    look: MorphLook;
    // "flying" until the frame reaches its target; the page there then shows the real thing.
    stage: "flying" | "landed";
    // Tells one flight from the next.
    flight: number;
};

export const MORPH_OPEN_MS = 720;
export const MORPH_CLOSE_MS = 640;
export const MORPH_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

// Where a field's slides sit, in px: must match the variables in category-detail/Deck.vue.
const SLIDE_FRAME = {
    mobile: { top: 68, inset: 8, peek: 44, radius: 16 },
    desktop: { top: 80, inset: 20, peek: 48, radius: 24 },
};

// The slide's picture overflows it by 14% at the top and bottom (Slide.vue's .slide-media).
export const SLIDE_MEDIA_SCALE = 1.28;

export const slideRadius = (radius: number) => `${radius}px`;

// The first slide's frame on this screen, before the page that holds it exists.
export const firstSlideTarget = (): { rect: MorphRect; look: MorphLook } => {
    const frame = window.innerWidth >= 768 ? SLIDE_FRAME.desktop : SLIDE_FRAME.mobile;
    const width = document.documentElement.clientWidth;
    return {
        rect: { x: frame.inset, y: frame.top, width: width - frame.inset * 2, height: window.innerHeight - frame.top - frame.peek },
        look: { filter: "brightness(1) saturate(1)", scale: SLIDE_MEDIA_SCALE, radius: slideRadius(frame.radius) },
    };
};

export const rectOf = (element: Element): MorphRect => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
};

// The picture's look as the browser currently renders it, mid-transition included.
export const lookOf = (frame: Element, image: Element): MorphLook => {
    const imageStyle = getComputedStyle(image);
    const scale = Number.parseFloat(imageStyle.scale);
    return {
        filter: imageStyle.filter === "none" ? "brightness(1) saturate(1)" : imageStyle.filter,
        scale: Number.isFinite(scale) ? scale : 1,
        radius: getComputedStyle(frame).borderRadius || "0px",
    };
};
