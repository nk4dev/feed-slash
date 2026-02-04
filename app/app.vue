<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Global Loading Bar -->
    <NuxtLoadingIndicator :height="10" :color="'#3b82f6'" />

    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between py-4">
          <!-- Logo -->
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
            <NuxtLink to="/">f/</NuxtLink>
          </h1>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-4">
            <div>

            </div>
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <NuxtLink to="/today-digest" @click="mobileMenuOpen = false"
                class="text-blue-600 rounded-md hover:text-blue-800 hover:bg-blue-50 transition-colors text-base">
                Today's Digest
              </NuxtLink>
              <NuxtLink to="/bookmark" @click="mobileMenuOpen = false"
                class="text-blue-600 rounded-md hover:text-blue-800 hover:bg-blue-50 transition-colors text-base">
                Bookmarks
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
            class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
          <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-100 py-4">
            <nav class="flex flex-col gap-2">
              <!-- Auth Section -->
              <div class="border-t border-gray-100 mt-2 pt-4 px-3">
                <SignedOut>
                  <div class="flex flex-col gap-3">
                    <SignInButton />
                    <SignUpButton />
                  </div>
                </SignedOut>
                <SignedIn>
                  <div class="flex items-center gap-3">
                    <span class="text-gray-600 text-sm">Account</span>
                    <UserButton />
                  </div>
                </SignedIn>
              </div>
            </nav>
          </div>
        </Transition>
      </div>
    </header>

    <main class="pb-8">
      <NuxtPage />
    </main>

    <footer class="bg-white border-t mt-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-gray-500">
        &copy; 2026 nk4dev.
        <div class="flex flex-wrap justify-center gap-3 mt-2">
          <NuxtLink to="/precautions" class="hover:text-gray-700 transition-colors">Precautions when using</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-gray-700 transition-colors">Privacy Policy</NuxtLink>
          <NuxtLink to="/repo" class="hover:text-gray-700 transition-colors">Repository</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>


<script setup lang="ts">
// Mobile menu state
const { userId, isLoaded } = useAuth();
const mobileMenuOpen = ref(false);
// Close mobile menu on route change
const route = useRoute()


watch(() => route.path, () => {
  mobileMenuOpen.value = false
});

</script>
