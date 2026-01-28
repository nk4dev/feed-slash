<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Precautions when using</h1>
    
    <div class="prose prose-lg">
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Usage Guidelines</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li>This service is provided "as is" without any warranties.</li>
          <li>RSS feeds are fetched from external sources. We are not responsible for the content of those feeds.</li>
          <li>Please respect the copyright and terms of service of the original content providers.</li>
          <li>Do not use this service for any illegal or unauthorized purpose.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Service Availability</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li>We do not guarantee continuous, uninterrupted access to the service.</li>
          <li>The service may be temporarily unavailable for maintenance or updates.</li>
          <li>Feed content may change or become unavailable at any time.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">User Responsibilities</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li>You are responsible for maintaining the security of your account.</li>
          <li>Do not share your login credentials with others.</li>
          <li>Report any security vulnerabilities or issues immediately.</li>
        </ul>
      </section>
    </div>

    <div class="mt-8">
      <NuxtLink to="/" class="text-blue-600 hover:underline">← Back to Home</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Precautions when using - Feed Slash',
});
</script>
