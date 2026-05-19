import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {AiPlugin, AiPluginContext, AiPluginInstance} from './ai-protocol';
import {__resetAiHostForTest, getAiHost, mountReadyPlugins} from './ai.host';
import {$aiReady} from './ai.store';

function fakePlugin(overrides: Partial<AiPlugin> = {}): {plugin: AiPlugin; dispose: () => void; mount: ReturnType<typeof vi.fn>} {
    const dispose = vi.fn();
    const instance: AiPluginInstance = {dispose};
    const mount = vi.fn((_c: HTMLElement, _ctx: AiPluginContext) => instance);
    return {
        plugin: {id: 'ai.translator', version: '1.0.0', mount, ...overrides},
        dispose,
        mount,
    };
}

describe('AiHost', () => {
    beforeEach(() => {
        __resetAiHostForTest();
    });

    it('does not mount a plugin while CS is not ready', () => {
        const {plugin, mount} = fakePlugin();
        getAiHost().register(plugin);
        expect(mount).not.toHaveBeenCalled();
    });

    it('mounts a registered plugin once CS becomes ready', () => {
        const {plugin, mount} = fakePlugin();
        getAiHost().register(plugin);

        mountReadyPlugins();
        expect(mount).toHaveBeenCalledTimes(1);
    });

    it('re-registering the same id disposes the old instance', () => {
        const first = fakePlugin();
        getAiHost().register(first.plugin);
        mountReadyPlugins();

        const second = fakePlugin();
        getAiHost().register(second.plugin);
        mountReadyPlugins();

        expect(first.dispose).toHaveBeenCalledTimes(1);
        expect(second.mount).toHaveBeenCalledTimes(1);
    });

    it('unregister disposes the mounted instance', () => {
        const {plugin, dispose} = fakePlugin();
        getAiHost().register(plugin);
        mountReadyPlugins();

        getAiHost().unregister('ai.translator');
        expect(dispose).toHaveBeenCalledTimes(1);
    });

    it('ignores an unknown plugin id', () => {
        const {plugin, mount} = fakePlugin({id: 'nonsense' as AiPlugin['id']});
        getAiHost().register(plugin);
        mountReadyPlugins();
        expect(mount).not.toHaveBeenCalled();
    });
});
