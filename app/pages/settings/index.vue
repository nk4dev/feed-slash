<template>
    <NuxtLink v-for="url in pageLists" :key="url.path" :to="url.path" class="w-1/2 hover:bg-blue-200 p-2">
        {{ url.name }}
    </NuxtLink>
</template>
<script setup lang="ts">
const pageLists = [
    { name: "Agent API", path: "/settings/agent-api" },
    { name: "API Keys", path: "/settings/api-key" },
];
useHead({
    title: "Settings - Feed Slash",
});
</script>