// imports

import type { RouteLocationRaw } from "vue-router";

// Opening a field: the eye closes, the field loads behind the lids, the eye opens on it
// (BlinkLayer plays it). "closing" → "closed" (navigating, waiting for the first video) → "opening".
export type Blink = { to: RouteLocationRaw; stage: "closing" | "closed" | "opening"; id: number };

export const useBlink = () => {
    // states

    const blink = useState<Blink | null>("blink", () => null);
    const router = useRouter();

    // methods

    const blinkTo = (to: RouteLocationRaw) => {
        if (blink.value) return;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            router.push(to);
            return;
        }
        blink.value = { to, stage: "closing", id: performance.now() };
    };

    return { blink, blinkTo };
};
