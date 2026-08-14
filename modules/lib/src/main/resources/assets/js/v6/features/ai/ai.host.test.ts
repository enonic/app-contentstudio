import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Content } from '../../../app/content/Content';
import type { Project } from '../../../app/settings/data/project/Project';
import { $activeProject } from '../../entities/project/activeProject.store';
import type { AiPlugin, AiPluginContext, AiPluginInstance } from './ai-protocol';
import {
    __resetAiHostForTest,
    getAiHost,
    handleDataActivePath,
    handleMediaUploaded,
    mountReadyPlugins,
    notifyImageUploaded,
    openPluginDialog,
} from './ai.host';
import { $languagesStore } from '../../entities/language/languages.store';
import { $config } from '../../shared/config/config.store';
import { $aiPluginDialogOpen } from './ai.store';

function fakePlugin(overrides: Partial<AiPlugin> = {}): {
    plugin: AiPlugin;
    dispose: () => void;
    mount: ReturnType<typeof vi.fn>;
} {
    const dispose = vi.fn();
    const instance: AiPluginInstance = { dispose };
    const mount = vi.fn((_c: HTMLElement, _ctx: AiPluginContext) => instance);
    return {
        plugin: { id: 'ai.translator', version: '1.0.0', mount, ...overrides },
        dispose,
        mount,
    };
}

// Mounts a fake Content Operator that records every context:set payload.
function mountOperator(): { received: (string | null)[] } {
    const received: (string | null)[] = [];
    const mount = vi.fn((_c: HTMLElement, ctx: AiPluginContext) => {
        ctx.api.on('context:set', (payload) => received.push(payload));
        return { dispose: vi.fn() };
    });
    getAiHost().register({
        id: 'ai.contentOperator',
        version: '1.0.0',
        commands: ['context:set', 'dialog:open'],
        mount,
    });
    mountReadyPlugins();
    return { received };
}

describe('AiHost', () => {
    beforeEach(() => {
        __resetAiHostForTest();
    });

    it('does not mount a plugin while AI is disabled', () => {
        const { plugin, mount } = fakePlugin();
        getAiHost().register(plugin);
        expect(mount).not.toHaveBeenCalled();
    });

    it('mounts a registering plugin immediately when the browse page is AI-ready', () => {
        $config.setKey('aiEnabled', true);
        $config.setKey('browseMode', true);
        $languagesStore.setKey('loaded', true);
        try {
            const { plugin, mount } = fakePlugin();
            getAiHost().register(plugin);
            expect(mount).toHaveBeenCalledTimes(1);
        } finally {
            $config.setKey('aiEnabled', false);
            $config.setKey('browseMode', false);
            $languagesStore.setKey('loaded', false);
        }
    });

    it('mounts a registered plugin once CS becomes ready', () => {
        const { plugin, mount } = fakePlugin();
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
        const { plugin, dispose } = fakePlugin();
        getAiHost().register(plugin);
        mountReadyPlugins();

        getAiHost().unregister('ai.translator');
        expect(dispose).toHaveBeenCalledTimes(1);
    });

    it('ignores an unknown plugin id', () => {
        const { plugin, mount } = fakePlugin({ id: 'nonsense' as AiPlugin['id'] });
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

    it('does not preset context when the dialog opens after a field was focused while closed', () => {
        const operator = mountOperator();
        $aiPluginDialogOpen.setKey('ai.contentOperator', false);

        handleDataActivePath('.title');
        openPluginDialog('ai.contentOperator');

        expect(operator.received).toEqual([]);
    });
});

describe('image upload notification', () => {
    beforeEach(() => {
        __resetAiHostForTest();
        $activeProject.set({ getName: () => 'test-project', getLanguage: () => 'en' } as unknown as Project);
    });

    afterEach(() => {
        $activeProject.set(undefined);
    });

    // Mounts a plugin that records every image:uploaded payload.
    function mountImageListener(commands: AiPlugin['commands']): { received: { contentId: string }[] } {
        const received: { contentId: string }[] = [];
        getAiHost().register({
            id: 'ai.contentOperator',
            version: '1.0.0',
            commands,
            mount: vi.fn((_c: HTMLElement, ctx: AiPluginContext) => {
                ctx.api.on('image:uploaded', (payload) => received.push(payload));
                return { dispose: vi.fn() };
            }),
        });
        mountReadyPlugins();
        return { received };
    }

    function fakeUploadedContent(id: string, isImage: boolean, isVector = false): Content {
        return {
            getId: () => id,
            getType: () => ({ isImage: () => isImage, isVectorMedia: () => isVector }),
        } as unknown as Content;
    }

    it('sends image:uploaded to a plugin declaring the command', () => {
        const { received } = mountImageListener(['image:uploaded']);

        notifyImageUploaded('content-1', 'test-project');

        expect(received).toEqual([{ contentId: 'content-1', project: 'test-project' }]);
    });

    it('does not send image:uploaded to a plugin not declaring the command', () => {
        const { received } = mountImageListener(['dialog:open']);

        notifyImageUploaded('content-1', 'test-project');

        expect(received).toEqual([]);
    });

    it('notifies for uploaded image content', () => {
        const { received } = mountImageListener(['image:uploaded']);

        handleMediaUploaded(fakeUploadedContent('image-1', true));

        expect(received).toEqual([{ contentId: 'image-1', project: 'test-project' }]);
    });

    it('notifies for uploaded vector content', () => {
        const { received } = mountImageListener(['image:uploaded']);

        handleMediaUploaded(fakeUploadedContent('vector-1', false, true));

        expect(received).toEqual([{ contentId: 'vector-1', project: 'test-project' }]);
    });

    it('ignores uploaded non-image media', () => {
        const { received } = mountImageListener(['image:uploaded']);

        handleMediaUploaded(fakeUploadedContent('doc-1', false));

        expect(received).toEqual([]);
    });

    it('ignores a null upload event', () => {
        const { received } = mountImageListener(['image:uploaded']);

        handleMediaUploaded(null);

        expect(received).toEqual([]);
    });
});
