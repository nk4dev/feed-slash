<template>
    <NuxtLink v-for="url in pageLists" :key="url.path" :to="url.path">
        <div class="w-3/4 m-auto bg-blue-100 hover:bg-blue-200 p-2 my-4">
            {{ url.name }}
        </div>
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
