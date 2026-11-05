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
        class="flex flex-col items-center gap-3 text-neutral-200 transition-opacity duration-500 ease-out"
        :class="visible ? 'opacity-100' : 'pointer-events-none opacity-0'"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="booted ? percent : undefined"
        :aria-label="$t('landing.intro.loading')"
        :aria-hidden="!visible"
    >
        <div class="h-0.5 w-40 overflow-hidden rounded-full bg-neutral-200/15">
            <div
                class="h-full origin-left rounded-full bg-neutral-200 rtl:origin-right"
                :class="{ 'boot-fill': !booted }"
                :style="booted ? { transform: `scaleX(${percent / 100})` } : undefined"
            />
        </div>
        <span class="text-sm font-medium tracking-wide tabular-nums">
            {{ booted ? $t("landing.intro.progress", { percent: formattedPercent }) : $t("landing.intro.loading") }}
        </span>
    </div>
</template>

<style scoped>
/* 0.9 is LOADING_SHARE in use-intro-stage.ts: downloads fill the bar up to 90%. */
.boot-fill {
    transform: scaleX(calc(var(--intro-load, 0) * 0.9));
    transition: transform 0.4s ease-out;
}
</style>
