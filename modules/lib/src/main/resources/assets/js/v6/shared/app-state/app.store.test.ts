import { writeTheme } from '@enonic/ui-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

const THEME_KEY = 'enonic:theme';

async function freshStore() {
    vi.resetModules();
    return import('./app.store');
}

function storageEventFromAnotherTab(key: string, newValue: string): void {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }));
}

function isDark(): boolean {
    return document.documentElement.classList.contains('dark');
}

afterEach(() => {
    document.documentElement.classList.remove('dark');
});

describe('theme', () => {
    it('leaves the document alone until the application binds it', async () => {
        localStorage.setItem(THEME_KEY, 'dark');
        await freshStore();

        expect(isDark()).toBe(false);
    });

    it('applies the stored theme once bound', async () => {
        localStorage.setItem(THEME_KEY, 'dark');
        const store = await freshStore();

        store.initTheme();

        expect(isDark()).toBe(true);
    });

    it('follows a switch made on the same page', async () => {
        localStorage.setItem(THEME_KEY, 'light');
        const store = await freshStore();
        store.initTheme();

        writeTheme('dark');

        expect(isDark()).toBe(true);
    });

    it('follows a switch made in another tab', async () => {
        localStorage.setItem(THEME_KEY, 'light');
        const store = await freshStore();
        store.initTheme();

        localStorage.setItem(THEME_KEY, 'dark');
        storageEventFromAnotherTab(THEME_KEY, 'dark');

        expect(isDark()).toBe(true);
    });

    it('ignores a stale theme in the app entry another tab resaves', async () => {
        localStorage.setItem(THEME_KEY, 'light');
        const store = await freshStore();
        store.initTheme();

        storageEventFromAnotherTab(
            'enonic:cs:app',
            JSON.stringify({ theme: 'dark', pageComponentsViewCollapsed: true }),
        );

        expect(store.$app.get().pageComponentsViewCollapsed).toBe(true);
        expect(isDark()).toBe(false);
    });
});
