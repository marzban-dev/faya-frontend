export default defineNuxtPlugin({
    name: "install-prompt",
    setup: () => {
        captureInstallPrompt();
    },
});
