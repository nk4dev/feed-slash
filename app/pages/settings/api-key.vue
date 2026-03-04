<script setup lang="ts">
interface ApiTokenItem {
    id: number;
    label: string | null;
    tokenPreview: string;
    createdAt: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
}

interface CreatedTokenResponse {
    id: number;
    token: string;
    tokenPreview: string;
    label: string | null;
    createdAt: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
}

const tokens = ref<ApiTokenItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const creating = ref(false);
const deletingId = ref<number | null>(null);
const createError = ref('');

const label = ref('');
const expiryOption = ref<'none' | '30' | '90' | '180'>('none');

const newToken = ref<CreatedTokenResponse | null>(null);
const copiedToken = ref(false);

async function fetchTokens() {
    loading.value = true;
    loadError.value = '';
    try {
        const rows = await $fetch<ApiTokenItem[]>('/api/tokens');
        tokens.value = rows;
    } catch (error: any) {
        loadError.value = error?.data?.statusMessage || error?.statusMessage || 'Failed to load API keys';
    } finally {
        loading.value = false;
    }
}

async function createToken() {
    creating.value = true;
    createError.value = '';
    copiedToken.value = false;

    try {
        const ttlDays = expiryOption.value === 'none' ? undefined : Number(expiryOption.value);
        const created = await $fetch<CreatedTokenResponse>('/api/tokens', {
            method: 'POST',
            body: {
                label: label.value.trim() || undefined,
                ttlDays,
            },
        });

        newToken.value = created;
        if (process.client) {
            sessionStorage.setItem('latestAgentApiToken', created.token);
        }
        label.value = '';
        expiryOption.value = 'none';
        await fetchTokens();
    } catch (error: any) {
        createError.value = error?.data?.statusMessage || error?.statusMessage || 'Failed to create API key';
    } finally {
        creating.value = false;
    }
}

async function deleteToken(id: number) {
    deletingId.value = id;
    try {
        await $fetch('/api/tokens', {
            method: 'DELETE',
            body: { id },
        });
        tokens.value = tokens.value.filter((token) => token.id !== id);
        if (newToken.value?.id === id) {
            newToken.value = null;
            if (process.client) {
                sessionStorage.removeItem('latestAgentApiToken');
            }
        }
    } catch {
        await fetchTokens();
    } finally {
        deletingId.value = null;
    }
}

async function copyToken() {
    if (!newToken.value) return;
    await navigator.clipboard.writeText(newToken.value.token);
    copiedToken.value = true;
    setTimeout(() => {
        copiedToken.value = false;
    }, 1800);
}

function formatDate(value: string | null) {
    if (!value) return 'Never';
    return new Date(value).toLocaleString();
}

onMounted(fetchTokens);

useHead({
    title: 'API Keys - Feed Slash',
});
</script>

<template>
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <NuxtLink to="/settings" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Settings
        </NuxtLink>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">API Keys</h1>
        <p class="text-gray-500 mt-1 text-sm sm:text-base">Create and manage Agent API authentication keys.</p>

        <div class="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mt-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Create new key</h2>
            <form @submit.prevent="createToken" class="grid gap-3 sm:grid-cols-3">
                <input v-model="label" type="text" maxlength="80" placeholder="Label (optional)"
                    class="sm:col-span-2 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    :disabled="creating" />
                <select v-model="expiryOption"
                    class="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    :disabled="creating">
                    <option value="none">No expiry</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                </select>
                <button type="submit"
                    class="sm:col-span-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    :disabled="creating">
                    {{ creating ? 'Creating...' : 'Create API key' }}
                </button>
            </form>
            <p v-if="createError" class="text-red-600 text-sm mt-3">{{ createError }}</p>
        </div>

        <div v-if="newToken" class="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 mt-6">
            <p class="text-sm text-green-800 font-semibold mb-2">Copy this key now. It will not be shown again.</p>
            <div class="flex items-center gap-2 bg-white p-3 rounded border border-green-200">
                <code class="flex-1 text-sm break-all">{{ newToken.token }}</code>
                <button @click="copyToken"
                    class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition">
                    {{ copiedToken ? 'Copied' : 'Copy' }}
                </button>
            </div>
        </div>

        <div class="mt-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">Existing keys</h2>
            <div v-if="loading" class="text-gray-500 text-sm">Loading keys...</div>
            <div v-else-if="loadError" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {{ loadError }}
            </div>
            <div v-else-if="tokens.length === 0"
                class="bg-white border border-gray-200 rounded-xl p-6 text-gray-500 text-sm">
                No API keys yet.
            </div>
            <div v-else class="space-y-3">
                <div v-for="token in tokens" :key="token.id"
                    class="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                        <p class="font-semibold text-gray-900 truncate">{{ token.label || 'Untitled key' }}</p>
                        <p class="text-sm text-gray-500 break-all">
                            {{ token.tokenPreview }} · Created {{ formatDate(token.createdAt) }} · Expires {{
                            formatDate(token.expiresAt) }} · Last used {{ formatDate(token.lastUsedAt) }}
                        </p>
                    </div>
                    <button @click="deleteToken(token.id)"
                        class="px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        :disabled="deletingId === token.id">
                        {{ deletingId === token.id ? 'Deleting...' : 'Delete' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>