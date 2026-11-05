<script setup lang="ts">
// imports

// `percent` comes from useIntroStage once the app runs; before that, the bar follows the
// bytes tracked from the page's <head> (server/plugins/intro-load-progress.ts) through CSS.
const props = defineProps<{ percent: number; visible: boolean }>();

// states

const { localeProperties } = useI18n();
const booted = ref(false);

// computed

const formattedPercent = computed(() =>
    new Intl.NumberFormat(localeProperties.value.language, { style: "percent" }).format(props.percent / 100),
);

// lifecycle

onMounted(() => {
    booted.value = true;
});
</script>

<template>
    <!-- Fixed light shades on purpose: like the scroll hint, it sits on the dark intro background. -->
    <div
        class="flex flex-col items-center gap-4 text-neutral-200 transition-opacity duration-500 ease-out"
        :class="visible ? 'opacity-100' : 'pointer-events-none opacity-0'"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="booted ? percent : undefined"
        :aria-label="$t('landing.intro.loading')"
        :aria-hidden="!visible"
    >
        <div class="relative h-[3px] w-56 rounded-full bg-neutral-200/10">
            <div
                class="progress-fill absolute inset-y-0 start-0 rounded-full"
                :class="{ 'boot-fill': !booted }"
                :style="booted ? { width: `${percent}%` } : undefined"
            >
                <span class="progress-shine absolute inset-0 overflow-hidden rounded-full" />
                <span class="progress-head absolute end-0 top-1/2 size-2 translate-x-1/2 -translate-y-1/2 rounded-full rtl:-translate-x-1/2" />
            </div>
        </div>
        <span class="font-label text-xs tracking-[0.2em] text-neutral-400 tabular-nums">
            {{ booted ? $t("landing.intro.progress", { percent: formattedPercent }) : $t("landing.intro.loading") }}
        </span>
    </div>
</template>

<style scoped>
.progress-fill {
    background: linear-gradient(
        to var(--progress-end, right),
        color-mix(in oklab, var(--ui-primary) 25%, transparent),
        var(--ui-primary)
    );
    transition: width 0.4s ease-out;
}

:dir(rtl) .progress-fill {
    --progress-end: left;
}

/* 0.9 is LOADING_SHARE in use-intro-stage.ts: downloads fill the bar up to 90%. */
.boot-fill {
    width: calc(var(--intro-load, 0) * 90%);
}

.progress-shine::after {
    content: "";
    position: absolute;
    inset: 0;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.55), transparent);
    animation: progress-shine 1.6s ease-in-out infinite;
}

:dir(rtl) .progress-shine::after {
    animation-direction: reverse;
}

.progress-head {
    background: color-mix(in oklab, var(--ui-primary) 40%, white);
    box-shadow:
        0 0 6px 1px var(--ui-primary),
        0 0 18px 4px color-mix(in oklab, var(--ui-primary) 55%, transparent);
    animation: progress-pulse 1.6s ease-in-out infinite;
}

@keyframes progress-shine {
    from {
        translate: -100% 0;
    }
    to {
        translate: 250% 0;
    }
}

@keyframes progress-pulse {
    0%,
    100% {
        opacity: 0.75;
        scale: 0.85;
    }
    50% {
        opacity: 1;
        scale: 1.15;
    }
}

@media (prefers-reduced-motion: reduce) {
    .progress-shine::after,
    .progress-head {
        animation: none;
    }
}
</style>
