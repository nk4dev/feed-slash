<template>
    <div class="max-w-5xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div class="mb-4 sm:mb-6">
            <NuxtLink :to="`/f/${feedId}`" class="text-xs sm:text-sm text-blue-600 hover:underline">
                ← Back to feed
            </NuxtLink>
        </div>

        <div v-if="pending" class="text-center py-8 page-subtitle">
            Loading content...
        </div>

        <div v-else-if="error" class="p-4 bg-red-50 text-red-700 rounded-md">
            Failed to load content: {{ error.message }}
        </div>

        <div v-else-if="!data?.item" class="page-card text-center py-12">
            Content not found.
        </div>

        <div v-else>
            <div class="mb-4 sm:mb-6">
                <div>
                    <span class="compact-label text-gray-500">Feed:</span>
                    <NuxtLink :to="`/f/${feedId}`" class="text-sm text-blue-600 hover:underline">
                        {{ data.feed.title || data.feed.feedUrl }}
                    </NuxtLink>
                </div>
                <h1 class="page-title mb-2 break-words">
                    {{ data.item.title || data.item.contentUrl }}
                </h1>
                website:
                <NuxtLink :to="`https://${remoteHostDomain}`">{{
                    remoteHostDomain
                }}</NuxtLink>
                <div class="compact-label text-gray-600">
                    <span v-if="data.item.author">{{ data.item.author }}</span>
                    <span v-if="data.item.author && data.item.publishedAt">
                        ·
                    </span>
                    <span v-if="data.item.publishedAt">{{ formatDisplayDate(data.item.publishedAt) }}</span>
                </div>
                <div class="mt-2 sm:mt-3 flex gap-2 sm:gap-4 items-center flex-wrap">
                    <a :href="openOriginalRedirectUrl" target="_blank" rel="noopener noreferrer"
                        class="text-sm text-blue-600 hover:underline">
                        Open original
                    </a>
                    <button v-if="!sanitizedContent" @click="fetchHtmlContent" :disabled="isFetching || isOfflineMode"
                        class="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        {{ isFetching ? "Fetching..." : "Fetch HTML Content" }}
                    </button>
                    <!-- Bookmark Button -->
                    <button @click="toggleBookmark" :disabled="isBookmarking || isOfflineMode" :class="[
                        'flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded transition-colors whitespace-nowrap',
                        isBookmarked
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        isBookmarking
                            ? 'opacity-50 cursor-not-allowed'
                            : '',
                    ]">
                        <svg class="w-4 h-4" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>{{
                            isBookmarking
                                ? "Saving..."
                                : isBookmarked
                                    ? ""
                                    : "Bookmark"
                        }}</span>
                    </button>
                    <!-- Local Save Button -->
                    <button @click="toggleLocalSave" :disabled="isLocalSaving" :class="[
                        'flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded transition-colors whitespace-nowrap',
                        isLocallySaved
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        isLocalSaving
                            ? 'opacity-50 cursor-not-allowed'
                            : '',
                    ]">
                        <svg class="w-4 h-4" :fill="isLocallySaved ? 'currentColor' : 'none'" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M4 5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14 3v6h6" />
                        </svg>
                        <span>{{
                            isLocalSaving
                                ? "Saving..."
                                : isLocallySaved
                                    ? "Saved locally"
                                    : "Save locally"
                        }}</span>
                    </button>
                    <!-- Bulk Update User Data Button -->
                    <button @click="bulkUpdateUserData" :disabled="isBulkUpdating || isOfflineMode"
                        class="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        {{ isBulkUpdating ? "Updating..." : "Update" }}
                    </button>
                    <span v-if="bulkUpdateMessage" class="text-xs text-green-700 ml-2">{{ bulkUpdateMessage }}</span>

                    <button v-else @click="fetchHtmlContent" :disabled="isFetching || isOfflineMode"
                        class="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        {{ isFetching ? "Loading..." : "All Content Load" }}
                    </button>
                </div>
                <div v-if="isOfflineMode" class="mt-2 compact-label text-amber-700">
                    Offline mode: showing cached article data.
                </div>
                <div v-if="fetchError" class="mt-2 compact-label text-red-600">
                    {{ fetchError }}
                </div>
            </div>

            <!-- Content display with tabs -->
            <div v-if="sanitizedContent || showOfflineTab" class="mb-3 sm:mb-4">
                <div class="flex border-b overflow-x-auto">
                    <button @click="viewMode = 'rendered'" :class="[
                        'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap',
                        viewMode === 'rendered'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-800',
                    ]">
                        Rendered HTML
                    </button>
                    <button @click="viewMode = 'source'" :class="[
                        'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap',
                        viewMode === 'source'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-800',
                    ]">
                        Source
                    </button>
                    <button @click="viewMode = 'offline'" :disabled="!showOfflineTab" :class="[
                        'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors',
                        viewMode === 'offline'
                            ? 'border-b-2 border-emerald-600 text-emerald-700'
                            : showOfflineTab
                                ? 'text-gray-600 hover:text-gray-800'
                                : 'text-gray-300 cursor-not-allowed',
                    ]">
                        Offline
                    </button>
                </div>
            </div>

            <div v-if="viewMode === 'offline' && showOfflineTab" class="space-y-4">
                <div class="page-card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p class="font-medium">Saved locally for offline reading</p>
                    <p class="mt-1 text-emerald-800">
                        {{ localSavedArticle?.savedAt ? `Saved at ${formatDisplayDate(localSavedArticle.savedAt)}` :
                            'This article is stored in your browser.'
                        }}
                    </p>
                </div>
                <div v-if="offlineRenderedContent" class="prose prose-sm sm:prose prose-gray max-w-2xl"
                    v-html="offlineRenderedContent"></div>
                <pre v-else
                    class="bg-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm whitespace-pre-wrap break-words">{{ offlineSourceContent }}</pre>
            </div>
            <div v-else-if="sanitizedContent && viewMode === 'rendered'"
                class="prose prose-sm sm:prose prose-gray max-w-2xl" v-html="sanitizedContent"></div>
            <pre v-else-if="sanitizedContent && viewMode === 'source'"
                class="bg-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm whitespace-pre-wrap break-words">{{ data.item.content }}</pre>
            <div v-else class="content-text text-gray-700 mx-2 my-4">
                {{
                    data.item.contentSnippet ||
                    'No content available. Click "Fetch HTML Content" '
                }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import DOMPurify from "isomorphic-dompurify";
import { useOfflineMode } from '../../../../composables/useOfflineMode';

const route = useRoute();
const feedId = route.params.id as string;
const contentId = route.params.contentId as string;
const contentCacheKey = `feeds:content:${feedId}:${contentId}`;
const { isOfflineMode, readCache, writeCache, getCacheSavedAt } = useOfflineMode();

type FeedMeta = {
    id: number;
    feedUrl: string;
    title: string | null;
    remoteUrl: string | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
};

type FeedItem = {
    contentId: number;
    parentId: number;
    contentUrl: string;
    title: string | null;
    content: string | null;
    contentSnippet: string | null;
    author: string | null;
    publishedAt: string | null;
};

type ContentData = {
    feed: FeedMeta;
    item: FeedItem;
};

const { data, pending, error, refresh } = await useFetch<ContentData>(`/api/feeds/${feedId}/${contentId}`, {
    key: `feed-content:${feedId}:${contentId}`,
    default: () => undefined,
});

function formatDisplayDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ja-JP", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Tokyo",
    }).format(date);
}

watch(data, (nextData) => {
    if (nextData) {
        writeCache(contentCacheKey, nextData);
    }
}, { deep: true });

watch(error, () => {
    if (isOfflineMode.value) {
        data.value = readCache<ContentData | undefined>(contentCacheKey, undefined);
    }
});

const viewMode = ref<"rendered" | "source" | "offline">("rendered");
const isFetching = ref(false);
const fetchError = ref<string | null>(null);

// Bookmark state
const isBookmarked = ref(false);
const isBookmarking = ref(false);

const localSaveStorageKey = `feed-slash:local-article:${feedId}:${contentId}`;
const isLocallySaved = ref(false);
const localSavedArticle = ref<LocalSavedArticle | null>(null);
const isLocalSaving = ref(false);

// Bulk update state
const isBulkUpdating = ref(false);
const bulkUpdateMessage = ref("");

// get remote host domain for display and replace auther link
const remoteHostDomain = computed(() => {
    try {
        const url = new URL(
            data.value?.feed.remoteUrl || data.value?.feed.feedUrl || "",
        );
        return url.hostname;
    } catch {
        return "";
    }
});

const contentBaseUrl = computed(() => {
    const fallbackBase =
        data.value?.feed.remoteUrl || data.value?.feed.feedUrl || "";
    try {
        return new URL(data.value?.item?.contentUrl || fallbackBase);
    } catch {
        try {
            return new URL(fallbackBase);
        } catch {
            return null;
        }
    }
});

function toRedirectUrl(absoluteUrl: string): string {
    if (!/^https?:\/\//i.test(absoluteUrl)) {
        return absoluteUrl;
    }

    return `/redirect/url?=${encodeURIComponent(absoluteUrl)}`;
}

const openOriginalRedirectUrl = computed(() => {
    const contentUrl = data.value?.item?.contentUrl;
    if (!contentUrl) return "#";
    return toRedirectUrl(contentUrl);
});

function normalizeUrl(rawUrl: string, baseUrl: URL): string {
    const url = rawUrl.trim();
    if (!url) return rawUrl;
    if (url.startsWith("#")) return url;
    if (/^[a-z][a-z\d+\-.]*:/i.test(url)) return url;
    if (url.startsWith("//")) return `${baseUrl.protocol}${url}`;
    if (/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#:]|$)/i.test(url)) {
        return `https://${url}`;
    }

    try {
        return new URL(url, baseUrl).toString();
    } catch {
        return rawUrl;
    }
}

function normalizeSrcSet(rawSrcSet: string, baseUrl: URL): string {
    return rawSrcSet
        .split(",")
        .map((entry) => {
            const trimmed = entry.trim();
            if (!trimmed) return trimmed;

            const [urlPart, ...descriptorParts] = trimmed.split(/\s+/);
            if (!urlPart) return trimmed;
            const normalizedUrl = normalizeUrl(urlPart, baseUrl);
            const redirectedUrl = toRedirectUrl(normalizedUrl);
            return descriptorParts.length > 0
                ? `${redirectedUrl} ${descriptorParts.join(" ")}`
                : redirectedUrl;
        })
        .join(", ");
}

function normalizeRelativeLinks(content: string): string {
    const baseUrl = contentBaseUrl.value;
    if (!baseUrl) return content;

    const normalizedAttributes = content.replace(
        /\b(href|src)=["']([^"']+)["']/gi,
        (_match, attribute: string, value: string) => {
            const normalized = normalizeUrl(value, baseUrl);
            const redirected = toRedirectUrl(normalized);
            return `${attribute}="${redirected}"`;
        },
    );

    return normalizedAttributes.replace(
        /\bsrcset=["']([^"']+)["']/gi,
        (_match, value: string) => {
            return `srcset="${normalizeSrcSet(value, baseUrl)}"`;
        },
    );
}

async function bulkUpdateUserData() {
    if (isOfflineMode.value) {
        const savedAt = getCacheSavedAt(contentCacheKey);
        bulkUpdateMessage.value = savedAt
            ? `Offline mode is active. Cached data saved at ${new Date(savedAt).toLocaleString()}.`
            : "Offline mode is active.";
        return;
    }

    isBulkUpdating.value = true;
    bulkUpdateMessage.value = "";
    try {
        // Please update the API endpoint as needed
        await $fetch("/api/user/bulk-update", { method: "POST" });
        bulkUpdateMessage.value = "User data updated successfully";
    } catch (err: any) {
        bulkUpdateMessage.value =
            err?.data?.statusMessage || err?.message || "更新に失敗しました";
    } finally {
        isBulkUpdating.value = false;
    }
}

type LocalSavedArticle = {
    feedId: string;
    contentId: string;
    savedAt: string;
    feedTitle: string | null;
    feedUrl: string;
    title: string | null;
    contentUrl: string;
    contentSnippet: string | null;
    author: string | null;
    publishedAt: string | null;
    content: string | null;
};

function readLocalSavedArticle(): LocalSavedArticle | null {
    if (!import.meta.client) {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(localSaveStorageKey);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as LocalSavedArticle;
    } catch {
        return null;
    }
}

function buildLocalSavedArticle(): LocalSavedArticle | null {
    if (!data.value?.feed || !data.value?.item) {
        return null;
    }

    return {
        feedId,
        contentId,
        savedAt: new Date().toISOString(),
        feedTitle: data.value.feed.title,
        feedUrl: data.value.feed.feedUrl,
        title: data.value.item.title,
        contentUrl: data.value.item.contentUrl,
        contentSnippet: data.value.item.contentSnippet,
        author: data.value.item.author,
        publishedAt: data.value.item.publishedAt,
        content: data.value.item.content,
    };
}

function hydrateLocalSaveState() {
    localSavedArticle.value = readLocalSavedArticle();
    isLocallySaved.value = Boolean(localSavedArticle.value);
}

async function toggleLocalSave() {
    if (!import.meta.client) {
        return;
    }

    isLocalSaving.value = true;
    try {
        if (isLocallySaved.value) {
            window.localStorage.removeItem(localSaveStorageKey);
            isLocallySaved.value = false;
            localSavedArticle.value = null;
            return;
        }

        const article = buildLocalSavedArticle();
        if (!article) {
            return;
        }

        window.localStorage.setItem(localSaveStorageKey, JSON.stringify(article));
        localSavedArticle.value = article;
        isLocallySaved.value = true;
    } finally {
        isLocalSaving.value = false;
    }
}

const showOfflineTab = computed(() => Boolean(localSavedArticle.value));

const offlineRenderedContent = computed(() => {
    const content = localSavedArticle.value?.content || localSavedArticle.value?.contentSnippet || "";
    if (!content) {
        return "";
    }

    return DOMPurify.sanitize(normalizeRelativeLinks(content), {
        ADD_TAGS: [
            "article",
            "section",
            "header",
            "footer",
            "main",
            "aside",
            "figure",
            "figcaption",
        ],
        ADD_ATTR: [
            "class",
            "id",
            "src",
            "srcset",
            "alt",
            "href",
            "target",
            "rel",
        ],
    });
});

const offlineSourceContent = computed(() => {
    const article = localSavedArticle.value;
    if (!article) {
        return "No locally saved content available.";
    }

    return article.content || article.contentSnippet || "No locally saved content available.";
});

// Check bookmark status on load
onMounted(async () => {
    hydrateLocalSaveState();

    if (isOfflineMode.value) {
        data.value = readCache<ContentData | undefined>(contentCacheKey, undefined);
        return;
    }

    try {
        const bookmarks =
            await $fetch<{ contentId: number }[]>("/api/bookmarks");
        isBookmarked.value = bookmarks.some(
            (b) => b.contentId === Number(contentId),
        );
    } catch {
        // User not logged in or error - ignore
    }
});

// Toggle bookmark
async function toggleBookmark() {
    if (isOfflineMode.value) {
        fetchError.value = "Offline mode is active. Disable it to update bookmarks.";
        return;
    }

    isBookmarking.value = true;
    try {
        if (isBookmarked.value) {
            await $fetch(`/api/bookmarks/${contentId}`, { method: "DELETE" });
            isBookmarked.value = false;
        } else {
            await $fetch(`/api/bookmarks/${contentId}`, { method: "POST" });
            isBookmarked.value = true;
        }
    } catch (err: any) {
        console.error("Bookmark error:", err);
        // Could show a toast here
    } finally {
        isBookmarking.value = false;
    }
}

const sanitizedContent = computed(() => {
    const contentstylecss = `<style>
  img {
    max-height: 30vh;
  }
  svg {
    max-height: 13vh;
  }
  pre {
    background-color: #f6f8fa;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    overflow-x: scroll;
    max-width: 10vhw;
  }
  </style>`;
    const normalizedContent = normalizeRelativeLinks(
        data.value?.item?.content ?? "",
    );
    const raw = normalizedContent + contentstylecss;
    if (!raw) return "";
    return DOMPurify.sanitize(raw, {
        ADD_TAGS: [
            "article",
            "section",
            "header",
            "footer",
            "main",
            "aside",
            "figure",
            "figcaption",
        ],
        ADD_ATTR: [
            "class",
            "id",
            "src",
            "srcset",
            "alt",
            "href",
            "target",
            "rel",
        ],
    });
});

async function fetchHtmlContent() {
    if (isOfflineMode.value) {
        const savedAt = getCacheSavedAt(contentCacheKey);
        fetchError.value = savedAt
            ? `Offline mode is active. Cached data saved at ${new Date(savedAt).toLocaleString()}.`
            : "Offline mode is active. Connect to fetch full HTML content.";
        return;
    }

    isFetching.value = true;
    fetchError.value = null;

    try {
        await $fetch(`/api/feeds/${feedId}/${contentId}/fetch-html`, {
            method: "POST",
        });
        // Refresh the data to get updated content
        await refresh();
    } catch (err: any) {
        fetchError.value =
            err?.data?.statusMessage ||
            err?.message ||
            "Failed to fetch HTML content";
    } finally {
        isFetching.value = false;
    }
}

useHead({
    title: data.value?.item?.title
        ? `${data.value.item.title} - Feed Slash`
        : "RSS Content - Feed Slash",
});
</script>
