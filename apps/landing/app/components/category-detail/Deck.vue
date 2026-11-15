<script setup lang="ts">
// imports

import { useSlideStrip } from "../../composables/category-detail/use-slide-strip";

const props = defineProps<{ category: HubCategory; opening: boolean }>();

const emit = defineEmits<{ exit: [] }>();

// states

type SlideView = { root: () => HTMLElement | null; media: () => HTMLElement | null; poster: string };

const slideViews = shallowRef<SlideView[]>([]);
const slides = computed(() => slideViews.value.map((view) => view.root()).filter((element) => element !== null));
const railView = ref<{ fill: () => HTMLElement | null } | null>(null);
const progress = computed(() => railView.value?.fill() ?? null);
const finaleView = ref<{ root: () => HTMLElement | null } | null>(null);
const finale = computed(() => finaleView.value?.root() ?? null);
const steps = categorySteps(props.category);
const enabled = computed(() => !props.opening);
const { active, wipe } = useSlideStrip({ slides, finale, progress, enabled, onExitTop: () => emit("exit") });

// methods

const setSlide = (slideIndex: number, view: unknown) => {
    if (!view || slideViews.value[slideIndex] === view) return;
    const next = [...slideViews.value];
    next[slideIndex] = view as SlideView;
    slideViews.value = next;
};

// The slide on screen now, for the morph back to the hub; none once the finale covers it.
const currentSlide = () => {
    const view = active.value < steps.length ? slideViews.value[active.value] : undefined;
    const media = view?.media();
    return media && view ? { media, poster: view.poster } : null;
};

defineExpose({ currentSlide });
</script>

<template>
    <div class="deck">
        <LandingCategoryDetailSlide
            v-for="(step, slideIndex) in steps"
            :key="step.id"
            :ref="(view) => setSlide(slideIndex, view)"
            :category="category.id"
            :step="step"
            :index="slideIndex"
            :total="steps.length"
            :active="!opening && slideIndex === active"
            :hidden="opening && slideIndex === 0"
            :class="{ 'slide-pinned': slideIndex === steps.length - 1 }"
        />
        <!-- Spare scroll after the last slide, over which the finale's stripes close. -->
        <div class="h-lvh" aria-hidden="true" />
        <LandingCategoryDetailFinale ref="finaleView" :category="category.id" :ready="wipe > 0.9" />
        <LandingCategoryDetailStepRail
            ref="railView"
            class="transition-opacity duration-700"
            :class="opening || wipe > 0.2 ? 'pointer-events-none opacity-0' : 'opacity-100'"
            :total="steps.length"
            :active="Math.min(active, steps.length - 1)"
        />
    </div>
</template>

<style scoped>
/* The slides' frame: must match SLIDE_FRAME in utils/category-morph.util.ts, which the hub's
   frame grows into before this page exists. */
.deck {
    --card-top: 4.25rem;
    --card-inset: 0.5rem;
    --card-gap: 0.875rem;
    --peek: 2.75rem;
    --card-radius: 1rem;
    padding-top: var(--card-top);
}

/* The last slide holds still while the finale's stripes close over it. */
.deck > .slide-pinned {
    position: sticky;
    top: var(--card-top);
}

@media (min-width: 768px) {
    .deck {
        --card-top: 5rem;
        --card-inset: 1.25rem;
        --peek: 3rem;
        --card-radius: 1.5rem;
    }
}
</style>
