import type { ResolvedTheme } from '@enonic/ui-types';
import { readResolvedTheme, subscribeResolvedTheme } from '@enonic/ui-utils';
import { computed, map } from 'nanostores';
import { syncMapStore } from '../lib/storage/sync';
import { isWizardUrl } from '../lib/url/app';

//
// * Types
//

export type AppPage = 'browse' | 'wizard';

type AppStore = {
    page: AppPage;
    pageComponentsViewCollapsed: boolean;
};

//
// * Store State
//

const SYNC_NAME = 'app';

export const $app = map<AppStore>({
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

export function setPage(page: AppPage): void {
    $app.setKey('page', page);
}

export function setPageComponentsViewCollapsed(collapsed: boolean): void {
    $app.setKey('pageComponentsViewCollapsed', collapsed);
}

//
// * Utilities
//

/**
 * Applies the resolved theme to the document root.
 */
function applyTheme(theme: ResolvedTheme): void {
    const isDark = theme === 'dark';

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
 * Applies the theme to the document and keeps it in sync with the switcher, other tabs and the OS.
 * Called once by the application entry: a widget bundle on the same page must not bind.
 */
export function initTheme(): void {
    if (typeof window === 'undefined') return;

    applyTheme(readResolvedTheme());
    subscribeResolvedTheme(applyTheme);
}

//
// * App-wide initializations
//
