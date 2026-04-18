<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-8">
    <h1 class="page-title mb-4 sm:mb-6">Add new feed</h1>

    <form @submit.prevent="handleSubmit" class="space-y-3 sm:space-y-4">
      <div>
        <label for="feed-url" class="block compact-label text-gray-700 mb-1 sm:mb-2">Feed URL</label>
        <input id="feed-url" type="url" v-model="feedUrl" placeholder="https://example.com/feed.xml" required
          class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 content-text"
          :disabled="pending" />
      </div>

      <div v-if="error" class="page-card p-4 text-red-700">
        {{ error.message }}
      </div>

      <div v-if="success" class="page-card p-4 text-green-700">
        Feed added successfully!
      </div>

      <button type="submit" :disabled="pending"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base">
        <span v-if="pending">Adding...</span>
        <span v-else>Add Feed</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const feedUrl = ref('');
const pending = ref(false);
const error = ref<null | { message: string }>(null);
const success = ref(false);

const handleSubmit = async () => {
  pending.value = true;
  error.value = null;
  success.value = false;

  try {
    await $fetch('/api/feeds', {
      method: 'POST',
      body: {
        feedUrl: feedUrl.value
      }
    });

    success.value = true;
    feedUrl.value = '';
  } catch (e: any) {
    error.value = {
      message: e.response?._data?.statusMessage || 'Failed to add feed'
    };
  } finally {
    pending.value = false;
  }
};

useHead({
  title: 'Add New Feed - Feed Slash',
});
</script>