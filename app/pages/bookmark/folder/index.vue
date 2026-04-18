<template>
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <!-- ヘッダー -->
        <div class="mb-6 sm:mb-8">
            <NuxtLink to="/bookmark" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                ← Back to Bookmarks
            </NuxtLink>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Manage Folders</h1>
            <p class="text-gray-500 mt-1 text-sm sm:text-base">{{ folders?.length || 0 }} folders</p>
        </div>

        <!-- フォルダ作成フォーム -->
        <div class="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Create New Folder</h2>
            <form @submit.prevent="createFolder" class="flex gap-3">
                <input v-model="newFolderName" type="text" placeholder="Folder name" maxlength="50"
                    class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    :disabled="isCreating" />
                <button type="submit"
                    class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="isCreating || !newFolderName.trim()">
                    {{ isCreating ? 'Creating...' : 'Create' }}
                </button>
            </form>
            <p v-if="createError" class="text-red-500 text-sm mt-2">{{ createError }}</p>
        </div>

        <!-- ローディング状態 -->
        <div v-if="status === 'pending'" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <!-- エラー状態 -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6">
            <p class="text-red-600 font-medium">{{ error.statusMessage || 'Failed to load folders' }}</p>
        </div>

        <!-- フォルダ一覧 -->
        <div v-else>
            <div v-if="displayFolders.length === 0" class="text-center py-16 text-gray-500">
                <div class="text-5xl mb-4">📁</div>
                <p class="text-xl font-medium">No folders yet</p>
                <p class="text-sm mt-2">Create a folder to organize your bookmarks!</p>
            </div>

            <div v-else class="space-y-3">
                <div v-for="folder in displayFolders" :key="folder.id"
                    class="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-3 min-w-0">
                        <div
                            class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                            📁
                        </div>
                        <div class="min-w-0">
                            <p class="font-semibold text-gray-900 truncate">{{ folder.name }}</p>
                            <p class="text-sm text-gray-500">
                                {{ folder.bookmarkCount }} {{ folder.bookmarkCount === 1 ? 'bookmark' : 'bookmarks' }}
                                <span class="ml-2">•</span>
                                <span class="ml-2">{{ formatDate(folder.createdAt) }}</span>
                            </p>
                        </div>
                    </div>
                    <button @click="confirmDelete(folder)"
                        class="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        :disabled="folder.isDeleting" :title="'Delete folder'">
                        <svg v-if="!folder.isDeleting" class="w-5 h-5" fill="none" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <div v-else class="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                    </button>
                </div>
            </div>
        </div>

        <!-- 削除確認モーダル -->
        <div v-if="folderToDelete" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            @click.self="folderToDelete = null">
            <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Delete Folder</h3>
                <p class="text-gray-600 text-sm mb-1">
                    Are you sure you want to delete <strong>"{{ folderToDelete.name }}"</strong>?
                </p>
                <p class="text-gray-500 text-xs mb-6">
                    Bookmarks in this folder will not be deleted — they will be moved to "Uncategorized".
                </p>
                <div class="flex gap-3 justify-end">
                    <button @click="folderToDelete = null"
                        class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button @click="deleteFolder"
                        class="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface FolderItem {
    id: number;
    name: string;
    createdAt: string;
    bookmarkCount: number;
    isDeleting?: boolean;
}

const newFolderName = ref('');
const isCreating = ref(false);
const createError = ref('');
const folderToDelete = ref<FolderItem | null>(null);

const { data: folders, status, error, refresh } = await useFetch<FolderItem[]>('/api/bookmark-folders', {
    key: 'bookmark-folders',
});

const displayFolders = ref<FolderItem[]>([]);

watch(() => folders.value, (items) => {
    if (items) {
        displayFolders.value = items.map(item => ({ ...item, isDeleting: false }));
    }
}, { immediate: true });

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

async function createFolder() {
    const name = newFolderName.value.trim();
    if (!name) return;

    isCreating.value = true;
    createError.value = '';

    try {
        await $fetch('/api/bookmark-folders', {
            method: 'POST',
            body: { name },
        });
        newFolderName.value = '';
        await refresh();
    } catch (err: any) {
        createError.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to create folder';
    } finally {
        isCreating.value = false;
    }
}

function confirmDelete(folder: FolderItem) {
    folderToDelete.value = folder;
}

async function deleteFolder() {
    const folder = folderToDelete.value;
    if (!folder) return;

    folderToDelete.value = null;

    const target = displayFolders.value.find(f => f.id === folder.id);
    if (target) target.isDeleting = true;

    try {
        await $fetch(`/api/bookmark-folders/${folder.id}`, { method: 'DELETE' });
        displayFolders.value = displayFolders.value.filter(f => f.id !== folder.id);
    } catch (err: any) {
        console.error('Failed to delete folder:', err);
        if (target) target.isDeleting = false;
    }
}

useHead({
    title: 'Manage Folders - Feed Slash',
});
</script>