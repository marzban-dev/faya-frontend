import type { AxiosError } from "axios";
import type { Mutation, Query } from "@tanstack/vue-query";

export type ApiErrorBody = { detail?: string; code?: string };

export type ApiError = AxiosError<ApiErrorBody>;

export type ApiErrorContext = {
    error: ApiError;
    query?: Query<unknown, unknown, unknown, readonly unknown[]>;
    mutation?: Mutation<unknown, unknown, unknown, unknown>;
};

declare module "axios" {
    export interface AxiosRequestConfig {
        /** Set to `false` for public endpoints; every other request sends the bearer token. */
        authorization?: boolean;
    }
}

declare module "@tanstack/query-core" {
    interface Register {
        queryMeta: { handleError?: boolean };
        mutationMeta: { handleError?: boolean };
    }
}

export type AppApiConfig = {
    errorCallback?: (context: ApiErrorContext) => void;
    unhandledErrorCallback?: () => void;
};

declare module "#app" {
    interface NuxtApp {
        $appApi?: AppApiConfig;
    }
}

declare module "vue" {
    interface ComponentCustomProperties {
        $appApi?: AppApiConfig;
    }
}
