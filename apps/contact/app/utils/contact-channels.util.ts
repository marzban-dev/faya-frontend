// TODO: placeholders until the team sends Faya's real email, phone and Instagram.
export const CONTACT_EMAIL = "hello@example.com";
export const CONTACT_PHONE = "+00 000 000 0000";
export const CONTACT_INSTAGRAM = "example";

// The fields a visitor can arrive from (`/contact?field=film`), so the message is about it.
export type ContactField = "film" | "design" | "commercial" | "lab";

const CONTACT_FIELDS: ContactField[] = ["film", "design", "commercial", "lab"];

export const toContactField = (value: unknown): ContactField | null =>
    typeof value === "string" && (CONTACT_FIELDS as string[]).includes(value) ? (value as ContactField) : null;
