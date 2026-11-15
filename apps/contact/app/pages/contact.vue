<script setup lang="ts">
// imports

definePageMeta({ title: "contact.title" });

// states

const { t } = useI18n();
const route = useRoute();

// computed

const field = computed(() => toContactField(route.query.field));
const fieldName = computed(() => (field.value ? t(`contact.fields.${field.value}`) : null));

const channels = computed(() => {
    const subject = fieldName.value ? t("contact.subject", { field: fieldName.value }) : t("contact.subject_general");
    return [
        { key: "email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` },
        { key: "phone", value: CONTACT_PHONE, href: `tel:${CONTACT_PHONE.replace(/\s/g, "")}` },
        { key: "instagram", value: `@${CONTACT_INSTAGRAM}`, href: `https://instagram.com/${CONTACT_INSTAGRAM}` },
    ];
});
</script>

<template>
    <!-- Dark in both modes on purpose: it continues the fields' night scene. -->
    <main class="flex min-h-lvh flex-col justify-center bg-black px-5 pt-32 pb-20 text-neutral-100 md:px-10">
        <ShellSiteHeader />

        <div class="mx-auto w-full max-w-5xl">
            <p class="font-label text-[0.68rem] tracking-[0.14em] text-neutral-400 uppercase">
                {{ $t("contact.eyebrow") }}
                <template v-if="fieldName">
                    <span class="mx-2 text-primary">·</span>
                    {{ $t("contact.about", { field: fieldName }) }}
                </template>
            </p>
            <h1 class="mt-5 font-display text-[clamp(3.25rem,10vw,9rem)] leading-[0.9] tracking-[-0.03em] text-neutral-50">
                {{ $t("contact.heading") }}
            </h1>
            <p class="mt-6 max-w-md text-[0.95rem] leading-relaxed text-neutral-400">
                {{ $t("contact.text") }}
            </p>

            <h2 class="sr-only">{{ $t("contact.channels.label") }}</h2>
            <ul class="mt-14 grid gap-px overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-800 md:grid-cols-3">
                <li v-for="channel in channels" :key="channel.key" class="bg-black">
                    <a
                        :href="channel.href"
                        :target="channel.key === 'instagram' ? '_blank' : undefined"
                        :rel="channel.key === 'instagram' ? 'noopener' : undefined"
                        class="group flex h-full flex-col gap-6 p-6 transition-colors duration-500 hover:bg-neutral-950 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary md:p-8"
                    >
                        <span class="font-label text-[0.68rem] tracking-[0.14em] text-neutral-500 uppercase">
                            {{ $t(`contact.channels.${channel.key}`) }}
                        </span>
                        <span class="text-lg text-neutral-100 transition-colors duration-500 group-hover:text-primary" dir="ltr">
                            {{ channel.value }}
                        </span>
                    </a>
                </li>
            </ul>
        </div>
    </main>
</template>
