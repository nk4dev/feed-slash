<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <!-- Global Loading Bar -->
    <NuxtLoadingIndicator :height="10" :color="'#3b82f6'" />

    <header class="bg-white shadow-sm sticky top-0 z-10 dark:bg-gray-900 dark:shadow-gray-950/60">
      <div class="max-w-8xl mx-auto px-4 sm:px-5 lg:px-6">
        <div class="flex items-center justify-between py-4">
          <!-- Logo -->
          <h1 class="text-xl sm:text-2xl font-bold">
            <NuxtLink to="/">
              <svg viewBox="0 10 200 100" xmlns="http://www.w3.org/2000/svg"
                class="h-12 text-gray-900 dark:text-gray-100">
                <text x="0" y="50" font-size="34" font-weight="bold" fill="currentColor">Feed / </text>
                <text x="0" y="100" font-size="34" font-weight="bold" fill="currentColor">Slash</text>
              </svg>
            </NuxtLink>
          </h1>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-4">
            <span :class="[
              'text-xs px-2 py-1 rounded-full',
              online ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
            ]">
              {{ online ? 'Network Online' : 'Network Offline' }}
            </span>
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <NuxtLink v-for="url in headerUrls" :key="url.path" :to="url.path" @click="mobileMenuOpen = false"
                class="text-blue-600 dark:text-blue-400">
                {{ url.name }}
              </NuxtLink>
              <div class="border-gray-200 bg-blue-400 rounded-full w-7 h-7">
                <div v-if="isLoaded">
                  <UserButton />
                </div>
                <svg v-else :class="['w-5 h-5 animate-spin']" fill="none" stroke="currentColor" stroke-width="2"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </SignedIn>
          </nav>

          <!-- Mobile Hamburger Button -->
          <button @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            aria-label="Toggle menu">
            <!-- Hamburger Icon -->
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <!-- Close Icon -->
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mobile Menu -->
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
          <div v-if="mobileMenuOpen"
            class="w-full h-full md:hidden border-t border-gray-100 py-4 fixed bg-white left-0 top-16 z-20 dark:border-gray-800 dark:bg-gray-900">
            <nav class="flex flex-col gap-2">
              <!-- Auth Section -->
              <div class="border-t border-gray-100 mt-2 pt-4 px-3 dark:border-gray-800">
                <SignedOut>
                  <div class="flex flex-col gap-3">
                    <SignInButton />
                    <SignUpButton />
                  </div>
                </SignedOut>
                <SignedIn>
                  <div class="mb-2 text-xs px-2 py-1 rounded-full w-fit"
                    :class="online ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                    {{ online ? 'Network Online' : 'Network Offline' }}
                  </div>
                  <div class="flex flex-col gap-3 mb-4">
                    <NuxtLink v-for="url in headerUrls" :key="url.path" :to="url.path" @click="mobileMenuOpen = false"
                      class="text-blue-600 rounded-md hover:text-blue-800 hover:bg-blue-50 transition-colors text-base dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/50">
                      {{ url.name }}
                    </NuxtLink>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-gray-600 text-sm dark:text-gray-300">Account</span>
                    <UserButton />
                  </div>
                </SignedIn>
              </div>
            </nav>
          </div>
        </Transition>
      </div>
    </header>

    <div v-if="isOfflineMode" class="bg-amber-100 border-b border-amber-200 text-amber-900 text-sm">
      <div class="max-w-8xl mx-auto px-4 sm:px-5 lg:px-6 py-2">
        Offline mode is enabled. The app shows cached data and pauses network updates.
      </div>
    </div>

    <main class="pb-24 px-2 sm:px-4 lg:px-6 mt-6">
      <div class="max-w-8xl mx-auto px-4 sm:px-5 lg:px-6">
        <NuxtPage />
      </div>
    </main>

    <div class="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
      <div class="mx-auto max-w-8xl px-3 sm:px-5 lg:px-6 pb-3 sm:pb-4">
        <div
          class="pointer-events-auto mx-auto flex w-full max-w-fit items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
          <button @click="toggleDarkMode" :class="[
            'px-3 py-1.5 text-sm rounded-full border transition-colors whitespace-nowrap',
            isDarkMode
              ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-300 dark:hover:bg-slate-100'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700',
          ]">
            {{ isDarkMode ? 'Dark: ON' : 'Dark: OFF' }}
          </button>
          <button @click="toggleOfflineMode" :class="[
            'px-3 py-1.5 text-sm rounded-full border transition-colors whitespace-nowrap',
            isOfflineMode
              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700',
          ]">
            {{ isOfflineMode ? 'Download: ON' : 'Download: OFF' }}
          </button>
          <NuxtLink to="/offline"
            class="px-3 py-1.5 text-sm rounded-full border border-gray-300 bg-white text-gray-700 transition-colors whitespace-nowrap hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
            Offline
          </NuxtLink>
        </div>
      </div>
    </div>

    <footer class="bg-white border-t mt-8 dark:bg-gray-900 dark:border-gray-800">
      <div class="max-w-8xl mx-auto px-4 sm:px-5 lg:px-6 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; 2026 nk4dev.
        <div class="flex flex-wrap justify-center gap-3 mt-2">
          <NuxtLink to="/precautions" class="hover:text-gray-700 transition-colors dark:hover:text-gray-200">Precautions
            when using</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-gray-700 transition-colors dark:hover:text-gray-200">Privacy Policy
          </NuxtLink>
          <NuxtLink to="https://github.com/nk4dev/feed-slash/" target="_blank"
            class="hover:text-gray-700 transition-colors dark:hover:text-gray-200">
            Repository</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>


<script setup lang="ts">
import { useOfflineMode } from '../composables/useOfflineMode';
import { useThemeMode } from '../composables/useThemeMode';

// Mobile menu state
const { userId, isLoaded } = useAuth();
const mobileMenuOpen = ref(false);
const { online, isOfflineMode, toggleOfflineMode } = useOfflineMode();
const { isDarkMode, toggleDarkMode } = useThemeMode();
// Close mobile menu on route change
const route = useRoute()

// header urls list
const headerUrls = [
  { name: "Today's Digest", path: "/today-digest" },
  { name: "Bookmarks", path: "/bookmark" },
  { name: "Offline", path: "/offline" },
  { name: "Settings", path: "/settings" },
];

watch(() => route.path, () => {
  mobileMenuOpen.value = false
});

</script>
