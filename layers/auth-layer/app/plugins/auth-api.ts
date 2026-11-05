import type { AccessResponse, AuthApi, SignInParams } from "../../types/types";

// These call the Nuxt server routes in `server/api/auth/`, not the backend: they hold the
// refresh token in an httpOnly cookie that browser JavaScript never sees.
export default defineNuxtPlugin({
    name: "auth-api",
    setup: () => {
        // methods

        const signIn = async ({ email, password }: SignInParams): Promise<string> => {
            const data = await $fetch<AccessResponse>("/api/auth/login", {
                method: "POST",
                body: { email: email.toLowerCase(), password },
            });
            return data.access;
        };

        const refresh = async (): Promise<string | null> => {
            try {
                const data = await $fetch<AccessResponse>("/api/auth/refresh", { method: "POST" });
                return data.access;
            } catch {
                return null;
            }
        };

        const logout = async (): Promise<void> => {
            await $fetch("/api/auth/logout", { method: "POST" });
        };

        const authApi: AuthApi = { signIn, refresh, logout };

        return {
            provide: { authApi },
        };
    },
});
