const filledField = "bg-elevated hover:bg-accented/50 focus:bg-elevated disabled:bg-elevated/50";

const filledFieldFocus = {
    color: "primary",
    variant: "soft",
    class: "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
} as const;

const tallerSizes = {
    sm: { base: "py-2" },
    md: { base: "py-2" },
    lg: { base: "py-2.5" },
    xl: { base: "py-2.5" },
};

export default defineAppConfig({
    ui: {
        // "brand" and "graphite" are defined in assets/css/theme.css.
        colors: {
            primary: "brand",
            neutral: "graphite",
        },

        card: {
            variants: {
                variant: {
                    outline: {
                        root: "bg-linear-to-br from-elevated/60 to-default",
                    },
                },
            },
        },

        // Nuxt UI's defaults, spelled out so the icon scan bundles them into the client.
        // Change an icon here to change it in every component.
        icons: {
            arrowDown: "i-lucide-arrow-down",
            arrowLeft: "i-lucide-arrow-left",
            arrowRight: "i-lucide-arrow-right",
            arrowUp: "i-lucide-arrow-up",
            caution: "i-lucide-circle-alert",
            check: "i-lucide-check",
            chevronDoubleLeft: "i-lucide-chevrons-left",
            chevronDoubleRight: "i-lucide-chevrons-right",
            chevronDown: "i-lucide-chevron-down",
            chevronLeft: "i-lucide-chevron-left",
            chevronRight: "i-lucide-chevron-right",
            chevronUp: "i-lucide-chevron-up",
            close: "i-lucide-x",
            copy: "i-lucide-copy",
            copyCheck: "i-lucide-copy-check",
            dark: "i-lucide-moon",
            drag: "i-lucide-grip-vertical",
            ellipsis: "i-lucide-ellipsis",
            error: "i-lucide-circle-x",
            external: "i-lucide-arrow-up-right",
            eye: "i-lucide-eye",
            eyeOff: "i-lucide-eye-off",
            file: "i-lucide-file",
            folder: "i-lucide-folder",
            folderOpen: "i-lucide-folder-open",
            hash: "i-lucide-hash",
            info: "i-lucide-info",
            light: "i-lucide-sun",
            loading: "i-lucide-loader-circle",
            menu: "i-lucide-menu",
            minus: "i-lucide-minus",
            panelClose: "i-lucide-panel-left-close",
            panelOpen: "i-lucide-panel-left-open",
            plus: "i-lucide-plus",
            reload: "i-lucide-rotate-ccw",
            search: "i-lucide-search",
            stop: "i-lucide-square",
            star: "i-lucide-star",
            success: "i-lucide-circle-check",
            system: "i-lucide-monitor",
            tip: "i-lucide-lightbulb",
            upload: "i-lucide-upload",
            warning: "i-lucide-triangle-alert",
        },

        formField: {
            slots: {
                label: "ps-1",
                description: "ps-1",
                help: "ps-1",
                error: "ps-1",
            },
        },

        button: {
            variants: {
                size: tallerSizes,
            },
            compoundVariants: [
                { square: true, size: "sm", class: "p-2" },
                { square: true, size: "md", class: "p-2" },
                { square: true, size: "lg", class: "p-2.5" },
                { square: true, size: "xl", class: "p-2.5" },
            ],
            defaultVariants: {
                size: "lg",
            },
        },

        input: {
            slots: {
                root: "w-full",
            },
            variants: {
                variant: { soft: filledField },
                size: tallerSizes,
            },
            compoundVariants: [filledFieldFocus],
            defaultVariants: {
                size: "lg",
                variant: "soft",
            },
        },

        textarea: {
            slots: {
                root: "w-full",
            },
            variants: {
                variant: { soft: filledField },
                size: tallerSizes,
            },
            compoundVariants: [filledFieldFocus],
            defaultVariants: {
                size: "lg",
                variant: "soft",
            },
        },

        // Laid out LTR in every locale so minus stays on the left and plus on the right;
        // `rtl:text-right` keeps button-less number fields aligned like the rest of an RTL form.
        inputNumber: {
            slots: {
                root: "[direction:ltr]",
            },
            compoundVariants: [
                {
                    orientation: "horizontal",
                    decrement: false,
                    class: "rtl:text-right",
                },
            ],
        },

        pinInput: {
            variants: {
                variant: { soft: filledField },
            },
            compoundVariants: [filledFieldFocus],
            defaultVariants: {
                variant: "soft",
            },
        },

        select: {
            slots: {
                content: "rounded-lg shadow-md",
                group: "p-1.5",
            },
            variants: {
                variant: { soft: filledField },
                size: tallerSizes,
            },
            compoundVariants: [filledFieldFocus],
            defaultVariants: {
                size: "lg",
                variant: "soft",
            },
        },

        selectMenu: {
            slots: {
                content: "rounded-lg shadow-md",
                group: "p-1.5",
            },
            variants: {
                variant: { soft: filledField },
                size: tallerSizes,
            },
            compoundVariants: [filledFieldFocus],
            defaultVariants: {
                size: "lg",
                variant: "soft",
            },
        },

        dropdownMenu: {
            slots: {
                content: "rounded-lg shadow-md",
                group: "p-1.5",
                separator: "-mx-1.5",
            },
        },

        popover: {
            slots: {
                content: "rounded-lg shadow-md",
            },
        },
    },
});
