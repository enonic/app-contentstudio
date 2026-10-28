import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

const ASSETS_URI = 'http://localhost/_/asset/app';

type Global = { CKEDITOR?: unknown };

let appendChild: MockInstance<(node: Node) => Node>;
let loadCKEditor: (assetsUri: string) => Promise<void>;
let $config: typeof import('../../config/config.store').$config;

const appendedScripts = (): HTMLScriptElement[] =>
    appendChild.mock.calls.map(([node]) => node).filter((node) => node instanceof HTMLScriptElement);

describe('loadCKEditor', () => {
    beforeEach(async () => {
        vi.resetModules();
        ({ loadCKEditor } = await import('./loadCKEditor'));
        ({ $config } = await import('../../config/config.store'));
        delete (globalThis as Global).CKEDITOR;
        appendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node);
    });

    afterEach(() => {
        delete (globalThis as Global).CKEDITOR;
        appendChild.mockRestore();
    });

    it('resolves without a script when CKEDITOR is already defined', async () => {
        (globalThis as Global).CKEDITOR = {};

        await loadCKEditor(ASSETS_URI);

        expect(appendedScripts()).toHaveLength(0);
    });

    it('appends the bundle once, applies the locale and resolves when it defines CKEDITOR', async () => {
        $config.setKey('locale', 'nb');
        const first = loadCKEditor(ASSETS_URI);
        const second = loadCKEditor(ASSETS_URI);

        const scripts = appendedScripts();
        expect(scripts).toHaveLength(1);
        expect(scripts[0].src).toBe(`${ASSETS_URI}/lib/ckeditor.js`);

        const ckeditor = { config: {} as { language?: string } };
        (globalThis as Global).CKEDITOR = ckeditor;
        scripts[0].dispatchEvent(new Event('load'));

        await expect(first).resolves.toBeUndefined();
        await expect(second).resolves.toBeUndefined();
        expect(ckeditor.config.language).toBe('nb');
    });

    it('rejects when the bundle fails and allows a retry', async () => {
        const failed = loadCKEditor(ASSETS_URI);
        appendedScripts()[0].dispatchEvent(new Event('error'));

        await expect(failed).rejects.toThrow('Failed to load');

        loadCKEditor(ASSETS_URI);

        expect(appendedScripts()).toHaveLength(2);
    });
});
