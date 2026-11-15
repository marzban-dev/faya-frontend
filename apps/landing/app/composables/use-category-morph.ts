// The frame in flight between the hub and a field's page; null when nothing is morphing.
export const useCategoryMorph = () => useState<CategoryMorph | null>("category-morph", () => null);
