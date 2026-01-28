<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Privacy Policy</h1>
    
    <div class="prose prose-lg">
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Information We Collect</h2>
        <p class="mb-4">When you use Feed Slash, we collect:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Account Information:</strong> Email address and authentication data provided through Clerk.</li>
          <li><strong>Feed Data:</strong> RSS feed URLs you add and the associated content.</li>
          <li><strong>Usage Data:</strong> Basic analytics about how you use the service.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">How We Use Your Information</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li>To provide and maintain the Feed Slash service.</li>
          <li>To authenticate your identity and secure your account.</li>
          <li>To improve and optimize the service.</li>
          <li>To communicate with you about service updates.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Data Storage and Security</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li>Your data is stored securely using industry-standard encryption.</li>
          <li>We use Clerk for authentication, which provides enterprise-grade security.</li>
          <li>Feed data is stored in secure PostgreSQL databases.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Third-Party Services</h2>
        <p class="mb-4">We use the following third-party services:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Clerk:</strong> For user authentication and account management.</li>
          <li><strong>Cloudflare:</strong> For hosting and content delivery.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Your Rights</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li>You can request access to your personal data at any time.</li>
          <li>You can request deletion of your account and associated data.</li>
          <li>You can export your feed data.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us.</p>
      </section>

      <section class="text-sm text-gray-500">
        <p>Last updated: January 2026</p>
      </section>
    </div>

    <div class="mt-8">
      <NuxtLink to="/" class="text-blue-600 hover:underline">← Back to Home</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Privacy Policy - Feed Slash',
});
</script>
