// The access token lives in memory only (10 minutes); after a reload it is gone and
// `ensureSession` gets a new one from the refresh cookie. That cookie is scoped to
// `/api/auth`, so page requests never carry it: the session exists only in the browser,
// and on the server every visitor is signed out.
let refreshInFlight: Promise<boolean> | null = null;

const useAuth = () => {
    // states

    const nuxtApp = useNuxtApp();
    const token = useState<string>("auth:token", () => "");

    // computed

    const isLoggedIn = computed(() => token.value !== "");

    // methods

    const setToken = (value: string) => {
        token.value = value;
    };

    const refreshAccessToken = (): Promise<boolean> => {
        if (import.meta.server) return Promise.resolve(false);

        refreshInFlight ??= nuxtApp.$authApi
            .refresh()
            .then((access) => {
                setToken(access ?? "");
                return Boolean(access);
            })
            .finally(() => {
                refreshInFlight = null;
            });

        return refreshInFlight;
    };

    const ensureSession = async (): Promise<boolean> => {
        if (isLoggedIn.value) return true;
        return refreshAccessToken();
    };

    const logout = async () => {
        try {
            await nuxtApp.$authApi.logout();
        } catch {
            // The server route drops the cookie either way.
        } finally {
            setToken("");
            nuxtApp.$queryClient.clear();
        }
    };

    return {
        token: readonly(token),
        isLoggedIn,
        setToken,
        refreshAccessToken,
        ensureSession,
        logout,
    };
};

export default useAuth;
