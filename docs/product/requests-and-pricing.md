# Requests, pricing, payment — POSTPONED

Don't build any of this yet: there is no backend, and pricing isn't final. This file keeps
the ideas so the discussion can resume where it stopped.

## What the team wants (from the brainstorm)

- After the CTA, a step-by-step request form specific to the category and service
  (e.g. Design → "What do you need? Poster / Banner / …").
- Pricing per category; the submit step tells the visitor the expected price.
- Custom work: submit → "Received, we'll call or message you."
- Fixed-price work: log in and pay on the site. Iran: local gateway. Abroad: PayPal or similar.
- **Retainer**: 3- or 6-month contract with a monthly package — a creative planning
  session, set production days, a set number of videos and images, defined editing and
  revisions, fixed delivery dates.
- Login is phone number + OTP.

## The template: `business-plan.txt`

The Brand Strategy inquiry form is the model for all services:

- 5 steps: Business Information → Current Challenge → Audience & Market →
  Strategic Objectives → Project & Contact.
- Submitting is free and commits to nothing. Afterwards: Brief Review → Strategic Discovery →
  Scope Definition → Project Proposal → Approval & Agreement.
- **Three pricing models**:
  - *Fixed Fee* — set scope and outputs (e.g. Brand Audit).
  - *Starting From* — a base price that grows with depth (e.g. Brand Foundation).
  - *Custom Proposal* — quoted after review (e.g. Comprehensive Brand Strategy).
- No final price is shown just from a form choice.
- Website rules: show progress per step, optional questions can be skipped, answers kept
  until submit, multiple file uploads with size/format limits, confirmation + tracking code
  after submit, data goes to a CRM, the form must not make the client design the solution.

## Proposed approach (agreed in principle, not final)

- Every service gets the same three pricing models. The submit step shows the model:
  "Fixed: X", "From X", or "Custom proposal" — never an invented range.
- One form engine driven by a config per service: shared steps (business info, contact)
  plus service-specific steps. UI can be built with a mock submit and wired to a backend later.
- Fixed-fee services go to checkout: phone login → payment.
- Retainer: proposed mainly under Commercial, plus a section on the Pricing page. ❓

## Known risks to raise again

- **PayPal (and Stripe) don't let Iranian businesses receive money.** International payments
  likely need a company/partner abroad. Business decision, not code.
- **OTP SMS to foreign numbers** from Iranian SMS providers is often unreliable. International
  visitors may need email or WhatsApp as a fallback.
