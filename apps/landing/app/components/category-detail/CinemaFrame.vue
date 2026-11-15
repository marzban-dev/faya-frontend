<script setup lang="ts">
// imports

const props = defineProps<{
    step: number;
    total: number;
    // The step count shows until the finale's stripes start to close.
    counting: boolean;
}>();

// states

const CLOCK_TICK_MS = 15_000;

const { locale } = useI18n();
// Filled in on the client only: the server's clock would never match the visitor's render.
const time = ref("--:--");
let clockTimer: ReturnType<typeof setInterval> | undefined;

// computed

const current = computed(() => String(props.step + 1).padStart(2, "0"));
const total = computed(() => String(props.total).padStart(2, "0"));

// methods

const tick = () => {
    time.value = new Intl.DateTimeFormat(locale.value === "fa_ir" ? "fa-IR" : "en-GB", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date());
};

// lifecycle

onMounted(() => {
    tick();
    clockTimer = setInterval(tick, CLOCK_TICK_MS);
});

onBeforeUnmount(() => clearInterval(clockTimer));
</script>

<template>
    <!-- Widescreen bars that cut the slides as they page, and a viewfinder's corner marks and
         labels around the whole screen. -->
    <div class="pointer-events-none" aria-hidden="true">
        <div class="fixed inset-x-0 top-0 z-30 h-(--card-top) bg-black" />
        <div
            class="fixed inset-x-0 bottom-0 z-30 flex h-(--bar-bottom) items-center justify-between bg-black px-8 font-label text-[0.62rem] tracking-[0.16em] text-neutral-400 uppercase tabular-nums md:px-10"
        >
            <span>{{ $t("landing.category.frame.clock", { time }) }}</span>
            <span class="transition-opacity duration-500" :class="counting ? 'opacity-100' : 'opacity-0'">
                {{ $t("landing.category.step_count", { current, total }) }}
            </span>
        </div>

        <span class="cinema-corner start-2.5 top-2.5 border-s border-t md:start-3.5 md:top-3.5" />
        <span class="cinema-corner end-2.5 top-2.5 border-e border-t md:end-3.5 md:top-3.5" />
        <span class="cinema-corner start-2.5 bottom-2.5 border-s border-b md:start-3.5 md:bottom-3.5" />
        <span class="cinema-corner end-2.5 bottom-2.5 border-e border-b md:end-3.5 md:bottom-3.5" />
    </div>
</template>

<style scoped>
.cinema-corner {
    position: fixed;
    z-index: 40;
    width: 0.875rem;
    height: 0.875rem;
    border-color: rgb(255 255 255 / 0.4);
}
</style>
