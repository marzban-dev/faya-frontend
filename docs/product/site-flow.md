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
- **Click** → the box morphs into fullscreen and opens the category. 🟡 Phase 2
- **Touch devices:** first tap opens the category (no hover preview). 🟡 Phase 2

## 3. Category page

- After the morph: the steps of doing that kind of work, revealed with scroll, like
  `steps-of-work.mov`. 🟡
- Ends with a **"Let's work together" CTA button**. 🟡

## 4. Request flow ⏸

See [requests-and-pricing.md](requests-and-pricing.md). Postponed until there is a backend
and pricing is final.

## 5. Other pages

- **Gallery** — portfolio of all works, filterable by category. 🟡 (not designed yet)
- **About**, **Contact**, **Pricing** — not designed yet. ❓
- **Hidden gift** — [hidden-gift.md](hidden-gift.md). ⏸

## Language

Bilingual (English + Persian) in the end. **English only for now.**
