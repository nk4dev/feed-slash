<template>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div class="mb-4 sm:mb-6">
            <NuxtLink to="/" class="text-xs sm:text-sm text-blue-600 hover:underline">← Back to feeds</NuxtLink>
        </div>

        <div v-if="pending" class="text-center py-8 text-gray-500">
            Loading feed...
        </div>

        <div v-else-if="error" class="p-4 bg-red-50 text-red-700 rounded-md">
            Failed to load feed: {{ error.message }}
        </div>

        <div v-else-if="!data?.feed" class="text-center py-12 bg-gray-50 rounded-lg">
            Feed not found.
        </div>

        <div v-else>
            <div class="mb-6 sm:mb-8">
                <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                    {{ data.feed.title || data.feed.feedUrl }}
                </h1>
                <p class="text-xs sm:text-sm text-gray-600 truncate" :title="data.feed.feedUrl">
                    {{ data.feed.feedUrl }}
                </p>
                <p v-if="data.feed.description" class="text-sm sm:text-base text-gray-700 mt-2 sm:mt-3">
                    {{ data.feed.description }}
                </p>
                <div class="mt-3 flex gap-2 sm:gap-3 flex-wrap items-center">
                    <a
                        v-if="data.feed.remoteUrl"
                        :href="data.feed.remoteUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm text-blue-600 hover:underline"
                    >
                        Visit site
                    </a>
                    <a
                        :href="data.feed.feedUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm text-blue-600 hover:underline"
                    >
                        Open RSS
                    </a>
                    <button
                        @click="refreshFeed"
                        :disabled="isRefreshing"
                        class="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {{ isRefreshing ? 'Refreshing...' : 'Refresh Feed' }}
                    </button>
                </div>
                <div v-if="refreshMessage" :class="['mt-2 text-sm', refreshError ? 'text-red-600' : 'text-green-600']">
                    {{ refreshMessage }}
                </div>
            </div>

            <div v-if="data.items.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
                No items yet.
            </div>

            <div v-else class="grid gap-3 sm:gap-4">
                <article
                    v-for="item in data.items"
                    :key="item.contentId"
                    class="border rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow"
                >
                    <div class="flex items-start justify-between gap-2 flex-wrap">
                        <NuxtLink
                            :to="`/f/${feedId}/${item.contentId}`"
                            class="font-semibold text-sm sm:text-base text-blue-700 hover:underline flex-1"
                        >
                            {{ item.title || item.contentUrl }}
                        </NuxtLink>
                        <span
                            v-if="item.content"
                            class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full whitespace-nowrap"
                        >
                            HTML取得済
                        </span>
                        <span
                            v-else
                            class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap"
                        >
                            未取得
                        </span>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                        <span v-if="item.author" class="text-xs text-gray-600">{{ item.author }}</span>
                        <span v-if="item.author && item.publishedAt" class="text-xs text-gray-400">·</span>
                        <span v-if="item.publishedAt" class="text-xs text-gray-500">
                            {{ new Date(item.publishedAt).toLocaleString() }}
                        </span>
                    </div>
                    <p v-if="item.contentSnippet" class="text-sm text-gray-700 mt-2 line-clamp-3">
                        {{ item.contentSnippet }}
                    </p>
                    <div class="text-xs text-gray-500 mt-2 truncate" :title="item.contentUrl">
                        {{ item.contentUrl }}
                    </div>
                    <div class="mt-2">
                        <a
                            :href="item.contentUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs text-blue-600 hover:underline"
                        >
                            Open original
                        </a>
                    </div>
                </article>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
const feedId = route.params.id as string;

interface FeedItem {
    contentId: string
    title?: string
    contentUrl: string
    author?: string
    publishedAt?: string
    contentSnippet?: string
    content?: string
}

interface FeedData {
    feed: {
        title?: string
        feedUrl: string
        remoteUrl?: string
        description?: string
    }
    items: FeedItem[]
}

const { data, pending, error, refresh } = await useFetch<FeedData>(`/api/feeds/${feedId}`);

const isRefreshing = ref(false);
const refreshMessage = ref<string | null>(null);
const refreshError = ref(false);

async function refreshFeed() {
    isRefreshing.value = true;
    refreshMessage.value = null;
    refreshError.value = false;

    try {
        const result = await $fetch('/api/feeds', {
            method: 'POST',
            body: { feedUrl: data.value?.feed?.feedUrl },
        });
        await refresh();
        refreshMessage.value = `Feed refreshed! ${(result as any).itemsFetched} items fetched.`;
    } catch (err: any) {
        refreshError.value = true;
        refreshMessage.value = err?.data?.statusMessage || err?.message || 'Failed to refresh feed';
    } finally {
        isRefreshing.value = false;
    }
}

useHead({
    title: data.value?.feed?.title
        ? `${data.value.feed.title} - RSS Feed`
        : 'RSS Feed'
});
</script>