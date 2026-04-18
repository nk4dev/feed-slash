export type LocalSavedArticle = {
    feedId: string;
    contentId: string;
    savedAt: string;
    feedTitle: string | null;
    feedUrl: string;
    title: string | null;
    contentUrl: string;
    contentSnippet: string | null;
    author: string | null;
    publishedAt: string | null;
    content: string | null;
};

const LOCAL_ARTICLE_PREFIX = "feed-slash:local-article:";

export function useLocalSavedArticles() {
    function readAllLocalSavedArticles(): LocalSavedArticle[] {
        if (!import.meta.client) {
            return [];
        }

        const articles: LocalSavedArticle[] = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
            const key = window.localStorage.key(i);
            if (!key || !key.startsWith(LOCAL_ARTICLE_PREFIX)) {
                continue;
            }

            const raw = window.localStorage.getItem(key);
            if (!raw) {
                continue;
            }

            try {
                const parsed = JSON.parse(raw) as LocalSavedArticle;
                if (!parsed.feedId || !parsed.contentId) {
                    continue;
                }
                articles.push(parsed);
            } catch {
                continue;
            }
        }

        return articles.sort((a, b) => {
            const aTime = new Date(a.savedAt).getTime();
            const bTime = new Date(b.savedAt).getTime();
            return bTime - aTime;
        });
    }

    function removeLocalSavedArticle(feedId: string, contentId: string) {
        if (!import.meta.client) {
            return;
        }

        const key = `${LOCAL_ARTICLE_PREFIX}${feedId}:${contentId}`;
        window.localStorage.removeItem(key);
    }

    return {
        readAllLocalSavedArticles,
        removeLocalSavedArticle,
    };
}
