<script setup lang="ts">
// imports

definePageMeta({ title: "landing.title", layout: "landing" });

// states

const route = useRoute();
const introSeen = useCookie<boolean | null>(INTRO_SEEN_COOKIE, { maxAge: INTRO_SEEN_MAX_AGE, sameSite: "lax" });
// `/?intro` plays the intro again, for reviewing it after it has been seen.
const replay = route.query.intro !== undefined;
const screen = ref<"intro" | "hub">(introSeen.value && !replay ? "hub" : "intro");
const arrivedFromTunnel = ref(false);
const morph = useCategoryMorph();
// A field's page shrinks back only into the hub; when the intro plays instead, drop it.
if (screen.value === "intro") morph.value = null;

// methods

const arrive = () => {
    introSeen.value = true;
    arrivedFromTunnel.value = true;
    screen.value = "hub";
};
</script>

<template>
    <!-- Black in both modes on purpose: the whole landing is one night scene, and a themed
         background would flash between the intro leaving and the hub arriving. -->
    <main class="bg-black">
        <h1 class="sr-only">{{ $t("landing.title") }}</h1>
        <!-- No transition: the tunnel ends inside the black hole and the hub starts in that same
             darkness. -->
        <LandingIndexIntro v-if="screen === 'intro'" @arrive="arrive" />
        <LandingIndexHub v-else :from-tunnel="arrivedFromTunnel" />
    </main>
</template>
