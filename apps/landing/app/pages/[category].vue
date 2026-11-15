<script setup lang="ts">
// imports

definePageMeta({
    layout: "landing",
    // A fresh page per field, so going from one field to the next starts it from the top.
    key: (route) => route.path,
    validate: (route) => {
        const category = route.params.category;
        return typeof category === "string" && ["film", "design", "commercial", "lab"].includes(category);
    },
});

// states

type DeckView = { currentSlide: () => { media: HTMLElement; poster: string } | null };

const { t } = useI18n();
const route = useRoute();
const category = HUB_CATEGORIES.find((entry) => entry.id === route.params.category);
if (!category) throw createError({ statusCode: 404, fatal: true });
const id = category.id;
const morph = useCategoryMorph();
const { blink } = useBlink();
const deck = ref<DeckView | null>(null);
const step = ref(0);
const steps = categorySteps(category);
let reducedMotion = false;

useHead(() => ({ title: t(`landing.hub.categories.${id}.name`) }));
useSeoMeta({ description: () => t(`landing.hub.categories.${id}.summary`) });

// computed

const trail = computed(() => {
    const current = steps[step.value];
    const field = t(`landing.hub.categories.${id}.name`);
    return current ? [field, t(`landing.category.steps.${id}.${current.id}.title`)] : [field];
});

// methods

const exit = () => navigateTo("/");

// lifecycle

// Leaving for the hub: the slide on screen lifts off at once and shrinks into its hub frame
// while the hub loads underneath it.
onBeforeRouteLeave((to) => {
    if (to.path !== "/" || reducedMotion) return;
    const slide = deck.value?.currentSlide();
    const body = slide?.media.parentElement;
    if (!slide || !body) return;
    morph.value = {
        id,
        rect: rectOf(body),
        src: slide.poster,
        look: {
            filter: "brightness(1) saturate(1)",
            scale: slide.media.offsetHeight / Math.max(1, body.offsetHeight),
            radius: getComputedStyle(body).borderRadius,
        },
        stage: "flying",
        flight: performance.now(),
    };
});

onMounted(() => {
    reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
});
</script>

<template>
    <!-- Dark in both modes on purpose: the field opens out of the hub's night sky. -->
    <main class="min-h-lvh bg-black text-neutral-100" :data-field="id">
        <h1 class="sr-only">{{ $t(`landing.hub.categories.${id}.name`) }}</h1>
        <ShellSiteHeader :back="{ to: '/', label: $t('landing.category.back'), short: $t('landing.category.all_fields') }" :trail="trail" />

        <LandingCategoryDetailDeck ref="deck" v-model:step="step" :category="category" :paused="blink !== null" @exit="exit" />
    </main>
</template>
