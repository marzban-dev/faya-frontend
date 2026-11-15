// imports

import type { Ref } from "vue";
import { useLogoLoop } from "./use-logo-loop";

type IntroElements = {
    section: Ref<HTMLElement | null>;
    stage: Ref<HTMLElement | null>;
    logo: Readonly<Ref<SVGSVGElement | null>>;
    logoShade: Ref<HTMLElement | null>;
    introCanvas: Ref<HTMLCanvasElement | null>;
    hint: Ref<HTMLElement | null>;
    letterbox: Ref<HTMLElement | null>;
    tunnel: Ref<{ setProgress: (progress: number) => void } | null>;
};

const MAX_PIXEL_RATIO = 2;
// Loading fills the progress up to this share (IntroLoadingProgress.vue's CSS uses it too); the rest fills over the logo's last cycle,
// so it reaches 100% when the logo holds and scrolling unlocks, not seconds before.
const LOADING_SHARE = 0.9;
const PROGRESS_EASE_RATE = 8;
// Shares of the intro frames: the letterbox closes in after the first few and opens again
// before the tunnel.
const LETTERBOX_IN = [0.03, 0.1] as const;
const LETTERBOX_OUT = [0.9, 1] as const;

// Drives the landing intro: the logo loops while the page loads, then scroll zooms into its
// eye, scrubs through the intro frames and flies through the tunnel. Everything is drawn
// from the scroll position on each animation frame, so scrolling back up plays it in
// reverse — until the tunnel's end, where `onArrive` hands over to the hub once.
export const useIntroStage = (elements: IntroElements, onArrive: () => void) => {
    // states

    const ready = ref(false);
    const progress = ref(0);
    const smoothScroll = useSmoothScroll();
    const logoLoop = useLogoLoop(elements.logo);
    const { baseURL } = useRuntimeConfig().app;
    let variant: IntroVariant | null = null;
    let sequence: FrameSequence | null = null;
    let layout: IntroLayout | null = null;
    let introContext: CanvasRenderingContext2D | null = null;
    let pixelRatio = 1;
    let sectionTop = 0;
    let distance = 1;
    let arrived = false;
    let scrollY = 0;
    let dirty = true;
    let drawnVersion = -1;
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let shownProgress = 0;
    let finishStart = 0;
    let finishDuration = -1;
    let lastTime = 0;

    // methods

    const selectVariant = (next: IntroVariant) => {
        if (next === variant && sequence) return sequence;
        variant = next;
        sequence?.dispose();
        const frames = INTRO_FRAMES[next];
        const created = createFrameSequence({ ...frames, url: (index) => withBaseUrl(baseURL, frames.url(index)) });
        sequence = created;
        created.ready.then(() => {
            if (created !== sequence) return;
            if (finishDuration < 0) {
                finishStart = performance.now();
                finishDuration = logoLoop.cycleRemaining() * 1000;
            }
            logoLoop.allowHold();
        });
        return created;
    };

    const measure = () => {
        const stage = elements.stage.value;
        const section = elements.section.value;
        if (!stage || !section) return;

        const width = stage.clientWidth;
        const height = stage.clientHeight;
        const next = width < height ? "mobile" : "desktop";
        selectVariant(next);
        layout = layoutIntro(width, height, INTRO_FRAMES[next]);

        pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
        const canvas = elements.introCanvas.value;
        if (canvas) {
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
        }

        sectionTop = section.getBoundingClientRect().top + window.scrollY;
        distance = Math.max(1, section.offsetHeight - height);

        const hint = elements.hint.value;
        if (hint) hint.style.top = `${layout.logo.y + layout.logo.height * INTRO_LOGO.contentBottom}px`;
        dirty = true;
    };

    // The SVG keeps its CSS box (the logo's resting place) and zooms by narrowing its
    // viewBox, so the vector stays sharp at any scale; overflow shows what spills past it.
    const drawLogo = (current: IntroLayout, zoom: IntroZoom) => {
        const svg = elements.logo.value;
        const shade = elements.logoShade.value;
        if (!svg || !shade) return;
        const visible = zoom.progress < 1;
        svg.style.visibility = visible ? "visible" : "hidden";
        shade.style.opacity = `${visible ? zoom.darken : 0}`;
        if (!visible) return;

        const rect = scaleRectAround(current.logo, current.logoPupil, zoom.focus, zoom.scale);
        const width = INTRO_LOGO.width / zoom.scale;
        const height = INTRO_LOGO.height / zoom.scale;
        const x = ((current.logo.x - rect.x) * width) / current.logo.width;
        const y = ((current.logo.y - rect.y) * height) / current.logo.height;
        svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
    };

    const maskToReveal = (context: CanvasRenderingContext2D, center: IntroCircle, reveal: IntroReveal) => {
        const { x, y } = center;
        const outer = reveal.radius + reveal.feather;
        const gradient = context.createRadialGradient(x, y, 0, x, y, outer);
        const visible = `rgb(0 0 0 / ${reveal.alpha})`;
        gradient.addColorStop(0, visible);
        gradient.addColorStop(reveal.radius / outer, visible);
        gradient.addColorStop(1, "rgb(0 0 0 / 0)");
        context.globalCompositeOperation = "destination-in";
        context.fillStyle = gradient;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.globalCompositeOperation = "source-over";
    };

    const drawIntro = (current: IntroLayout, zoom: IntroZoom, progress: number) => {
        const canvas = elements.introCanvas.value;
        if (!canvas || !introContext || !sequence) return;
        const reveal = revealAt(current, zoom);
        canvas.style.visibility = reveal ? "visible" : "hidden";
        if (!reveal) return;

        const pupil = current.introPupil;
        const frames = reveal.complete
            ? introFramesAt(progress, sequence.count)
            : { from: 0, to: 0, mix: 0 };
        const image = sequence.nearest(frames.from);
        introContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        introContext.clearRect(0, 0, current.width, current.height);
        if (!image) return;

        const rect = scaleRectAround(current.intro, pupil, pupil, reveal.scale);
        introContext.drawImage(image, rect.x, rect.y, rect.width, rect.height);
        const next = frames.mix > 0.02 ? sequence.nearest(frames.to) : null;
        if (next && next !== image) {
            introContext.globalAlpha = frames.mix;
            introContext.drawImage(next, rect.x, rect.y, rect.width, rect.height);
            introContext.globalAlpha = 1;
        }
        if (!reveal.complete) maskToReveal(introContext, pupil, reveal);
    };

    const easeBetween = (from: number, to: number, value: number) => {
        const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
        return t * t * (3 - 2 * t);
    };

    const letterboxAt = (frames: number) =>
        easeBetween(LETTERBOX_IN[0], LETTERBOX_IN[1], frames) * (1 - easeBetween(LETTERBOX_OUT[0], LETTERBOX_OUT[1], frames));

    // Share of the bytes the intro waits for that have arrived, as tracked from the page's
    // <head> by server/plugins/intro-load-progress.ts; the frames' own count if that's missing.
    const loadedShare = () => {
        const tracked = Number(document.getElementById("intro-load")?.dataset.value);
        return Number.isFinite(tracked) ? tracked : (sequence?.readyProgress() ?? 0);
    };

    const updateProgress = (time: number) => {
        const delta = lastTime ? Math.min(time - lastTime, 100) / 1000 : 0;
        lastTime = time;
        const finishing = finishDuration < 0 ? 0 : Math.min(1, (time - finishStart) / Math.max(1, finishDuration));
        const loading = finishDuration < 0 ? loadedShare() : 1;
        const target = LOADING_SHARE * loading + (1 - LOADING_SHARE) * finishing;
        shownProgress += (target - shownProgress) * (1 - Math.exp(-delta * PROGRESS_EASE_RATE));
        const percent = Math.floor(shownProgress * 100);
        if (percent > progress.value) progress.value = percent;
    };

    const render = (time: number) => {
        animationFrame = requestAnimationFrame(render);
        if (!ready.value) updateProgress(time);
        const version = sequence?.version() ?? 0;
        if (!layout || (!dirty && version === drawnVersion)) return;
        dirty = false;
        drawnVersion = version;

        const timeline = introTimelineAt(scrollY - sectionTop, distance);
        const zoom = zoomAt(layout, timeline.zoom);
        drawLogo(layout, zoom);
        drawIntro(layout, zoom, timeline.frames);
        elements.tunnel.value?.setProgress(Math.min(1, Math.max(0, timeline.tunnel)));
        if (!arrived && timeline.tunnel >= INTRO_ARRIVE_AT) {
            arrived = true;
            onArrive();
        }

        const letterbox = elements.letterbox.value;
        if (letterbox) letterbox.style.setProperty("--intro-letterbox", letterboxAt(timeline.frames).toFixed(4));

        const hint = elements.hint.value;
        if (hint) hint.style.opacity = `${hintOpacityAt(zoom)}`;
    };

    // watches

    watch(logoLoop.held, (held) => {
        if (!held) return;
        progress.value = 100;
        ready.value = true;
        smoothScroll.unlock();
    });

    // lifecycle

    onMounted(() => {
        // The intro starts at the top of the page, so a reload never lands halfway through it.
        history.scrollRestoration = "manual";
        window.scrollTo(0, 0);
        smoothScroll.lock();
        smoothScroll.onScroll((y) => {
            scrollY = y;
            dirty = true;
        });

        shownProgress = LOADING_SHARE * loadedShare();
        progress.value = Math.floor(shownProgress * 100);
        introContext = elements.introCanvas.value?.getContext("2d") ?? null;
        measure();
        resizeObserver = new ResizeObserver(measure);
        if (elements.stage.value) resizeObserver.observe(elements.stage.value);

        logoLoop.start();
        animationFrame = requestAnimationFrame(render);
    });

    onBeforeUnmount(() => {
        cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        sequence?.dispose();
        history.scrollRestoration = "auto";
    });

    return { ready, progress, played: logoLoop.played };
};
