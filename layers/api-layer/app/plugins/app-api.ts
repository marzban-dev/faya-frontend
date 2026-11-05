import type { AppApiConfig } from "#layers/api-layer";

const STATUS_ERROR_KEYS: Record<number, string> = {
    400: "bad_request",
    403: "permission_denied",
    404: "not_found",
    409: "conflict",
    413: "too_large",
    429: "too_many_requests",
};

export default defineNuxtPlugin({
    name: "app-api",
    setup: () => {
        // states

        const nuxtApp = useNuxtApp();
        const toast = useAppToast();

        // methods

        const t = (key: string) => nuxtApp.$i18n.t(key);

        const errorCallback: AppApiConfig["errorCallback"] = ({ error }) => {
            const status = error.response?.status ?? 0;

            // Handled by auth-error.ts: a 401 refreshes the session or signs out.
            if (status === 401) return;

            const key = STATUS_ERROR_KEYS[status] ?? "request_failed";
            toast.error({ title: t(`common.api_errors.${key}`), description: error.response?.data?.detail });
        };

        const unhandledErrorCallback: AppApiConfig["unhandledErrorCallback"] = () => {
            toast.error({ title: t("common.api_errors.unexpected") });
        };

        const appApi: AppApiConfig = { errorCallback, unhandledErrorCallback };

        return {
            provide: { appApi },
        };
    },
});
