<template>
    <!-- Shared by the hub and the field pages, so the blink and a frame morphing back to the hub
         stay on screen while the page changes underneath them. -->
    <div>
        <slot />
        <LandingCategoryMorphLayer />
        <LandingBlinkLayer />
    </div>
</template>
