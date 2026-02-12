<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <!-- ヘッダー -->
        <div class="mb-6 sm:mb-8">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Bookmarks</h1>
            <p class="text-gray-500 mt-1 text-sm sm:text-base">{{ bookmarks?.length || 0 }} saved articles</p>
        </div>
        <div>
            <NuxtLink to="/bookmark/folder"
                class="inline-block mb-6 px-4 py-2  text-white bg-blue-600 text-sm sm:text-base">
                📁 Manage Folders
            </NuxtLink>
        </div>

        <!-- ローディング状態 -->
        <div v-if="status === 'pending'" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <!-- エラー状態 -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6">
            <p class="text-red-600 font-medium">{{ error.statusMessage || 'Failed to load bookmarks' }}</p>
            <p v-if="error.statusCode === 401" class="text-sm text-red-500 mt-2">
                Please <NuxtLink to="/sign-in" class="underline font-medium">sign in</NuxtLink> to view your bookmarks.
            </p>
        </div>

        <!-- ブックマーク一覧 -->
        <main v-else>
            <div v-if="displayBookmarks.length === 0" class="text-center py-16 text-gray-500">
                <div class="text-5xl mb-4">🔖</div>
                <p class="text-xl font-medium">No bookmarks yet</p>
                <p class="text-sm mt-2">Save articles from your feeds to read later!</p>
                <NuxtLink to="/" class="inline-block mt-4 text-blue-600 hover:underline">
                    Browse your feeds →
                </NuxtLink>
            </div>

            <!-- レスポンシブグリッド -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <article v-for="item in displayBookmarks" :key="item.id"
                    class="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
                    <!-- カードヘッダー -->
                    <div class="p-4 border-b border-gray-100">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                                {{ (item.feedTitle || 'F').charAt(0).toUpperCase() }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-gray-900 truncate text-sm">{{ item.feedTitle ||
                                    'UnknownFeed' }}</p>
                                <p class="text-xs text-gray-500 flex items-center gap-1">
                                    <span v-if="item.author" class="truncate">{{ item.author }}</span>
                                    <span v-if="item.author && item.publishedAt">•</span>
                                    <span v-if="item.publishedAt">{{ formatDate(item.publishedAt) }}</span>
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
                        <p v-if="item.contentSnippet" class="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                            {{ item.contentSnippet }}
                        </p>
                    </div>

                    <!-- アクションバー -->
                    <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <!-- ブックマーク解除ボタン -->
                            <button @click="removeBookmark(item)"
                                class="flex items-center gap-1.5 text-sm text-yellow-500 hover:text-red-500 transition-colors"
                                :disabled="item.isLoading">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <span class="hidden sm:inline">{{ item.isLoading ? 'Removing...' : 'Remove' }}</span>
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

                    <!-- ブックマーク日時 -->
                    <div class="px-4 py-2 bg-gray-50 text-xs text-gray-500">
                        Saved {{ formatRelativeTime(item.bookmarkedAt) }}
                    </div>
                </article>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
interface BookmarkItem {
    id: number;
    contentId: number;
    title: string | null;
    contentUrl: string;
    contentSnippet: string | null;
    author: string | null;
    publishedAt: string | null;
    feedId: number;
    feedTitle: string | null;
    bookmarkedAt: string;
    isLoading?: boolean;
}

const { data: bookmarks, status, error, refresh } = await useFetch<BookmarkItem[]>('/api/bookmarks', {
    key: 'user-bookmarks',
});

// リアクティブな表示用リスト
const displayBookmarks = ref<BookmarkItem[]>([]);

watch(() => bookmarks.value, (items) => {
    if (items) {
        displayBookmarks.value = items.map(item => ({ ...item, isLoading: false }));
    }
}, { immediate: true });

// 日付フォーマット
function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

// 相対時間フォーマット
function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
}

// ブックマーク解除
async function removeBookmark(item: BookmarkItem) {
    item.isLoading = true;
    try {
        await $fetch(`/api/bookmarks/${item.contentId}`, { method: 'DELETE' });
        // リストから削除
        displayBookmarks.value = displayBookmarks.value.filter(b => b.id !== item.id);
    } catch (err) {
        console.error('Failed to remove bookmark:', err);
        item.isLoading = false;
    }
}

useHead({
    title: 'Bookmarks - Feed Slash',
});
</script>