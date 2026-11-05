export type IntroRect = { x: number; y: number; width: number; height: number };

export type IntroCircle = { x: number; y: number; radius: number };

export type IntroLayout = {
    width: number;
    height: number;
    logo: IntroRect;
    logoPupil: IntroCircle;
    intro: IntroRect;
    introPupil: IntroCircle;
    // Distance from the intro's pupil to the farthest corner of the screen.
    cover: number;
    // How much the logo grows before its pupil fills the screen.
    zoom: number;
};

export type IntroZoom = {
    progress: number;
    scale: number;
    focus: { x: number; y: number };
    // How far the logo has faded to black, hiding its pupil's highlight before the reveal.
    darken: number;
};

export type IntroReveal = {
    alpha: number;
    radius: number;
    feather: number;
    scale: number;
    complete: boolean;
};

// Across the zoom's scroll distance: the logo's pupil has filled the screen by ZOOM_UNTIL,
// and the intro opens out of that black from REVEAL_FROM to the end.
const ZOOM_UNTIL = 0.7;
const REVEAL_FROM = 0.62;
// The intro starts slightly enlarged and settles to its normal size as it opens.
const REVEAL_SETTLE = 0.15;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (from: number, to: number, value: number) => {
    const t = clamp01((value - from) / (to - from));
    return t * t * (3 - 2 * t);
};

const circleIn = (rect: IntroRect, scale: number, pupil: IntroPupil): IntroCircle => ({
    x: rect.x + pupil.x * scale,
    y: rect.y + pupil.y * scale,
    radius: pupil.radius * scale,
});

// The logo sits a little above centre to leave room for the scroll hint, as wide as the
// screen allows (its frame has generous margins, so it may overflow a narrow screen).
// The intro covers the screen like `object-fit: cover`.
export const layoutIntro = (width: number, height: number, frames: IntroFrames): IntroLayout => {
    const logoAspect = INTRO_LOGO.height / INTRO_LOGO.width;
    const logoWidth = Math.min(width * 1.15, 1100, (height * 0.6) / logoAspect);
    const logoHeight = logoWidth * logoAspect;
    const logo = {
        x: (width - logoWidth) / 2,
        y: height * 0.46 - logoHeight / 2,
        width: logoWidth,
        height: logoHeight,
    };
    const logoPupil = circleIn(logo, logoWidth / INTRO_LOGO.width, INTRO_LOGO.pupil);

    const introScale = Math.max(width / frames.width, height / frames.height);
    const intro = {
        x: (width - frames.width * introScale) / 2,
        y: (height - frames.height * introScale) / 2,
        width: frames.width * introScale,
        height: frames.height * introScale,
    };
    const introPupil = circleIn(intro, introScale, frames.pupil);
    const cover = Math.hypot(
        Math.max(introPupil.x, width - introPupil.x),
        Math.max(introPupil.y, height - introPupil.y),
    );

    return {
        width,
        height,
        logo,
        logoPupil,
        intro,
        introPupil,
        cover,
        zoom: (cover * 1.1) / logoPupil.radius,
    };
};

// The logo grows exponentially (a steady feel of moving forward) around its pupil, while
// the pupil travels to where the intro's pupil sits, until its black fills the screen.
export const zoomAt = (layout: IntroLayout, rawProgress: number): IntroZoom => {
    const progress = clamp01(rawProgress);
    // Mostly linear in log-scale (a steady rate of moving forward), eased only at the ends,
    // so no stretch of the scroll covers a disproportionate part of the zoom.
    const t = clamp01(progress / ZOOM_UNTIL);
    const scale = layout.zoom ** (0.75 * t + 0.25 * smoothstep(0, 1, t));
    const travel = (scale - 1) / (layout.zoom - 1);
    const { logoPupil: from, introPupil: to } = layout;
    return {
        progress,
        scale,
        focus: { x: from.x + (to.x - from.x) * travel, y: from.y + (to.y - from.y) * travel },
        darken: smoothstep(0.4, REVEAL_FROM, progress),
    };
};

export const scaleRectAround = (
    rect: IntroRect,
    origin: { x: number; y: number },
    focus: { x: number; y: number },
    scale: number,
): IntroRect => ({
    x: focus.x + (rect.x - origin.x) * scale,
    y: focus.y + (rect.y - origin.y) * scale,
    width: rect.width * scale,
    height: rect.height * scale,
});

// The intro opens out of the black as a soft-edged circle growing from its own pupil, which
// sits where the logo's pupil ended, until it covers the screen. Null while still hidden.
export const revealAt = (layout: IntroLayout, zoom: IntroZoom): IntroReveal | null => {
    const progress = smoothstep(REVEAL_FROM, 1, zoom.progress);
    if (progress <= 0) return null;

    const scale = 1 + REVEAL_SETTLE * (1 - progress);
    const pupilRadius = layout.introPupil.radius * scale;
    const radius = pupilRadius + (layout.cover - pupilRadius) * progress ** 1.6;
    return {
        alpha: smoothstep(0, 0.2, progress),
        radius,
        feather: Math.max(24, radius * 0.6),
        scale,
        complete: progress >= 1,
    };
};

// The two frames either side of the scroll position and how far it is between them, so
// the canvas can crossfade and slow scrolling doesn't step from frame to frame.
export const introFramesAt = (rawProgress: number, count: number) => {
    const position = clamp01(rawProgress) * (count - 1);
    const from = Math.floor(position);
    return { from, to: Math.min(count - 1, from + 1), mix: position - from };
};

export const hintOpacityAt = (zoom: IntroZoom) => 1 - smoothstep(0, 0.06, zoom.progress);
