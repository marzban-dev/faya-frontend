<script setup lang="ts">
// imports

defineProps<{ category: HubCategoryId; ready: boolean }>();

// states

const STRIPES = 28;
const root = ref<HTMLElement | null>(null);

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
