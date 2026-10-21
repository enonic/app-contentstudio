import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errAsync, okAsync } from 'neverthrow';
import type { Content } from '../../../app/content/Content';
import type { Site } from '../../../app/content/Site';
import type { Project } from '../../../app/settings/data/project/Project';
import { $activeProject } from '../../entities/project/activeProject.store';
import type { AiPlugin, AiPluginContext, AiPluginInstance } from './ai-protocol';
import {
    __resetAiHostForTest,
    getAiHost,
    handleAssignedPluginsChange,
    handleDataActivePath,
    handleMediaUploaded,
    mountReadyPlugins,
    notifyImageUploaded,
    openPluginDialog,
} from './ai.host';
import { $languagesStore } from '../../entities/language/languages.store';
import { $config } from '../../shared/config/config.store';
import { $aiAssignedPlugins, $aiPluginDialogOpen } from './ai.store';

const fetchNearestSite = vi.hoisted(() => vi.fn());

vi.mock('../../entities/content/api/content.api', () => ({ fetchNearestSite }));

const OPERATOR_APP_KEY = 'com.enonic.app.ai.contentoperator';

function fakeAppConfigs(...appKeys: string[]): { getApplicationKey: () => { getName: () => string } }[] {
    return appKeys.map((key) => ({ getApplicationKey: () => ({ getName: () => key }) }));
}

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

describe('dialog open', () => {
    // Mounts a plugin that records every dialog:open command.
    function mountDialogListener(): { opened: number[] } {
        const opened: number[] = [];
        getAiHost().register({
            id: 'ai.contentOperator',
            version: '1.0.0',
            commands: ['dialog:open'],
            mount: vi.fn((_c: HTMLElement, ctx: AiPluginContext) => {
                ctx.api.on('dialog:open', () => opened.push(1));
                return { dispose: vi.fn() };
            }),
        });
        mountReadyPlugins();
        return { opened };
    }

    beforeEach(() => {
        __resetAiHostForTest();
    });

    afterEach(() => {
        $aiAssignedPlugins.setKey('ai.contentOperator', false);
    });

    it('sends dialog:open when the plugin app is assigned', () => {
        const { opened } = mountDialogListener();
        $aiAssignedPlugins.setKey('ai.contentOperator', true);

        openPluginDialog('ai.contentOperator');

        expect(opened).toHaveLength(1);
    });

    it('does not send dialog:open when the plugin app is not assigned', () => {
        const { opened } = mountDialogListener();
        $aiAssignedPlugins.setKey('ai.contentOperator', false);

        openPluginDialog('ai.contentOperator');

        expect(opened).toEqual([]);
    });
});

describe('assignment revoked', () => {
    // Mounts a plugin that records every dialog:close command.
    function mountCloseListener(): { closed: number[] } {
        const closed: number[] = [];
        getAiHost().register({
            id: 'ai.contentOperator',
            version: '1.0.0',
            commands: ['dialog:close'],
            mount: vi.fn((_c: HTMLElement, ctx: AiPluginContext) => {
                ctx.api.on('dialog:close', () => closed.push(1));
                return { dispose: vi.fn() };
            }),
        });
        mountReadyPlugins();
        return { closed };
    }

    beforeEach(() => {
        __resetAiHostForTest();
    });

    it('closes an open dialog when the plugin app becomes unassigned', () => {
        const { closed } = mountCloseListener();
        $aiPluginDialogOpen.setKey('ai.contentOperator', true);

        handleAssignedPluginsChange({ 'ai.translator': false, 'ai.contentOperator': false });

        expect(closed).toHaveLength(1);
    });

    it('does not send dialog:close when the dialog is already closed', () => {
        const { closed } = mountCloseListener();
        $aiPluginDialogOpen.setKey('ai.contentOperator', false);

        handleAssignedPluginsChange({ 'ai.translator': false, 'ai.contentOperator': false });

        expect(closed).toEqual([]);
    });

    it('does not send dialog:close while the plugin app stays assigned', () => {
        const { closed } = mountCloseListener();
        $aiPluginDialogOpen.setKey('ai.contentOperator', true);

        handleAssignedPluginsChange({ 'ai.translator': false, 'ai.contentOperator': true });

        expect(closed).toEqual([]);
    });
});

describe('image upload notification', () => {
    let projectConfigs: ReturnType<typeof fakeAppConfigs>;

    function setNearestSite(site: Site | undefined): void {
        fetchNearestSite.mockReturnValue(okAsync(site));
    }

    function fakeSite(...appKeys: string[]): Site {
        return { getSiteConfigs: () => fakeAppConfigs(...appKeys) } as unknown as Site;
    }

    beforeEach(() => {
        __resetAiHostForTest();
        projectConfigs = fakeAppConfigs(OPERATOR_APP_KEY);
        setNearestSite(undefined);
        $activeProject.set({
            getName: () => 'test-project',
            getLanguage: () => 'en',
            getSiteConfigs: () => projectConfigs,
        } as unknown as Project);
    });

    afterEach(() => {
        $activeProject.set(undefined);
        fetchNearestSite.mockReset();
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
            getContentId: () => ({ toString: () => id }),
            getType: () => ({ isImage: () => isImage, isVectorMedia: () => isVector }),
        } as unknown as Content;
    }

    // Lets the nearest-site lookup and the notify that follows it settle.
    async function flush(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
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

    it('notifies for uploaded image content', async () => {
        const { received } = mountImageListener(['image:uploaded']);

        handleMediaUploaded(fakeUploadedContent('image-1', true));
        await flush();

        expect(received).toEqual([{ contentId: 'image-1', project: 'test-project' }]);
    });

    it('notifies for uploaded vector content', async () => {
        const { received } = mountImageListener(['image:uploaded']);

        handleMediaUploaded(fakeUploadedContent('vector-1', false, true));
        await flush();

        expect(received).toEqual([{ contentId: 'vector-1', project: 'test-project' }]);
    });

    it('ignores uploaded non-image media', async () => {
        const { received } = mountImageListener(['image:uploaded']);

        handleMediaUploaded(fakeUploadedContent('doc-1', false));
        await flush();

        expect(received).toEqual([]);
        expect(fetchNearestSite).not.toHaveBeenCalled();
    });

    it('ignores a null upload event', async () => {
        const { received } = mountImageListener(['image:uploaded']);

        handleMediaUploaded(null);
        await flush();

        expect(received).toEqual([]);
    });

    it('notifies when the operator app is assigned to the nearest site only', async () => {
        const { received } = mountImageListener(['image:uploaded']);
        projectConfigs = fakeAppConfigs();
        setNearestSite(fakeSite(OPERATOR_APP_KEY));

        handleMediaUploaded(fakeUploadedContent('image-1', true));
        await flush();

        expect(received).toEqual([{ contentId: 'image-1', project: 'test-project' }]);
    });

    it('ignores the project assignment when the content is inside a site without the app', async () => {
        const { received } = mountImageListener(['image:uploaded']);
        projectConfigs = fakeAppConfigs(OPERATOR_APP_KEY);
        setNearestSite(fakeSite('com.example.other'));

        handleMediaUploaded(fakeUploadedContent('image-1', true));
        await flush();

        expect(received).toEqual([]);
    });

    it('does not notify when the nearest-site lookup fails', async () => {
        const { received } = mountImageListener(['image:uploaded']);
        projectConfigs = fakeAppConfigs(OPERATOR_APP_KEY);
        fetchNearestSite.mockReturnValue(errAsync(new Error('lookup failed')));

        handleMediaUploaded(fakeUploadedContent('image-1', true));
        await flush();

        expect(received).toEqual([]);
    });

    it('does not notify when the content is outside any site and the project lacks the app', async () => {
        const { received } = mountImageListener(['image:uploaded']);
        projectConfigs = fakeAppConfigs('com.enonic.app.ai.translator');
        setNearestSite(undefined);

        handleMediaUploaded(fakeUploadedContent('image-1', true));
        await flush();

        expect(received).toEqual([]);
    });
});
