<script setup lang="ts">
// imports

import type { Blink } from "../composables/use-blink";

// states

const CLOSE_MS = 420;
const OPEN_MS = 820;
// Longest the closed eye waits for the field's first video before opening anyway.
const VIDEO_WAIT_MS = 700;

const { blink } = useBlink();
const router = useRouter();
const top = ref<HTMLElement | null>(null);
const bottom = ref<HTMLElement | null>(null);

// methods

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

// Only the arriving field's video counts: going field to field, the old page can still be in
// the DOM for a moment.
const firstVideoReady = async (path: string) => {
    const deadline = performance.now() + VIDEO_WAIT_MS;
    const selector = `main[data-field="${path.replace(/^\//, "")}"] .slide video`;
    let video: HTMLVideoElement | null = null;
    while (!video && performance.now() < deadline) {
        video = document.querySelector<HTMLVideoElement>(selector);
        if (!video) await nextFrame();
    }
    if (!video || video.readyState >= 2) return;
    const loaded = new Promise<void>((resolve) => video.addEventListener("loadeddata", () => resolve(), { once: true }));
    await Promise.race([loaded, wait(Math.max(0, deadline - performance.now()))]);
};

const move = (open: boolean, duration: number) => {
    const options: KeyframeAnimationOptions = { duration, easing: criticalSpringEasing(), fill: "forwards" };
    const shut = { transform: "translateY(0)" };
    return Promise.all(
        [
            top.value?.animate(open ? [shut, { transform: "translateY(-100%)" }] : [{ transform: "translateY(-100%)" }, shut], options),
            bottom.value?.animate(open ? [shut, { transform: "translateY(100%)" }] : [{ transform: "translateY(100%)" }, shut], options),
        ].map((animation) => animation?.finished.catch(() => undefined)),
    );
};

const play = async (current: Blink) => {
    await nextTick();
    await move(false, CLOSE_MS);
    current.stage = "closed";
    await router.push(current.to);
    await nextTick();
    await firstVideoReady(router.currentRoute.value.path);
    current.stage = "opening";
    await move(true, OPEN_MS);
    if (blink.value === current) blink.value = null;
};

// watches

watch(
    () => blink.value,
    (current) => {
        if (current?.stage === "closing") play(current);
    },
);
</script>

<template>
    <!-- The eye: two almond-edged lids meet in the middle and part again on the next page. -->
    <div v-if="blink" :key="blink.id" class="pointer-events-auto fixed inset-0 z-[60]" aria-hidden="true">
        <div ref="top" class="blink-lid blink-lid-top" />
        <div ref="bottom" class="blink-lid blink-lid-bottom" />
    </div>
</template>

<style scoped>
.blink-lid {
    position: absolute;
    left: -6vw;
    right: -6vw;
    height: 80lvh;
    background: black;
}

/* The curved edges overlap at the sides when shut, so no light leaks in at the corners. */
.blink-lid-top {
    top: 0;
    border-radius: 0 0 50% 50% / 0 0 20% 20%;
    transform: translateY(-100%);
}

.blink-lid-bottom {
    bottom: 0;
    border-radius: 50% 50% 0 0 / 20% 20% 0 0;
    transform: translateY(100%);
}
</style>
