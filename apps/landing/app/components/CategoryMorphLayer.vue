<script setup lang="ts">
// states

const LAND_FADE_MS = 180;
// How long to wait for the hub's frame to exist before landing without it.
const FIND_FRAMES = 40;

const morph = useCategoryMorph();
const box = ref<HTMLElement | null>(null);
const image = ref<HTMLImageElement | null>(null);

// computed

const startStyle = computed(() => {
    const value = morph.value;
    if (!value) return {};
    return {
        left: `${value.rect.x}px`,
        top: `${value.rect.y}px`,
        width: `${value.rect.width}px`,
        height: `${value.rect.height}px`,
        borderRadius: value.look.radius,
    };
});

const startImageStyle = computed(() => (morph.value ? { filter: morph.value.look.filter, scale: `${morph.value.look.scale}` } : {}));

// methods

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const hubTarget = async (id: HubCategoryId) => {
    for (let attempt = 0; attempt < FIND_FRAMES; attempt++) {
        const frame = document.querySelector(`.hub-category[data-id="${id}"] .hub-category-frame`);
        const picture = frame?.querySelector("img");
        if (frame && picture) return { rect: rectOf(frame), look: { ...lookOf(frame, picture), scale: 1 } };
        await nextFrame();
    }
    return null;
};

const fly = async (flight: CategoryMorph) => {
    await nextTick();
    const element = box.value;
    const picture = image.value;
    const target = await hubTarget(flight.id);
    if (morph.value !== flight) return;
    if (element && picture && target) {
        const options: KeyframeAnimationOptions = {
            duration: MORPH_CLOSE_MS,
            easing: MORPH_EASING,
            fill: "forwards",
        };
        const { rect, look } = target;
        const moving = element.animate(
            [
                startStyle.value,
                { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: look.radius },
            ],
            options,
        );
        picture.animate([startImageStyle.value, { filter: look.filter, scale: `${look.scale}` }], options);
        await moving.finished.catch(() => undefined);
        if (morph.value !== flight) return;
    }
    flight.stage = "landed";
    await element?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: LAND_FADE_MS, easing: "ease-out", fill: "forwards" }).finished.catch(() => undefined);
    if (morph.value === flight) morph.value = null;
};

// watches

watch(
    () => morph.value,
    (flight) => {
        if (flight?.stage === "flying") fly(flight);
    },
);
</script>

<template>
    <div
        v-if="morph"
        ref="box"
        :key="morph.flight"
        class="pointer-events-none fixed z-50 overflow-hidden bg-neutral-900"
        :style="startStyle"
        aria-hidden="true"
    >
        <img ref="image" :src="morph.src" alt="" class="size-full object-cover" :style="startImageStyle" />
    </div>
</template>
