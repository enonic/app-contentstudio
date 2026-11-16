import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Content } from '../../../../app/content/Content';
import type { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import type { Site } from '../../../../app/content/Site';

const mocks = vi.hoisted(() => ({
    renderable: false,
    page: undefined as object | undefined,
    templateByKey: vi.fn(),
    containsId: vi.fn(),
    aiConfigs: vi.fn(),
    handleError: vi.fn(),
    openLiveEdit: vi.fn(),
    loadDefaultModels: vi.fn(),
    loadNearestSite: vi.fn(),
    siteModelUpdate: vi.fn(),
    templateSource: vi.fn(),
    bridgeInit: vi.fn(),
    bridgeCleanup: vi.fn(),
    inspectionStart: vi.fn(),
    inspectionStop: vi.fn(),
    syncRenderable: vi.fn(),
    save: vi.fn(),
    inlineEditing: false,
    componentReload: undefined as ((path: unknown, existing: boolean) => void) | undefined,
    hasController: true,
    log: [] as string[],
}));

vi.mock('../../../../app/resource/GetPageTemplateByKeyRequest', () => ({
    GetPageTemplateByKeyRequest: class {
        constructor(private readonly key: unknown) {}
        sendAndParse = () => mocks.templateByKey(this.key);
    },
}));
vi.mock('../../../../app/site/SiteModel', () => ({
    SiteModel: class {
        constructor(readonly site: unknown) {}
        update = mocks.siteModelUpdate;
        getSite = () => this.site;
    },
}));
vi.mock('../../../../app/util/ContentHelper', () => ({
    ContentHelper: { doContentComponentsContainId: mocks.containsId },
}));
vi.mock('../../../../app/wizard/page/PageState', () => ({ PageState: { getState: () => mocks.page } }));
vi.mock('../../../../app/wizard/PageEventsManager', () => ({
    PageEventsManager: {
        get: () => ({
            onComponentReloadRequested: (listener: (path: unknown, existing: boolean) => void) => {
                mocks.componentReload = listener;
            },
            unComponentReloadRequested: () => {
                mocks.componentReload = undefined;
            },
        }),
    },
}));
vi.mock('../../../shared/lib/cms/schema/contentTypeName', () => ({ toContentTypeName: (name: string) => name }));
vi.mock('../../../widgets/inspectors/model/component-inspection.service', () => ({
    start: mocks.inspectionStart,
    stop: mocks.inspectionStop,
}));
vi.mock('../../../widgets/inspectors/model/fragment-inspection.service', () => ({
    start: mocks.inspectionStart,
    stop: mocks.inspectionStop,
}));
vi.mock('../../../widgets/inspectors/model/page-inspection.service', () => ({
    start: mocks.inspectionStart,
    stop: mocks.inspectionStop,
}));
vi.mock('../../../widgets/inspectors/model/page-editor', () => ({
    $pageEditorLifecycle: { get: () => ({ inlineEditing: mocks.inlineEditing }) },
    cleanupPageEditorBridge: mocks.bridgeCleanup,
    initPageEditorBridge: mocks.bridgeInit,
    syncInitialRenderable: mocks.syncRenderable,
}));
vi.mock('./wizardController', () => ({
    getWizardController: () => (mocks.hasController ? { save: mocks.save } : undefined),
}));
vi.mock('./wizardPageTemplate.commands', () => ({ setWizardPageTemplateSource: mocks.templateSource }));
vi.mock('../../../../page-editor/LiveEditModel', () => ({
    LiveEditModel: {
        create: () => {
            const model: Record<string, unknown> = {};
            const builder = {
                setContent: (value: unknown) => ((model.content = value), builder),
                setCompareStatus: (value: unknown) => ((model.compareStatus = value), builder),
                setSiteModel: (value: unknown) => ((model.siteModel = value), builder),
                setDefaultTemplate: (value: unknown) => ((model.defaultModels = value), builder),
                build: () => ({
                    ...model,
                    getDefaultModels: () => model.defaultModels,
                    getContent: () => model.content,
                    getSiteModel: () => model.siteModel,
                }),
            };
            return builder;
        },
    },
}));
vi.mock('../../../entities/project', () => ({ getActiveProject: () => ({ getSiteConfigs: () => [] }) }));
vi.mock('../../../features/ai', () => ({ updateAiAppConfigs: mocks.aiConfigs }));
vi.mock('../../../shared/lib/cms/application/applicationConfig', () => ({
    fromLegacyApplicationConfig: (config: unknown) => config,
}));
vi.mock('../../../shared/notifications', () => ({ handleError: mocks.handleError }));
vi.mock('../../../widgets/preview-panel/model/previewResolution.store', () => ({
    whenPreviewSettled: () => Promise.resolve(mocks.renderable),
    isFrameRenderable: (result: boolean) => result,
}));
vi.mock('./wizardLayout.service', () => ({ openWizardLiveEdit: mocks.openLiveEdit }));
vi.mock('./wizardLoad.service', () => ({
    loadDefaultModels: mocks.loadDefaultModels,
    loadNearestSite: mocks.loadNearestSite,
}));

import {
    attachWizardPageEditorView,
    getWizardLiveEditModel,
    getWizardTemplateForCustomize,
    handleWizardContentNamed,
    handleWizardOtherContentUpdated,
    handleWizardTemplatesDeleted,
    initWizardPageModel,
    loadWizardPage,
    reloadWizardPageEditorAfterSave,
    requestWizardPageEditorReload,
    startWizardPageEditor,
    updateWizardPageModel,
    type WizardPageEditorHost,
    type WizardPageEditorView,
} from './wizardPageEditor.service';

type ContentOptions = { id?: string; path?: string; page?: boolean; template?: string; site?: boolean; type?: string };

const idOf = (value: string) => ({
    value,
    equals: (other: { value: string }) => other?.value === value,
    toString: () => value,
});

const pathOf = (value: string) => ({
    toString: () => value,
    getRootElement: () => value.split('/')[1],
    isDescendantOf: (other: { value: string }) => value.startsWith(`${other.value}/`),
    value,
});

const typeOf = (name: string) => ({
    toString: () => name,
    isPageTemplate: () => name === 'page-template',
    isSite: () => name === 'site',
});

const contentOf = ({
    id = 'current',
    path = '/site/current',
    page = false,
    template,
    site = false,
    type = 'post',
}: ContentOptions = {}) =>
    ({
        getContentId: () => idOf(id),
        getId: () => id,
        getPath: () => pathOf(path),
        getPage: () => (page || template ? { getTemplate: () => template } : null),
        getType: () => typeOf(type),
        isSite: () => site,
        getSiteConfigs: () => [],
        isPageTemplate: () => type === 'page-template',
        isInherited: () => false,
        isDataInherited: () => false,
    }) as unknown as Content & ContentSummaryAndCompareStatus & Site;

const modelsOf = (templateId: string | null) => ({
    hasDefaultPageTemplate: () => templateId != null,
    getDefaultPageTemplate: () =>
        templateId ? { getId: () => templateId, getKey: () => templateId, getDisplayName: () => templateId } : null,
});

const SITE = contentOf({ id: 'site', path: '/site', site: true, type: 'site' });

const flush = async (): Promise<void> => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
};

describe('wizardPageEditor.service', () => {
    let persisted: Content | undefined;
    let view: { [K in keyof WizardPageEditorView]: ReturnType<typeof vi.fn> };
    let host: WizardPageEditorHost;
    let stop: () => void = () => undefined;

    const start = (overrides: Partial<WizardPageEditorHost> = {}): void => {
        stop();
        host = {
            getPersistedContent: () => persisted,
            getCompareStatus: () => 'NEW' as never,
            getContentType: () => null,
            createsSite: false,
            ...overrides,
        };
        stop = startWizardPageEditor(host);
    };

    const attach = (): void => attachWizardPageEditorView(view as unknown as WizardPageEditorView);

    const settleReload = async (): Promise<void> => {
        await vi.advanceTimersByTimeAsync(200);
        await flush();
    };

    beforeEach(() => {
        vi.useFakeTimers();
        Object.values(mocks).forEach((mock) => typeof mock === 'function' && 'mockReset' in mock && mock.mockReset());
        mocks.renderable = false;
        mocks.page = undefined;
        mocks.log = [];
        mocks.loadNearestSite.mockResolvedValue(null);
        mocks.loadDefaultModels.mockResolvedValue(modelsOf(null));
        mocks.inlineEditing = false;
        mocks.hasController = true;
        mocks.save.mockResolvedValue(undefined);
        persisted = contentOf();
        view = {
            loadPage: vi.fn(() => {
                mocks.log.push('load');
                return Promise.resolve(mocks.renderable);
            }),
            unloadPage: vi.fn(() => mocks.log.push('unload')),
            setModel: vi.fn(() => mocks.log.push('model')),
            loadComponent: vi.fn(() => mocks.log.push('component')),
            skipNextReloadConfirmation: vi.fn(() => mocks.log.push('skip')),
        };
        mocks.openLiveEdit.mockImplementation(() => mocks.log.push('liveEdit'));
        start();
    });

    afterEach(() => {
        stop();
        vi.useRealTimers();
    });

    describe('model', () => {
        it('should build the model before the editor exists and hand it over once it does', () => {
            initWizardPageModel({ site: SITE, defaultModels: modelsOf('t1') as never });
            updateWizardPageModel(persisted as Content);

            const model = getWizardLiveEditModel() as unknown as Record<string, unknown>;
            expect(model.content).toBe(persisted);
            expect(model.compareStatus).toBe('NEW');
            expect((model.siteModel as { site: unknown }).site).toBe(SITE);
            expect(view.setModel).not.toHaveBeenCalled();

            attach();
            expect(view.setModel).toHaveBeenCalledExactlyOnceWith(model);
        });

        it('should restart what inspects the page with every model the editor gets', async () => {
            initWizardPageModel({ site: SITE, defaultModels: modelsOf('t1') as never });
            updateWizardPageModel(persisted as Content);
            expect(mocks.bridgeInit).not.toHaveBeenCalled();

            mocks.renderable = true;
            attach();
            await flush();

            expect(mocks.templateSource).toHaveBeenCalledWith(persisted, SITE);
            expect(mocks.bridgeInit).toHaveBeenCalledWith(
                expect.objectContaining({
                    hasDefaultPageTemplate: true,
                    defaultPageTemplateName: 't1',
                    contentContext: expect.objectContaining({ sitePath: '/site', contentTypeName: 'post' }),
                }),
            );
            expect(mocks.inspectionStart).toHaveBeenCalledTimes(3);
            expect(mocks.syncRenderable).toHaveBeenCalledWith(true);
        });

        it('should stop the inspection only for a wizard that had an editor', () => {
            stop();
            expect(mocks.bridgeCleanup).not.toHaveBeenCalled();

            start();
            attach();
            stop();
            expect(mocks.inspectionStop).toHaveBeenCalledTimes(3);
            expect(mocks.bridgeCleanup).toHaveBeenCalledTimes(1);
        });

        it('should take the content itself as the site when it is one', () => {
            const site = contentOf({ id: 'own', site: true, type: 'site' });

            updateWizardPageModel(site);
            const model = getWizardLiveEditModel() as unknown as { siteModel: { site: unknown } };

            expect(model.siteModel.site).toBe(site);
        });

        it('should update the existing site model and the AI configs on a later build', () => {
            initWizardPageModel({ site: SITE, defaultModels: null });
            updateWizardPageModel(persisted as Content);
            mocks.aiConfigs.mockClear();

            updateWizardPageModel(persisted as Content);

            expect(mocks.siteModelUpdate).toHaveBeenCalledExactlyOnceWith(SITE);
            expect(mocks.aiConfigs).toHaveBeenCalledTimes(1);
        });

        it('should forget the model when a new wizard starts', () => {
            updateWizardPageModel(persisted as Content);

            start();

            expect(getWizardLiveEditModel()).toBeUndefined();
        });

        it('should look for the nearest site again once the content is named', async () => {
            const nearest = contentOf({ id: 'other-site', site: true });
            mocks.loadNearestSite.mockResolvedValue(nearest);

            handleWizardContentNamed(persisted as Content);
            await flush();
            updateWizardPageModel(persisted as Content);

            const model = getWizardLiveEditModel() as unknown as { siteModel: { site: unknown } };
            expect(model.siteModel.site).toBe(nearest);
        });
    });

    describe('customize template', () => {
        beforeEach(() => {
            initWizardPageModel({ site: SITE, defaultModels: modelsOf('default') as never });
        });

        it('should be none for a page with its own controller', async () => {
            mocks.page = { hasController: () => true };

            expect(await getWizardTemplateForCustomize()).toBeNull();
        });

        it('should be the default template when the page has none of its own', async () => {
            mocks.page = { hasController: () => false, getTemplate: () => null };

            expect((await getWizardTemplateForCustomize())?.getId()).toBe('default');
        });

        it('should load the template the page uses when it is not the default one', async () => {
            const template = { getId: () => 'own' };
            mocks.page = { hasController: () => false, getTemplate: () => ({ equals: () => false }) };
            mocks.templateByKey.mockResolvedValue(template);

            expect(await getWizardTemplateForCustomize()).toBe(template);
        });
    });

    describe('after a save', () => {
        const reload = (): Promise<void> => reloadWizardPageEditorAfterSave(persisted as Content);

        it('should do nothing before the editor exists', async () => {
            await reload();

            expect(view.loadPage).not.toHaveBeenCalled();
        });

        it('should load, then refresh the model of a page that renders within a site', async () => {
            initWizardPageModel({ site: SITE, defaultModels: null });
            attach();
            mocks.renderable = true;

            await reload();

            expect(mocks.log).toEqual(['load', 'model']);
        });

        it('should leave a rendered content outside any site as it is', async () => {
            attach();
            mocks.renderable = true;

            await reload();

            expect(mocks.log).toEqual(['load']);
        });

        it('should refresh the model of a page that does not render', async () => {
            persisted = contentOf({ page: true });
            attach();

            await reload();

            expect(mocks.log).toEqual(['load', 'model']);
        });

        it('should unload what neither renders nor has a page', async () => {
            attach();

            await reload();

            expect(mocks.log).toEqual(['load', 'unload']);
        });

        it('should count a wizard that creates a site, and a page template, as within a site', async () => {
            start({ createsSite: true });
            attach();
            mocks.renderable = true;
            await reload();
            expect(mocks.log).toEqual(['load', 'model']);

            mocks.log = [];
            persisted = contentOf({ type: 'page-template' });
            start();
            attach();
            await reload();
            expect(mocks.log).toEqual(['load', 'model']);
        });

        it('should fail the save when the load fails, not hang it', async () => {
            attach();
            view.loadPage.mockRejectedValue(new Error('nope'));

            await expect(reload()).rejects.toThrow('nope');
        });
    });

    describe('requested reload', () => {
        beforeEach(() => {
            attach();
        });

        it('should wait 200 ms and run once, with the options of the last request', async () => {
            requestWizardPageEditorReload(true, true);
            await vi.advanceTimersByTimeAsync(150);
            requestWizardPageEditorReload(false, false);
            await vi.advanceTimersByTimeAsync(150);
            expect(view.loadPage).not.toHaveBeenCalled();

            await settleReload();

            expect(view.loadPage).toHaveBeenCalledTimes(1);
            expect(view.skipNextReloadConfirmation).toHaveBeenCalledExactlyOnceWith(false);
            expect(mocks.openLiveEdit).not.toHaveBeenCalled();
        });

        it('should skip the confirmation, load, and bring the editor back', async () => {
            requestWizardPageEditorReload(true, true);
            await settleReload();

            expect(mocks.log).toEqual(['skip', 'load', 'liveEdit']);
        });

        it('should refresh the model only when the page starts or stops rendering', async () => {
            view.loadPage.mockImplementation(() => {
                mocks.log.push('load');
                mocks.renderable = true;
                return Promise.resolve(true);
            });
            initWizardPageModel({ site: SITE, defaultModels: null });

            requestWizardPageEditorReload();
            await settleReload();

            expect(mocks.log).toEqual(['skip', 'load', 'model']);
        });

        it('should do nothing without an editor or without content', async () => {
            start();
            requestWizardPageEditorReload(true, true);
            await settleReload();

            persisted = undefined;
            attach();
            requestWizardPageEditorReload(true, true);
            await settleReload();

            expect(view.loadPage).not.toHaveBeenCalled();
            expect(mocks.openLiveEdit).not.toHaveBeenCalled();
        });

        it('should drop a pending request when the wizard stops', async () => {
            requestWizardPageEditorReload(true, true);
            stop();
            await settleReload();

            expect(view.loadPage).not.toHaveBeenCalled();
        });
    });

    describe('other content updated', () => {
        beforeEach(() => {
            initWizardPageModel({ site: SITE, defaultModels: modelsOf('default') as never });
            updateWizardPageModel(persisted as Content);
            attach();
            view.setModel.mockClear();
        });

        it('should reload when the template the page uses changes', async () => {
            persisted = contentOf({ template: 't1' });

            handleWizardOtherContentUpdated(
                contentOf({ id: 't1', path: '/site/_templates/t1', type: 'page-template' }),
            );
            await settleReload();

            expect(view.loadPage).toHaveBeenCalledTimes(1);
            expect(mocks.loadDefaultModels).not.toHaveBeenCalled();
        });

        it('should reload an automatically rendered page when the changed template is, or becomes, its default', async () => {
            mocks.loadDefaultModels.mockResolvedValue(modelsOf('t2'));

            handleWizardOtherContentUpdated(
                contentOf({ id: 't2', path: '/site/_templates/t2', type: 'page-template' }),
            );
            await flush();
            await settleReload();

            expect(view.setModel).toHaveBeenCalledTimes(1);
            expect(view.loadPage).toHaveBeenCalledTimes(1);
        });

        it('should only refresh the model for a template that does not render the page', async () => {
            mocks.loadDefaultModels.mockResolvedValue(modelsOf('default'));

            handleWizardOtherContentUpdated(
                contentOf({ id: 't3', path: '/site/_templates/t3', type: 'page-template' }),
            );
            await flush();
            await settleReload();

            expect(view.setModel).toHaveBeenCalledTimes(1);
            expect(view.loadPage).not.toHaveBeenCalled();
        });

        it('should ignore templates of another root and pages with their own page', async () => {
            handleWizardOtherContentUpdated(
                contentOf({ id: 't4', path: '/other/_templates/t4', type: 'page-template' }),
            );
            persisted = contentOf({ page: true });
            handleWizardOtherContentUpdated(
                contentOf({ id: 't5', path: '/site/_templates/t5', type: 'page-template' }),
            );
            await settleReload();

            expect(mocks.loadDefaultModels).not.toHaveBeenCalled();
            expect(view.loadPage).not.toHaveBeenCalled();
        });

        it('should reload and take the new site when the parent site changes', async () => {
            const fresh = contentOf({ id: 'site', path: '/site', site: true, type: 'site' });
            mocks.loadNearestSite.mockResolvedValue(fresh);

            handleWizardOtherContentUpdated(SITE);
            await flush();
            await settleReload();

            expect(view.loadPage).toHaveBeenCalledTimes(1);
            expect(view.skipNextReloadConfirmation).toHaveBeenCalledWith(false);
            expect(mocks.siteModelUpdate).toHaveBeenCalledWith(fresh);
        });

        it('should reload when the page shows the changed content', async () => {
            start({ getContentType: () => ({ getForm: () => 'form' }) as never });
            attach();
            mocks.containsId.mockReturnValue(Promise.resolve(true));

            handleWizardOtherContentUpdated(contentOf({ id: 'image', path: '/media/image', type: 'image' }));
            await flush();
            await settleReload();

            expect(view.loadPage).toHaveBeenCalledTimes(1);
            expect(mocks.openLiveEdit).not.toHaveBeenCalled();
        });

        it('should leave the editor alone for an unrelated content', async () => {
            start({ getContentType: () => ({ getForm: () => 'form' }) as never });
            attach();
            mocks.containsId.mockReturnValue(Promise.resolve(false));

            handleWizardOtherContentUpdated(contentOf({ id: 'image', path: '/media/image', type: 'image' }));
            await flush();
            await settleReload();

            expect(view.loadPage).not.toHaveBeenCalled();
        });

        it('should do nothing before the content is loaded', () => {
            persisted = undefined;

            handleWizardOtherContentUpdated(SITE);

            expect(mocks.loadNearestSite).not.toHaveBeenCalled();
        });
    });

    describe('templates deleted', () => {
        beforeEach(() => {
            initWizardPageModel({ site: SITE, defaultModels: modelsOf('default') as never });
            updateWizardPageModel(persisted as Content);
            attach();
            view.setModel.mockClear();
        });

        it('should reload when the template the page uses is deleted', async () => {
            persisted = contentOf({ template: 't1' });
            mocks.loadDefaultModels.mockResolvedValue(modelsOf('default'));

            handleWizardTemplatesDeleted([idOf('t1') as never]);
            await flush();
            await settleReload();

            expect(view.loadPage).toHaveBeenCalledTimes(1);
            expect(view.setModel).not.toHaveBeenCalled();
        });

        it('should refresh the model and reload when the default template changes', async () => {
            mocks.loadDefaultModels.mockResolvedValue(modelsOf(null));

            handleWizardTemplatesDeleted([idOf('default') as never]);
            await flush();
            await settleReload();

            expect(view.setModel).toHaveBeenCalledTimes(1);
            expect(view.loadPage).toHaveBeenCalledTimes(1);
        });

        it('should do nothing when neither the used nor the default template is hit', async () => {
            mocks.loadDefaultModels.mockResolvedValue(modelsOf('default'));

            handleWizardTemplatesDeleted([idOf('unused') as never]);
            await flush();
            await settleReload();

            expect(view.loadPage).not.toHaveBeenCalled();
        });

        it('should still reload a page whose template is gone when the default models cannot be loaded', async () => {
            persisted = contentOf({ template: 't1' });
            mocks.loadDefaultModels.mockRejectedValue(new Error('nope'));

            handleWizardTemplatesDeleted([idOf('t1') as never]);
            await flush();
            await settleReload();

            expect(view.loadPage).toHaveBeenCalledTimes(1);
            expect(mocks.handleError).toHaveBeenCalledTimes(1);
        });
    });

    describe('component reload', () => {
        beforeEach(() => {
            attach();
            mocks.log = [];
        });

        it('should save without reloading the page, then reload the component in place', async () => {
            mocks.inlineEditing = true;

            mocks.componentReload?.('path', true);
            expect(await loadWizardPage()).toBe(false);
            await flush();

            expect(mocks.save).toHaveBeenCalledWith({ reloadPageEditor: false });
            expect(view.loadComponent).toHaveBeenCalledWith('path', true);
            expect(view.loadPage).not.toHaveBeenCalled();
        });

        it('should reload the whole page when the editor is not editing in place', async () => {
            mocks.componentReload?.('path', false);
            await flush();

            expect(view.loadComponent).not.toHaveBeenCalled();
            expect(view.loadPage).toHaveBeenCalledTimes(1);
        });

        it('should allow page loads again after a failed save', async () => {
            mocks.save.mockRejectedValue(new Error('nope'));

            mocks.componentReload?.('path', true);
            await flush();

            expect(mocks.handleError).toHaveBeenCalledTimes(1);
            mocks.renderable = true;
            expect(await loadWizardPage()).toBe(true);
        });

        it('should do nothing without a wizard controller', async () => {
            mocks.hasController = false;

            mocks.componentReload?.('path', true);
            await flush();

            expect(mocks.save).not.toHaveBeenCalled();
            mocks.renderable = true;
            expect(await loadWizardPage()).toBe(true);
        });

        it('should stop listening for component reloads when the wizard stops', () => {
            stop();

            expect(mocks.componentReload).toBeUndefined();
        });
    });

    it('should not load a page before the editor exists', async () => {
        expect(await loadWizardPage()).toBe(false);
        expect(view.loadPage).not.toHaveBeenCalled();
    });
});
