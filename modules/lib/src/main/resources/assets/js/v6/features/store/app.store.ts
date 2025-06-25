import {computed, map} from 'nanostores';
import {syncMapStore} from '../utils/storage/sync';
import {isWizardUrl} from '../utils/url/app';

//
// * Types
//

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AppPage = 'browse' | 'wizard';

type AppStore = {
    theme: Theme;
    page: AppPage;
};

//
// * Store State
//

const SYNC_NAME = 'app';

export const $app = map<AppStore>({
    theme: getInitialTheme(),
    page: isWizardUrl() ? 'wizard' : 'browse',
});

// Sync theme to localStorage and across tabs
syncMapStore($app, SYNC_NAME, {
    keys: ['theme'],
    loadInitial: true,
    syncTabs: true,
});

//
// * Derived State
//

export const $isWizard = computed($app, ({page}) => page === 'wizard');

//
// * Public API
//

export function setTheme(theme: Theme): void {
    $app.setKey('theme', theme);
}

/**
 * Cycles through theme options: Light → Dark → System → Light
 */
export function cycleTheme(): void {
    const {theme} = $app.get();

    switch (theme) {
        case 'light':
            setTheme('dark');
            break;
        case 'dark':
            setTheme('system');
            break;
        case 'system':
            setTheme('light');
            break;
    }
}

/**
 * Returns the resolved theme (what's actually being displayed).
 * Useful for components that need to know the actual theme value.
 */
export function getResolvedTheme(): ResolvedTheme {
    return resolveTheme($app.get().theme);
}

export function setPage(page: AppPage): void {
    $app.setKey('page', page);
}

//
// * Utilities
//

function getSystemPreference(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): Theme {
    // Try to get saved theme from localStorage
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('enonic:cs:app');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.theme === 'dark' || parsed.theme === 'light' || parsed.theme === 'system') {
                    return parsed.theme;
                }
            }
        } catch {
            // Fall through to default
        }
    }

    // Default to system preference (most user-friendly)
    return 'system';
}

/**
 * Resolves the theme preference to an actual theme value.
 * If theme is 'system', returns the current system preference.
 */
function resolveTheme(theme: Theme): ResolvedTheme {
    if (theme === 'system') {
        return getSystemPreference();
    }
    return theme;
}

/**
 * Applies the resolved theme to the document root.
 * Handles both explicit themes and system preference.
 */
function applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;

    const resolvedTheme = resolveTheme(theme);
    const isDark = resolvedTheme === 'dark';

    document.documentElement.classList.toggle('dark', isDark);

    // Update color-scheme meta tag to match the resolved theme
    const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
        colorSchemeMeta.setAttribute('content', isDark ? 'dark' : 'light');
    }
}

//
// * Internal Subscriptions
//

// Apply and listen for system theme changes to apply it to the document root
$app.subscribe((state) => {
    applyTheme(state.theme);
});

// Watch for system theme changes when in system mode
if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (): void => {
        const currentTheme = $app.get().theme;
        if (currentTheme === 'system') {
            applyTheme('system');
        }
    };

    // Modern API
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemThemeChange);
    }
}
