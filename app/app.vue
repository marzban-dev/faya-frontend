<script setup lang="ts">
// states

const { t } = useI18n();
const route = useRoute();
const { uiLocale, lang, dir } = useAppLocale();

useHead(() => ({
    htmlAttrs: { lang: lang.value, dir: dir.value },
    title: route.meta.title ? t(route.meta.title) : undefined,
}));
</script>

<template>
    <UApp :locale="uiLocale">
        <NuxtLayout>
            <VitePwaManifest />
            <NuxtPage />
            <div dir="ltr">
                <VueQueryDevtools dir="ltr" button-position="bottom-left" />
            </div>
        </NuxtLayout>
    </UApp>
</template>
