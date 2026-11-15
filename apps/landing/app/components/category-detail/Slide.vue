<script setup lang="ts">
// imports

const props = defineProps<{
    category: HubCategoryId;
    step: CategoryStep;
    index: number;
    total: number;
    // The slide in view: its video plays.
    active: boolean;
}>();

// states

const { t } = useI18n();
const root = ref<HTMLElement | null>(null);
const media = ref<HTMLElement | null>(null);
const video = ref<HTMLVideoElement | null>(null);
const { baseURL } = useRuntimeConfig().app;
const src = withBaseUrl(baseURL, props.step.media.src);
const poster = withBaseUrl(baseURL, props.step.media.poster);
const number = String(props.index + 1).padStart(2, "0");
const total = String(props.total).padStart(2, "0");
const textKey = `landing.category.steps.${props.category}.${props.step.id}`;
const letterbox = props.step.media.letterbox ?? 0;
// Taller than the slide by the bars, so they fall outside it.
const videoStyle = letterbox ? { top: `${(-letterbox / (1 - 2 * letterbox)) * 100}%`, height: `${100 / (1 - 2 * letterbox)}%` } : undefined;

// computed

const deliverables = computed(() =>
    t(`${textKey}.deliverables`)
        .split("·")
        .map((item) => item.trim())
        .filter(Boolean),
);

// methods

const sync = (playing: boolean) => {
    const element = video.value;
    if (!element) return;
    if (playing) element.play().catch(() => undefined);
    else element.pause();
};

defineExpose({ root: () => root.value, media: () => media.value, poster });

// watches

watch(() => props.active, sync);

// lifecycle

onMounted(() => sync(props.active));
</script>

<template>
    <article ref="root" class="slide" :aria-label="$t(`${textKey}.title`)">
        <div class="slide-body bg-neutral-900">
            <div ref="media" class="slide-media">
                <video
                    v-if="step.media.kind === 'video'"
                    ref="video"
                    :src="src"
                    :poster="poster"
                    class="absolute inset-x-0 top-0 size-full object-cover"
                    :style="videoStyle"
                    muted
                    loop
                    playsinline
                    disablepictureinpicture
                    preload="auto"
                />
                <img v-else :src="src" alt="" class="size-full object-cover" />
            </div>
            <div class="slide-gradient" />
            <div class="slide-shade" />

            <!-- Each layer of text drifts at its own pace as the slide scrolls (parallax). -->
            <div class="absolute inset-0 flex flex-col justify-between p-5 md:p-10">
                <p class="slide-layer font-label text-[0.68rem] leading-relaxed tracking-[0.14em] text-neutral-300 uppercase tabular-nums" data-depth="1.6">
                    <span class="block">{{ $t(`landing.hub.categories.${category}.name`) }}</span>
                    <span class="block">{{ $t("landing.category.step_count", { current: number, total }) }}</span>
                </p>

                <div class="slide-layer max-w-3xl" data-depth="1">
                    <p class="font-label text-[0.68rem] tracking-[0.14em] text-primary uppercase">{{ $t("landing.category.steps_label") }}</p>
                    <h2 class="mt-3 font-display text-[clamp(3rem,8.5vw,8rem)] leading-[0.92] tracking-[-0.03em] text-neutral-50">
                        {{ $t(`${textKey}.title`) }}
                    </h2>
                    <p class="mt-4 max-w-md text-[0.95rem] leading-relaxed text-neutral-300">{{ $t(`${textKey}.text`) }}</p>
                    <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                        <ul class="flex flex-wrap gap-x-4 gap-y-2">
                            <li v-for="item in deliverables" :key="item" class="flex items-center gap-2 font-label text-[0.68rem] tracking-[0.14em] text-neutral-200 uppercase">
                                <span class="size-1 rounded-full bg-primary" aria-hidden="true" />
                                {{ item }}
                            </li>
                        </ul>
                        <NuxtLink
                            :to="{ path: '/contact', query: { field: category } }"
                            class="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 font-label text-[0.68rem] tracking-[0.14em] text-white uppercase transition-colors duration-300 hover:border-white hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {{ $t("landing.category.start") }}
                            <span aria-hidden="true">→</span>
                        </NuxtLink>
                    </div>
                </div>
            </div>

        </div>
    </article>
</template>

<style scoped>
/* One frame of the strip; the page scrolls them. The next one's top edge peeks from below. */
.slide {
    position: relative;
    height: calc(100lvh - var(--card-top) - var(--peek));
    margin-inline: var(--card-inset);
    margin-bottom: var(--card-gap);
}

.slide-body {
    position: relative;
    height: 100%;
    overflow: hidden;
    border-radius: var(--card-radius);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.04);
}

/* The picture lags behind its slide as the strip moves (useSlideStrip moves it, and the text
   layers, on their own GPU layers so the slide never repaints while scrolling). */
.slide-media {
    position: absolute;
    inset: -14% 0;
    will-change: transform;
}

.slide-gradient {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(to bottom, rgb(0 0 0 / 0.45), transparent 10rem),
        linear-gradient(to top, rgb(0 0 0 / 0.8) 0%, rgb(0 0 0 / 0.25) 45%, transparent 70%),
        radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.45) 100%);
}

.slide-shade {
    position: absolute;
    inset: 0;
    background: black;
    opacity: 0;
}

.slide-layer {
    will-change: transform;
}
</style>
