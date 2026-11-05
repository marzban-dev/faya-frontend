import type { AxiosInstance } from "axios";
import axiosOriginal from "axios";

declare module "#app" {
    interface NuxtApp {
        $axios: AxiosInstance;
    }
}

declare module "vue" {
    interface ComponentCustomProperties {
        $axios: AxiosInstance;
    }
}

const PROXY_BASE_URL = "/api/backend";

const trimSlash = (url: string) => url.replace(/\/$/, "");

export default defineNuxtPlugin({
    name: "axios",
    setup: () => {
        // states

        const nuxtApp = useNuxtApp();
        const config = useRuntimeConfig();
        const { token } = useAuth();

        // One instance per Nuxt app: on the server that is one per request, so headers and
        // interceptors never leak between visitors.
        const axios = axiosOriginal.create();

        // methods

        const resolveBaseUrl = () => {
            if (import.meta.server) return trimSlash(String(config.API_INTERNAL_BASE_URL || ""));

            const useDirectApi = String(config.public.USE_DIRECT_API || "false").toLowerCase() === "true";
            const directBaseUrl = trimSlash(String(config.public.API_BASE_URL || ""));

            // The same-origin proxy (`nitro.routeRules`) avoids CORS.
            return useDirectApi && directBaseUrl ? directBaseUrl : PROXY_BASE_URL;
        };

        axios.defaults.baseURL = resolveBaseUrl();

        axios.interceptors.request.use((request) => {
            const locale = nuxtApp.$i18n?.locale.value;
            if (locale) {
                request.headers["Accept-Language"] = locale.split("_")[0];
            }

            if (request.authorization !== false && token.value) {
                request.headers.Authorization = `Bearer ${token.value}`;
            }

            return request;
        });

        return {
            provide: {
                axios,
            },
        };
    },
});
