<script setup lang="ts">
// imports

import type { RouteLocationRaw } from "vue-router";
import logo from "~/assets/images/faya-logo.webp";

defineProps<{
    // Frosts the bar so content passing under it doesn't fight the links.
    blurred?: boolean;
    // A labelled way back, shown next to the logo (the field pages: back to all fields).
    back?: { to: RouteLocationRaw; label: string };
}>();

// states

const links = [
    { key: "gallery", to: "/gallery" },
    { key: "about", to: "/about" },
    { key: "contact", to: "/contact" },
    { key: "pricing", to: "/pricing" },
] as const;
</script>

<template>
    <header class="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
        <div
            class="site-header-frost absolute inset-x-0 top-0 -bottom-6 -z-10 backdrop-blur-md transition-opacity duration-300"
            :class="blurred ? 'opacity-100' : 'opacity-0'"
            aria-hidden="true"
        />

        <div class="flex items-center gap-2 sm:gap-4 md:gap-7">
            <NuxtLink to="/" class="pointer-events-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                <img :src="logo" :alt="$t('shell.header.home')" width="800" height="459" class="h-7 w-auto md:h-9" />
            </NuxtLink>

            <NuxtLink
                v-if="back"
                :to="back.to"
                :aria-label="back.label"
                class="site-header-link pointer-events-auto order-first flex items-center sm:order-0 gap-2 rounded-sm py-1 font-label text-[0.68rem] tracking-[0.14em] text-white uppercase opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current md:text-xs"
            >
                <span class="rtl:-scale-x-100" aria-hidden="true">←</span>
                <span class="hidden sm:inline" aria-hidden="true">{{ back.label }}</span>
            </NuxtLink>
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
/* Darkest at the top, fading out downwards; the mask fades the blur with it, so there is no edge. */
.site-header-frost {
    background: linear-gradient(to bottom, rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.2) 60%, transparent);
    mask-image: linear-gradient(to bottom, black 45%, transparent);
}

.site-header-link {
    background: linear-gradient(currentColor, currentColor) left bottom / 0 1px no-repeat;
    transition:
        opacity 300ms ease,
        background-size 450ms cubic-bezier(0.2, 0.7, 0.1, 1);
}

.site-header-link:hover {
    background-size: 100% 1px;
}
</style>
