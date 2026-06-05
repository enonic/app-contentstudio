import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {AiPlugin, AiPluginContext, AiPluginInstance} from './ai-protocol';
import {
    __resetAiHostForTest,
    captureOperatorSeed,
    getAiHost,
    handleDataActivePath,
    mountReadyPlugins,
    openOperatorWithSeed,
} from './ai.host';
import {$aiPluginDialogOpen, $aiReady} from './ai.store';

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

// Mounts a fake Content Operator that records every context:set payload.
function mountOperator(): {received: (string | null)[]} {
    const received: (string | null)[] = [];
    const mount = vi.fn((_c: HTMLElement, ctx: AiPluginContext) => {
        ctx.api.on('context:set', payload => received.push(payload));
        return {dispose: vi.fn()};
    });
    getAiHost().register({
        id: 'ai.contentOperator',
        version: '1.0.0',
        commands: ['context:set', 'dialog:open'],
        mount,
    });
    mountReadyPlugins();
    return {received};
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

describe('Content Operator context', () => {
    beforeEach(() => {
        __resetAiHostForTest();
    });

    it('does not push context on focus while the dialog is closed', () => {
        const operator = mountOperator();
        $aiPluginDialogOpen.setKey('ai.contentOperator', false);

        handleDataActivePath('.title');

        expect(operator.received).toEqual([]);
    });

    it('pushes context on focus while the dialog is open', () => {
        const operator = mountOperator();
        $aiPluginDialogOpen.setKey('ai.contentOperator', true);

        handleDataActivePath('.title');

        expect(operator.received).toEqual(['/title']);
    });

    it('seeds the dialog with the field focused at capture time on open', () => {
        const operator = mountOperator();

        // Focus while closed: remembered, not sent.
        handleDataActivePath('.title');
        expect(operator.received).toEqual([]);

        captureOperatorSeed();
        openOperatorWithSeed();

        expect(operator.received).toEqual(['/title']);
    });

    it('does not seed when no field is focused at capture time', () => {
        const operator = mountOperator();

        // Focus then blur to a neutral element: live field cleared.
        handleDataActivePath('.title');
        handleDataActivePath(undefined);

        captureOperatorSeed();
        openOperatorWithSeed();

        expect(operator.received).toEqual([]);
    });

    it('seeds the most recently focused field, not a stale one', () => {
        const operator = mountOperator();

        handleDataActivePath('.title');
        handleDataActivePath('.body');

        captureOperatorSeed();
        openOperatorWithSeed();

        expect(operator.received).toEqual(['/body']);
    });

    it('clears the pending seed after opening, so a later open does not re-seed', () => {
        const operator = mountOperator();

        handleDataActivePath('.title');
        captureOperatorSeed();
        openOperatorWithSeed();
        expect(operator.received).toEqual(['/title']);

        // No new capture: blur the field, then open again.
        handleDataActivePath(undefined);
        captureOperatorSeed();
        openOperatorWithSeed();

        expect(operator.received).toEqual(['/title']);
    });
});
