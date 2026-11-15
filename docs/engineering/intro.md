# The intro (as built)

Landing page: `apps/landing/app/pages/index.vue` renders `<LandingIndexIntro>`.

## Pieces

| File | Role |
| ---- | ---- |
| `components/index/Intro.vue` | The section (`760lvh` tall) with a sticky full-screen stage. |
| `composables/index/use-intro-stage.ts` | Drives everything from the scroll position each frame (so scrolling up plays it backwards). |
| `components/index/IntroLogo.vue` + `utils/intro-logo-shapes.util.ts` | The logo animation, an SVG/CSS recreation traced from the original raster frames. |
| `composables/index/use-logo-loop.ts` | Loops the logo while loading; holds it once frames are ready. |
| `components/index/IntroStarfield.vue` | Canvas starfield (3 layers, twinkle, mouse parallax). |
| `components/index/IntroLoadingProgress.vue`, `IntroScrollHint.vue` | Loading % then scroll hint. |
| `utils/intro-geometry.util.ts` | Layout + zoom + reveal maths. |
| `utils/frame-sequence.util.ts`, `utils/intro-assets.util.ts` | Loads the WebP frame sequence (desktop/mobile variants). |
| `server/plugins/intro-load-progress.ts` | Tracks real byte progress from the page `<head>`. |
| `scripts/intro-assets/build.ts` | `bun run intro-assets`: builds frames from the source videos. |
| `composables/use-smooth-scroll.ts` | Lenis; locked until the logo holds. |

## Sequence

1. Logo loops at least one full cycle while frames load; progress then scroll hint.
2. Scroll share 1.6 / 6.6: zoom into the pupil via the SVG `viewBox` (stays sharp), darkening.
3. Remaining share: the intro video's eye opens out of the pupil (radial mask), then 241
   WebP frames scrub with crossfade between neighbours.

## Rules that came from the team

- Keep every frame of scroll animations; reduce size via quality, never frame rate.
- Fidelity to the original artwork beats hand-made approximations (the eye/hand are traced
  flipbooks; approximated circles/fades were rejected).
- The intro video will be replaced; the "works out of the eye" moment will be in the new video.

## Tunnel and hub (added 2026-11-14)

| File | Role |
| ---- | ---- |
| `utils/intro-timeline.util.ts` | **Single source of the scroll pacing**: screens for zoom / frames / tunnel, the section height, and where arrival fires. Change pacing only here. |
| `components/index/IntroTunnel.vue` + `utils/intro-tunnel.util.ts` | The tunnel's timeline and orchestration, on one WebGL canvas: black fades in over the video, then the camera flies forward past 23 works and streaking stars (the path is laid out for 24, so the last work has passed well before the black hole); the camera leans slightly with the mouse (parallax); cards have no hover effect; stars partly fade as the black hole forms (`starsFade`). Works load once the intro is ready. |
| `utils/tunnel-space.util.ts` + `composables/index/use-tunnel-objects.ts` + `utils/tunnel-object-shaders.util.ts` | The tunnel as a **3D scene** in camera space (x right, y down, z ahead, units of half the shorter screen side; same projection as the old 2D one). Works are textured **panels**, all turned ~24° toward the axis (they only swing and lean, never roll, so they stay upright), so they show perspective as they pass; lit (soft shading, glancing-angle darkening, a sheen, a fine edge). Power-of-two textures with mipmaps (+ anisotropic filtering) keep distant works clean. Stars are additive streak quads (tail → brighter head). Drawn at full resolution after the deep space. |
| `composables/index/use-tunnel-deep-space.ts` + `utils/deep-space-shaders.util.ts` | Owns the WebGL context (canvas at CSS × DPR ≤ 2, ≤ 4.5M px). Pass 1 ray-traces the deep space into a small buffer (≈0.6× CSS, ≤ 500k px): nebula layers you fly *through*, a faint band, and from the hole onward a lensed **distant star field**. Pass 2 scales it up with a radial motion blur (14 samples + jitter; a single fetch when not stretching). Kept dim (`EXPOSURE`, `INTENSITY`). Errors log `[tunnel gl] …`. Checked in headless Chrome (ANGLE Metal, M1): no shader errors; 60 fps. |
| `funnelAt` / `funnelPoint` / `horizonFade` in `utils/tunnel-space.util.ts` | Late in the hole phase the **stars** flow into the hole: every star moves inward on screen, faster the closer it is (`d'² = d² − pull`), curling slightly (`FUNNEL_SWIRL`), and vanishes at the shadow (`blackHoleShadowRadius`); streaks capped at 90 px. Works are **not** pulled in and have **no** depth-of-field blur (both tried and removed, see decisions.md). |
| `blackHoleDistance` in `utils/intro-tunnel.util.ts` + the deep-space shader | The tunnel ends in a **ray-traced Schwarzschild black hole** (in the deep-space shader): each pixel's light ray is integrated backwards along its geodesic (Schwarzschild radius = 1, adaptive steps, up to 240), collecting light from a thin Keplerian accretion disc (3–12 r_s, hotter inward, Doppler-beamed and gravitationally redshifted, turbulence shearing with the scroll) and bending the nebulae and distant stars behind; rays far from the hole use the weak-field deflection formula. The camera approaches from 70 r_s as the hole forms (`hole`, 0.58–0.85 of the tunnel), then falls in, accelerating, through the horizon (`fall`, 0.86–0.965) with extra radial stretch. The hub then comes out of the darkness (`fromTunnel`). Verified in headless Chrome. |
| `pages/index.vue` | Shows the intro or the hub. On arrival it sets the `faya_intro_seen` cookie and swaps to the hub (one way, no transition): the tunnel ends inside the black hole and the hub starts in the same darkness (`fromTunnel`), which fades out as the frames arrive. |
| `utils/intro-seen.util.ts` | Cookie name and lifetime. A cookie (not localStorage) so SSR renders the hub directly for returning visitors. |
| `components/index/SkyEvents.vue` | Realistic sky events on a canvas with additive light: brief meteors (every 3.5–9 s, under a second each) as thin tapering blue-white streaks with a small hot head and slight flicker, occasionally green or amber; and star flares (every 0.9–2.4 s), a distant star scintillating with a soft bloom and faint hair-thin diffraction spikes. No outlines or cartoon shapes, which the team rejected. Sparser on phones, off with reduced motion or a hidden tab. Used behind the opening logo and in the hub's sky. |
| `components/index/Hub.vue` | Fixed full-screen hub: starfield, hover-video backdrop, vignette, header, the four categories, pointer parallax. |
| `components/index/HubCategory.vue` + `utils/hub-categories.util.ts` | One field (hovering one hides the other three completely): a frame in that field's native format (Film 2.39:1, Design 4:5 poster, Commercial 9:16, Lab 1:1), viewfinder crop marks on hover/focus. Positions are constants so SSR markup matches. Phones get a staggered 2-column flow. |
| `components/index/HubBackdrop.vue` | The four hover videos. Muted, `preload="none"`; on fine-pointer devices they preload after 2.5 s. Faded to 30 % on hover, paused after fading out. |
| `app/components/shell/SiteHeader.vue` | Logo + Gallery / About / Contact / Pricing. Shown from the hub on. |
| `app/components/common/CustomCursor.vue` | Site-wide cinema/design cursor (mouse only): a printer's **registration mark** on the mouse and a trailing 16:9 **viewfinder** (corner brackets), solid white with a dark outline so it reads on any background. Over links/buttons the viewfinder snaps around the element's box (`STICK_PADDING`, slight lean `STICK_PULL`, not for targets bigger than `STICK_MAX`) and the mark fills. Over an element with `data-cursor-label="…"` the frame opens a little, the mark becomes a dot, and the label shows under the frame (hub cards: `landing.hub.enter`). Kept deliberately simple — the team rejected a busier REC/timecode version. |
| `app/components/common/FilmGrain.vue` | Site-wide film grain: an SVG noise tile on one fixed layer, jittered with `steps()`. |

- **Replay the intro:** open `/?intro`, or delete the `faya_intro_seen` cookie.
- `server/plugins/intro-load-progress.ts` skips its load-tracking script when the cookie is
  set (unless `?intro`), so returning visitors don't pay for it.
- `public/samples/**` is excluded from the PWA precache (like `public/intro/**`).
- Clicking a category does nothing yet — Phase 2 (morph → steps of work → CTA).
- Navbar links point to pages that don't exist yet.

### Sample media

`apps/landing/public/samples/` holds **placeholders** until the real works arrive: 24 work
stills (cropped to mixed formats) and 4 category stills + muted hover clips, all cut from
the trailer of the Blender Foundation open movie *Sintel* (© Blender Foundation,
durian.blender.org), licensed **CC-BY 3.0**. Only seconds 2–8 and 19–40 of the trailer are
picture; the rest is black, titles and credits — don't cut from there. Replace them with
Faya's own work before launch, or credit them if any stay.

They were cut with a throwaway AVFoundation script plus `scripts/intro-assets/video-tools.swift`
(clips re-encoded at ~1.4 Mbps, 960×540, 5–7 s, ~1 MB each). The clips keep the trailer's
letterbox bars, which disappear against the black hub.
