import { describe, expect, it, vi } from 'vitest';
import { loadAdminMenu, mountAdminMenu, type AdminMenu } from './adminMenu';

class FakeScript extends EventTarget {
    type = '';
    src = '';
    dataset: Record<string, string> = {};
    removed = false;

    remove(): void {
        this.removed = true;
    }
}

function fakeDocument() {
    const scripts: FakeScript[] = [];
    const win: { XpMenu?: AdminMenu } = {};
    const doc = {
        defaultView: win,
        baseURI: 'https://xp.example/admin/tool/com.enonic.app.contentstudio/main',
        createElement: () => new FakeScript(),
        head: { appendChild: (script: FakeScript) => scripts.push(script) },
    } as unknown as Document;

    const mount = vi.fn(() => Promise.resolve({ tagName: 'XP-MENU' } as unknown as HTMLElement));
    const menu: AdminMenu = { mount, unmount: vi.fn() };

    return {
        doc,
        win,
        menu,
        mount,
        scripts,
        arrive: (script = scripts.at(-1)) => {
            win.XpMenu = menu;
            script?.dispatchEvent(new Event('load'));
        },
        fail: (script = scripts.at(-1)) => script?.dispatchEvent(new Event('error')),
    };
}

describe('loadAdminMenu', () => {
    it('appends the loader once, auto-mount off, and answers its api on load', async () => {
        const { doc, menu, scripts, arrive } = fakeDocument();
        const first = loadAdminMenu('/admin/com.enonic.xp.app.main/menu-loader', doc);
        const second = loadAdminMenu('/admin/com.enonic.xp.app.main/menu-loader', doc);

        expect(scripts).toHaveLength(1);
        expect(scripts[0].type).toBe('module');
        expect(scripts[0].src).toBe('https://xp.example/admin/com.enonic.xp.app.main/menu-loader');
        expect(scripts[0].dataset.autoMount).toBe('false');

        arrive();
        await expect(first).resolves.toBe(menu);
        await expect(second).resolves.toBe(menu);
    });

    it('answers an api the page already has without a script', async () => {
        const { doc, win, menu, scripts } = fakeDocument();
        win.XpMenu = menu;

        await expect(loadAdminMenu('/menu-loader', doc)).resolves.toBe(menu);
        expect(scripts).toHaveLength(0);
    });

    it('rejects a loader that leaves no api, naming the url', async () => {
        const { doc, scripts } = fakeDocument();
        const load = loadAdminMenu('/menu-loader', doc);
        scripts[0].dispatchEvent(new Event('load'));

        await expect(load).rejects.toThrow('/menu-loader');
    });

    it('removes a script that failed and retries under a url the module map has not seen', async () => {
        const { doc, menu, scripts, fail, arrive } = fakeDocument();
        const failed = loadAdminMenu('/menu-loader?theme=dark', doc);
        fail();
        await expect(failed).rejects.toThrow('failed to load');
        expect(scripts[0].removed).toBe(true);

        const retried = loadAdminMenu('/menu-loader?theme=dark', doc);
        expect(scripts).toHaveLength(2);
        expect(scripts[1].src).toBe('https://xp.example/menu-loader?theme=dark&retry=1');
        arrive();
        await expect(retried).resolves.toBe(menu);
    });
});

describe('mountAdminMenu', () => {
    it('mounts with the options once the loader is there and answers the host', async () => {
        const { doc, mount, arrive } = fakeDocument();
        const mounted = mountAdminMenu('/menu-loader', { autoOpen: true }, doc);
        arrive();

        const host = await mounted;
        expect(host.tagName).toBe('XP-MENU');
        expect(mount).toHaveBeenCalledWith({ autoOpen: true });
    });
});
