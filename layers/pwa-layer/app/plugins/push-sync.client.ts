// How often a returning app re-checks its push subscription.
const RESYNC_INTERVAL_MS = 30 * 60 * 1000;

export default defineNuxtPlugin({
    name: "push-sync",
    dependsOn: ["auth-api"],
    setup: () => {
        // states

        const router = useRouter();
        const { token } = useAuth();
        const { sync } = usePushNotifications();
        let lastSync = 0;

        // methods

        // Safari can drop a subscription silently, so it is renewed after sign-in and
        // whenever the app comes back. This never asks for permission.
        const syncIfSignedIn = () => {
            if (!token.value) return;
            lastSync = Date.now();
            sync().catch(() => undefined);
        };

        // watches

        watch(
            token,
            (newToken, oldToken) => {
                if (newToken && !oldToken) syncIfSignedIn();
            },
            { immediate: true },
        );

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible" && Date.now() - lastSync > RESYNC_INTERVAL_MS) syncIfSignedIn();
        });

        // A tapped notification asks the open app to show a page.
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener("message", (event) => {
                const url = event.data?.type === "NAVIGATE" ? event.data.url : null;
                if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) router.push(url);
            });
        }
    },
});
