import * as uiLocales from "@nuxt/ui/locale";

export const useAppLocale = () => {
    // states

    const { $queryClient: queryClient } = useNuxtApp();
    const { locales, setLocale, locale } = useI18n();
    const localeCookie = useCookie(LOCALE_COOKIE_KEY, { maxAge: 60 * 60 * 24 * 365 });

    // computed

    const uiLocale = computed(() => uiLocales[locale.value]);
    const lang = computed(() => uiLocale.value.code);
    const dir = computed(() => uiLocale.value.dir);

    const currentLocale = computed({
        get: () => locale.value,
        set: (value) => {
            localeCookie.value = value;
            setLocale(value).then(() => queryClient.invalidateQueries());
        },
    });

    const availableLocales = computed(() =>
        locales.value.map((item) => ({
            code: item.code,
            title: item.verbose_name as string,
            icon: item.icon as string,
        })),
    );

    const currentLocaleIcon = computed(() => availableLocales.value.find((i) => i.code === currentLocale.value)?.icon);

    return {
        availableLocales,
        currentLocale,
        currentLocaleIcon,
        uiLocale,
        lang,
        dir,
    };
};
