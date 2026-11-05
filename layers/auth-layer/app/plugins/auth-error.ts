import type { ApiError } from "#layers/api-layer";

export default defineNuxtPlugin({
    name: "auth-error",
    dependsOn: ["axios", "auth-api"],
    setup: () => {
        // states

        const { $axios: axios } = useNuxtApp();
        const { refreshAccessToken, setToken } = useAuth();
        const signInPath = useRuntimeConfig().public.authModule.signInPath;

        // methods

        const endSession = async () => {
            setToken("");
            await navigateTo(signInPath);
        };

        // On the server there is no session to refresh and no page to send anyone to.
        if (import.meta.server) return;

        axios.interceptors.response.use(
            (response) => response,
            async (error: ApiError) => {
                const request = error.config;

                if (error.response?.status !== 401 || !request || request.authorization === false) {
                    return Promise.reject(error);
                }

                if (!request.retriedAfterRefresh && (await refreshAccessToken())) {
                    return axios({ ...request, retriedAfterRefresh: true });
                }

                await endSession();
                return Promise.reject(error);
            },
        );
    },
});
