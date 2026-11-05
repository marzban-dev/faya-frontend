<script lang="ts" setup>
// imports

import { useJwt } from "@vueuse/integrations/useJwt";

// states

const { token, isLoggedIn, refreshAccessToken, logout } = useAuth();
const { payload } = useJwt(computed(() => token.value));

// computed

const expiresAt = computed(() => toReadableDateString(new Date((payload.value?.exp ?? 0) * 1000)));

// methods

const toReadableDateString = (date: Date) => {
    if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "-";

    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(date);
};
</script>

<template>
    <div class="size-full min-h-screen bg-neutral-950 text-neutral-300" dir="ltr">
        <div class="flex w-full flex-col gap-8 p-12">
            <div class="flex flex-col gap-4 rounded-xl bg-neutral-900 p-6">
                <div class="text-white">Access token (memory)</div>
                <div class="w-full break-words">{{ token || "Signed out" }}</div>
                <div v-if="token" class="tracking-wider text-emerald-500">Expires {{ expiresAt }}</div>
                <div class="text-sm text-neutral-500">
                    The refresh token is an httpOnly cookie and can't be read from JavaScript.
                </div>
            </div>

            <div class="flex items-center gap-4">
                <button
                    class="cursor-pointer rounded-lg bg-sky-400 px-4 py-2 text-black transition-transform active:translate-y-0.5"
                    @click="refreshAccessToken()"
                >
                    Refresh now
                </button>
                <button
                    v-if="isLoggedIn"
                    class="cursor-pointer rounded-lg bg-rose-400 px-4 py-2 text-black transition-transform active:translate-y-0.5"
                    @click="logout()"
                >
                    Logout
                </button>
            </div>
        </div>
    </div>
</template>
