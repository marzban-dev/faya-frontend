# Site flow

The whole visitor journey. Status: ✅ built · 🟡 agreed, not built · ⏸ postponed · ❓ open.

## 1. Intro (seen once per device)

| # | Step | Status |
| - | ---- | ------ |
| 1 | Logo animation plays while assets load; scroll hint appears. | ✅ |
| 2 | Scroll zooms into the logo's eye; the intro video opens out of the pupil and scrubs with scroll. | ✅ |
| 3 | Near the end of the video, works fly out of the eye. | ⏸ will be inside the new video |
| 4 | Camera enters the eye → "time tunnel" through space, works flying past fast. **For now:** the video fades to black, then the tunnel starts. | ✅ (sample works) |
| 5 | Tunnel ends at the **hub**: the 4 categories floating in space. | ✅ |

**Intro seen** is recorded (cookie `faya_intro_seen`) only when the visitor reaches the hub. `/?intro` replays it. Leaving midway means the
intro plays again next time. After that, the site opens directly on the hub.

## 2. Hub (the real home)

- Navbar appears from here on: **Gallery · About · Contact · Pricing**. ✅ (pages not built)
- Background: black + stars (+ film grain). ✅
- **Hover** a category → a low-opacity video for that field fades in behind everything.
  Mouse out → back to black and stars. ✅ (sample videos)
- **Click** → the rest of the hub fades, the frame grows into the field's first card and
  the page opens at `/film`, `/design`, `/commercial` or `/lab`. **Close** (or the browser's
  back button) shrinks the current card back into its hub frame. ✅
- **Touch devices:** first tap opens the category (no hover preview). ✅

## 3. Category page

- After the morph: the steps of doing that kind of work, revealed with scroll, like
  `steps-of-work.mov`: one full slide per step (for now the field's 5 services) on a strip
  that pages slide by slide (one wheel flick, swipe or arrow key = one slide, carried by a
  spring); the slide in view becomes current and its text animates in. Paging up from the first
  slide returns to the hub, and so does the **"← Back to all fields"** link next to the logo.
  The header frosts (blur under a top-to-bottom black gradient) once the page has moved. ✅ (placeholder copy and
  sample footage)
- Ends with black stripes closing like blinds, then a **"Let's work together" CTA button**
  that opens **Contact** with the field (`/contact?field=film`). ✅
- A shared link opens the page directly, without the morph. Closing it then goes to `/`,
  which plays the intro if the visitor hasn't seen it.

## 4. Request flow ⏸

See [requests-and-pricing.md](requests-and-pricing.md). Postponed until there is a backend
and pricing is final.

## 5. Other pages

- **Gallery** — portfolio of all works, filterable by category. 🟡 (not designed yet)
- **Contact** — a simple page: heading, and email, phone and Instagram (placeholders until
  the team sends the real ones); names the field when opened from a field's CTA. ✅
- **About**, **Pricing** — not designed yet. ❓
- **Hidden gift** — [hidden-gift.md](hidden-gift.md). ⏸

## Language

Bilingual (English + Persian) in the end. **English only for now.**
