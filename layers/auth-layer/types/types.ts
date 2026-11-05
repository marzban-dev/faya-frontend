export type SignInParams = {
    email: string;
    password: string;
};

export type AccessResponse = {
    access: string;
};

export type AuthApi = {
    signIn: (params: SignInParams) => Promise<string>;
    refresh: () => Promise<string | null>;
    logout: () => Promise<void>;
};

declare module "axios" {
    export interface AxiosRequestConfig {
        retriedAfterRefresh?: boolean;
    }
}

declare module "#app" {
    interface NuxtApp {
        $authApi: AuthApi;
    }
}

declare module "vue" {
    interface ComponentCustomProperties {
        $authApi: AuthApi;
    }
}
