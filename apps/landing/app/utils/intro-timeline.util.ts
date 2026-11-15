// Scroll distance of each part of the intro, in screen heights. The section is one screen
// (the sticky stage) taller than their sum. Intro.vue's height and useIntroStage's split
// both come from here, so change the pacing only here.
export const INTRO_SCREENS = {
    zoom: 1.6,
    frames: 5,
    tunnel: 4.5,
} as const;

const TOTAL_SCREENS = INTRO_SCREENS.zoom + INTRO_SCREENS.frames + INTRO_SCREENS.tunnel;

export const INTRO_SECTION_HEIGHT = `${(TOTAL_SCREENS + 1) * 100}lvh`;

// Lenis eases towards the end of the page without quite reaching it, so arrival fires a
// little before the tunnel's last pixel.
export const INTRO_ARRIVE_AT = 0.97;

export type IntroTimeline = { zoom: number; frames: number; tunnel: number };

// Progress of each part (0–1, unclamped) for a scroll distance into the section.
export const introTimelineAt = (scrolled: number, distance: number): IntroTimeline => {
    const unit = distance / TOTAL_SCREENS;
    const zoomEnd = INTRO_SCREENS.zoom * unit;
    const framesEnd = zoomEnd + INTRO_SCREENS.frames * unit;
    return {
        zoom: scrolled / zoomEnd,
        frames: (scrolled - zoomEnd) / (INTRO_SCREENS.frames * unit),
        tunnel: (scrolled - framesEnd) / (INTRO_SCREENS.tunnel * unit),
    };
};
