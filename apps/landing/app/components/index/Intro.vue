<script setup lang="ts">
// imports

import { useIntroStage } from "../../composables/index/use-intro-stage";

// states

const section = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const logoComponent = ref<{ element: () => SVGSVGElement | null } | null>(null);
const logoShade = ref<HTMLElement | null>(null);
const introCanvas = ref<HTMLCanvasElement | null>(null);
const hint = ref<HTMLElement | null>(null);
const logo = computed(() => logoComponent.value?.element() ?? null);

const { ready, progress, played } = useIntroStage({ section, stage, logo, logoShade, introCanvas, hint });
</script>

<template>
    <!-- 760lvh: one screen for the sticky stage, 1.6 for the zoom, five for the intro. -->
    <section ref="section" class="relative h-[760lvh]" :aria-label="$t('landing.intro.label')">
        <!-- Dark in both modes on purpose: the logo is drawn for a dark background. -->
        <div ref="stage" class="intro-stage sticky top-0 h-lvh w-full overflow-hidden bg-neutral-950">
            <LandingIndexIntroStarfield :visible="played" />
            <div class="intro-logo-box">
                <LandingIndexIntroLogo ref="logoComponent" class="size-full" />
            </div>
            <div ref="logoShade" class="absolute inset-0 bg-black opacity-0" />
            <canvas ref="introCanvas" class="invisible absolute inset-0 size-full" aria-hidden="true" />

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
    --intro-logo-width: min(115cqw, 1100px, calc(60lvh * 1280 / 660));
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

/* Under the logo's drawing (INTRO_LOGO.contentBottom), so the loading progress shows from
   the first paint; useIntroStage sets the same position once the app runs. */
.intro-hint {
    top: calc(46cqh + var(--intro-logo-width) * 660 / 1280 * (0.95 - 0.5));
}
</style>
