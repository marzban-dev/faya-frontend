// imports

import type { Ref } from "vue";

// The logo's SVG animation starts on its own from the server-rendered page (CSS
// animations). This takes control of it once mounted: it counts full cycles, replays the
// cycle until the page is ready, then holds it on its last frame.
export const useLogoLoop = (svg: Readonly<Ref<SVGSVGElement | null>>) => {
    // states

    const held = ref(false);
    const played = ref(false);
    let canHold = false;
    let cycles = 0;
    let cycle: Element | null = null;

    // methods

    // Restarts every CSS animation in the logo. Rewinding through the Web Animations API
    // isn't enough: finished animations without a fill (most flipbook frames) are no longer
    // listed by getAnimations().
    const replay = () => {
        const root = svg.value;
        if (!root) return;
        root.classList.add("restart");
        void root.getBoundingClientRect();
        root.classList.remove("restart");
    };

    const onCycleEnd = () => {
        cycles++;
        played.value = true;
        if (canHold) held.value = true;
        else replay();
    };

    const start = () => {
        cycle = svg.value?.querySelector(".cycle") ?? null;
        if (!cycle) {
            played.value = true;
            held.value = canHold;
            return;
        }
        cycle.addEventListener("animationend", onCycleEnd);
        if (cycle.getAnimations()[0]?.playState === "finished") onCycleEnd();
    };

    // Called once the intro frames are ready. Holding waits for the current cycle to end.
    const allowHold = () => {
        canHold = true;
        if (cycles > 0 && cycle?.getAnimations()[0]?.playState === "finished") held.value = true;
    };

    // Seconds until the running cycle ends: how long holding still waits once allowed.
    const cycleRemaining = () => {
        const timing = cycle?.getAnimations()[0]?.effect?.getComputedTiming();
        if (!timing) return 0;
        return Math.max(0, (Number(timing.endTime) - Number(timing.localTime ?? 0)) / 1000);
    };

    // lifecycle

    onBeforeUnmount(() => cycle?.removeEventListener("animationend", onCycleEnd));

    return { held, played, start, allowHold, cycleRemaining };
};
