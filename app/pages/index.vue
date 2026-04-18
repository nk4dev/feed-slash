<template>
    <div class="max-w-8xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div v-if="!isLoaded">Loading...</div>

        <!-- 未ログイン時の表示 -->
        <div v-else-if="!isSignedIn" class="flex flex-col items-center justify-center py-16">
            <h1 class="page-title mb-4">
                Feed Slash へようこそ
            </h1>
            <p class="page-subtitle mb-6">
                高速でRSSフィードを読む、シンプルなリーダー。
            </p>
            <SignedOut>
                <div class="flex gap-3">
                    <SignInButton> Sign In </SignInButton>
                    or
                    <SignUpButton> Sign Up </SignUpButton>
                    start
                </div>
            </SignedOut>
        </div>

        <!-- ログイン済みの表示 -->
        <div v-else>
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                <h1 class="page-title">
                    RSS Feeds
                </h1>
                <div class="flex gap-2 sm:gap-3">
                    <button @click="refreshAllFeeds" :disabled="isRefreshingAll || isOfflineMode"
                        class="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="All Feeds Refresh">
                        <svg :class="['w-5 h-5', isRefreshingAll ? 'animate-spin' : '']" fill="none"
                            stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <NuxtLink to="/add"
                        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base text-center whitespace-nowrap">
                        Add New Feed
                    </NuxtLink>
                </div>
            </div>

            <div class="mb-4 text-gray-700 text-sm">
                <p v-if="user" class="content-text">Welcome, {{ user.username }}!</p>
                <p v-if="isOfflineMode" class="compact-label text-amber-700 mt-1">
                    Offline mode: showing cached feed list.
                </p>
            </div>

            <!-- Refresh All Status Message -->
            <div v-if="refreshAllMessage" :class="[
                'mb-4 p-3 rounded-md text-sm',
                refreshAllError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            ]">
                {{ refreshAllMessage }}
            </div>

            <div v-if="isOfflineMode">
                <div class="mb-4 p-3 rounded-md text-sm bg-amber-50 text-amber-800 border border-amber-200">
                    Offline mode is active. Showing only locally saved offline articles.
                    <NuxtLink to="/offline" class="ml-2 text-amber-900 underline">Open offline page</NuxtLink>
                </div>

                <div v-if="offlineArticles.length === 0" class="page-card text-center py-12">
                    <p class="content-text mb-3">No offline articles saved yet.</p>
                    <p class="page-subtitle">
                        Open an article and use "Save locally" to make it available offline.
                    </p>
                </div>

                <div v-else class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <article v-for="article in offlineArticles" :key="`${article.feedId}-${article.contentId}`"
                        class="page-card p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div class="text-xs text-gray-500 mb-2">
                            Saved: {{ formatSavedAt(article.savedAt) }}
                        </div>
                        <NuxtLink :to="`/f/${article.feedId}/${article.contentId}`"
                            class="font-semibold text-base sm:text-lg mb-2 hover:underline block line-clamp-2">
                            {{ article.title || article.contentUrl }}
                        </NuxtLink>
                        <div class="text-xs sm:text-sm text-gray-500 truncate"
                            :title="article.feedTitle || article.feedUrl">
                            {{ article.feedTitle || article.feedUrl }}
                        </div>
                        <p v-if="article.contentSnippet" class="content-text mt-2 line-clamp-3">
                            {{ article.contentSnippet }}
                        </p>
                        <div class="mt-3">
                            <a :href="article.contentUrl" target="_blank" rel="noopener noreferrer"
                                class="text-sm text-blue-600 hover:underline">
                                Open source
                            </a>
                        </div>
                    </article>
                </div>
            </div>

            <div v-else-if="pending" class="text-center py-8 page-subtitle">
                Loading feeds...
            </div>

            <div v-else-if="feeds?.length === 0" class="page-card text-center py-12">
                <p class="page-subtitle mb-4">No feeds added yet.</p>
                <NuxtLink to="/add" class="text-blue-600 hover:underline">Add your first feed</NuxtLink>
            </div>

            <!-- Feed List Component -->
            <div v-else class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="feed in feeds" :key="feed.id"
                    class="page-card p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <NuxtLink :to="`/f/${feed.id}`"
                        class="font-semibold text-base sm:text-lg mb-2 truncate hover:underline block"
                        :title="feed.title || feed.feedUrl">
                        {{ feed.title || feed.feedUrl }}
                    </NuxtLink>
                    <div class="text-xs sm:text-sm text-gray-500 truncate" :title="feed.feedUrl">
                        {{ feed.feedUrl }}
                    </div>
                    <div class="compact-label text-gray-500 mb-3 sm:mb-4">
                        Added:
                        {{ new Date(feed.createdAt).toLocaleDateString() }}
                    </div>
                    <div class="flex items-center gap-3">
                        <a :href="feed.feedUrl" target="_blank" rel="noopener noreferrer"
                            class="text-sm text-blue-600 hover:underline">
                            Visit Source
                        </a>
                        <button @click="deleteFeed(feed.id, feed.title || feed.feedUrl)"
                            :disabled="deletingFeedId === feed.id || isOfflineMode"
                            class="text-sm text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ deletingFeedId === feed.id ? 'Deleting...' : 'Delete' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalSavedArticles, type LocalSavedArticle } from '../../composables/useLocalSavedArticles';
import { useOfflineMode } from '../../composables/useOfflineMode';

type FeedSummary = {
    id: number;
    title: string | null;
    feedUrl: string;
    createdAt: string;
};

const feedCacheKey = 'feeds:list';
const { isOfflineMode, readCache, writeCache, getCacheSavedAt } = useOfflineMode();
const { readAllLocalSavedArticles } = useLocalSavedArticles();
const { data: feeds, pending, error, refresh } = await useFetch<FeedSummary[]>("/api/feeds", {
    immediate: false,
    default: () => readCache<FeedSummary[]>(feedCacheKey, []),
});
const offlineArticles = ref<LocalSavedArticle[]>([]);
const { isLoaded, isSignedIn } = useAuth();
const { user } = useUser();

watch(feeds, (items) => {
    if (items) {
        writeCache(feedCacheKey, items);
    }
}, { deep: true });

onMounted(async () => {
    offlineArticles.value = readAllLocalSavedArticles();

    if (isOfflineMode.value) {
        feeds.value = readCache<FeedSummary[]>(feedCacheKey, []);
        offlineArticles.value = readAllLocalSavedArticles();
        return;
    }

    await refresh();
});

watch(isOfflineMode, async (offline) => {
    if (offline) {
        feeds.value = readCache<FeedSummary[]>(feedCacheKey, []);
        offlineArticles.value = readAllLocalSavedArticles();
        return;
    }

    await refresh();
});

watch(error, () => {
    if (!isOfflineMode.value) {
        return;
    }

    feeds.value = readCache<FeedSummary[]>(feedCacheKey, []);
});

function formatSavedAt(savedAt: string) {
    const date = new Date(savedAt);
    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return date.toLocaleString();
}

// OGP config
useHead({
    title: "RSS Feeds - Feed Slash",
});

// 全フィード更新機能
const isRefreshingAll = ref(false);
const refreshAllMessage = ref<string | null>(null);
const refreshAllError = ref(false);
const deletingFeedId = ref<number | null>(null);

async function refreshAllFeeds() {
    if (isOfflineMode.value) {
        refreshAllError.value = true;
        const savedAt = getCacheSavedAt(feedCacheKey);
        refreshAllMessage.value = savedAt
            ? `Offline mode is active. Cached data saved at ${new Date(savedAt).toLocaleString()}.`
            : 'Offline mode is active. Connect to the network to refresh all feeds.';
        return;
    }

    isRefreshingAll.value = true;
    refreshAllMessage.value = null;
    refreshAllError.value = false;

    try {
        const result = await $fetch('/api/feeds/refresh-all', {
            method: 'POST',
        });
        await refresh();
        refreshAllMessage.value = (result as any).message + ` (${(result as any).totalItems} items fetched)`;
    } catch (err: any) {
        refreshAllError.value = true;
        refreshAllMessage.value = err?.data?.statusMessage || err?.message || 'Failed to refresh feeds';
    } finally {
        isRefreshingAll.value = false;
    }
}

async function deleteFeed(feedId: number, feedLabel: string) {
    if (isOfflineMode.value) {
        window.alert('Offline mode is active. Disable offline mode to delete feeds.');
        return;
    }

    if (deletingFeedId.value !== null) {
        return;
    }

    const confirmed = window.confirm(`Delete feed "${feedLabel}"? This action cannot be undone.`);
    if (!confirmed) {
        return;
    }

    deletingFeedId.value = feedId;

    try {
        await $fetch(`/api/feeds/${feedId}`, {
            method: 'DELETE',
        });
        await refresh();
    } catch (err: any) {
        const message = err?.data?.statusMessage || err?.message || 'Failed to delete feed';
        window.alert(message);
    } finally {
        deletingFeedId.value = null;
    }
}


</script>
