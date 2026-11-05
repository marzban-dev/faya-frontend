export default defineNuxtRouteMiddleware(async () => {
    // states

    const signInPath = useRuntimeConfig().public.authModule.signInPath;
    const { ensureSession } = useAuth();

    // The session is browser-only (see use-auth.ts); the guard runs again on hydration.
    if (import.meta.server) return;

    if (!(await ensureSession())) {
        return navigateTo(signInPath);
    }
});
