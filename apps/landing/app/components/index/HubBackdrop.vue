<script setup lang="ts">
// imports

const props = defineProps<{ active: HubCategoryId | null }>();

// states

const FADE_MS = 900;
const PRELOAD_AFTER_MS = 2500;

const videos = ref<HTMLVideoElement[]>([]);
const { baseURL } = useRuntimeConfig().app;
const sources = HUB_CATEGORIES.map((category) => ({ id: category.id, src: withBaseUrl(baseURL, category.video) }));
const pauseTimers = new Map<HTMLVideoElement, ReturnType<typeof setTimeout>>();
let preloadTimer: ReturnType<typeof setTimeout> | undefined;

// methods

const videoFor = (id: HubCategoryId) => videos.value.find((video) => video.dataset.id === id);

// Paused only once faded out, so leaving a frame doesn't freeze the picture mid-fade.
const settle = (active: HubCategoryId | null) => {
    for (const video of videos.value) {
        clearTimeout(pauseTimers.get(video));
        if (video.dataset.id === active) continue;
        pauseTimers.set(
            video,
            setTimeout(() => video.pause(), FADE_MS),
        );
    }
    const current = active ? videoFor(active) : undefined;
    if (current) current.play().catch(() => undefined);
};

// watches

watch(() => props.active, settle);

// lifecycle

onMounted(() => {
    // Hover only exists with a fine pointer; on touch the videos would never show here.
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    preloadTimer = setTimeout(() => {
        for (const video of videos.value) video.preload = "auto";
    }, PRELOAD_AFTER_MS);
});

onBeforeUnmount(() => {
    clearTimeout(preloadTimer);
    pauseTimers.forEach((timer) => clearTimeout(timer));
});
</script>

<template>
    <div class="pointer-events-none fixed inset-0" aria-hidden="true">
        <video
            v-for="source in sources"
            :key="source.id"
            ref="videos"
            :data-id="source.id"
            :src="source.src"
            class="absolute inset-0 size-full object-cover transition-opacity ease-out"
            :class="active === source.id ? 'opacity-30' : 'opacity-0'"
            :style="{ transitionDuration: `${FADE_MS}ms` }"
            muted
            loop
            playsinline
            disablepictureinpicture
            preload="none"
        />
    </div>
</template>
