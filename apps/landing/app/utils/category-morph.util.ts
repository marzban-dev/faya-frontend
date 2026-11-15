// A field's current slide flying back into its hub frame. It lives in the landing layout
// (CategoryMorphLayer), above both pages, so it keeps moving while the page changes under it.

export type MorphRect = { x: number; y: number; width: number; height: number };

// How the picture looks at either end: its filter, its scale inside the frame, and the
// frame's corner radius (a CSS border-radius value).
export type MorphLook = { filter: string; scale: number; radius: string };

export type CategoryMorph = {
    id: HubCategoryId;
    rect: MorphRect;
    src: string;
    look: MorphLook;
    // "flying" until the frame reaches its hub frame; the hub then shows the real thing.
    stage: "flying" | "landed";
    // Tells one flight from the next.
    flight: number;
};

export const MORPH_CLOSE_MS = 640;
export const MORPH_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

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
