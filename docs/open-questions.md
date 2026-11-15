# Open questions and things we're waiting for

## Waiting on the team

- [ ] New intro video (with works flying out of the eye).
- [ ] Real works (images/videos) for the tunnel and Gallery. Sintel (CC-BY) samples are used until then.
- [ ] A hover video for each of the 4 categories. Samples until then.
- [ ] Real English copy for categories, steps of work, About, Contact. The field pages use
  placeholder text written from the service names (`landing.category.steps.*`).
- [ ] Faya's real email, phone and Instagram for the Contact page (placeholders in
  `apps/contact/app/utils/contact-channels.util.ts`).
- [ ] For each field: a still that is the **first frame** of its video, so the hub frame's
  picture hands over to the playing video without a cut. Videos without baked-in black bars
  (the Sintel samples have them; the cards crop them for now).
- [ ] Footage for each step of each field (sample works for now).
- [ ] List of fixed-price services and their prices.
- [ ] Final pricing / business plan for every service (only Brand Strategy exists).
- [ ] Logo as SVG, if one exists (the current one is traced).

## Decisions still open

- [ ] Final fonts and accent colour (proposal in [design/direction.md](design/direction.md)).
- [ ] Where the Retainer lives (proposal: Commercial + Pricing page).
- [ ] Design of Gallery, About, Contact, Pricing pages.
- [ ] International payments (PayPal doesn't serve Iranian businesses) — business decision.
- [ ] OTP for foreign phone numbers.

## Tooling

- No browser tool is connected yet, so screenshots can't be checked automatically. Adding
  Claude in Chrome or a Playwright MCP would let the agent look at its own work.
