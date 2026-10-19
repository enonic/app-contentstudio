import { afterEach, describe, expect, it, vi } from 'vitest';

const THEME_KEY = 'enonic:theme';

async function freshStore() {
    vi.resetModules();
    return import('./app.store');
}

function storageEventFromAnotherTab(key: string, newValue: string): void {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }));
}

afterEach(() => {
    document.documentElement.classList.remove('dark');
});

describe('theme', () => {
    it('leaves the document alone until the application binds it', async () => {
        localStorage.setItem(THEME_KEY, 'dark');
        const store = await freshStore();

        store.setTheme('dark');

        expect(store.$app.get().theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('applies the stored theme once bound', async () => {
        localStorage.setItem(THEME_KEY, 'dark');
        const store = await freshStore();

        store.initTheme();

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('stores the theme it is set to', async () => {
        const store = await freshStore();
        store.initTheme();

        store.setTheme('light');

        expect(localStorage.getItem(THEME_KEY)).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('follows a switch made in another tab', async () => {
        const store = await freshStore();
        store.initTheme();
        store.setTheme('light');

        storageEventFromAnotherTab(THEME_KEY, 'dark');

        expect(store.$app.get().theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('keeps the chosen theme when another tab resaves the app entry with a stale one', async () => {
        const store = await freshStore();
        store.initTheme();
        store.setTheme('light');

        storageEventFromAnotherTab(
            'enonic:cs:app',
            JSON.stringify({ theme: 'dark', pageComponentsViewCollapsed: true }),
        );

        expect(store.$app.get().theme).toBe('light');
        expect(store.$app.get().pageComponentsViewCollapsed).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
