export default defineNuxtConfig({
    modules: ["@nuxtjs/i18n"],

    i18n: {
        strategy: "no_prefix",
        detectBrowserLanguage: false,
        defaultLocale: "fa_ir",
        locales: [
            {
                name: "Farsi",
                verbose_name: "فارسی",
                code: "fa_ir",
                language: "fa-IR",
                dir: "rtl",
                file: "fa.json",
                icon: "circle-flags:ir",
            },
            {
                name: "English",
                verbose_name: "English",
                code: "en",
                language: "en-US",
                dir: "ltr",
                file: "en.json",
                icon: "circle-flags:us",
            },
        ],
    },
});
