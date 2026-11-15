<script setup lang="ts">
// imports

const props = defineProps<{ total: number; active: number }>();

// states

const fill = ref<HTMLElement | null>(null);

defineExpose({ fill: () => fill.value });

// computed

const current = computed(() => String(props.active + 1).padStart(2, "0"));
const total = computed(() => String(props.total).padStart(2, "0"));
</script>

<template>
    <div>
        <!-- The current step, and a thin line that fills as the strip scrolls (useSlideStrip scales it). -->
        <div
            class="step-rail pointer-events-none fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 font-label text-[0.62rem] tracking-[0.16em] text-white tabular-nums md:flex lg:right-9"
            aria-hidden="true"
        >
            <span>{{ current }}</span>
            <span class="relative h-20 w-px bg-white/25">
                <span ref="fill" class="absolute inset-0 origin-top bg-white" style="transform: scaleY(0)" />
            </span>
            <span class="opacity-50">{{ total }}</span>
        </div>
    </div>
</template>

<style scoped>
.step-rail {
    text-shadow: 0 1px 8px rgb(0 0 0 / 0.5);
}
</style>
