<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
    <div v-if="!isLoaded">Loading...</div>

    <!-- 未ログイン時の表示 -->
    <div v-else-if="!isSignedIn" class="flex flex-col items-center justify-center py-16">
      <h1 class="text-3xl sm:text-4xl font-bold mb-4">Feed Slash へようこそ</h1>
      <p class="text-lg text-gray-600 mb-6">高速でRSSフィードを読む、シンプルなリーダー。</p>
      <SignedOut>
        <div class="flex gap-3">
          <SignInButton>
            Sign In
          </SignInButton>
          or
          <SignUpButton>
            Sign Up
          </SignUpButton>
          start
        </div>
      </SignedOut>
    </div>

    <!-- ログイン済みの表示 -->
    <div v-else>
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold">RSS Feeds</h1>
        <NuxtLink to="/add"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base text-center whitespace-nowrap">
          Add New Feed
        </NuxtLink>
      </div>

      <div class="mb-4 text-gray-700 text-sm">Welcome, {{ userId }}！ </div>

      <div v-if="pending" class="text-center py-8 text-gray-500">
        Loading feeds...
      </div>

      <div v-else-if="feeds?.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
        <p class="text-gray-500 mb-4">No feeds added yet.</p>
        <NuxtLink to="/add" class="text-blue-600 hover:underline">Add your first feed</NuxtLink>
      </div>

      <div v-else class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="feed in feeds" :key="feed.id"
          class="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white">
          <NuxtLink :to="`/f/${feed.id}`" class="font-semibold text-base sm:text-lg mb-2 truncate hover:underline block"
            :title="feed.title || feed.feedUrl">
            {{ feed.title || feed.feedUrl }}
          </NuxtLink>
          <div class="text-xs sm:text-sm text-gray-500 truncate" :title="feed.feedUrl">
            {{ feed.feedUrl }}
          </div>
          <div class="text-xs text-gray-500 mb-3 sm:mb-4">
            Added: {{ new Date(feed.createdAt).toLocaleDateString() }}
          </div>
          <div class="flex gap-2">
            <a :href="feed.feedUrl" target="_blank" rel="noopener noreferrer"
              class="text-sm text-blue-600 hover:underline">
              Visit Source
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: feeds, pending, error } = await useFetch('/api/feeds');
const { getToken, isLoaded, isSignedIn, sessionId, userId } = useAuth()

const fetchProtectedData = async () => {
  // Use `getToken()` to get the current user's session token
  const token = await getToken.value()

  // Use the token to fetch data from an external API
  const response = await fetch('https://api.example.com/data', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

useHead({
  title: 'RSS Feeds - Feed Slash',
});
</script>