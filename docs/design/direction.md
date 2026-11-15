# Design direction

Cinematic, dark, grainy, editorial. The team likes Framer-made websites; the main
reference is **https://antonyraphy.com/**, especially its grain and cinematic feel.

## What the reference actually uses (read from its HTML, 2026-11-14)

- Built with **Framer** (`<meta name="generator" content="Framer …">`).
- Fonts: **Geist Mono** for almost all text (≈140 uses), **Geist** for some, **Caveat**
  (handwritten) as a small accent; Inter is Framer's fallback.
- Text is small and dense: most at `0.88rem`, labels at `0.75rem` / `0.7rem`, with a few
  large display lines.
- Tight tracking: `letter-spacing: -0.04em` is the dominant value (also `-0.02em`, `-0.06em`
  on big type).
- Colours: black / near-black surfaces (`#000`, `#0f0f0f`, `#121212`, a warm `#17170d`),
  white text, greys `rgb(145,145,145)` / `rgb(106,106,106)` for secondary text, and a warm
  muted gold accent `rgb(209,198,123)` (≈ `#d1c67b`, its most used colour).
- `mix-blend-mode: difference` on overlaid UI (nav/cursor) so it reads over any image.
- Copy style: uppercase mono labels, numbered items (`_CLARION_01`), coordinates, a
  playful "classified" tone in the contact block.
- The grain technique couldn't be confirmed from the HTML (likely an image/overlay layer).

## Faya's direction (proposal, 2026-11-14)

- **Type**
  - Display: a cinematic serif for big headlines and category names (proposal:
    *Instrument Serif*, used in many Framer sites; italic for accents).
  - UI / body: **Geist** (sans).
  - Labels, numbers, metadata: **Geist Mono**, uppercase, small, tracked.
  - Big type tracked tight (`-0.04em`); mono labels tracked slightly open.
  - All fonts self-hosted (the project forbids font CDNs).
- **Colour**: near-black stage (`#0b0b0b`–`#111`), off-white text, greys for secondary
  text; Faya's **brand orange** stays the accent instead of the reference's gold.
- **Texture**: a film-grain overlay over the whole site (animated, subtle), plus a soft
  vignette. It must not cost much on mobile.
- **Motion**: slow, eased, cinematic; scroll-driven where it tells a story (intro, tunnel,
  steps of work); Lenis smooth scroll is already in the project.
- Dark is the default and the intro stage is dark on purpose in both modes.

Fonts and accent colour are proposals until the team approves them; record the final
choice in [../decisions.md](../decisions.md).

## Space palette (decided 2026-11-15)

All space colours (nebulae, black-hole disc, stars, meteors) come from one family
built around the brand orange `#ff6b0a`: its relatives amber, copper, burnt umber and ember,
set against deep petrol blue and slate teal (orange's complementary cool). No violet, magenta,
pink or green. Space stays dim so the works and cards stay the focus. Source: `palette()` in
`apps/landing/app/utils/deep-space-shaders.util.ts`.
