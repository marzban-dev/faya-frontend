<script setup lang="ts">
// imports

definePageMeta({ title: "landing.title" });
</script>

<template>
    <main class="bg-default">
        <h1 class="sr-only">{{ $t("landing.title") }}</h1>
        <LandingIndexIntro />
    </main>
</template>
