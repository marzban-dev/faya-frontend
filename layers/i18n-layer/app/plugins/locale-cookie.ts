export default defineNuxtPlugin({
    name: "locale-cookie",
    enforce: "post",
    setup: async () => {
        // states

        const i18n = useNuxtApp().$i18n;
        const savedLocale = useCookie(LOCALE_COOKIE_KEY).value;

        // methods

        const isKnownLocale = (code: string) => i18n.locales.value.some((locale) => locale.code === code);

        if (savedLocale && savedLocale !== i18n.locale.value && isKnownLocale(savedLocale)) {
            await i18n.setLocale(savedLocale as typeof i18n.locale.value);
        }
    },
});
