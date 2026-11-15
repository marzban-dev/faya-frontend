// Set when a visitor reaches the hub at the end of the intro. From then on the landing opens
// on the hub. A cookie, not localStorage, so the server renders the right screen first time.
export const INTRO_SEEN_COOKIE = "faya_intro_seen";

export const INTRO_SEEN_MAX_AGE = 60 * 60 * 24 * 365;
