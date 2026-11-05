<script setup lang="ts">
// states

const { t } = useI18n();
const toast = useAppToast();
const { status, isBusy, refresh, enable, disable, sendTest } = usePushNotifications();
const { isIOS } = usePWAInstall();
const isSendingTest = ref(false);

// computed

const description = computed(() => {
    if (status.value === "blocked") return t(isIOS.value ? "pwa.push.status.blocked_ios" : "pwa.push.status.blocked");
    return t(`pwa.push.status.${status.value.replace("-", "_")}`);
});

// methods

// Called straight from the click: Safari shows the permission prompt only during it.
const handleEnable = () => {
    enable()
        .then(() => toast.success({ title: t("pwa.push.enabled") }))
        .catch((error: Error) => toast.error({ title: error.message }));
};

const handleDisable = async () => {
    await disable();
    toast.success({ title: t("pwa.push.disabled") });
};

const handleTest = async () => {
    isSendingTest.value = true;
    try {
        await sendTest();
        toast.success({ title: t("pwa.push.test_sent.title"), description: t("pwa.push.test_sent.description") });
    } catch (error) {
        toast.error({ title: (error as Error).message });
    } finally {
        isSendingTest.value = false;
    }
};

// lifecycle

onMounted(() => {
    refresh();
});
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 flex-col">
                <span class="flex items-center gap-2 text-sm font-medium text-highlighted">
                    {{ t("pwa.push.title") }}
                    <UBadge v-if="status === 'on'" color="success" variant="subtle" size="sm">{{ t("pwa.push.on") }}</UBadge>
                </span>
                <span class="text-xs text-muted">{{ description }}</span>
            </div>

            <div class="flex shrink-0 items-center gap-2">
                <USkeleton v-if="status === 'checking'" class="h-8 w-20" />
                <UButton v-else-if="status === 'off'" size="sm" icon="i-lucide-bell-ring" :loading="isBusy" @click="handleEnable">
                    {{ t("pwa.push.enable") }}
                </UButton>
                <template v-else-if="status === 'on'">
                    <UButton
                        size="sm"
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-send"
                        :loading="isSendingTest"
                        @click="handleTest"
                    >
                        {{ t("pwa.push.test") }}
                    </UButton>
                    <UButton size="sm" color="neutral" variant="ghost" :loading="isBusy" @click="handleDisable">
                        {{ t("pwa.push.disable") }}
                    </UButton>
                </template>
            </div>
        </div>

        <ol
            v-if="status === 'needs-install'"
            class="flex list-inside list-decimal flex-col gap-1.5 rounded-md bg-elevated px-3 py-2.5 text-xs text-default"
        >
            <li>
                {{ t("pwa.push.install_steps.share") }}
                <UIcon name="i-lucide-share" class="inline size-3.5 align-text-bottom" />
            </li>
            <li>{{ t("pwa.push.install_steps.add") }}</li>
            <li>{{ t("pwa.push.install_steps.open") }}</li>
        </ol>
    </div>
</template>
