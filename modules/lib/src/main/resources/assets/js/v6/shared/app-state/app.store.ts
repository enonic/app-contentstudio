import { computed, map } from 'nanostores';
import { syncMapStore } from '../lib/storage/sync';
import { isWizardUrl } from '../lib/url/app';

//
// * Types
//

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AppPage = 'browse' | 'wizard';

type AppStore = {
    theme: Theme;
    page: AppPage;
    pageComponentsViewCollapsed: boolean;
};

//
// * Store State
//

const SYNC_NAME = 'app';
const THEME_STORAGE_KEY = 'enonic:theme';

export const $app = map<AppStore>({
    theme: getInitialTheme(),
    page: isWizardUrl() ? 'wizard' : 'browse',
    pageComponentsViewCollapsed: false,
});

// Sync persisted preferences to localStorage and across tabs
syncMapStore($app, SYNC_NAME, {
    keys: ['pageComponentsViewCollapsed'],
    loadInitial: true,
    syncTabs: true,
});

//
// * Derived State
//

export const $isWizard = computed($app, ({ page }) => page === 'wizard');

//
// * Public API
//

export function setTheme(theme: Theme): void {
    $app.setKey('theme', theme);
    saveTheme(theme);
}

/**
 * Cycles through theme options: Light → Dark → System → Light
 */
export function cycleTheme(): void {
    const { theme } = $app.get();

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

export function setPageComponentsViewCollapsed(collapsed: boolean): void {
    $app.setKey('pageComponentsViewCollapsed', collapsed);
}

//
// * Utilities
//

function getSystemPreference(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function isTheme(value: unknown): value is Theme {
    return value === 'dark' || value === 'light' || value === 'system';
}

function getInitialTheme(): Theme {
    // Try to get saved theme from localStorage
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (isTheme(saved)) {
                return saved;
            }
        } catch {
            // Fall through to default
        }
    }

    // Default to system preference (most user-friendly)
    return 'system';
}

function saveTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error: unknown) {
        console.error(`Error writing to localStorage ${THEME_STORAGE_KEY}`, error);
    }
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
// * Document Binding
//

/**
 * Applies the theme to the document and keeps it in sync with other tabs and the OS. Called once
 * by the application entry: a widget bundle that carries its own copy of this store must not bind.
 */
export function initTheme(): void {
    if (typeof window === 'undefined') return;

    $app.subscribe((state) => {
        applyTheme(state.theme);
    });

    window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === THEME_STORAGE_KEY && isTheme(e.newValue)) {
            $app.setKey('theme', e.newValue);
        }
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
        if ($app.get().theme === 'system') {
            applyTheme('system');
        }
    });
}

//
// * App-wide initializations
//
