<script setup lang="ts">
// imports

defineProps<{ visible: boolean }>();
</script>

<template>
    <!-- Fixed light shades on purpose: the hint always sits on the dark intro background. -->
    <div
        class="flex flex-col items-center gap-4 text-neutral-200 transition-[opacity,translate] duration-1000 ease-out"
        :class="visible ? 'translate-y-0 opacity-100 delay-500' : 'pointer-events-none translate-y-3 opacity-0'"
        :aria-hidden="!visible"
    >
        <span class="hidden h-11 w-7 justify-center rounded-full border-2 border-current pointer-fine:flex">
            <span class="scroll-hint-wheel mt-2 h-2.5 w-1 rounded-full bg-current" />
        </span>

        <span class="hidden flex-col items-center pointer-coarse:flex">
            <span class="scroll-hint-finger block size-3 rounded-full bg-current" />
            <span class="block h-8 w-px bg-linear-to-b from-current to-transparent" />
        </span>

        <span class="flex flex-col items-center gap-1.5">
            <span class="text-sm font-medium tracking-wide pointer-coarse:hidden">
                {{ $t("landing.intro.scroll_hint.mouse") }}
            </span>
            <span class="hidden text-sm font-medium tracking-wide pointer-coarse:inline">
                {{ $t("landing.intro.scroll_hint.touch") }}
            </span>
            <UIcon name="i-lucide-chevron-down" class="scroll-hint-chevron size-4 text-neutral-400" />
        </span>
    </div>
</template>

<style scoped>
.scroll-hint-wheel {
    animation: scroll-hint-wheel 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

.scroll-hint-finger {
    animation: scroll-hint-finger 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

.scroll-hint-chevron {
    animation: scroll-hint-chevron 1.8s ease-in-out infinite;
}

@keyframes scroll-hint-wheel {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    60% {
        transform: translateY(12px);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 0;
    }
}

@keyframes scroll-hint-finger {
    0% {
        transform: translateY(28px);
        opacity: 0;
    }
    20% {
        opacity: 1;
    }
    70% {
        transform: translateY(0);
        opacity: 1;
    }
    100% {
        transform: translateY(0);
        opacity: 0;
    }
}

@keyframes scroll-hint-chevron {
    0%,
    100% {
        transform: translateY(0);
        opacity: 0.5;
    }
    50% {
        transform: translateY(4px);
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .scroll-hint-wheel,
    .scroll-hint-finger,
    .scroll-hint-chevron {
        animation: none;
    }
}
</style>
