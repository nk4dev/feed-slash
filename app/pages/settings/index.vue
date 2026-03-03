<template>
    <NuxtLink to="/settings/account" class="block px-4 py-2 rounded hover:bg-gray-100 transition-colors">
        Account Settings
    </NuxtLink>
    <NuxtLink to="/settings/agent-api" class="block px-4 py-2 rounded hover:bg-gray-100 transition-colors">
        Agent API
    </NuxtLink>
</template>
<script setup lang="ts">
const pageLists = [
    { name: "Account Settings", path: "/settings/account" },
    { name: "Agent API", path: "/settings/agent-api" },
];
useHead({
    title: "Settings - Feed Slash",
});
</script>