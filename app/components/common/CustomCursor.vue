<script setup lang="ts">
// states

type CursorMode = "default" | "link" | "label";

const FRAME_EASE_RATE = 14;
const INTERACTIVE = "[data-cursor-label], a, button, [role='button'], label, summary";
// Room between a framed element and the viewfinder, and how far the frame leans toward the
// mouse while it holds an element (0 = locked on it, 1 = follows the mouse).
const STICK_PADDING = { x: 10, y: 8 };
const STICK_PULL = 0.12;
// Bigger targets (whole panels made clickable) keep the plain focus-lock look.
const STICK_MAX = { width: 480, height: 220 };

const enabled = ref(false);
const visible = ref(false);
const pressed = ref(false);
const mode = ref<CursorMode>("default");
const label = ref("");
const mark = ref<HTMLElement | null>(null);
const frame = ref<HTMLElement | null>(null);
const frameShape = ref<HTMLElement | null>(null);
let pointer = { x: -100, y: -100 };
let frameAt = { x: -100, y: -100 };
let lastTime = 0;
let animationFrame = 0;
let reducedMotion = false;
let finePointer: MediaQueryList | null = null;
let stuckTo: HTMLElement | null = null;

// methods

// The loop sleeps once the viewfinder has caught up with a still mouse; movement wakes it.
const wake = () => {
    if (!enabled.value || animationFrame) return;
    lastTime = 0;
    animationFrame = requestAnimationFrame(tick);
};

const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer = { x: event.clientX, y: event.clientY };
    wake();
    if (visible.value) return;
    frameAt = { ...pointer };
    visible.value = true;
};

const onPointerOver = (event: PointerEvent) => {
    const element = event.target instanceof Element ? event.target.closest<HTMLElement>(INTERACTIVE) : null;
    const text = element?.dataset.cursorLabel;
    label.value = text ?? "";
    mode.value = text ? "label" : element ? "link" : "default";
    stickTo(mode.value === "link" ? element : null);
    wake();
};

const stickTo = (element: HTMLElement | null) => {
    const rect = element?.getBoundingClientRect();
    stuckTo = rect && rect.width <= STICK_MAX.width && rect.height <= STICK_MAX.height ? element : null;
    const shape = frameShape.value;
    if (!shape) return;
    shape.style.width = stuckTo && rect ? `${rect.width + STICK_PADDING.x * 2}px` : "";
    shape.style.height = stuckTo && rect ? `${rect.height + STICK_PADDING.y * 2}px` : "";
};

// Where the viewfinder heads: the mouse, or the framed element's centre leaning a little
// toward the mouse.
const frameTarget = () => {
    if (!stuckTo?.isConnected) return pointer;
    const rect = stuckTo.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    return { x: center.x + (pointer.x - center.x) * STICK_PULL, y: center.y + (pointer.y - center.y) * STICK_PULL };
};

const onPointerDown = () => (pressed.value = true);

const onPointerUp = () => (pressed.value = false);

const onLeaveWindow = () => (visible.value = false);

const tick = (time: number) => {
    const delta = lastTime ? Math.min(time - lastTime, 100) / 1000 : 0;
    lastTime = time;
    const ease = reducedMotion ? 1 : 1 - Math.exp(-delta * FRAME_EASE_RATE);
    const target = frameTarget();
    frameAt = { x: frameAt.x + (target.x - frameAt.x) * ease, y: frameAt.y + (target.y - frameAt.y) * ease };
    if (mark.value) mark.value.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    if (frame.value) frame.value.style.transform = `translate3d(${frameAt.x}px, ${frameAt.y}px, 0)`;
    // A framed element can move under a still mouse (scrolling), so keep following it.
    const settled = !stuckTo && Math.abs(target.x - frameAt.x) < 0.05 && Math.abs(target.y - frameAt.y) < 0.05;
    animationFrame = settled ? 0 : requestAnimationFrame(tick);
};

const enable = () => {
    if (enabled.value) return;
    enabled.value = true;
    document.documentElement.classList.add("has-custom-cursor");
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    wake();
};

const disable = () => {
    enabled.value = false;
    visible.value = false;
    document.documentElement.classList.remove("has-custom-cursor");
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerover", onPointerOver);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
};

const onPointerTypeChange = (event: MediaQueryListEvent) => (event.matches ? enable() : disable());

// lifecycle

onMounted(() => {
    reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    if (finePointer.matches) enable();
    finePointer.addEventListener("change", onPointerTypeChange);
});

onBeforeUnmount(() => {
    finePointer?.removeEventListener("change", onPointerTypeChange);
    disable();
});
</script>

<template>
    <div
        v-show="enabled"
        class="custom-cursor"
        :class="[`is-${mode}`, { 'is-visible': visible, 'is-pressed': pressed }]"
        aria-hidden="true"
    >
        <div ref="frame" class="custom-cursor-anchor">
            <div ref="frameShape" class="custom-cursor-frame" :class="{ 'is-stuck': mode === 'link' }">
                <span class="custom-cursor-label">{{ label }}</span>
            </div>
        </div>
        <div ref="mark" class="custom-cursor-anchor">
            <div class="custom-cursor-mark" />
        </div>
    </div>
</template>

<style>
/* Only while the cursor is drawn (a real mouse), so touch and keyboard users lose nothing. */
html.has-custom-cursor,
html.has-custom-cursor * {
    cursor: none !important;
}
</style>

<style scoped>
.custom-cursor {
    --ease-out: cubic-bezier(0.2, 0.7, 0.1, 1);
    --line: 1.5px;
    position: fixed;
    inset: 0;
    z-index: 70;
    pointer-events: none;
    opacity: 0;
    transition: opacity 300ms ease;
}

.custom-cursor.is-visible {
    opacity: 1;
}

.custom-cursor-anchor {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
}

/* Solid white with a dark outline rather than an inverting blend: inverted lines vanish over
   mid-grey footage, an outlined white line reads on black, white and everything between. */
.custom-cursor-mark,
.custom-cursor-frame {
    position: absolute;
    translate: -50% -50%;
    color: #fff;
    filter: drop-shadow(0 0 1px rgb(0 0 0 / 0.9)) drop-shadow(0 0 3px rgb(0 0 0 / 0.45));
}

/* A printer's registration mark: a cross through a small circle. */
.custom-cursor-mark {
    width: 24px;
    height: 24px;
    background:
        linear-gradient(currentColor, currentColor) center / var(--line) 100% no-repeat,
        linear-gradient(currentColor, currentColor) center / 100% var(--line) no-repeat;
    transition:
        width 400ms var(--ease-out),
        height 400ms var(--ease-out),
        scale 300ms var(--ease-out);
}

.custom-cursor-mark::before {
    content: "";
    position: absolute;
    inset: 50%;
    width: 11px;
    height: 11px;
    translate: -50% -50%;
    border: var(--line) solid currentColor;
    border-radius: 50%;
    transition:
        background-color 300ms ease,
        width 400ms var(--ease-out),
        height 400ms var(--ease-out);
}

/* A camera viewfinder: corner brackets around a 16:9 frame. */
.custom-cursor-frame {
    --mark: currentColor;
    --length: 9px;
    width: 52px;
    height: 29px;
    background:
        linear-gradient(var(--mark), var(--mark)) top left / var(--length) var(--line),
        linear-gradient(var(--mark), var(--mark)) top left / var(--line) var(--length),
        linear-gradient(var(--mark), var(--mark)) top right / var(--length) var(--line),
        linear-gradient(var(--mark), var(--mark)) top right / var(--line) var(--length),
        linear-gradient(var(--mark), var(--mark)) bottom left / var(--length) var(--line),
        linear-gradient(var(--mark), var(--mark)) bottom left / var(--line) var(--length),
        linear-gradient(var(--mark), var(--mark)) bottom right / var(--length) var(--line),
        linear-gradient(var(--mark), var(--mark)) bottom right / var(--line) var(--length);
    background-repeat: no-repeat;
    transition:
        width 450ms var(--ease-out),
        height 450ms var(--ease-out),
        scale 160ms ease-out;
}

.custom-cursor-label {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    translate: -50% -4px;
    font-family: var(--font-label);
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    white-space: nowrap;
    opacity: 0;
    transition:
        opacity 250ms ease,
        translate 400ms var(--ease-out);
}

/* Over something clickable the viewfinder closes in on the mark and the mark fills: focus locked. */
.is-link .custom-cursor-frame {
    width: 34px;
    height: 34px;
}

.custom-cursor-frame.is-stuck {
    --length: 8px;
}

.is-link .custom-cursor-mark {
    width: 14px;
    height: 14px;
}

.is-link .custom-cursor-mark::before {
    width: 6px;
    height: 6px;
    background-color: currentColor;
}

/* Over a labelled target the viewfinder opens a little, the mark settles to a dot, and the
   action is named under the frame. */
.is-label .custom-cursor-frame {
    width: 72px;
    height: 40px;
}

.is-label .custom-cursor-mark {
    width: 0;
    height: 0;
}

.is-label .custom-cursor-mark::before {
    width: 5px;
    height: 5px;
    background-color: currentColor;
}

.is-label .custom-cursor-label {
    opacity: 1;
    translate: -50% 0;
}

/* A click is a shutter: the frame snaps in and back. */
.is-pressed .custom-cursor-frame {
    scale: 0.88;
}
</style>
