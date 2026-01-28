<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
            <NuxtLink to="/">f/</NuxtLink>
          </h1>
          <nav class="flex gap-3 sm:gap-4">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <!-- Show the user button when the user is signed in -->
            <SignedIn>
              <UserButton />
            </SignedIn>
          </nav>
          
        </div>
      </div>
    </header>
    <main class="pb-8">
      <NuxtPage />
    </main>
    <footer class="bg-white border-t mt-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-gray-500">
        &copy; 2026 nk4dev.
        <div class="flex justify-center gap-3">
          <NuxtLink to="/precautions">Precautions when using</NuxtLink>
          <NuxtLink to="/privacy">Privacy Policy</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
