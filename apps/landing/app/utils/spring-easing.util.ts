// A critically damped spring (heavy, never overshoots) as a CSS `linear()` easing, so Web
// Animations can play it. Settles to 99.5% at the end of `durationMs`. Browsers without
// `linear()` get a close cubic-bezier.
const SAMPLES = 48;
const SETTLE = 7.4;

const FALLBACK = "cubic-bezier(0.22, 1, 0.36, 1)";

export const criticalSpringEasing = () => {
    if (!CSS.supports("animation-timing-function", "linear(0, 1)")) return FALLBACK;
    const points = Array.from({ length: SAMPLES + 1 }, (_, index) => {
        const t = (index / SAMPLES) * SETTLE;
        return index === SAMPLES ? 1 : 1 - (1 + t) * Math.exp(-t);
    });
    return `linear(${points.map((point) => point.toFixed(4)).join(", ")})`;
};
