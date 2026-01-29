<template>
    <div class="max-w-4xl mx-auto px-4 py-8">
        <div>
            <h1 class="text-2xl font-bold"> {{ formattedDate }}'s Digest</h1>
        </div>
        <main>
            test
            <pre>
                {{ articles }}
            </pre>
        </main>
    </div>
</template>
<script setup lang="ts">
const currentDate = new Date();
const systemDate = currentDate.toISOString().split('T')[0];
console.log('System Date:', systemDate);
const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
});

import axios from 'axios';

const { data: articles, status } = await useAsyncData('daily-articles', async () => {
    const response = await axios.get('/api/feeds/daily/2022-01-01');
    return response.data;
});
useHead({
    title: "Today's Digest - Feed Slash",
});
</script>