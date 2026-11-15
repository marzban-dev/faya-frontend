// The four fields floating on the hub. Each frame takes its field's native format — a
// scope film frame, a poster, a phone screen, a square study — so the shapes say what the
// work is before the words do. Positions are fixed (not random) so the server and the
// browser render the same markup.

export type HubCategoryId = "film" | "design" | "commercial" | "lab";

export type HubCategory = {
    id: HubCategoryId;
    number: string;
    // Frame width / height.
    aspect: number;
    still: string;
    video: string;
    // Desktop placement: centre as a share of the stage, width in vw capped in vh.
    x: number;
    y: number;
    widthVw: number;
    widthVh: number;
    // How strongly the frame follows the pointer; deeper frames move more.
    depth: number;
    // Offset into the floating loop, in seconds, so the frames don't bob together.
    floatDelay: number;
};

const sample = (id: HubCategoryId) => ({
    still: `/samples/categories/${id}.jpg`,
    video: `/samples/categories/${id}.mp4`,
});

export const HUB_CATEGORIES: HubCategory[] = [
    {
        id: "film",
        number: "01",
        aspect: 2.39,
        ...sample("film"),
        x: 0.29,
        y: 0.36,
        widthVw: 31,
        widthVh: 52,
        depth: 1,
        floatDelay: 0,
    },
    {
        id: "design",
        number: "02",
        aspect: 4 / 5,
        ...sample("design"),
        x: 0.75,
        y: 0.33,
        widthVw: 14.5,
        widthVh: 26,
        depth: 0.55,
        floatDelay: -2.3,
    },
    {
        id: "commercial",
        number: "03",
        aspect: 9 / 16,
        ...sample("commercial"),
        x: 0.58,
        y: 0.66,
        widthVw: 10.5,
        widthVh: 19,
        depth: 1.45,
        floatDelay: -4.1,
    },
    {
        id: "lab",
        number: "04",
        aspect: 1,
        ...sample("lab"),
        x: 0.3,
        y: 0.74,
        widthVw: 13,
        widthVh: 22,
        depth: 0.8,
        floatDelay: -1.2,
    },
];
