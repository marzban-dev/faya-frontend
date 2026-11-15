<script setup lang="ts">
// states

const fill = ref<HTMLElement | null>(null);

defineExpose({ fill: () => fill.value });
</script>

<template>
    <!-- A thin line that fills as the strip pages (useSlideStrip scales it); the step number sits
         in the viewfinder's corner (CinemaFrame). -->
    <div class="pointer-events-none fixed top-1/2 right-6 z-40 hidden h-20 w-px -translate-y-1/2 bg-white/25 md:block lg:right-9" aria-hidden="true">
        <span ref="fill" class="absolute inset-0 origin-top bg-white" style="transform: scaleY(0)" />
    </div>
</template>
