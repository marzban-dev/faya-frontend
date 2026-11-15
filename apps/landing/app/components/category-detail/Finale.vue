<script setup lang="ts">
// imports

const props = defineProps<{ category: HubCategoryId; ready: boolean }>();

// states

const STRIPES = 28;
const root = ref<HTMLElement | null>(null);
const { blinkTo } = useBlink();
const { baseURL } = useRuntimeConfig().app;
const position = HUB_CATEGORIES.findIndex((entry) => entry.id === props.category);
const next = HUB_CATEGORIES[(position + 1) % HUB_CATEGORIES.length] ?? HUB_CATEGORIES[0]!;
const nextStill = withBaseUrl(baseURL, next.still);
const nextHref = withBaseUrl(baseURL, `/${next.id}`);

// methods

// A plain link, not NuxtLink: RouterLink would navigate before the eye has closed. Clicks that
// open a new tab are left to the browser.
const openNext = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    blinkTo(`/${next.id}`);
};

defineExpose({ root: () => root.value });
</script>

<template>
    <!-- Over the spare scroll after the last slide (useSlideStrip's --wipe): black stripes close
         over it like blinds, then the call to action rises in. Scrolling back opens them again. -->
    <section ref="root" class="finale fixed inset-0 z-30" :aria-label="$t('landing.category.cta.title')" :aria-hidden="!ready" :inert="!ready">
        <div class="absolute inset-0 flex" aria-hidden="true">
            <span v-for="stripe in STRIPES" :key="stripe" class="finale-stripe" :style="{ '--i': stripe - 1, '--count': STRIPES }" />
        </div>

        <div class="finale-cta relative flex h-full flex-col items-center justify-center px-6 text-center" :class="ready ? 'pointer-events-auto' : ''">
            <p class="font-label text-[0.68rem] tracking-[0.14em] text-neutral-400 uppercase">
                {{ $t("landing.category.cta.eyebrow") }}
                <span class="mx-2 text-primary">·</span>
                {{ $t(`landing.hub.categories.${category}.name`) }}
            </p>
            <h2 class="mt-5 font-display text-[clamp(3.25rem,10vw,9rem)] leading-[0.9] tracking-[-0.03em] text-neutral-50">
                {{ $t("landing.category.cta.title") }}
            </h2>
            <p class="mt-6 max-w-md text-[0.95rem] leading-relaxed text-neutral-400">
                {{ $t("landing.category.cta.text") }}
            </p>
            <UButton :to="{ path: '/contact', query: { field: category } }" color="primary" size="xl" class="mt-10 rounded-full px-8">
                {{ $t("landing.category.cta.button") }}
            </UButton>

            <!-- On to the next field instead of back to the hub; the eye blinks into it. -->
            <a
                :href="nextHref"
                class="group mt-16 flex items-center gap-4 rounded-sm text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                @click="openNext"
            >
                <span class="block h-12 overflow-hidden rounded-sm bg-neutral-900" :style="{ aspectRatio: next.aspect }">
                    <img :src="nextStill" alt="" class="size-full object-cover brightness-75 transition-[filter,scale] duration-700 ease-out group-hover:scale-105 group-hover:brightness-100" />
                </span>
                <span class="font-label text-[0.68rem] tracking-[0.14em] text-neutral-400 uppercase transition-colors duration-300 group-hover:text-neutral-100">
                    {{ $t("landing.category.next") }}
                    <span class="mx-1.5 text-primary">·</span>
                    {{ $t(`landing.hub.categories.${next.id}.name`) }}
                    <span class="ms-1.5 inline-block transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100" aria-hidden="true">→</span>
                </span>
            </a>
        </div>
    </section>
</template>

<style scoped>
.finale {
    --wipe: 0;
    pointer-events: none;
}

.finale-stripe {
    flex: 1;
    background: black;
    transform-origin: 0 50%;
    scale: clamp(0, var(--wipe) * 2.6 - var(--i) / var(--count) * 0.9, 1.02) 1;
}

/* Only once the stripes have closed (about 0.72 of the wipe) does the call to action rise in. */
.finale-cta {
    opacity: clamp(0, (var(--wipe) - 0.74) / 0.22, 1);
    translate: 0 calc((1 - clamp(0, (var(--wipe) - 0.74) / 0.22, 1)) * 2.5rem);
}

@media (prefers-reduced-motion: reduce) {
    .finale-stripe {
        scale: 1.02 1;
        opacity: clamp(0, var(--wipe) * 1.4, 1);
    }

    .finale-cta {
        translate: none;
    }
}
</style>
