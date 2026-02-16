<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
    <div class="mb-4 sm:mb-6">
      <NuxtLink :to="`/f/${feedId}`" class="text-xs sm:text-sm text-blue-600 hover:underline">
        ← Back to feed
      </NuxtLink>
    </div>

    <div v-if="pending" class="text-center py-8 text-gray-500">
      Loading content...
    </div>

    <div v-else-if="error" class="p-4 bg-red-50 text-red-700 rounded-md">
      Failed to load content: {{ error.message }}
    </div>

    <div v-else-if="!data?.item" class="text-center py-12 bg-gray-50 rounded-lg">
      Content not found.
    </div>

    <div v-else>
      <div class="mb-4 sm:mb-6">

        <div>
          <span class="text-sm text-gray-500">Feed:</span>
          <NuxtLink :to="`/f/${feedId}`" class="text-sm text-blue-600 hover:underline">
            {{ data.feed.title || data.feed.feedUrl }}
          </NuxtLink>
        </div>
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">
          {{ data.item.title || data.item.contentUrl }}
        </h1>
        website: <NuxtLink :to="`https://${remoteHostDomain}`">{{ remoteHostDomain }}</NuxtLink>
        <div class="text-xs sm:text-sm text-gray-600">
          <span v-if="data.item.author">{{ data.item.author }}</span>
          <span v-if="data.item.author && data.item.publishedAt"> · </span>
          <span v-if="data.item.publishedAt">{{ new Date(data.item.publishedAt).toLocaleString() }}</span>
        </div>
        <div class="mt-2 sm:mt-3 flex gap-2 sm:gap-4 items-center flex-wrap">
          <a :href="openOriginalRedirectUrl" target="_blank" rel="noopener noreferrer"
            class="text-sm text-blue-600 hover:underline">
            Open original
          </a>
          <button v-if="!sanitizedContent" @click="fetchHtmlContent" :disabled="isFetching"
            class="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {{ isFetching ? 'Fetching...' : 'Fetch HTML Content' }}
          </button>
          <button v-else @click="fetchHtmlContent" :disabled="isFetching"
            class="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {{ isFetching ? 'Loading...' : 'All Content Load' }}
          </button>
          <!-- Bookmark Button -->
          <button @click="toggleBookmark" :disabled="isBookmarking" :class="[
            'flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded transition-colors whitespace-nowrap',
            isBookmarked
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            isBookmarking ? 'opacity-50 cursor-not-allowed' : ''
          ]">
            <svg class="w-4 h-4" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>{{ isBookmarking ? 'Saving...' : (isBookmarked ? '' : 'Bookmark') }}</span>
          </button>
          <!-- Bulk Update User Data Button -->
          <button @click="bulkUpdateUserData" :disabled="isBulkUpdating"
            class="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {{ isBulkUpdating ? 'Updating...' : 'Update' }}
          </button>
          <span v-if="bulkUpdateMessage" class="text-xs text-green-700 ml-2">{{ bulkUpdateMessage }}</span>
        </div>
        <div v-if="fetchError" class="mt-2 text-sm text-red-600">
          {{ fetchError }}
        </div>
      </div>

      <!-- Content display with tabs -->
      <div v-if="sanitizedContent" class="mb-3 sm:mb-4">
        <div class="flex border-b overflow-x-auto">
          <button @click="viewMode = 'rendered'" :class="[
            'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap',
            viewMode === 'rendered' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
          ]">
            Rendered HTML
          </button>
          <button @click="viewMode = 'source'" :class="[
            'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap',
            viewMode === 'source' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
          ]">
            Source
          </button>
        </div>
      </div>

      <div v-if="sanitizedContent && viewMode === 'rendered'" class="prose prose-sm sm:prose prose-gray max-w-2xl"
        v-html="sanitizedContent"></div>
      <pre v-else-if="sanitizedContent && viewMode === 'source'"
        class="bg-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm whitespace-pre-wrap break-words">{{ data.item.content }}</pre>
      <div v-else class="text-sm sm:text-base text-gray-700  mx-2 my-4">
        {{ data.item.contentSnippet || 'No content available. Click "Fetch HTML Content" ' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify';

const route = useRoute();
const feedId = route.params.id as string;
const contentId = route.params.contentId as string;

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

const { data, pending, error, refresh } = await useFetch<{ feed: FeedMeta; item: FeedItem }>(
  `/api/feeds/${feedId}/${contentId}`
);

const viewMode = ref<'rendered' | 'source'>('rendered');
const isFetching = ref(false);
const fetchError = ref<string | null>(null);

// Bookmark state
const isBookmarked = ref(false);
const isBookmarking = ref(false);

// Bulk update state
const isBulkUpdating = ref(false);
const bulkUpdateMessage = ref('');

// get remote host domain for display and replace auther link
const remoteHostDomain = computed(() => {
  try {
    const url = new URL(data.value?.feed.remoteUrl || data.value?.feed.feedUrl || '');
    return url.hostname;
  } catch {
    return '';
  }
});

const contentBaseUrl = computed(() => {
  const fallbackBase = data.value?.feed.remoteUrl || data.value?.feed.feedUrl || '';
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
  if (!contentUrl) return '#';
  return toRedirectUrl(contentUrl);
});

function normalizeUrl(rawUrl: string, baseUrl: URL): string {
  const url = rawUrl.trim();
  if (!url) return rawUrl;
  if (url.startsWith('#')) return url;
  if (/^[a-z][a-z\d+\-.]*:/i.test(url)) return url;
  if (url.startsWith('//')) return `${baseUrl.protocol}${url}`;
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
    .split(',')
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) return trimmed;

      const [urlPart, ...descriptorParts] = trimmed.split(/\s+/);
      if (!urlPart) return trimmed;
      const normalizedUrl = normalizeUrl(urlPart, baseUrl);
      const redirectedUrl = toRedirectUrl(normalizedUrl);
      return descriptorParts.length > 0
        ? `${redirectedUrl} ${descriptorParts.join(' ')}`
        : redirectedUrl;
    })
    .join(', ');
}

function normalizeRelativeLinks(content: string): string {
  const baseUrl = contentBaseUrl.value;
  if (!baseUrl) return content;

  const normalizedAttributes = content.replace(/\b(href|src)=["']([^"']+)["']/gi, (_match, attribute: string, value: string) => {
    const normalized = normalizeUrl(value, baseUrl);
    const redirected = toRedirectUrl(normalized);
    return `${attribute}="${redirected}"`;
  });

  return normalizedAttributes.replace(/\bsrcset=["']([^"']+)["']/gi, (_match, value: string) => {
    return `srcset="${normalizeSrcSet(value, baseUrl)}"`;
  });
}

async function bulkUpdateUserData() {
  isBulkUpdating.value = true;
  bulkUpdateMessage.value = '';
  try {
    // Please update the API endpoint as needed
    await $fetch('/api/user/bulk-update', { method: 'POST' });
    bulkUpdateMessage.value = 'User data updated successfully';
  } catch (err: any) {
    bulkUpdateMessage.value = err?.data?.statusMessage || err?.message || '更新に失敗しました';
  } finally {
    isBulkUpdating.value = false;
  }
}

// Check bookmark status on load
onMounted(async () => {
  try {
    const bookmarks = await $fetch<{ contentId: number }[]>('/api/bookmarks');
    isBookmarked.value = bookmarks.some(b => b.contentId === Number(contentId));
  } catch {
    // User not logged in or error - ignore
  }
});

// Toggle bookmark
async function toggleBookmark() {
  isBookmarking.value = true;
  try {
    if (isBookmarked.value) {
      await $fetch(`/api/bookmarks/${contentId}`, { method: 'DELETE' });
      isBookmarked.value = false;
    } else {
      await $fetch(`/api/bookmarks/${contentId}`, { method: 'POST' });
      isBookmarked.value = true;
    }
  } catch (err: any) {
    console.error('Bookmark error:', err);
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
  </style>`
  const normalizedContent = normalizeRelativeLinks(data.value?.item?.content ?? '');
  const raw = normalizedContent + contentstylecss;
  if (!raw) return '';
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['article', 'section', 'header', 'footer', 'main', 'aside', 'figure', 'figcaption'],
    ADD_ATTR: ['class', 'id', 'src', 'srcset', 'alt', 'href', 'target', 'rel'],
  });
});

async function fetchHtmlContent() {
  isFetching.value = true;
  fetchError.value = null;

  try {
    await $fetch(`/api/feeds/${feedId}/${contentId}/fetch-html`, {
      method: 'POST',
    });
    // Refresh the data to get updated content
    await refresh();
  } catch (err: any) {
    fetchError.value = err?.data?.statusMessage || err?.message || 'Failed to fetch HTML content';
  } finally {
    isFetching.value = false;
  }
}

useHead({
  title: data.value?.item?.title
    ? `${data.value.item.title} - Feed Slash`
    : 'RSS Content - Feed Slash'
});
</script>
