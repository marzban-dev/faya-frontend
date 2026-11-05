<script setup lang="ts">
// imports

defineExpose({ element: () => root.value });

// states

const root = ref<SVGSVGElement | null>(null);
const bands = INTRO_LOGO_BANDS;
const eyeFrames = INTRO_LOGO_EYE;
const handFrames = INTRO_LOGO_HAND;
const phases = ["grow", "fill"] as const;
const FPS = 24;
const LAST_FRAME = 101;
// Frame windows of the band layers: the arms grow (white) from frame 22 and are all done
// by 39; the orange starts at 66 and covers everything by 81.
const PHASES = {
    growing: { from: 20, to: 39 },
    grown: { from: 40, to: 81 },
    filling: { from: 60, to: 81 },
    filled: { from: 82, to: LAST_FRAME },
    settled: { from: 40, to: LAST_FRAME },
};

// methods

const armsOf = (band: number) => INTRO_LOGO_ARMS.filter((arm) => arm.band === band);

const timing = ({ delay, duration }: { delay: number; duration: number }) => ({
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
});

// A flipbook frame (or band layer) is visible only during its own frames; the last stays.
const frameTiming = (frame: { from: number; to: number }) => ({
    animationDelay: `${frame.from / FPS}s`,
    animationDuration: `${(frame.to - frame.from + 1) / FPS}s`,
    animationFillMode: frame.to === LAST_FRAME ? "forwards" : "none",
});
</script>

<template>
    <!-- One cycle is 4.25s: 102 frames at 24fps, as in the original animation. -->
    <svg
        ref="root"
        class="intro-logo"
        viewBox="0 0 1280 660"
        preserveAspectRatio="none"
        overflow="visible"
        aria-hidden="true"
    >
        <!-- Each band is revealed only by its own arms, twice: white outline, then orange. -->
        <defs>
            <template v-for="phase in phases" :key="phase">
                <mask
                    v-for="(_, band) in bands"
                    :id="`intro-logo-${phase}-${band}`"
                    :key="band"
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="1280"
                    height="660"
                >
                    <path
                        v-for="(arm, index) in armsOf(band)"
                        :key="index"
                        class="arm"
                        :d="arm.d"
                        :stroke-width="arm.width"
                        :style="timing(arm[phase])"
                        pathLength="1"
                    />
                </mask>
            </template>
        </defs>

        <!-- The eye sits under the bands: their outlines frame the slit. -->
        <g v-for="frame in eyeFrames" :key="`eye-${frame.from}`" class="flip" :style="frameTiming(frame)">
            <path v-if="frame.black" :d="frame.black" fill="#000" />
            <path v-if="frame.white" :d="frame.white" fill="#fff" />
            <path v-if="frame.orange" :d="frame.orange" fill="#a34418" />
        </g>

        <!-- Each band layer renders only during its own phase, so the masks cost nothing
             once the bands have settled: from BANDS_FILLED on, the logo is plain paths. -->
        <g class="flip" :style="frameTiming(PHASES.growing)">
            <path
                v-for="(band, index) in bands"
                :key="index"
                :d="band"
                :mask="`url(#intro-logo-grow-${index})`"
                class="band band-white"
            />
        </g>
        <!-- Shown whole once grown: a mask's stroke ends would notch the outline where arms meet. -->
        <g class="flip" :style="frameTiming(PHASES.grown)">
            <path v-for="(band, index) in bands" :key="index" :d="band" class="band band-white" />
        </g>
        <g class="flip" :style="frameTiming(PHASES.filling)">
            <path
                v-for="(band, index) in bands"
                :key="index"
                :d="band"
                :mask="`url(#intro-logo-fill-${index})`"
                class="band band-orange"
            />
        </g>
        <g class="flip" :style="frameTiming(PHASES.filled)">
            <path v-for="(band, index) in bands" :key="index" :d="band" class="band band-final" />
        </g>

        <!-- A thin black edge over every band phase: it hides the anti-aliased seam where
             the orange meets the white, and keeps the outline the same width throughout. -->
        <g class="flip" :style="frameTiming(PHASES.growing)">
            <path
                v-for="(band, index) in bands"
                :key="index"
                :d="band"
                :mask="`url(#intro-logo-grow-${index})`"
                class="band-edge"
            />
        </g>
        <g class="flip" :style="frameTiming(PHASES.settled)">
            <path v-for="(band, index) in bands" :key="index" :d="band" class="band-edge" />
        </g>

        <g v-for="frame in handFrames" :key="`hand-${frame.from}`" class="flip" :style="frameTiming(frame)">
            <path v-if="frame.black" :d="frame.black" fill="#000" />
            <path v-if="frame.white" :d="frame.white" fill="#fff" />
            <path v-if="frame.orange" :d="frame.orange" fill="#a34418" />
        </g>

        <!-- Runs the full cycle; its end is how the page knows one loop has finished. -->
        <rect class="cycle" width="0" height="0" />
    </svg>
</template>

<style scoped>
.cycle {
    animation: cycle 4.25s linear both;
}

.arm {
    fill: none;
    stroke: #fff;
    stroke-linecap: round;
    stroke-dasharray: 1 2;
    animation-name: arm-grow;
    animation-fill-mode: both;
    animation-timing-function: cubic-bezier(0.45, 0, 0.25, 1);
}

.band {
    fill-rule: evenodd;
    stroke-linejoin: round;
    paint-order: stroke;
}

.band-white {
    fill: #fff;
    stroke: #000;
    stroke-width: 18;
}

.band-orange {
    fill: #a34418;
}

.band-edge {
    fill: none;
    stroke: #000;
    stroke-width: 2;
}

.band-final {
    fill: #a34418;
    stroke: #000;
    stroke-width: 18;
}

.flip {
    visibility: hidden;
    animation-name: flip;
    animation-timing-function: linear;
}

.intro-logo.restart * {
    animation: none !important;
}

@keyframes cycle {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes flip {
    from,
    to {
        visibility: visible;
    }
}

@keyframes arm-grow {
    0% {
        stroke-dashoffset: 1;
        opacity: 0;
    }
    0.1% {
        opacity: 1;
    }
    100% {
        stroke-dashoffset: 0;
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .intro-logo * {
        animation-delay: 0s !important;
        animation-duration: 1ms !important;
    }
}
</style>
