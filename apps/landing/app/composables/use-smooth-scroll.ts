// imports

import type Lenis from "lenis";
import "lenis/dist/lenis.css";

export type SmoothScroll = {
    lock: () => void;
    unlock: () => void;
    onScroll: (callback: (scrollY: number) => void) => void;
};

// Lenis smooths wheel scrolling; touch keeps the platform's own momentum. With reduced
// motion Lenis isn't started and plain scroll events drive the callbacks instead.
export const useSmoothScroll = (): SmoothScroll => {
    // states

    let lenis: Lenis | null = null;
    let locked = false;
    let unmounted = false;
    const callbacks: ((scrollY: number) => void)[] = [];

    // methods

    const emit = (scrollY: number) => {
        for (const callback of callbacks) callback(scrollY);
    };

    const onNativeScroll = () => emit(window.scrollY);

    const applyLock = () => {
        document.documentElement.style.overflow = locked ? "hidden" : "";
        if (locked) lenis?.stop();
        else lenis?.start();
    };

    const lock = () => {
        locked = true;
        if (import.meta.client) applyLock();
    };

    const unlock = () => {
        locked = false;
        if (import.meta.client) applyLock();
    };

    const onScroll = (callback: (scrollY: number) => void) => {
        callbacks.push(callback);
    };

    // lifecycle

    onMounted(async () => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            window.addEventListener("scroll", onNativeScroll, { passive: true });
            return;
        }

        const { default: LenisClass } = await import("lenis");
        if (unmounted) return;
        lenis = new LenisClass({ autoRaf: true, lerp: 0.07 });
        lenis.on("scroll", (instance) => emit(instance.scroll));
        applyLock();
    });

    onBeforeUnmount(() => {
        unmounted = true;
        lenis?.destroy();
        window.removeEventListener("scroll", onNativeScroll);
        document.documentElement.style.overflow = "";
    });

    return { lock, unlock, onScroll };
};
