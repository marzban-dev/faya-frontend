import type { AxiosInstance } from "axios";

// Thrown outside the composable, where there is no i18n; enable() translates them.
const ERROR_CODES = {
    loading: "loading",
    incomplete: "incomplete_subscription",
};

const ENDPOINTS = {
    config: "/push/config",
    subscription: "/push/subscription",
    test: "/push/test",
};

export type PushStatus =
    | "checking"
    | "unsupported" // the browser has no Web Push
    | "needs-install" // iPhone/iPad: push only works in the Home Screen app
    | "not-configured" // the server has no VAPID keys
    | "blocked" // the person denied permission
    | "off"
    | "on";

export type NotificationPayload = {
    title: string;
    body?: string;
    tag?: string;
    url?: string;
    requireInteraction?: boolean;
    data?: Record<string, unknown>;
};

type PushTestResult = { notification_sent: boolean; reason?: string };

// What the module-level helpers need from the Nuxt app; read in setup and passed in,
// because useNuxtApp() is unavailable once a callback runs after an await.
type PushApi = { axios: AxiosInstance; fallbackKey: string | null };

// Shared by every caller. Only the browser changes these: every function that does runs
// from onMounted, a click or a .client plugin, so server requests never share state.

const SERVICE_WORKER_TIMEOUT_MS = 5000;
// The first install precaches the whole app; Safari on a phone can take well over 5s.
const SERVICE_WORKER_INSTALL_TIMEOUT_MS = 60000;
const ENDPOINT_KEY = "faya-push-endpoint";
const TURNED_OFF_KEY = "faya-push-turned-off";

const status = ref<PushStatus>("checking");
const publicKey = ref<string | null>(null);
const isBusy = ref(false);
let configRequest: Promise<string | null> | null = null;

const storage = {
    get: (key: string) => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    set: (key: string, value: string | null) => {
        try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch {
            // Storage may be unavailable (private mode).
        }
    },
};

const pushSupported = () =>
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const serviceWorkerReady = (timeoutMs = SERVICE_WORKER_TIMEOUT_MS) =>
    Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(ERROR_CODES.loading)), timeoutMs)),
    ]);

const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    const output = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
};

/** True when the subscription was made with this VAPID key. */
const usesKey = (subscription: PushSubscription, key: string) => {
    const current = subscription.options?.applicationServerKey;
    if (!current) return true; // Older browsers do not expose it.
    const expected = urlBase64ToUint8Array(key);
    const actual = new Uint8Array(current);
    return actual.length === expected.length && actual.every((byte, i) => byte === expected[i]);
};

/** The VAPID public key from the API (falls back to the build-time setting). */
const loadPublicKey = ({ axios, fallbackKey }: PushApi) => {
    configRequest ??= axios
        .get<{ enabled: boolean; public_key: string | null }>(ENDPOINTS.config)
        .then(({ data }) => data.public_key)
        .catch(() => fallbackKey)
        .then((key) => {
            publicKey.value = key;
            return key;
        });
    return configRequest;
};

const register = async ({ axios }: PushApi, subscription: PushSubscription) => {
    const keys = subscription.toJSON().keys;
    if (!keys?.p256dh || !keys.auth) {
        throw new Error(ERROR_CODES.incomplete);
    }
    const previous = storage.get(ENDPOINT_KEY);
    await axios.post(ENDPOINTS.subscription, {
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: navigator.userAgent,
        previousEndpoint: previous && previous !== subscription.endpoint ? previous : undefined,
    });
    storage.set(ENDPOINT_KEY, subscription.endpoint);
};

/**
 * Makes sure this browser has a subscription for the current key and that the
 * server knows it. Safari can drop subscriptions without telling the app, so
 * this runs on every start.
 */
const ensureSubscribed = async (api: PushApi) => {
    const key = await loadPublicKey(api);
    if (!key) {
        status.value = "not-configured";
        return;
    }
    const registration = await serviceWorkerReady(SERVICE_WORKER_INSTALL_TIMEOUT_MS);
    let subscription = await registration.pushManager.getSubscription();
    if (subscription && !usesKey(subscription, key)) {
        await subscription.unsubscribe();
        subscription = null;
    }
    subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
    });
    await register(api, subscription);
    status.value = "on";
};

const usePushNotifications = () => {
    // states

    const { $i18n: i18n, $axios: axios } = useNuxtApp();
    const fallbackKey = (useRuntimeConfig().public.VAPID_PUBLIC_KEY as string) || null;
    const api: PushApi = { axios, fallbackKey };
    const { isIOS, isStandalone } = usePWAInstall();

    // computed

    const isSupported = computed(() => !["unsupported", "needs-install"].includes(status.value));
    const isConfigured = computed(() => status.value !== "not-configured");
    const isSubscribed = computed(() => status.value === "on");

    // methods

    /** Works out the status without asking the person anything. */
    const refresh = async () => {
        if (!pushSupported()) {
            status.value = isIOS.value && !isStandalone.value ? "needs-install" : "unsupported";
            return;
        }
        const key = await loadPublicKey(api);
        if (!key) {
            status.value = "not-configured";
            return;
        }
        if (Notification.permission === "denied") {
            status.value = "blocked";
            return;
        }
        if (Notification.permission !== "granted" || storage.get(TURNED_OFF_KEY)) {
            status.value = "off";
            return;
        }
        try {
            const registration = await serviceWorkerReady();
            const subscription = await registration.pushManager.getSubscription();
            status.value = subscription && usesKey(subscription, key) ? "on" : "off";
        } catch {
            status.value = "off";
        }
    };

    /**
     * Renews the subscription when permission is already granted. Never asks
     * for permission; run it on start, after sign-in and when the app returns.
     */
    const sync = async () => {
        if (!pushSupported() || Notification.permission !== "granted" || storage.get(TURNED_OFF_KEY)) {
            await refresh();
            return;
        }
        try {
            await ensureSubscribed(api);
        } catch (error) {
            console.info("[Notifications] Could not renew the push subscription:", (error as Error).message);
            await refresh();
        }
    };

    /**
     * Turns notifications on. Call it straight from a click: Safari only shows
     * the permission prompt during the click, so it is requested before any await.
     */
    const enable = (): Promise<void> => {
        if (!pushSupported()) {
            return Promise.reject(
                new Error(i18n.t(isIOS.value && !isStandalone.value ? "pwa.push.errors.needs_install" : "pwa.push.errors.unsupported")),
            );
        }
        const permission =
            Notification.permission === "default" ? Notification.requestPermission() : Promise.resolve(Notification.permission);

        return (async () => {
            isBusy.value = true;
            try {
                const result = await permission;
                if (result !== "granted") {
                    status.value = result === "denied" ? "blocked" : "off";
                    throw new Error(i18n.t(result === "denied" ? "pwa.push.errors.blocked" : "pwa.push.errors.not_enabled"));
                }
                storage.set(TURNED_OFF_KEY, null);
                await ensureSubscribed(api).catch((error: Error) => {
                    const known = Object.values(ERROR_CODES).includes(error.message);
                    throw known ? new Error(i18n.t(`pwa.push.errors.${error.message}`)) : error;
                });
                if (status.value === "not-configured") {
                    throw new Error(i18n.t("pwa.push.errors.not_configured"));
                }
            } finally {
                isBusy.value = false;
            }
        })();
    };

    /** Removes this device from the account; with `remember`, keeps it off. */
    const removeDevice = async (remember: boolean) => {
        if (remember) storage.set(TURNED_OFF_KEY, "1");
        if (!pushSupported()) return;
        const registration = await serviceWorkerReady().catch(() => null);
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
            await axios
                .delete(ENDPOINTS.subscription, { params: { endpoint: subscription.endpoint } })
                .catch(() => undefined);
            await subscription.unsubscribe().catch(() => false);
        }
        storage.set(ENDPOINT_KEY, null);
        await refresh();
    };

    /** Turns notifications off for this device until the person turns them on again. */
    const disable = async () => {
        isBusy.value = true;
        try {
            await removeDevice(true);
        } finally {
            isBusy.value = false;
        }
    };

    /** Call before signing out, so the next person on this device gets no pushes for this account. */
    const forgetDevice = () => removeDevice(false);

    /** Asks the server to push a test message to this account's devices. */
    const sendTest = async () => {
        const { data } = await axios.post<PushTestResult>(ENDPOINTS.test);
        if (!data.notification_sent) {
            throw new Error(data.reason || i18n.t("pwa.push.errors.test_failed"));
        }
    };

    /** Shows a notification from inside the open app. */
    const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
        if (!pushSupported() || Notification.permission !== "granted") return false;
        const registration = await serviceWorkerReady().catch(() => null);
        if (!registration) return false;
        await registration.showNotification(payload.title, {
            body: payload.body || "",
            tag: payload.tag,
            data: { ...payload.data, url: payload.url ?? "/" },
        });
        return true;
    };

    return {
        status: readonly(status),
        isBusy: readonly(isBusy),
        isSupported,
        isConfigured,
        isSubscribed,
        refresh,
        sync,
        enable,
        disable,
        forgetDevice,
        sendTest,
        sendNotification,
    };
};

export default usePushNotifications;
