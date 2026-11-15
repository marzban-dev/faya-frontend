<script setup lang="ts">
// imports

import type { RouteLocationRaw } from "vue-router";
import logo from "~/assets/images/faya-logo.webp";

defineProps<{
    // A labelled way back next to the logo (the field pages: back to all fields). `short` is
    // the link's visible text, `label` its full accessible name.
    back?: { to: RouteLocationRaw; label: string; short: string };
    // Where the visitor is, after the way back: the field, then the step. Each later part
    // only shows once the screen is wide enough for it.
    trail?: string[];
}>();

// states

const links = [
    { key: "gallery", to: "/gallery" },
    { key: "about", to: "/about" },
    { key: "contact", to: "/contact" },
    { key: "pricing", to: "/pricing" },
] as const;

const TRAIL_SHOWN_FROM = ["hidden md:flex", "hidden lg:flex"];
</script>

<template>
    <header class="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
        <div class="flex items-center gap-2 sm:gap-4 md:gap-7">
            <NuxtLink to="/" class="pointer-events-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                <img :src="logo" :alt="$t('shell.header.home')" width="800" height="459" class="h-7 w-auto md:h-9" />
            </NuxtLink>

            <nav
                v-if="back"
                :aria-label="$t('shell.header.trail')"
                class="order-first sm:order-0"
            >
                <ol class="flex items-center gap-2.5 font-label text-[0.68rem] tracking-[0.14em] text-white uppercase md:text-xs">
                    <li>
                        <NuxtLink
                            :to="back.to"
                            :aria-label="back.label"
                            class="site-header-link pointer-events-auto flex items-center gap-2 rounded-sm py-1 opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                        >
                            <span class="rtl:-scale-x-100" aria-hidden="true">←</span>
                            <span class="hidden sm:inline" aria-hidden="true">{{ back.short }}</span>
                        </NuxtLink>
                    </li>
                    <li
                        v-for="(part, index) in trail"
                        :key="index"
                        class="items-center gap-2.5 whitespace-nowrap"
                        :class="TRAIL_SHOWN_FROM[index] ?? 'hidden'"
                        :aria-current="index === (trail?.length ?? 0) - 1 ? 'page' : undefined"
                    >
                        <span class="opacity-35" aria-hidden="true">/</span>
                        <Transition name="site-header-crumb" mode="out-in">
                            <span :key="part" :class="index === (trail?.length ?? 0) - 1 ? 'opacity-100' : 'opacity-70'">{{ part }}</span>
                        </Transition>
                    </li>
                </ol>
            </nav>
        </div>

        <nav :aria-label="$t('shell.header.label')" class="pointer-events-auto text-white mix-blend-difference">
            <ul class="flex gap-3 font-label text-[0.68rem] tracking-[0.14em] uppercase sm:gap-7 md:gap-10 md:text-xs">
                <li v-for="link in links" :key="link.key">
                    <NuxtLink
                        :to="link.to"
                        class="site-header-link rounded-sm py-1 opacity-70 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                        {{ $t(`shell.header.nav.${link.key}`) }}
                    </NuxtLink>
                </li>
            </ul>
        </nav>
    </header>
</template>

<style scoped>
.site-header-link {
    background: linear-gradient(currentColor, currentColor) left bottom / 0 1px no-repeat;
    transition:
        opacity 300ms ease,
        background-size 450ms cubic-bezier(0.2, 0.7, 0.1, 1);
}

.site-header-link:hover {
    background-size: 100% 1px;
}

.site-header-crumb-enter-active,
.site-header-crumb-leave-active {
    transition:
        opacity 220ms ease,
        translate 320ms cubic-bezier(0.2, 0.7, 0.1, 1);
}

.site-header-crumb-enter-from {
    opacity: 0;
    translate: 0 0.4em;
}

.site-header-crumb-leave-to {
    opacity: 0;
    translate: 0 -0.4em;
}
</style>
