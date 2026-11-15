// imports

import type { Ref } from "vue";

type StripOptions = {
    slides: Readonly<Ref<HTMLElement[]>>;
    finale: Readonly<Ref<HTMLElement | null>>;
    // A line scaled from 0 (first slide) to 1 (last slide) along its height.
    progress: Readonly<Ref<HTMLElement | null>>;
    // Off while the hub frame is still growing into the first slide (the page doesn't page).
    enabled: Readonly<Ref<boolean>>;
    // Paging up from the first slide: the field closes and the hub returns.
    onExitTop: () => void;
};

// Share of the screen's height scrolled past the last slide over which the finale's stripes close.
const WIPE_SCREENS = 0.75;
// From this far into the wipe no slide counts as current (its text leaves).
const WIPE_TAKES_OVER = 0.3;

// The paging spring (mass 1): soft and critically damped, so the page glides like something
// heavy and comes to rest without ever overshooting (about 0.8 s per page).
const SPRING_STIFFNESS = 70;
const SPRING_DAMPING = 2 * Math.sqrt(SPRING_STIFFNESS);
const SPRING_SUBSTEPS = 4;
// Wheel delta (px) that turns a page. Small mouse-wheel clicks add up towards it.
const WHEEL_TRIGGER = 20;
// Wheel events closer together than this belong to one gesture (a trackpad's inertia tail).
const WHEEL_QUIET_MS = 180;
// After this long without wheel events, a partial total is forgotten.
const WHEEL_FORGET_MS = 800;
// A gesture that already turned a page can turn another this soon if the deltas speed up again
// (a new flick during the inertia tail; the tail itself only ever slows down).
const WHEEL_REARM_MS = 300;
// A swipe turns a page past this distance (px) or this release speed (px/ms).
const SWIPE_PX = 50;
const SWIPE_SPEED = 0.35;
// Pulling down this far on the first slide closes the field.
const EXIT_SWIPE_PX = 50;

// How far a slide's picture lags behind it, as a share of the picture's height per slide scrolled.
const MEDIA_LAG = -0.12;
// How far its text runs ahead, in screen heights per slide scrolled, times the layer's data-depth.
const TEXT_LEAD = 0.38;

type SlideParts = { media: HTMLElement | null; shade: HTMLElement | null; layers: { element: HTMLElement; depth: number }[] };

// The field pages page slide by slide: a wheel gesture, swipe or key moves exactly one stop
// (each slide, then the finale fully closed) and a spring carries the page there, keeping its
// speed if a new gesture comes mid-flight. Native scrolling is switched off; the page is moved
// with scrollTo, so the parallax below still reads plain window.scrollY.
// From the scroll position it works out each slide's place in the strip, moves its picture and
// text layers for the parallax and darkens it as it leaves, tracks which slide is current, and
// drives the finale's wipe (`--wipe`).
// It writes transforms straight onto the few elements that move, and only when a value changes:
// custom properties set on a slide would make the browser restyle everything inside it each frame.
export const useSlideStrip = (options: StripOptions) => {
    // states

    const active = ref(0);
    const wipe = ref(0);
    let animationFrame = 0;
    let springFrame = 0;
    let springAt = 0;
    let springing = false;
    let x = 0;
    let velocity = 0;
    let target = 0;
    let stop = 0;
    let exiting = false;
    let reducedMotion = false;
    let wheelAt = -Infinity;
    let wheelSum = 0;
    let wheelSpent = false;
    let wheelFiredAt = 0;
    let wheelDirection = 0;
    let wheelHistory: number[] = [];
    let touch: { startY: number; startScroll: number; startStop: number; lastY: number; lastAt: number; speed: number } | null = null;
    let parts: SlideParts[] = [];
    let partsFor: HTMLElement[] = [];
    const written = new Map<HTMLElement, string>();

    // methods

    const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

    // Sets one style property, skipping the write when nothing changed.
    const write = (element: HTMLElement | null, property: "transform" | "opacity" | "--wipe", value: string) => {
        if (!element) return;
        const key = `${property}:${value}`;
        if (written.get(element) === key) return;
        written.set(element, key);
        element.style.setProperty(property, value);
    };

    const partsOf = (slides: HTMLElement[]) => {
        if (slides === partsFor) return parts;
        partsFor = slides;
        parts = slides.map((slide) => ({
            media: slide.querySelector<HTMLElement>(".slide-media"),
            shade: slide.querySelector<HTMLElement>(".slide-shade"),
            layers: [...slide.querySelectorAll<HTMLElement>("[data-depth]")].map((element) => ({ element, depth: Number(element.dataset.depth) || 0 })),
        }));
        return parts;
    };

    const stepOf = (slides: HTMLElement[]) => {
        const first = slides[0];
        if (!first) return 0;
        return (slides[1]?.offsetTop ?? first.offsetTop + first.offsetHeight) - first.offsetTop;
    };

    // Where the page rests for each slide, then with the finale fully closed.
    const stops = () => {
        const slides = options.slides.value;
        const step = stepOf(slides);
        if (!step) return [0];
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const list = slides.map((_, index) => Math.min(max, index * step));
        list.push(Math.min(max, (slides.length - 1) * step + window.innerHeight * WIPE_SCREENS));
        return list;
    };

    const nearestStop = (list: number[], scrollY: number) =>
        list.reduce((best, value, index) => (Math.abs(value - scrollY) < Math.abs((list[best] ?? 0) - scrollY) ? index : best), 0);

    const update = () => {
        animationFrame = 0;
        const slides = options.slides.value;
        const step = stepOf(slides);
        if (!step) return;
        const position = window.scrollY / step;
        const lead = window.innerHeight * TEXT_LEAD;
        partsOf(slides).forEach((part, index) => {
            const offset = index - position;
            // Off screen it stays where it was last drawn.
            if (Math.abs(offset) > 1.6) return;
            const shift = reducedMotion ? 0 : offset;
            write(part.media, "transform", `translate3d(0, ${(shift * MEDIA_LAG * 100).toFixed(2)}%, 0)`);
            write(part.shade, "opacity", (Math.min(1, Math.abs(offset)) * 0.65).toFixed(3));
            for (const layer of part.layers) write(layer.element, "transform", `translate3d(0, ${(shift * layer.depth * lead).toFixed(1)}px, 0)`);
        });

        write(options.progress.value, "transform", `scaleY(${clamp01(position / Math.max(1, slides.length - 1)).toFixed(4)})`);

        const lastAligned = (slides.length - 1) * step;
        const wiped = clamp01((window.scrollY - lastAligned) / (window.innerHeight * WIPE_SCREENS));
        write(options.finale.value, "--wipe", wiped.toFixed(3));
        const rounded = Math.round(wiped * 100) / 100;
        if (rounded !== wipe.value) wipe.value = rounded;

        const current = wiped > WIPE_TAKES_OVER ? slides.length : Math.min(slides.length - 1, Math.max(0, Math.round(position)));
        if (current !== active.value) active.value = current;
    };

    const schedule = () => {
        if (!animationFrame) animationFrame = requestAnimationFrame(update);
    };

    const place = (scrollY: number) => {
        window.scrollTo({ top: scrollY, behavior: "instant" });
        update();
    };

    const halt = () => {
        cancelAnimationFrame(springFrame);
        springFrame = 0;
        springing = false;
        velocity = 0;
    };

    const tick = (now: number) => {
        const dt = Math.min(0.032, Math.max(0, (now - springAt) / 1000)) / SPRING_SUBSTEPS;
        springAt = now;
        for (let index = 0; index < SPRING_SUBSTEPS; index++) {
            velocity += (-SPRING_STIFFNESS * (x - target) - SPRING_DAMPING * velocity) * dt;
            x += velocity * dt;
        }
        const settled = Math.abs(x - target) < 0.5 && Math.abs(velocity) < 4;
        if (settled) x = target;
        place(x);
        if (settled) halt();
        else springFrame = requestAnimationFrame(tick);
    };

    // Springs to a stop; `speed` (px/s) replaces the current velocity, e.g. a finger's on release.
    const goTo = (next: number, speed?: number) => {
        const list = stops();
        stop = Math.min(list.length - 1, Math.max(0, next));
        target = list[stop] ?? 0;
        if (reducedMotion) {
            halt();
            place(target);
            return;
        }
        if (!springing) {
            x = window.scrollY;
            velocity = 0;
            springing = true;
            springAt = performance.now();
            springFrame = requestAnimationFrame(tick);
        }
        if (speed === undefined) return;
        // Critical damping overshoots only if it starts towards the target faster than this.
        const limit = Math.sqrt(SPRING_STIFFNESS) * Math.abs(target - x);
        velocity = Math.sign(speed) === Math.sign(target - x) ? Math.sign(speed) * Math.min(Math.abs(speed), limit) : speed;
    };

    const exit = () => {
        if (exiting || !options.enabled.value) return;
        exiting = true;
        options.onExitTop();
    };

    const page = (direction: number) => {
        if (!options.enabled.value) return;
        if (direction < 0 && stop === 0) exit();
        else goTo(stop + direction);
    };

    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

    const accelerating = () => {
        if (wheelHistory.length < 6) return false;
        const recent = mean(wheelHistory.slice(-3));
        return recent > 4 && recent > mean(wheelHistory.slice(0, -3)) * 1.4;
    };

    const onWheel = (event: WheelEvent) => {
        if (event.ctrlKey) return;
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
        const delta = event.deltaY * unit;
        if (!delta) return;
        const now = event.timeStamp;
        const direction = Math.sign(delta);
        const gap = now - wheelAt;
        const reversed = direction !== wheelDirection;
        wheelAt = now;
        wheelDirection = direction;
        if (gap > WHEEL_FORGET_MS || reversed) wheelSum = 0;
        if (gap > WHEEL_QUIET_MS || reversed) {
            wheelHistory = [];
            wheelSpent = reversed && wheelSpent && now - wheelFiredAt < WHEEL_REARM_MS;
        }
        wheelHistory.push(Math.abs(delta));
        if (wheelHistory.length > 12) wheelHistory.shift();
        if (wheelSpent && now - wheelFiredAt > WHEEL_REARM_MS && accelerating()) wheelSpent = false;
        if (wheelSpent) return;
        wheelSum += delta;
        if (Math.abs(wheelSum) < WHEEL_TRIGGER) return;
        wheelSum = 0;
        wheelSpent = true;
        wheelFiredAt = now;
        page(direction);
    };

    const onTouchStart = (event: TouchEvent) => {
        const y = event.touches[0]?.clientY;
        if (y === undefined || event.touches.length > 1) {
            touch = null;
            return;
        }
        halt();
        touch = { startY: y, startScroll: window.scrollY, startStop: stop, lastY: y, lastAt: event.timeStamp, speed: 0 };
    };

    // The page follows the finger 1:1; the spring takes over from the finger's speed on release.
    const onTouchMove = (event: TouchEvent) => {
        const y = event.touches[0]?.clientY;
        if (!touch || y === undefined) return;
        event.preventDefault();
        if (!options.enabled.value) return;
        if (touch.startStop === 0 && y - touch.startY >= EXIT_SWIPE_PX) {
            touch = null;
            exit();
            return;
        }
        const elapsed = event.timeStamp - touch.lastAt;
        if (elapsed > 0) touch.speed = 0.6 * ((touch.lastY - y) / elapsed) + 0.4 * touch.speed;
        touch.lastY = y;
        touch.lastAt = event.timeStamp;
        place(touch.startScroll + touch.startY - y);
    };

    const onTouchEnd = (event: TouchEvent) => {
        if (!touch) return;
        const { startStop, startY, lastY, lastAt } = touch;
        const travel = startY - lastY;
        // A finger that stopped before lifting carries no speed.
        const speed = event.timeStamp - lastAt > 80 ? 0 : touch.speed;
        touch = null;
        if (!options.enabled.value) return;
        const direction = Math.abs(speed) > SWIPE_SPEED ? Math.sign(speed) : Math.abs(travel) > SWIPE_PX ? Math.sign(travel) : 0;
        goTo(startStop + direction, speed * 1000);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.altKey || event.metaKey || event.ctrlKey) return;
        const element = event.target instanceof HTMLElement ? event.target : null;
        if (element?.closest("input, textarea, select, [contenteditable]")) return;
        const space = event.key === " " && !element?.closest("button");
        const forward = event.key === "ArrowDown" || event.key === "PageDown" || (space && !event.shiftKey);
        const back = event.key === "ArrowUp" || event.key === "PageUp" || (space && event.shiftKey);
        if (forward || back) page(forward ? 1 : -1);
        else if (event.key === "Home" && options.enabled.value) goTo(0);
        else if (event.key === "End" && options.enabled.value) goTo(Infinity);
        else return;
        event.preventDefault();
    };

    // Scrolling that didn't come from paging (focus moving to a link further down, the browser
    // restoring a position) settles on the nearest stop.
    const onScroll = () => {
        schedule();
        if (springing || touch) return;
        const list = stops();
        if (Math.abs((list[stop] ?? 0) - window.scrollY) < 1) return;
        goTo(nearestStop(list, window.scrollY));
    };

    const onResize = () => {
        halt();
        const list = stops();
        stop = Math.min(stop, list.length - 1);
        place(list[stop] ?? 0);
    };

    // lifecycle

    onMounted(() => {
        reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.documentElement.style.overflow = "hidden";
        stop = nearestStop(stops(), window.scrollY);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd, { passive: true });
        window.addEventListener("touchcancel", onTouchEnd, { passive: true });
        window.addEventListener("keydown", onKeyDown);
        update();
    });

    onBeforeUnmount(() => {
        cancelAnimationFrame(animationFrame);
        halt();
        document.documentElement.style.overflow = "";
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
        window.removeEventListener("keydown", onKeyDown);
    });

    return { active, wipe };
};
