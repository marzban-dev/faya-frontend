<script setup lang="ts">
// imports

import logo from "~/assets/images/faya-logo.webp";

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
        <NuxtLink to="/" class="pointer-events-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            <img :src="logo" :alt="$t('shell.header.home')" width="800" height="459" class="h-7 w-auto md:h-9" />
        </NuxtLink>

        <nav :aria-label="$t('shell.header.label')" class="pointer-events-auto text-white mix-blend-difference">
            <ul class="flex gap-4 font-label text-[0.68rem] tracking-[0.14em] uppercase sm:gap-7 md:gap-10 md:text-xs">
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
</style>
