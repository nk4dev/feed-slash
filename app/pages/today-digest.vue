<template>
    <div class="max-w-8xl mx-auto px-4 sm:px-5 lg:px-6 py-6 sm:py-8">
        <!-- ヘッダー -->
        <div class="mb-6 sm:mb-8">
            <h1 class="page-title text-gray-900">{{ formattedDate }}'s Digest</h1>
            <p class="page-subtitle mt-1">{{ digest?.count || 0 }} articles today</p>
        </div>

        <!-- ローディング状態 -->
        <div v-if="status === 'pending'" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <!-- エラー状態 -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6">
            <p class="text-red-600 font-medium">{{ error.statusMessage || 'Failed to load digest' }}</p>
            <p v-if="error.statusCode === 401" class="text-sm text-red-500 mt-2">
                Please <a href="/sign-in" class="underline font-medium">sign in</a> to view your digest.
            </p>
        </div>

        <!-- コンテンツ一覧 -->
        <main v-else>
            <div v-if="digest?.items?.length === 0" class="text-center py-16 page-subtitle">
                <div class="text-5xl mb-4">📭</div>
                <p class="text-xl font-medium">No new articles today</p>
                <p class="text-sm mt-2">Check back later or add more feeds!</p>
            </div>

            <!-- レスポンシブグリッド -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <article v-for="item in articles" :key="item.contentId"
                    class="page-card overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
                    <!-- SNS風カードヘッダー -->
                    <div class="p-4 border-b border-gray-100">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {{ (item.feedTitle || 'F').charAt(0).toUpperCase() }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-gray-900 truncate text-sm">{{ item.feedTitle ||
                                    'UnknownFeed' }}</p>
                                <p class="compact-label text-gray-500 flex items-center gap-1">
                                    <span v-if="item.author" class="truncate">{{ item.author }}</span>
                                    <span v-if="item.author && item.publishedAt">•</span>
                                    <span v-if="item.publishedAt">{{ formatTime(item.publishedAt) }}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- コンテンツ本体 -->
                    <div class="p-4 flex-1">
                        <h2 class="font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">
                            <NuxtLink :to="`/f/${item.feedId}/${item.contentId}`"
                                class="hover:text-blue-600 transition-colors">
                                {{ item.title || 'Untitled' }}
                            </NuxtLink>
                        </h2>
                        <p v-if="item.contentSnippet" class="content-text line-clamp-3">
                            {{ item.contentSnippet }}
                        </p>
                    </div>

                    <!-- アクションバー -->
                    <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <!-- ブックマークボタン -->
                            <button @click="toggleBookmark(item)"
                                class="flex items-center gap-1.5 text-sm transition-colors"
                                :class="item.isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'"
                                :disabled="item.isLoading">
                                <svg v-if="item.isBookmarked" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <span class="hidden sm:inline">{{ item.isBookmarked ? 'Saved' : 'Save' }}</span>
                            </button>

                            <!-- 外部リンク -->
                            <a :href="item.contentUrl" target="_blank" rel="noopener noreferrer"
                                class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span class="hidden sm:inline">Open</span>
                            </a>
                        </div>

                        <!-- 読むボタン -->
                        <NuxtLink :to="`/f/${item.feedId}/${item.contentId}`"
                            class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                            Read →
                        </NuxtLink>
                    </div>
                </article>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
interface DigestItem {
    contentId: number;
    title: string | null;
    contentUrl: string;
    contentSnippet: string | null;
    author: string | null;
    publishedAt: string | null;
    feedId: number;
    feedTitle: string | null;
    feedUrl: string;
    isBookmarked: boolean;
    isLoading?: boolean;
}

const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
});

const { data: digest, status, error } = await useFetch('/api/feeds/daily', {
    key: 'daily-digest',
});

// リアクティブな記事リスト
const articles = ref<DigestItem[]>([]);

watch(() => digest.value?.items, (items) => {
    if (items) {
        articles.value = items.map(item => ({ ...item, isLoading: false }));
    }
}, { immediate: true });

// 時刻フォーマット
function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ブックマークのトグル
async function toggleBookmark(item: DigestItem) {
    item.isLoading = true;
    try {
        if (item.isBookmarked) {
            await $fetch(`/api/bookmarks/${item.contentId}`, { method: 'DELETE' });
            item.isBookmarked = false;
        } else {
            await $fetch(`/api/bookmarks/${item.contentId}`, { method: 'POST' });
            item.isBookmarked = true;
        }
    } catch (err) {
        console.error('Failed to toggle bookmark:', err);
    } finally {
        item.isLoading = false;
    }
}

useHead({
    title: "Today's Digest - Feed Slash",
});
</script>