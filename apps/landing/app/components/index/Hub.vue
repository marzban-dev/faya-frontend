<script setup lang="ts">
// imports

defineProps<{ fromTunnel?: boolean }>();

const emit = defineEmits<{ open: [id: HubCategoryId] }>();

// states

const POINTER_EASE_RATE = 3;

const root = ref<HTMLElement | null>(null);
const active = ref<HubCategoryId | null>(null);
const categories = HUB_CATEGORIES;
let target = { x: 0, y: 0 };
let pointer = { x: 0, y: 0 };
let lastTime = 0;
let animationFrame = 0;

// methods

const activate = (id: HubCategoryId) => {
    active.value = id;
};

const deactivate = (id: HubCategoryId) => {
    if (active.value === id) active.value = null;
};

const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    target = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
    };
};

const tick = (time: number) => {
    animationFrame = requestAnimationFrame(tick);
    const delta = lastTime ? Math.min(time - lastTime, 100) / 1000 : 0;
    lastTime = time;
    const ease = 1 - Math.exp(-delta * POINTER_EASE_RATE);
    pointer = { x: pointer.x + (target.x - pointer.x) * ease, y: pointer.y + (target.y - pointer.y) * ease };
    root.value?.style.setProperty("--hub-pointer-x", pointer.x.toFixed(4));
    root.value?.style.setProperty("--hub-pointer-y", pointer.y.toFixed(4));
};

// lifecycle

onMounted(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    animationFrame = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("pointermove", onPointerMove);
});
</script>

<template>
    <!-- Dark in both modes on purpose: the hub is the same night sky the intro ends in. -->
    <section
        ref="root"
        class="fixed inset-0 overflow-x-hidden overflow-y-auto bg-black text-neutral-100 md:overflow-hidden"
        :aria-label="$t('landing.hub.label')"
    >
        <div class="pointer-events-none fixed inset-0">
            <LandingIndexIntroStarfield :visible="true" />
            <LandingIndexSkyEvents :active="true" />
        </div>
        <LandingIndexHubBackdrop :active="active" />
        <div class="hub-vignette pointer-events-none fixed inset-0" />

        <ShellSiteHeader class="hub-fade-in" />

        <ul class="relative grid grid-cols-2 items-start gap-x-5 gap-y-12 px-5 pt-28 pb-24 md:block md:h-lvh md:p-0">
            <li v-for="(category, index) in categories" :key="category.id" class="contents">
                <LandingIndexHubCategory
                    :category="category"
                    :index="index"
                    :dimmed="active !== null && active !== category.id"
                    @activate="activate(category.id)"
                    @deactivate="deactivate(category.id)"
                    @open="emit('open', category.id)"
                />
            </li>
        </ul>

        <div v-if="fromTunnel" class="hub-from-dark pointer-events-none fixed inset-0 z-50 bg-black" aria-hidden="true" />

        <p
            class="hub-fade-in pointer-events-none relative px-5 pb-8 font-label text-[0.68rem] tracking-[0.14em] text-neutral-500 uppercase md:fixed md:bottom-8 md:left-10 md:p-0"
        >
            {{ $t("landing.hub.hint") }}
        </p>
    </section>
</template>

<style scoped>
.hub-vignette {
    background: radial-gradient(ellipse at center, transparent 45%, rgb(0 0 0 / 0.75) 100%);
}

/* The tunnel ends inside the black hole; the hub comes out of that same darkness. */
.hub-from-dark {
    animation: hub-from-dark 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
}

@keyframes hub-from-dark {
    to {
        opacity: 0;
        visibility: hidden;
    }
}

.hub-fade-in {
    animation: hub-fade-in 1.2s ease-out 0.9s both;
}

@keyframes hub-fade-in {
    from {
        opacity: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .hub-fade-in {
        animation: none;
    }

    .hub-from-dark {
        animation-duration: 0.6s;
    }
}
</style>
