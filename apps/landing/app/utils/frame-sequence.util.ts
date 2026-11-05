export type FrameSequence = {
    count: number;
    // The frame at `index`, or the closest one that has loaded so far.
    nearest: (index: number) => HTMLImageElement | null;
    // Goes up each time a frame loads, so a renderer knows when to redraw.
    version: () => number;
    // Share of the frames `ready` waits for that have settled, from 0 to 1.
    readyProgress: () => number;
    // Resolves once the opening second and a coarse spread of the rest have loaded.
    ready: Promise<void>;
    dispose: () => void;
};

type FrameSequenceOptions = {
    count: number;
    url: (index: number) => string;
    leadFrames?: number;
    coarseStep?: number;
    concurrency?: number;
};

export const FRAME_LOAD_DEFAULTS = { leadFrames: 24, coarseStep: 6 };

// Loads the opening frames first, then every `coarseStep`th frame, then fills the gaps
// coarse to fine, so scrubbing works early and only gets smoother as the rest arrive. The
// first `readyCount` frames are the ones `ready` waits for.
export const frameLoadOrder = (
    count: number,
    leadFrames = FRAME_LOAD_DEFAULTS.leadFrames,
    coarseStep = FRAME_LOAD_DEFAULTS.coarseStep,
) => {
    const seen = new Set<number>();
    const order: number[] = [];
    const add = (index: number) => {
        if (index < count && !seen.has(index)) {
            seen.add(index);
            order.push(index);
        }
    };

    for (let i = 0; i < leadFrames; i++) add(i);
    for (let i = 0; i < count; i += coarseStep) add(i);
    add(count - 1);
    const readyCount = order.length;

    for (let step = coarseStep >> 1; step >= 1; step >>= 1) {
        for (let i = 0; i < count; i += step) add(i);
    }
    return { order, readyCount };
};

export const createFrameSequence = (options: FrameSequenceOptions): FrameSequence => {
    const { count, url, leadFrames, coarseStep, concurrency = 6 } = options;
    const { order, readyCount } = frameLoadOrder(count, leadFrames, coarseStep);
    const frames: (HTMLImageElement | null)[] = Array.from({ length: count }, () => null);
    const pending = new Set<HTMLImageElement>();
    let version = 0;
    let settled = 0;
    let cursor = 0;
    let disposed = false;
    let resolveReady = () => {};
    const ready = new Promise<void>((resolve) => (resolveReady = resolve));

    const settle = () => {
        settled++;
        if (settled === readyCount) resolveReady();
    };

    const loadNext = async (): Promise<void> => {
        const position = cursor++;
        const index = order[position];
        if (index === undefined || disposed) return;

        const image = new Image();
        image.decoding = "async";
        image.src = url(index);
        pending.add(image);
        try {
            await image.decode();
            if (disposed) return;
            frames[index] = image;
            version++;
        } catch {
            // A frame that fails is skipped; nearest() falls back to its neighbours.
        } finally {
            pending.delete(image);
        }
        if (position < readyCount) settle();
        return loadNext();
    };

    const nearest = (index: number) => {
        const target = Math.min(count - 1, Math.max(0, index));
        for (let distance = 0; distance < count; distance++) {
            const before = frames[target - distance];
            if (before) return before;
            const after = frames[target + distance];
            if (after) return after;
        }
        return null;
    };

    const dispose = () => {
        disposed = true;
        for (const image of pending) image.src = "";
        pending.clear();
    };

    for (let i = 0; i < concurrency; i++) void loadNext();

    const readyProgress = () => Math.min(1, settled / readyCount);

    return { count, nearest, version: () => version, readyProgress, ready, dispose };
};
