<template>
    <div class="film-grain" aria-hidden="true" />
</template>

<style scoped>
/* A tile of grey fractal noise, drawn once by the browser and shifted a few times a second:
   moving one composited layer costs almost nothing, unlike redrawing noise on a canvas. */
.film-grain {
    position: fixed;
    /* Just enough margin for the largest shift below (7%). */
    inset: -8%;
    z-index: 60;
    pointer-events: none;
    opacity: 0.075;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    animation: film-grain 0.9s steps(6) infinite;
}

@keyframes film-grain {
    0% {
        transform: translate(0, 0);
    }
    20% {
        transform: translate(-6%, 4%);
    }
    40% {
        transform: translate(5%, -7%);
    }
    60% {
        transform: translate(-3%, -4%);
    }
    80% {
        transform: translate(7%, 6%);
    }
    100% {
        transform: translate(-5%, 2%);
    }
}

@media (prefers-reduced-motion: reduce) {
    .film-grain {
        animation: none;
    }
}
</style>
