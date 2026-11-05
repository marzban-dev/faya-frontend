<script setup lang="ts">
// states

const DISMISS_KEY = "faya-install-dismissed-until";
const DISMISS_DAYS = 30;

const { t } = useI18n();
const { canPromptInstall, needsManualInstall, install } = usePWAInstall();
const isDismissed = ref(true);

// computed

const isVisible = computed(() => !isDismissed.value && (canPromptInstall.value || needsManualInstall.value));

// methods

const dismiss = () => {
    isDismissed.value = true;
    try {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
    } catch {
        // Storage may be unavailable; it stays hidden for this visit.
    }
};

const handleInstall = async () => {
    if (await install()) dismiss();
};

// lifecycle

onMounted(() => {
    try {
        isDismissed.value = Number(localStorage.getItem(DISMISS_KEY)) > Date.now();
    } catch {
        isDismissed.value = false;
    }
});
</script>

<template>
    <UAlert
        v-if="isVisible"
        icon="i-lucide-smartphone"
        color="primary"
        variant="subtle"
        :title="t('pwa.install.title')"
        :description="needsManualInstall ? t('pwa.install.manual') : t('pwa.install.description')"
        :actions="canPromptInstall ? [{ label: t('pwa.install.submit'), color: 'primary', size: 'xs', onClick: handleInstall }] : []"
        close
        @update:open="(open: boolean) => { if (!open) dismiss(); }"
    />
</template>
