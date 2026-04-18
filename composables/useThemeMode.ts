let themeListenersAttached = false;

const THEME_STORAGE_KEY = "feed-slash:theme";

export function useThemeMode() {
    const isDarkMode = useState<boolean>("theme:is-dark", () => false);

    const applyTheme = (dark: boolean) => {
        if (!import.meta.client) {
            return;
        }

        const root = window.document.documentElement;
        root.classList.toggle("dark", dark);
    };

    const setDarkMode = (nextValue: boolean) => {
        isDarkMode.value = nextValue;
        applyTheme(nextValue);

        if (import.meta.client) {
            window.localStorage.setItem(THEME_STORAGE_KEY, nextValue ? "dark" : "light");
        }
    };

    const toggleDarkMode = () => {
        setDarkMode(!isDarkMode.value);
    };

    if (import.meta.client && !themeListenersAttached) {
        themeListenersAttached = true;

        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        isDarkMode.value = savedTheme ? savedTheme === "dark" : prefersDark;
        applyTheme(isDarkMode.value);
    }

    return {
        isDarkMode,
        setDarkMode,
        toggleDarkMode,
    };
}
