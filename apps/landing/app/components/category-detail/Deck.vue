<script setup lang="ts">
// imports

import { useSlideStrip } from "../../composables/category-detail/use-slide-strip";

const props = defineProps<{
    category: HubCategory;
    // While the eye blinks into the page, paging waits.
    paused: boolean;
}>();

const emit = defineEmits<{ exit: [] }>();

// The current step, for the header's trail.
const step = defineModel<number>("step", { required: true });

// states

type SlideView = { root: () => HTMLElement | null; media: () => HTMLElement | null; poster: string };

const slideViews = shallowRef<SlideView[]>([]);
const slides = computed(() => slideViews.value.map((view) => view.root()).filter((element) => element !== null));
const railView = ref<{ fill: () => HTMLElement | null } | null>(null);
const progress = computed(() => railView.value?.fill() ?? null);
const finaleView = ref<{ root: () => HTMLElement | null } | null>(null);
const finale = computed(() => finaleView.value?.root() ?? null);
const steps = categorySteps(props.category);
const enabled = computed(() => !props.paused);
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

// watches

watch(active, (value) => {
    step.value = value;
});
</script>

<template>
    <div class="deck">
        <LandingCategoryDetailSlide
            v-for="(entry, slideIndex) in steps"
            :key="entry.id"
            :ref="(view) => setSlide(slideIndex, view)"
            :category="category.id"
            :step="entry"
            :index="slideIndex"
            :total="steps.length"
            :active="slideIndex === active"
            :class="{ 'slide-pinned': slideIndex === steps.length - 1 }"
        />
        <!-- Spare scroll after the last slide, over which the finale's stripes close. -->
        <div class="h-lvh" aria-hidden="true" />
        <LandingCategoryDetailFinale ref="finaleView" :category="category.id" :ready="wipe > 0.9" />
        <LandingCategoryDetailCinemaFrame :step="Math.min(active, steps.length - 1)" :total="steps.length" :counting="wipe < 0.2" />
        <LandingCategoryDetailStepRail
            ref="railView"
            class="transition-opacity duration-700"
            :class="wipe > 0.2 ? 'opacity-0' : 'opacity-100'"
        />
    </div>
</template>

<style scoped>
/* The slides' frame, between the widescreen bars (CinemaFrame): the top bar holds the header,
   the bottom one the viewfinder's labels. The next slide's top edge peeks above the bottom bar. */
.deck {
    --card-top: 4.25rem;
    --bar-bottom: 2rem;
    --card-inset: 0.5rem;
    --card-gap: 0.875rem;
    --peek: calc(2.75rem + var(--bar-bottom));
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
        --bar-bottom: 2.25rem;
        --card-inset: 1.25rem;
        --peek: calc(3rem + var(--bar-bottom));
        --card-radius: 1.5rem;
    }
}
</style>
