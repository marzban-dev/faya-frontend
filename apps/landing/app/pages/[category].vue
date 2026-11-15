<script setup lang="ts">
// imports

definePageMeta({
    layout: "landing",
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
const deck = ref<DeckView | null>(null);
const scrolled = ref(false);
let reducedMotion = false;

useHead(() => ({ title: t(`landing.hub.categories.${id}.name`) }));
useSeoMeta({ description: () => t(`landing.hub.categories.${id}.summary`) });

// computed

// The hub frame is still growing into the first slide (CategoryMorphLayer); the slide waits.
const opening = computed(() => morph.value?.direction === "open" && morph.value.id === id && morph.value.stage === "flying");

// methods

const exit = () => navigateTo("/");

const onScroll = () => {
    scrolled.value = window.scrollY > 1;
};

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
        direction: "close",
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
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
});

onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
    <!-- Dark in both modes on purpose: the field opens out of the hub's night sky. -->
    <main class="min-h-lvh bg-black text-neutral-100">
        <h1 class="sr-only">{{ $t(`landing.hub.categories.${id}.name`) }}</h1>
        <ShellSiteHeader
            class="transition-opacity duration-500"
            :class="opening ? 'opacity-0' : 'opacity-100'"
            :blurred="scrolled"
            :back="{ to: '/', label: $t('landing.category.back') }"
        />

        <LandingCategoryDetailDeck ref="deck" :category="category" :opening="opening" @exit="exit" />
    </main>
</template>
