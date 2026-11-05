type AppToastOptions = {
    title: string;
    description?: string;
    icon?: string;
};

const useAppToast = () => {
    // states

    const toast = useToast();

    // methods

    const show = (color: "success" | "error" | "warning" | "info" | "neutral", defaultIcon: string) => {
        return ({ title, description, icon }: AppToastOptions) => {
            toast.add({ color, title, description, icon: icon ?? defaultIcon });
        };
    };

    return {
        success: show("success", "lucide:circle-check"),
        error: show("error", "lucide:circle-alert"),
        warning: show("warning", "lucide:triangle-alert"),
        info: show("info", "lucide:info"),
        text: show("neutral", "lucide:circle-alert"),
    };
};

export default useAppToast;
