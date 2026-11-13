import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Site } from '../../../../app/content/Site';

const mocks = vi.hoisted(() => ({
    send: vi.fn(),
    fire: vi.fn(),
    handleError: vi.fn(),
    onSaveAsTemplate: vi.fn(),
    page: undefined as object | undefined,
}));

vi.mock('../../../../app/content/ContentSummaryAndCompareStatus', () => ({
    ContentSummaryAndCompareStatus: { fromContentSummary: (content: unknown) => ({ summary: content }) },
}));
vi.mock('../../../../app/event/EditContentEvent', () => ({
    EditContentEvent: class {
        constructor(readonly items: unknown[]) {}
        fire = () => mocks.fire(this.items);
    },
}));
vi.mock('../../../../app/wizard/CreatePageTemplateRequest', () => ({
    CreatePageTemplateRequest: class {
        private readonly params: Record<string, unknown> = {};
        private set = (key: string) => (value: unknown) => {
            this.params[key] = value;
            return this;
        };
        setController = this.set('controller');
        setRegions = this.set('regions');
        setConfig = this.set('config');
        setDisplayName = this.set('displayName');
        setSite = this.set('site');
        setSupports = this.set('supports');
        setName = this.set('name');
        sendAndParse = () => mocks.send(this.params);
    },
}));
vi.mock('../../../../app/wizard/page/PageState', () => ({ PageState: { getState: () => mocks.page } }));
vi.mock('../../../../app/wizard/PageEventsManager', () => ({
    PageEventsManager: { get: () => ({ onPageSaveAsTemplate: mocks.onSaveAsTemplate }) },
}));
vi.mock('../../../shared/notifications', () => ({ handleError: mocks.handleError }));

import { saveWizardPageAsTemplate, setWizardPageTemplateSource } from './wizardPageTemplate.commands';

const CONTENT = {
    getDisplayName: () => 'Post',
    getType: () => 'app:post',
    getName: () => 'post',
} as unknown as ContentSummary;

const SITE = { getPath: () => '/site' } as unknown as Site;

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('wizardPageTemplate.commands', () => {
    beforeEach(() => {
        mocks.send.mockReset();
        mocks.fire.mockReset();
        mocks.handleError.mockReset();
        mocks.page = {
            getController: () => 'controller',
            getRegions: () => 'regions',
            getConfig: () => 'config',
        };
    });

    it('should do nothing before the page editor reports the content', () => {
        saveWizardPageAsTemplate();

        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('should listen to the page editor once', () => {
        setWizardPageTemplateSource(CONTENT, SITE);
        setWizardPageTemplateSource(CONTENT, null);

        expect(mocks.onSaveAsTemplate).toHaveBeenCalledExactlyOnceWith(saveWizardPageAsTemplate);
    });

    it('should create the template from the page and open it', async () => {
        const template = { id: 'template' };
        mocks.send.mockResolvedValue(template);
        setWizardPageTemplateSource(CONTENT, SITE);

        saveWizardPageAsTemplate();
        await flush();

        expect(mocks.send).toHaveBeenCalledWith({
            controller: 'controller',
            regions: 'regions',
            config: 'config',
            displayName: 'Post',
            site: '/site',
            supports: 'app:post',
            name: 'post',
        });
        expect(mocks.fire).toHaveBeenCalledWith([{ summary: template }]);
    });

    it('should create a template outside a site', async () => {
        mocks.send.mockResolvedValue({});
        setWizardPageTemplateSource(CONTENT, null);

        saveWizardPageAsTemplate();
        await flush();

        expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ site: null }));
    });

    it('should do nothing without a page and report a failed request', async () => {
        setWizardPageTemplateSource(CONTENT, SITE);
        mocks.page = undefined;
        saveWizardPageAsTemplate();
        expect(mocks.send).not.toHaveBeenCalled();

        mocks.page = { getController: () => 1, getRegions: () => 2, getConfig: () => 3 };
        mocks.send.mockRejectedValue(new Error('nope'));
        saveWizardPageAsTemplate();
        await flush();

        expect(mocks.handleError).toHaveBeenCalledTimes(1);
        expect(mocks.fire).not.toHaveBeenCalled();
    });
});
