<template>
    <div class="max-w-8xl mx-auto px-4 sm:px-5 lg:px-6 py-6 sm:py-8">
        <!-- ヘッダー -->
        <div class="mb-6 sm:mb-8">
            <h1 class="page-title text-gray-900">Bookmarks</h1>
            <p class="page-subtitle mt-1">{{ bookmarks?.length || 0 }} saved articles</p>
        </div>
        <div class="flex flex-wrap gap-3 mb-6">
            <NuxtLink to="/bookmark/folder"
                class="inline-block px-4 py-2 text-white bg-blue-600 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors">
                📁 Manage Folders
            </NuxtLink>
        </div>

        <!-- フォルダフィルター -->
        <div v-if="folderList && folderList.length > 0" class="flex flex-wrap gap-2 mb-6">
            <button @click="selectedFolderId = undefined"
                class="px-3 py-1.5 text-sm rounded-full border transition-colors"
                :class="selectedFolderId === undefined ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'">
                All
            </button>
            <button @click="selectedFolderId = null" class="px-3 py-1.5 text-sm rounded-full border transition-colors"
                :class="selectedFolderId === null ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'">
                Uncategorized
            </button>
            <button v-for="folder in folderList" :key="folder.id" @click="selectedFolderId = folder.id"
                class="px-3 py-1.5 text-sm rounded-full border transition-colors"
                :class="selectedFolderId === folder.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'">
                📁 {{ folder.name }}
            </button>
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
            <div v-if="filteredBookmarks.length === 0" class="text-center py-16 page-subtitle">
                <div class="text-5xl mb-4">🔖</div>
                <p class="text-xl font-medium">No bookmarks yet</p>
                <p class="text-sm mt-2">Save articles from your feeds to read later!</p>
                <NuxtLink to="/" class="inline-block mt-4 text-blue-600 hover:underline">
                    Browse your feeds →
                </NuxtLink>
            </div>

            <!-- レスポンシブグリッド -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <article v-for="item in filteredBookmarks" :key="item.id"
                    class="page-card overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
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
                                <p class="compact-label text-gray-500 flex items-center gap-1">
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
                        <p v-if="item.contentSnippet" class="content-text line-clamp-3">
                            {{ item.contentSnippet }}
                        </p>
                    </div>

                    <!-- フォルダ移動 -->
                    <div v-if="folderList && folderList.length > 0" class="px-4 py-2 border-t border-gray-100">
                        <select :value="item.folderId ?? ''"
                            @change="moveToFolder(item, ($event.target as HTMLSelectElement).value)"
                            class="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">Uncategorized</option>
                            <option v-for="folder in folderList" :key="folder.id" :value="folder.id">
                                📁 {{ folder.name }}
                            </option>
                        </select>
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
                    <div class="px-4 py-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
                        <span>Saved {{ formatRelativeTime(item.bookmarkedAt) }}</span>
                        <span v-if="item.folderName" class="text-blue-500">📁 {{ item.folderName }}</span>
                    </div>
                </article>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
interface FolderItem {
    id: number;
    name: string;
    bookmarkCount: number;
}

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
    folderId: number | null;
    folderName: string | null;
    isLoading?: boolean;
}

const { data: bookmarks, status, error, refresh } = await useFetch<BookmarkItem[]>('/api/bookmarks', {
    key: 'user-bookmarks',
});

const { data: folderList } = await useFetch<FolderItem[]>('/api/bookmark-folders', {
    key: 'bookmark-folders-filter',
});

// undefined = all, null = uncategorized, number = specific folder
const selectedFolderId = ref<number | null | undefined>(undefined);

// リアクティブな表示用リスト
const displayBookmarks = ref<BookmarkItem[]>([]);

watch(() => bookmarks.value, (items) => {
    if (items) {
        displayBookmarks.value = items.map(item => ({ ...item, isLoading: false }));
    }
}, { immediate: true });

const filteredBookmarks = computed(() => {
    if (selectedFolderId.value === undefined) {
        return displayBookmarks.value;
    }
    if (selectedFolderId.value === null) {
        return displayBookmarks.value.filter(b => !b.folderId);
    }
    return displayBookmarks.value.filter(b => b.folderId === selectedFolderId.value);
});

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
        displayBookmarks.value = displayBookmarks.value.filter(b => b.id !== item.id);
    } catch (err) {
        console.error('Failed to remove bookmark:', err);
        item.isLoading = false;
    }
}

// フォルダ移動
async function moveToFolder(item: BookmarkItem, value: string) {
    const folderId = value === '' ? null : parseInt(value);
    try {
        await $fetch(`/api/bookmarks/${item.contentId}`, {
            method: 'PATCH',
            body: { folderId },
        });
        item.folderId = folderId;
        item.folderName = folderId
            ? folderList.value?.find(f => f.id === folderId)?.name || null
            : null;
    } catch (err) {
        console.error('Failed to move bookmark:', err);
    }
}

useHead({
    title: 'Bookmarks - Feed Slash',
});
</script>