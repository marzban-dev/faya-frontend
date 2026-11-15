<script setup lang="ts">
// imports

import { useIntroStage } from "../../composables/index/use-intro-stage";

const emit = defineEmits<{ arrive: [] }>();

// states

const section = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const logoComponent = ref<{ element: () => SVGSVGElement | null } | null>(null);
const logoShade = ref<HTMLElement | null>(null);
const introCanvas = ref<HTMLCanvasElement | null>(null);
const hint = ref<HTMLElement | null>(null);
const letterbox = ref<HTMLElement | null>(null);
const tunnel = ref<{ setProgress: (progress: number) => void } | null>(null);
const logo = computed(() => logoComponent.value?.element() ?? null);
const sectionHeight = INTRO_SECTION_HEIGHT;

const { ready, progress, played } = useIntroStage({ section, stage, logo, logoShade, introCanvas, hint, letterbox, tunnel }, () =>
    emit("arrive"),
);
</script>

<template>
    <section
        ref="section"
        class="relative"
        :style="{ height: sectionHeight }"
        :aria-label="$t('landing.intro.label')"
    >
        <!-- Dark in both modes on purpose: the logo is drawn for a dark background. -->
        <div ref="stage" class="intro-stage sticky top-0 h-lvh w-full overflow-hidden bg-neutral-950">
            <LandingIndexIntroStarfield :visible="played" />
            <LandingIndexSkyEvents :active="played" />
            <div class="intro-logo-box">
                <LandingIndexIntroLogo ref="logoComponent" class="size-full" />
            </div>
            <div ref="logoShade" class="absolute inset-0 bg-black opacity-0" />
            <canvas ref="introCanvas" class="invisible absolute inset-0 size-full" aria-hidden="true" />
            <div ref="letterbox" class="intro-letterbox pointer-events-none absolute inset-0" aria-hidden="true">
                <div class="intro-letterbox-bar intro-letterbox-top" />
                <div class="intro-letterbox-bar intro-letterbox-bottom" />
            </div>
            <LandingIndexIntroTunnel ref="tunnel" :load="ready" />

            <div ref="hint" class="intro-hint absolute inset-x-0 grid justify-items-center *:col-start-1 *:row-start-1">
                <LandingIndexIntroLoadingProgress :percent="progress" :visible="!ready" />
                <LandingIndexIntroScrollHint :visible="ready" />
            </div>
        </div>
    </section>
</template>

<style scoped>
.intro-stage {
    container-type: size;
    --intro-logo-width: min(80cqw, 600px, calc(34lvh * 1280 / 660));
}

/* Must match layoutIntro() in utils/intro-geometry.util.ts, which the zoom starts from. */
.intro-logo-box {
    position: absolute;
    left: 50%;
    top: 46%;
    width: var(--intro-logo-width);
    aspect-ratio: 1280 / 660;
    translate: -50% -50%;
}

/* Crops the intro video to a 2.1:1 frame; a minimum keeps the bars on portrait screens.
   useIntroStage sets --intro-letterbox (0–1) from the scroll. */
.intro-letterbox {
    --intro-letterbox: 0;
}

.intro-letterbox-bar {
    position: absolute;
    inset-inline: 0;
    height: max(5cqh, calc((100cqh - 100cqw / 2.1) / 2));
    background: black;
}

.intro-letterbox-top {
    top: 0;
    translate: 0 calc((1 - var(--intro-letterbox)) * -100%);
}

.intro-letterbox-bottom {
    bottom: 0;
    translate: 0 calc((1 - var(--intro-letterbox)) * 100%);
}

@media (prefers-reduced-motion: reduce) {
    .intro-letterbox-top,
    .intro-letterbox-bottom {
        translate: none;
        opacity: var(--intro-letterbox);
    }
}

/* Under the logo's drawing (INTRO_LOGO.contentBottom), so the loading progress shows from
   the first paint; useIntroStage sets the same position once the app runs. */
.intro-hint {
    top: calc(46cqh + var(--intro-logo-width) * 660 / 1280 * (0.95 - 0.5));
    padding-top: clamp(2rem, 6cqh, 4rem);
}
</style>
