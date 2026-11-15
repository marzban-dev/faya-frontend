# Decisions log

Newest first. Each entry: date, decision, and why if it isn't obvious.

## 2026-11-15

- **The black hole is alive:** its disc is arcs and clumps of gas that keep orbiting with time
  (inner edge about once every 5 s, inner rings faster than outer); only the orbit, no gas churn or
  pulsing (tried and removed). The first version wound the gas into fine rings that looked still and
  pixelated, so the disc now uses flow noise (two gas copies taking turns, neither winding up), and
  the scene is drawn sharper (85% of screen size, up from 60%) once the hole shows. This
  is the one part of the tunnel that moves with time as well as scroll; scroll still drives the
  approach and the fall. Held still under reduced motion.
- **Hub sky has the tunnel's galaxy fog**, kept subtle (thinner in the centre, where the frames sit).
  It's the same WebGL gas and palette as the tunnel, drifting slowly with time and the pointer, and
  held still under reduced motion. Without WebGL the hub has no fog.
- **Cinematic letterbox bars on the intro video:** black bars at the top and bottom (a 2.1:1 frame,
  at least 5% of the height each) close in a few frames into the video and open again before the
  tunnel. They follow the scroll.
- **The tunnel starts a little brighter:** gas and stars are 30% brighter as it opens, easing back to
  normal by about 45% of the way through.
- **The whole tunnel is one 3D WebGL scene** (the team called the flat 2D works "trash"): works are lit
  3D panels in perspective, turned toward the tunnel's axis; stars are 3D streaks. The 2D canvas is
  gone: **without WebGL the tunnel stays black** (accepted; the console says why).
- **No works go into the black hole, and no depth-of-field blur** (both removed at the team's
  request after several versions: works orbiting the hole, many works stretched in, and the last 4
  stretched in one by one). Every work simply flies past the camera, sharp. Stars still flow into the
  hole late in the hole phase.
- Tunnel cards: **no hover effect**; all cards turned toward the axis by the **same** angle, upright
  (no random tilt, roll or sway).
- **No galaxies** in the tunnel at all (removed). The last work was removed too (23 works; the camera
  path is unchanged), so no card sits beside the black hole at the end.
- Stars dimmer, as trails.
- **Tunnel ending: a real, ray-traced 3D black hole** (the team rejected a drawn 2D one as not real): approach, lensing, accretion disc, then falling through the horizon; the hub emerges from darkness. Works now start sooner in the tunnel.
- **Deep space in the tunnel** (nebulae, galaxies) rendered with WebGL shaders, not images: images flashed when stretched and looked soft. It must stay subtle: the works are the focus.
- Cursor over cards kept **simple** (no REC/timecode/frosted box — "too complicated").
- Hovering a hub card hides the other cards completely.
- Random meteors and sparks in the opening logo's sky and the hub's sky.
- Opening logo made much smaller (max 600px wide, 80% of the screen width, 34% of its height).

## 2026-11-14

- **Custom cursor:** cinema + design themed (registration mark + viewfinder, REC/timecode monitor over cards), site-wide, mouse only. Tunnel ends in a portal of light that hands over to the hub; tunnel works and hub cards scale up a little on hover; subtle mouse parallax in the tunnel.
- **Fonts approved:** Instrument Serif (display/headlines, category names), Geist (UI/body),
  Geist Mono (small uppercase labels). Self-hosted.
- **Samples:** the team chose free stock. Picsum was down (HTTP 522) and scraping Unsplash
  was blocked, so the placeholders are cut from the Blender Foundation's *Sintel* trailer
  (CC-BY 3.0) instead: cinematic and clearly licensed. Replace before launch.
- **fa.json:** while English is the focus, new keys get the English text in `fa.json` too;
  translate everything in one pass later.
- **Phase 1 approved:** English default, fonts, film grain, fade-to-black → time tunnel →
  floating hub with hover videos, navbar, intro-seen cookie. Phase 2 (category morph →
  steps of work → CTA) comes after review.
- **English first.** Build and write everything in English for now; Persian comes later.
  The site will be bilingual in the end.
- **Fonts and look:** cinematic, grainy, "Framer-style". Main reference: antonyraphy.com
  (see [design/direction.md](design/direction.md)). The team likes Framer-made sites in general.
- **Sample media:** use sample images and videos for the works and category videos until
  the real ones arrive.
- **Postponed:** hidden gift, payment, SMS/OTP, request forms, pricing. Don't build them yet.
- **Auth (when it comes):** phone number + OTP everywhere.
- **Intro step 3 (works flying out of the eye)** will be part of a *new* intro video that
  isn't ready. Don't build it. For now the intro video fades to black and goes into the time
  tunnel; rework the transition when the new video arrives.
- **"Let's work together"** at the end of a category's steps is a real CTA button.
- **Mobile:** first tap on a category opens it (no hover-preview step on touch).
- **Gallery** = portfolio of all works, filterable by category.
- The `frontend-design` skill is installed (also `impeccable`, `emil-design-eng`,
  `design-taste-frontend`, `web-design-guidelines` in `.claude/skills/`).

## 2026-11-05

- Intro built: SVG logo loader → scroll zoom into the pupil → scroll-scrubbed intro frames.
- Starfield behind the logo, with mouse parallax.
- Keep every frame of scroll animations; reduce size via quality, never frame rate.
