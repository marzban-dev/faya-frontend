<script setup lang="ts">
// imports

const props = defineProps<{ category: HubCategory; index: number; dimmed: boolean }>();

const emit = defineEmits<{ activate: []; deactivate: []; open: [] }>();

// states

const { baseURL } = useRuntimeConfig().app;
const still = withBaseUrl(baseURL, props.category.still);
const placement = {
    "--x": props.category.x,
    "--y": props.category.y,
    "--w": `min(${props.category.widthVw}vw, ${props.category.widthVh}vh)`,
    "--aspect": props.category.aspect,
    "--depth": props.category.depth,
    "--float-delay": `${props.category.floatDelay}s`,
    "--index": props.index,
};

// methods

const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType === "mouse") emit("activate");
};

const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === "mouse") emit("deactivate");
};

// Keyboard focus previews the field like hover does; a tap's focus shouldn't.
const onFocus = (event: FocusEvent) => {
    if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) emit("activate");
};
</script>

<template>
    <div class="hub-category" :data-id="category.id" :style="placement">
        <div class="hub-category-float">
            <button
                type="button"
                class="hub-category-button group block w-full text-start transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.2,0.7,0.1,1)] hover:scale-[1.035] focus-visible:scale-[1.035] focus-visible:outline-none"
                :class="dimmed ? 'opacity-0' : 'opacity-100'"
                @pointerenter="onPointerEnter"
                @pointerleave="onPointerLeave"
                @focus="onFocus"
                @blur="emit('deactivate')"
                :data-cursor-label="$t('landing.hub.enter')"
                @click="emit('open')"
            >
                <span class="relative block">
                    <span class="hub-category-frame block overflow-hidden bg-neutral-900">
                        <img
                            :src="still"
                            alt=""
                            class="size-full object-cover brightness-75 saturate-[0.8] transition-[filter,scale] duration-1000 ease-out group-hover:scale-[1.04] group-hover:brightness-100 group-hover:saturate-100 group-focus-visible:brightness-100"
                        />
                    </span>
                    <span class="hub-category-corners" />
                </span>

                <span class="mt-4 flex items-baseline gap-3">
                    <span class="font-label text-[0.68rem] text-neutral-500 tabular-nums">{{ category.number }}</span>
                    <span class="font-display text-[2rem] leading-none tracking-[-0.02em] text-neutral-50 md:text-[clamp(2rem,2.6vw,3rem)]">
                        {{ $t(`landing.hub.categories.${category.id}.name`) }}
                    </span>
                </span>
                <span class="mt-1.5 block text-sm text-neutral-400">
                    {{ $t(`landing.hub.categories.${category.id}.summary`) }}
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.hub-category {
    animation: hub-category-arrive 1.6s cubic-bezier(0.2, 0.7, 0.1, 1) both;
    animation-delay: calc(var(--index) * 140ms + 250ms);
}

.hub-category-frame {
    aspect-ratio: var(--aspect);
}

/* Viewfinder crop marks around the frame of the field in focus. */
.hub-category-corners {
    --mark: var(--ui-primary);
    --length: 14px;
    --thickness: 1px;
    position: absolute;
    inset: -16px;
    opacity: 0;
    pointer-events: none;
    background:
        linear-gradient(var(--mark), var(--mark)) top left / var(--length) var(--thickness),
        linear-gradient(var(--mark), var(--mark)) top left / var(--thickness) var(--length),
        linear-gradient(var(--mark), var(--mark)) top right / var(--length) var(--thickness),
        linear-gradient(var(--mark), var(--mark)) top right / var(--thickness) var(--length),
        linear-gradient(var(--mark), var(--mark)) bottom left / var(--length) var(--thickness),
        linear-gradient(var(--mark), var(--mark)) bottom left / var(--thickness) var(--length),
        linear-gradient(var(--mark), var(--mark)) bottom right / var(--length) var(--thickness),
        linear-gradient(var(--mark), var(--mark)) bottom right / var(--thickness) var(--length);
    background-repeat: no-repeat;
    transition:
        opacity 400ms ease-out,
        inset 600ms cubic-bezier(0.2, 0.7, 0.1, 1);
}

.hub-category-button:hover .hub-category-corners,
.hub-category-button:focus-visible .hub-category-corners {
    opacity: 1;
    inset: -10px;
}

/* Phones: a staggered two-column flow, each frame keeping its own format. */
.hub-category[data-id="film"] {
    grid-column: span 2;
}

.hub-category[data-id="commercial"] {
    justify-self: center;
    width: 72%;
    margin-top: 3rem;
}

.hub-category[data-id="lab"] {
    grid-column: span 2;
    justify-self: end;
    width: 58%;
}

/* Wider screens: frames float at fixed points in space and drift with the pointer. */
@media (min-width: 768px) {
    .hub-category,
    .hub-category[data-id] {
        position: absolute;
        left: calc(var(--x) * 100%);
        top: calc(var(--y) * 100%);
        width: var(--w);
        margin: 0;
        translate: -50% -50%;
        transform: translate3d(
            calc(var(--hub-pointer-x, 0) * var(--depth) * -26px),
            calc(var(--hub-pointer-y, 0) * var(--depth) * -18px),
            0
        );
    }

    .hub-category-float {
        animation: hub-category-float 9s ease-in-out infinite alternate;
        animation-delay: var(--float-delay);
    }
}

@keyframes hub-category-arrive {
    from {
        opacity: 0;
        scale: 0.82;
        filter: blur(12px);
    }
    to {
        opacity: 1;
        scale: 1;
        filter: blur(0);
    }
}

@keyframes hub-category-float {
    from {
        transform: translateY(-8px) rotate(-0.35deg);
    }
    to {
        transform: translateY(8px) rotate(0.35deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .hub-category,
    .hub-category-float {
        animation: none;
    }
}
</style>
