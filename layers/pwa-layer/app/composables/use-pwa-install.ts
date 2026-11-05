// Chromium's install prompt event (not in TypeScript's DOM lib).
type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Shared by every caller: the browser offers the install prompt once, early, so the
// install-prompt plugin starts listening on load.
const deferredPrompt = shallowRef<BeforeInstallPromptEvent | null>(null);
const isStandalone = ref(false);
let listening = false;

export const captureInstallPrompt = () => {
    if (listening) return;
    listening = true;

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const updateStandalone = () => {
        isStandalone.value =
            standaloneQuery.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    };
    updateStandalone();
    standaloneQuery.addEventListener?.("change", updateStandalone);

    window.addEventListener("beforeinstallprompt", (event) => {
        // Show our own install button instead of the browser's bar.
        event.preventDefault();
        deferredPrompt.value = event as BeforeInstallPromptEvent;
    });
    window.addEventListener("appinstalled", () => {
        deferredPrompt.value = null;
        isStandalone.value = true;
    });
};

export const usePWAInstall = () => {
    // computed

    // iPadOS reports itself as a Mac, but with touch.
    const isIOS = computed(() => {
        if (import.meta.server) return false;
        const { userAgent, maxTouchPoints } = navigator;
        return /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
    });

    const canPromptInstall = computed(() => !!deferredPrompt.value && !isStandalone.value);

    // On iPhone and iPad the person installs from the Share menu.
    const needsManualInstall = computed(() => isIOS.value && !isStandalone.value);

    // methods

    const install = async () => {
        const event = deferredPrompt.value;
        if (!event) return false;

        deferredPrompt.value = null;
        await event.prompt();
        const choice = await event.userChoice;
        return choice.outcome === "accepted";
    };

    return {
        isIOS,
        isStandalone: readonly(isStandalone),
        canPromptInstall,
        needsManualInstall,
        install,
    };
};
