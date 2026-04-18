<template>
    <div class="max-w-8xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div class="flex items-start justify-between gap-4 mb-6 sm:mb-8 flex-wrap">
            <div>
                <h1 class="page-title">Offline Library</h1>
                <p class="page-subtitle mt-2">
                    Locally saved articles available without network access.
                </p>
            </div>
            <button @click="refreshOfflineArticles"
                class="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                Refresh list
            </button>
        </div>

        <div v-if="offlineArticles.length === 0" class="page-card text-center py-12">
            <p class="content-text mb-3">No offline articles saved yet.</p>
            <NuxtLink to="/" class="text-blue-600 hover:underline">Back to home</NuxtLink>
        </div>

        <div v-else class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <article v-for="article in offlineArticles" :key="`${article.feedId}-${article.contentId}`"
                class="page-card p-4 hover:shadow-md transition-shadow">
                <div class="text-xs text-gray-500 mb-2">
                    Saved: {{ formatSavedAt(article.savedAt) }}
                </div>
                <NuxtLink :to="`/f/${article.feedId}/${article.contentId}`"
                    class="font-semibold text-base text-blue-700 hover:underline line-clamp-2">
                    {{ article.title || article.contentUrl }}
                </NuxtLink>
                <div class="text-xs sm:text-sm text-gray-600 mt-2 truncate">
                    {{ article.feedTitle || article.feedUrl }}
                </div>
                <p v-if="article.contentSnippet" class="content-text mt-3 line-clamp-3">
                    {{ article.contentSnippet }}
                </p>
                <div class="flex items-center justify-between mt-4">
                    <a :href="article.contentUrl" target="_blank" rel="noopener noreferrer"
                        class="text-sm text-blue-600 hover:underline">
                        Open source
                    </a>
                    <button @click="removeArticle(article.feedId, article.contentId)"
                        class="text-sm text-red-600 hover:underline">
                        Remove
                    </button>
                </div>
            </article>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalSavedArticles, type LocalSavedArticle } from "../../composables/useLocalSavedArticles";

const offlineArticles = ref<LocalSavedArticle[]>([]);
const { readAllLocalSavedArticles, removeLocalSavedArticle } = useLocalSavedArticles();

function refreshOfflineArticles() {
    offlineArticles.value = readAllLocalSavedArticles();
}

function removeArticle(feedId: string, contentId: string) {
    removeLocalSavedArticle(feedId, contentId);
    refreshOfflineArticles();
}

function formatSavedAt(savedAt: string) {
    const date = new Date(savedAt);
    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }
    return date.toLocaleString();
}

onMounted(() => {
    refreshOfflineArticles();
});

useHead({
    title: "Offline Library - Feed Slash",
});
</script>
