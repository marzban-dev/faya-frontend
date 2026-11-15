<template>
    <!-- Shared by the hub and the field pages, so a frame morphing between them stays on screen
         while the page changes underneath it. -->
    <div>
        <slot />
        <LandingCategoryMorphLayer />
    </div>
</template>
