import type { DehydratedState, VueQueryPluginOptions } from "@tanstack/vue-query";
import { VueQueryPlugin, QueryClient, QueryCache, MutationCache, dehydrate, hydrate } from "@tanstack/vue-query";
import { AxiosError } from "axios";
import type { ApiError, ApiErrorContext } from "#layers/api-layer";

declare module "#app" {
    interface NuxtApp {
        $queryClient: QueryClient;
    }
}

declare module "vue" {
    interface ComponentCustomProperties {
        $queryClient: QueryClient;
    }
}

const DEFAULT_STALE_TIME = 5000;

export default defineNuxtPlugin({
    name: "tanstack",
    enforce: "pre",
    setup: () => {
        // states

        const nuxtApp = useNuxtApp();
        const queryState = useState<DehydratedState | null>("vue-query-state", () => null);

        // methods

        const handleError = (context: ApiErrorContext) => {
            // Toasts belong to the browser; a failed server-side query is retried there.
            if (import.meta.server) return;
            if (!(context.error instanceof AxiosError)) return;

            const status = context.error.response?.status ?? 0;

            if (status >= 400 && status < 500) {
                nuxtApp.$appApi?.errorCallback?.(context);
            } else {
                nuxtApp.$appApi?.unhandledErrorCallback?.();
            }
        };

        // states

        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: DEFAULT_STALE_TIME,
                    retry: 1,
                    refetchOnWindowFocus: false,
                },
            },
            queryCache: new QueryCache({
                onError: (error, query) => {
                    if (query.meta?.handleError !== false) handleError({ error: error as ApiError, query });
                },
            }),
            mutationCache: new MutationCache({
                onError: (error, _variables, _context, mutation) => {
                    if (mutation.meta?.handleError !== false) handleError({ error: error as ApiError, mutation });
                },
            }),
        });

        const options: VueQueryPluginOptions = { queryClient };

        nuxtApp.vueApp.use(VueQueryPlugin, options);

        // lifecycle

        // Queries fetched during SSR travel to the browser in the payload, so it doesn't
        // fetch them again on hydration.
        if (import.meta.server) {
            nuxtApp.hooks.hook("app:rendered", () => {
                queryState.value = dehydrate(queryClient);
            });
        }

        if (import.meta.client && queryState.value) {
            hydrate(queryClient, queryState.value);
        }

        return {
            provide: {
                queryClient,
            },
        };
    },
});
