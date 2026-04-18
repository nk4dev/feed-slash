let listenersAttached = false;

const OFFLINE_MODE_STORAGE_KEY = "feed-slash:offline-mode";
const CACHE_PREFIX = "feed-slash:offline-cache:";

type CacheEnvelope<T> = {
    savedAt: string;
    value: T;
};

function readEnvelope<T>(cacheKey: string): CacheEnvelope<T> | null {
    if (!import.meta.client) {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as CacheEnvelope<T>;
    } catch {
        return null;
    }
}

export function useOfflineMode() {
    const forcedOffline = useState<boolean>("offline:forced", () => false);
    const online = useState<boolean>("offline:online", () => true);

    if (import.meta.client && !listenersAttached) {
        listenersAttached = true;

        const saved = window.localStorage.getItem(OFFLINE_MODE_STORAGE_KEY);
        forcedOffline.value = saved === "1";
        online.value = window.navigator.onLine;

        window.addEventListener("online", () => {
            online.value = true;
        });

        window.addEventListener("offline", () => {
            online.value = false;
        });
    }

    const isOfflineMode = computed(() => forcedOffline.value || !online.value);

    function setOfflineMode(nextValue: boolean) {
        forcedOffline.value = nextValue;

        if (import.meta.client) {
            window.localStorage.setItem(
                OFFLINE_MODE_STORAGE_KEY,
                nextValue ? "1" : "0",
            );
        }
    }

    function toggleOfflineMode() {
        setOfflineMode(!forcedOffline.value);
    }

    function readCache<T>(cacheKey: string, fallback: T): T {
        const envelope = readEnvelope<T>(cacheKey);
        return envelope?.value ?? fallback;
    }

    function writeCache<T>(cacheKey: string, value: T) {
        if (!import.meta.client) {
            return;
        }

        const envelope: CacheEnvelope<T> = {
            savedAt: new Date().toISOString(),
            value,
        };

        window.localStorage.setItem(
            `${CACHE_PREFIX}${cacheKey}`,
            JSON.stringify(envelope),
        );
    }

    function getCacheSavedAt(cacheKey: string): string | null {
        const envelope = readEnvelope<unknown>(cacheKey);
        return envelope?.savedAt ?? null;
    }

    return {
        online,
        forcedOffline,
        isOfflineMode,
        setOfflineMode,
        toggleOfflineMode,
        readCache,
        writeCache,
        getCacheSavedAt,
    };
}
