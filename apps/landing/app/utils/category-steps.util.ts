// The steps shown on each field's page: for now its five services, in the order of
// docs/product/services.md. Text lives in i18n under `landing.category.steps.<field>.<step>`.

export type CategoryStepMedia = {
    kind: "video" | "image";
    src: string;
    poster: string;
    // Share of the frame's height each black bar takes when the picture is letterboxed inside
    // the file (the Sintel samples are), so the card can crop the bars away.
    letterbox?: number;
};

// TODO: drop once the real field videos (without baked-in bars) replace the samples.
const SAMPLE_VIDEO_LETTERBOX = 0.13;

export type CategoryStep = { id: string; media: CategoryStepMedia };

export const CATEGORY_IDS: HubCategoryId[] = ["film", "design", "commercial", "lab"];

const STEP_IDS: Record<HubCategoryId, string[]> = {
    film: ["development", "pre_production", "production", "post_production", "distribution"],
    design: ["film_graphics", "poster_design", "visual_identity", "brand_strategy", "brand_storytelling"],
    commercial: ["advertising_films", "social_content", "campaign_production", "ai_production", "photography"],
    lab: ["ai_research", "visual_experiments", "new_media", "creative_rnd", "original_concepts"],
};

const SAMPLE_WORK_COUNT = 23;

const sampleWork = (index: number) => `/samples/works/work-${String((index % SAMPLE_WORK_COUNT) + 1).padStart(2, "0")}.jpg`;

export const isCategoryId = (value: unknown): value is HubCategoryId =>
    typeof value === "string" && (CATEGORY_IDS as string[]).includes(value);

// The first step opens on the field's own video (the one its hub frame morphs into); the rest
// use sample works until the team sends real ones.
export const categorySteps = (category: HubCategory): CategoryStep[] => {
    const offset = CATEGORY_IDS.indexOf(category.id) * 5;
    return STEP_IDS[category.id].map((id, index) => ({
        id,
        media:
            index === 0
                ? { kind: "video", src: category.video, poster: category.still, letterbox: SAMPLE_VIDEO_LETTERBOX }
                : { kind: "image", src: sampleWork(offset + index), poster: sampleWork(offset + index) },
    }));
};
