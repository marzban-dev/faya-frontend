import { createResolver, defineNuxtModule, extendPages } from "@nuxt/kit";
import { defu } from "defu";
import { addCustomTab } from "@nuxt/devtools-kit";

type ModuleOptions = {
    /** In-app route the auth middleware redirects to when a guard fails. */
    signInPath: string;
};

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name: "auth-module",
        configKey: "authModule",
    },

    defaults: {
        signInPath: "/login",
    },

    setup: (moduleOptions, nuxt) => {
        const resolver = createResolver(import.meta.url);

        nuxt.options.runtimeConfig.public.authModule = defu(nuxt.options.runtimeConfig.public.authModule, {
            signInPath: moduleOptions.signInPath,
        });

        if (!nuxt.options.dev) return;

        extendPages((pages) => {
            pages.unshift({
                name: "devtools-auth-view",
                path: "/devtools-auth-view",
                file: resolver.resolve("runtime/templates/devtools-auth-view.vue"),
            });
        });

        addCustomTab({
            name: "auth-module",
            title: "Auth Module",
            icon: "lucide:lock-keyhole",
            view: {
                type: "iframe",
                src: "/devtools-auth-view",
            },
        });
    },
});
