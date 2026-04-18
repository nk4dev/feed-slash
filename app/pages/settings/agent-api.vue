<script setup lang="ts">
interface ApiTokenItem {
    id: number;
    label: string | null;
    tokenPreview: string;
    createdAt: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
}

useHead({
    title: "Agent API Settings - Feed Slash",
});

const url = useRequestURL();
const tokenRows = ref<ApiTokenItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const activeToken = ref('');
const copied = ref(false);

const agentContext = computed(() => activeToken.value
    ? `${url.origin}/api/agents?token=${encodeURIComponent(activeToken.value)}`
    : '');

const loadTokens = async () => {
    loading.value = true;
    loadError.value = '';
    try {
        tokenRows.value = await $fetch<ApiTokenItem[]>('/api/tokens');
    } catch (error: any) {
        loadError.value = error?.data?.statusMessage || error?.statusMessage || 'Failed to load API keys';
    } finally {
        loading.value = false;
    }
};

const copyToClipboard = async () => {
    if (!agentContext.value) return;
    await navigator.clipboard.writeText(agentContext.value);
    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000);
};

onMounted(async () => {
    if (process.client) {
        activeToken.value = sessionStorage.getItem('latestAgentApiToken') || '';
    }
    await loadTokens();
});
</script>

<template>
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <NuxtLink to="/settings" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Settings
        </NuxtLink>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Agent API Settings</h1>
        <p class="mb-4 text-gray-600">Use this URL as your agent context endpoint.</p>

        <div class="space-y-4">
            <div class="flex items-center gap-2 bg-gray-100 p-3 rounded border border-gray-200">
                <code class="flex-1 text-sm text-gray-800 break-all">
                    {{ agentContext || 'Create a new API key in /settings/api-key and come back here.' }}
                </code>
                <button @click="copyToClipboard" :disabled="!agentContext"
                    class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ copied ? '✅' : 'Copy' }}
                </button>
            </div>
        </div>

        <div class="mt-6 bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <h2 class="font-semibold text-gray-900">Available API keys</h2>
            <p class="text-xs text-gray-500 mt-1">Only key previews are listed here. Full key value is shown once at
                creation.</p>
            <p v-if="loading" class="text-sm text-gray-500 mt-3">Loading keys...</p>
            <p v-else-if="loadError" class="text-sm text-red-600 mt-3">{{ loadError }}</p>
            <ul v-else-if="tokenRows.length > 0" class="mt-3 space-y-2">
                <li v-for="token in tokenRows" :key="token.id" class="text-sm text-gray-700">
                    <span class="font-medium">{{ token.label || 'Untitled key' }}</span>
                    <span class="text-gray-500"> ({{ token.tokenPreview }})</span>
                </li>
            </ul>
            <p v-else class="text-sm text-gray-500 mt-3">No API keys yet.</p>
            <NuxtLink to="/settings/api-key" class="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm">
                Go to API key management →
            </NuxtLink>
        </div>

        <p class="mt-6 text-sm text-gray-700">
            By setting this URL as the source for your AI agent, you can use your feed data as context.
        </p>
        <strong class="block mt-2 text-sm text-gray-900">
            Note: Do not expose your API key publicly or in screenshots.
        </strong>
    </div>
</template>
