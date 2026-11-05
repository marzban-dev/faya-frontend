# CLAUDE.md

## Before editing

Ask any questions you need answered before starting. Before editing any file, describe
what you plan to change and wait for my go-ahead.

## Rule toggles

Each switch turns a section of this file on or off. When a switch is `false`, ignore
that section completely: don't apply its rules to new code, and don't flag existing code
for breaking them.

- dark-light-mode: true
- i18n: true

## Project

Faya: a public website. For now it is a single landing page; more pages and sections will
be added later. This folder is the Nuxt 4 frontend.

- Rendered with SSR (Nuxt's default) so pages are indexable. Code that touches `window`,
  `document`, `navigator` or `localStorage` runs only on the client (`onMounted`,
  `.client.ts` plugins, `<ClientOnly>`, or behind `import.meta.client`). Server and client
  must render the same markup, or hydration breaks.
- Never keep per-visitor state at module level (a `let`, a `ref` or an instance outside a
  function): on the server one module serves every request. Per-request things are created
  in a plugin or kept in `useState`.
- Packages: **Bun** is the package manager and `bun.lock` is the source of truth. Add and
  upgrade dependencies with `bun add` / `bun update`, run scripts with `bun run`, and
  one-off CLIs with `bunx`. Don't use npm, pnpm or yarn; they would create a second lockfile.
- New dependency versions wait 7 days after release: `bunfig.toml` sets
  `minimumReleaseAge`, so Bun refuses anything newer. Don't lower it.
- `overrides` in `package.json` must be flat (`"vue": "3.5.44"`). Bun ignores nested
  overrides (`"pkg": { "dep": "…" }`) without a warning.
- The original design assets (logo, intro videos, logo animation) sit in the parent
  `Faya/` folder. Copy what a page needs into the project in a web size; never link to or
  bundle the originals. The site logo is `app/assets/images/faya-logo.webp`.

### Definition of done

A change isn't done until these pass:

```bash
bun run typecheck
bunx nuxi build
```

Both currently pass with zero errors; keep it that way. Report the result honestly,
including failures you didn't fix.

TypeScript stays on 6.x until `vue-tsc` supports TypeScript 7.

## Script organization comments

Inside the `<script setup>` block of every `.vue` file — and inside composables, plugins
and middleware — group the code under lowercase section comments. Each comment names the
kind of code that follows it, so the section header tells you where things live:

```text
// imports
// states
// queries
// computed
// methods
// watches
// lifecycle
```

Keep them in that order, use only the sections that are actually needed, and put each
new declaration under the section it belongs to rather than at the end of the file.

Example:

```vue
<script setup lang="ts">
// imports

import x from "x";

// states

const y = ref("2");
const route = useRoute();

// queries

const { data: plan } = usePlanQuery(() => route.params.id as string);

// computed

const h = computed(() => {
    // ...
});

// methods

const f = () => {};

// watches

watch(y, () => {
    // ...
});

// lifecycle

onMounted(() => {});
</script>
```

Notes:

- `// states` covers `ref`, `reactive`, `shallowRef`, plain constants, and composable
  calls that return state (`useX()`, stores, `useRoute()`, etc.).
- `// queries` covers TanStack queries and mutations (`useXQuery()`, `useXMutation()`).
- A value a query is keyed on — usually derived from the route, like the current page —
  goes under `// states`, even when it is a writable `computed`. `useQuery` reads its key
  during setup, so it must already exist.
- `// methods` covers all functions, including event handlers and async actions.
- Macros that must stay at the top of the block (`definePageMeta`, `defineProps`,
  `defineEmits`, `defineModel`) go right after `// imports`.
- Code that runs immediately during setup (a state initializer, a top-level call, an
  `immediate` watcher) must not read a `const` declared further down. Computed getters and
  handlers run later, so a computed may call a method from `// methods`.
- `useNuxtApp()` (and anything that calls it) only works during setup. Read what you need
  from it there, never inside a callback that runs after an `await` or a timer.

## Comments

The section comments above (`// states`, `// methods`, …) are structure, and they are wanted.
Outside of those, keep comments rare.

Don't write comments that narrate what the next line already says, restate a variable name in
prose, announce an obvious step, or describe a change that was just made. They read as
AI-generated filler, they push the real code further apart, and they go stale. Prefer a
clearer name or a smaller function over a comment explaining an unclear one.

If there is something to explain about an implementation — a tradeoff, a caveat, why one
approach was chosen over another — put it in the chat reply instead of the file. The reply
gets read.

A comment does earn its place for: a non-obvious workaround together with the reason it
exists, a link to an issue or spec, a `// TODO`, or a warning that something will break if
changed.

Don't leave commented-out code or `*_backup` files behind. Git keeps the history.

## Functions

Use arrow functions assigned to a `const`:

```ts
const formatIrPhone = (phone: string) => `${phone.slice(0, 3)} ${phone.slice(3)}`;
```

Not `export function formatIrPhone() {}`. This holds for exported utils, composable
internals, event handlers, plugin and module `setup`, and everything else.

There are a few cases where a `function` declaration is genuinely the only option —
TypeScript overload signatures, and generators (`function*`). If one of those comes up, use
`function` and say so in the reply with the reason, rather than switching style silently.

## TypeScript

- No `any` and no `as any`. Use `unknown` and narrow it, or type the thing properly.
- No `declare global` types. Domain types are models, auto-imported from `models/`; layer
  types are exported and imported (`import type { ApiError } from "#layers/api-layer"`).
  Module augmentations (`PageMeta`, `NuxtApp`, `axios`) are fine.
- Type props, emits and `defineModel` explicitly.

## Dark and light mode

> Toggle: `dark-light-mode`

Every screen has to work in both modes. Nuxt UI's semantic utilities switch with the
color mode on their own, so reach for them first:

- text — `text-dimmed`, `text-muted`, `text-toned`, `text-default`, `text-highlighted`,
  `text-inverted`
- background — `bg-default`, `bg-muted`, `bg-elevated`, `bg-accented`, `bg-inverted`
- border — `border-default`, `border-muted`, `border-accented`, `border-inverted`
- brand and status — `primary`, `secondary`, `neutral`, `success`, `info`, `warning`,
  `error`, as utilities (`text-primary`, `bg-error/10`) or through a component's `color` prop

Don't hard-code a palette shade (`bg-white`, `text-zinc-900`, `border-gray-200`) for
something that should follow the theme. If a semantic color really doesn't fit, pair the
shade with its `dark:` counterpart (`bg-zinc-50 dark:bg-zinc-900`) so both modes are covered.
Never use a palette name (`brand`, `graphite`, `orange`) directly: `primary` and `neutral`
are mapped to `brand` and `graphite` in `layers/ui-layer/app/app.config.ts`, so changing the
brand color there is a one-line change only if everything uses the semantic names.

Style Nuxt UI components through their props (`color`, `variant`, `size`) and the `ui` prop
before adding classes. A change that should apply everywhere goes in
`layers/ui-layer/app/app.config.ts`, not in each component.

Pinning an area to one mode on purpose is fine. Check the result in both modes before
calling UI work done.

Dark is the default (`colorMode.preference` in `nuxt.config.ts`).

## i18n

> Toggle: `i18n`

No user-facing text is hard-coded. That covers labels, placeholders, `aria-label`s, toasts,
validation messages, and page titles.

- Locales are `fa_ir` (Farsi, RTL) and `en`, in `layers/i18n-layer/i18n/locales/`
  (`fa.json`, `en.json`). The strategy is `no_prefix`: the locale lives in a cookie, never
  in the URL, so don't use `localePath()`. `layers/i18n-layer/app/plugins/locale-cookie.ts`
  reads that cookie on the server too, so SSR renders in the visitor's language.
- Keys are nested objects in snake_case, with the most general part first:
  `<domain>.<page or feature>.<key>` (`landing.hero.title`, `layouts.default.nav.home`).
  The top-level namespace matches the domain layer (`landing`, …). Text shared everywhere
  sits in `common`; text shared across one domain sits one level up (`landing.cta`).
- Name a key after what the text is for, not what it says: `submit`, not `sign_in_button`;
  `email.required`, not `please_enter_email`.
- Group related keys under an object (`email.label`, `email.required`, `email.invalid`)
  instead of repeating a prefix in flat keys.
- Use named interpolation for dynamic values (`"Code sent to {email}"`), never string
  concatenation. Enum-driven text maps each value to a key (`landing.plan.${tier}`).
- Add each key to **every** locale file in the same change, in the same position and
  nesting.
- Use `$t(...)` in templates, or `t` from `useI18n()`; both are fine. In `<script setup>`
  and composables, use `t` from `useI18n()`. Wrap text that has to react to a locale
  change, like validation messages and `useHead`/`useSeoMeta` titles, in a getter:
  `() => t("...")`.
- A page's title is an i18n key in `definePageMeta({ title: "landing.title" })`.
  `app.vue` puts it in the browser tab; only a page whose title depends on data adds its
  own `useHead(() => ({ title: ... }))`.
- Farsi wording: formal-neutral register, «شما», full verbs, no slang. Keep product terms
  consistent; once a term is settled, add it to a glossary here.
- The backend's error `detail` is shown as the description, never as the main message:
  `layers/api-layer/app/plugins/app-api.ts` maps the status to `common.api_errors.*`.
- Farsi is RTL. Use logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`,
  `text-start`) instead of `ml-*`, `mr-*`, `left-*`, `text-left`. Use `rtl:`/`ltr:` for
  anything that has to flip, such as directional icons.

The default locale is `fa_ir`. The Farsi text was written in the register above and is
reviewed by a native speaker; flag wording you're unsure of in the reply.

## Layers

There are two kinds of layer.

### Infrastructure layers (`layers/*`)

Nuxt auto-registers every folder in `layers/`, and each gets a `#layers/<name>` alias.
These own cross-cutting setup; domain code never goes here.

| Layer        | Owns                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api-layer`  | `$axios` (one instance per request), the TanStack `QueryClient` (`$queryClient`) with SSR hydration, global API error toasts                          |
| `auth-layer` | The session: `useAuth()`, `$authApi`, 401 → refresh → retry, `check-is-logged-in` / `check-is-not-logged-in`                                        |
| `i18n-layer` | `@nuxtjs/i18n` config, locale files, the locale cookie, `useAppLocale()`                                                                               |
| `ui-layer`   | Nuxt UI theme (`app/app.config.ts`), Tailwind entry and `theme.css` (the `brand` and `graphite` palettes), local fonts, `useAppToast()`                 |
| `pwa-layer`  | Manifest, icons and iOS splash screens, `injectManifest` with `public/service-worker.ts`, install prompt                                                |

The favicon, PWA icons and splash screens are generated from
`layers/pwa-layer/assets/faya-logo.png` by `bun run pwa-assets`, which also rewrites
`layers/pwa-layer/splash-links.json`. Don't edit the files in `public/icons/` by hand.

The session keeps the access token in memory only and the refresh token in an httpOnly
cookie. Never store a token in `localStorage`, a readable cookie or a store — go through
`$authApi`.

Each layer keeps its code under `app/`; `public/`, `i18n/`, `modules/`, `server/` and
`assets/` stay at the layer root.

### The root `app/`

Root `app/` has two jobs and nothing else:

- **Shared code every domain may use**: generic UI (`components/common/`), shared models
  and composables.
- **The shell**: `app.vue`, `layouts/` and `components/shell/` (header, footer,
  navigation). The shell composes the domains, so it may render any domain's components —
  the one place allowed to.

### Domain layers (`apps/*`)

Every folder under `apps/` is a Nuxt layer, one per domain, pulled in by `extends` in the
root `nuxt.config.ts` (unlike `layers/`, `apps/` is not auto-registered). Domains:
`landing` (the home page). Add a new domain for each new area of the site.

Each layer declares its own component prefix in its local `nuxt.config.ts` (`Landing`,
…), and adds `models`, `repositories` and `queries/**` to `imports.dirs` once it has
them, so they are auto-imported.
Component files are named **without** the prefix: `Hero.vue` in the landing layer is used
as `<LandingHero>`. Check generated names in `.nuxt/components.d.ts` when adding a
subfolder. Inside a layer, `app/` follows normal Nuxt conventions plus the rules below.

- Domains never import from each other: no other domain's models, repositories, queries
  or composables. A
  domain may **render** another domain's components in its templates (they are
  auto-imported), passing plain props. Data stays inside the domain that owns it.
- Something genuinely shared by several domains goes in the root `app/` (or an
  infrastructure layer if it is setup, not domain code).
- Inside a layer, import the layer's own files with a relative path and infrastructure
  layers with `#layers/<name>/...`. `~/` points at the root app; use it only to reach root
  shared code that isn't auto-imported.

```text
apps/landing/
├── nuxt.config.ts              # component prefix + imports.dirs
└── app/
    ├── components/
    │   ├── Hero.vue                        # global, used as <LandingHero>
    │   └── pricing/                        # scoped to pages/pricing.vue
    │       └── PlanCard.vue
    ├── composables/
    │   └── use-landing-scroll.ts           # global, auto-imported
    ├── models/
    │   └── plan.model.ts
    ├── repositories/
    │   ├── plan.repo.ts
    │   └── plan.repo.type.ts
    ├── queries/
    │   └── plan/
    │       └── use-plan.query.ts
    └── pages/
        └── index.vue
```

### components and composables

- Something reusable across the layer goes at the **root** of `components/` or
  `composables/` and is auto-imported.
- Something used by a single page goes in a subfolder named after that page, mirroring its
  path: `pages/pricing.vue` → `composables/pricing/`; `pages/blog/index.vue` →
  `composables/blog/`. A dynamic segment becomes `-detail`: `pages/blog/[slug].vue` →
  `composables/blog-detail/`. Subfolders aren't auto-imported, so import them explicitly.
- Something needed by _every_ layer goes in the root `app/` folder instead, not inside a
  layer.
- Split a component that grows past about 250 lines.

### models

Models are the domain entities, nothing else — not response types, not request payloads,
not incidental helper types. Fields are camelCase, whatever casing the API uses. A model
file exports the `type` and, when behavior is needed, a same-named `const` namespace
holding its functions under a `// functions` comment:

```ts
export type Plan = {
    id: string;
    priceMonthly: number;
    features: string[];
};

// functions

export const Plan = {
    isFree: (plan: Plan) => plan.priceMonthly === 0,
};
```

API shapes never live here — they belong in `*.repo.type.ts`.

### repositories

`<entity>.repo.ts` exports a factory that takes the `AxiosInstance` and returns
`{ keys, endpoints, calls }`:

- `endpoints` — URL paths, as strings or functions of their params.
- `keys` — a key factory for this entity, from general to specific, so invalidating a
  prefix clears everything under it (`all: ["plan"]`, `detail: (id) => ["plan", id]`).
  Queries read keys from here and never write key arrays by hand.
- `calls` — the actual axios calls. **Each call maps the API response into models before
  returning.** Nothing outside the repository layer ever sees a raw response type.

Every request sends the bearer token unless it passes `{ authorization: false }`; public
endpoints (most of a marketing site) pass it. Mapping functions live in the repository
file as `to<Model>`. `<entity>.repo.type.ts` sits next to it and holds only the wire shapes.

### queries

TanStack queries and mutations, composed from repositories and models.

- **One query or one mutation per file**, with the `.query.ts` suffix, grouped in a
  per-entity subfolder (`queries/plan/use-plan.query.ts`).
- `queryKey` comes from the repo's `keys`, and `queryFn` from its `calls`. Parameters are
  passed as refs or getters so the query reacts to them:

```ts
export const usePlanQuery = (id: MaybeRefOrGetter<string>) => {
    const { $axios: axios } = useNuxtApp();
    const planRepo = PlanRepo(axios);

    return useQuery({
        queryKey: computed(() => planRepo.keys.detail(toValue(id))),
        queryFn: () => planRepo.calls.detail(toValue(id)),
    });
};
```

- Data a page needs in its server-rendered HTML (SEO content) is awaited during SSR:
  `const { data, suspense } = usePlanQuery(id); onServerPrefetch(suspense);`. It reaches
  the browser through the payload, so it isn't fetched twice.
- A mutation owns its cache updates: it invalidates (or `setQueryData`s) the keys it
  affects in its own `onSuccess`. Toasts and navigation for one screen stay at the call
  site.
- Errors show a toast automatically, in the browser only. A query or mutation whose
  screen shows the error itself sets `meta: { handleError: false }`.
- 401s are never handled per query: `auth-layer` refreshes the token, retries, and sends
  the user to the sign-in page if that fails.

### state

- Server data belongs to TanStack Query. Never copy it into a store or a `ref`.
- Client-only state shared across components goes in `useState` (SSR-safe), not a
  module-level `ref`.

### everything else

`pages/`, `utils/`, `middleware/`, `stores/`, and any folder added later are plain Nuxt
folders following plain Nuxt conventions. No special rules.

### file naming

Kebab-case throughout, with a type suffix where the folder alone isn't explicit:

- composables — `use-landing-scroll.ts`
- models — `plan.model.ts`
- repositories — `plan.repo.ts`, `plan.repo.type.ts`
- queries — `use-plan.query.ts`
- utils — `price-format.util.ts`
- middleware and plugins — `check-something.ts`, `analytics.client.ts`
- components — `PascalCase.vue`, as Nuxt expects

## Performance

- Pages are split per route automatically. Don't import one page's heavy code from a
  shared place (a layout, `app.vue`, a global plugin) — that pulls it into the entry bundle.
- Components that aren't visible on first paint — modals, drawers, videos, heavy
  below-the-fold sections — are used with the `Lazy` prefix (`<LazyLandingVideoModal v-if="open" />`)
  so they load when first rendered.
- Heavy libraries (animation, charts, carousels) are imported only by the code that uses
  them, never registered in a global plugin, and their CSS is imported by that component,
  not listed in `nuxt.config.ts` `css`. A plugin that needs one loads it with a dynamic
  `import()`.
- Set a `staleTime` on queries for data that rarely changes instead of refetching on every
  mount.
- Use `shallowRef` for large objects and arrays that are replaced, not mutated. Avoid
  `deep` watchers on large data.
- Check bundle impact with `bunx nuxi analyze` when adding a dependency.
