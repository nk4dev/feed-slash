
<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
            <NuxtLink to="/">f/</NuxtLink>
          </h1>
          <nav class="flex gap-3 sm:gap-4">
            <NuxtLink 
              to="/add" 
              class="text-sm sm:text-base text-gray-700 hover:text-blue-600 transition-colors"
            >
              Login
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>
    <main class="pb-8">
      <NuxtPage />
    </main>
  </div>
</template>
