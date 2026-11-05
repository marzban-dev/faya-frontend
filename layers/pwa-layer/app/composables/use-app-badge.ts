// The number on the app icon, where supported (installed PWAs on iOS 16.4+, Chromium on
// desktop and Android). Elsewhere these calls do nothing.
type BadgeNavigator = Navigator & {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
};

const useAppBadge = () => {
    // methods

    const set = (count: number) => {
        const nav = navigator as BadgeNavigator;
        if (!nav.setAppBadge) return;

        const request = count > 0 ? nav.setAppBadge(count) : nav.clearAppBadge?.();
        request?.catch(() => undefined);
    };

    const clear = () => set(0);

    return { set, clear };
};

export default useAppBadge;
