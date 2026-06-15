import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentBuilder, type Content} from '../../../app/content/Content';
import {ContentName} from '../../../app/content/ContentName';
import type {ContentType} from '../../../app/inputtype/schema/ContentType';
import {Workflow} from '../../../app/content/Workflow';
import {WorkflowState} from '../../../app/content/WorkflowState';
import {
    $wizardDraftMixins,
    $wizardPersistedMixins,
    $wizardSectionChanges,
    initializeWizardContentState,
    requestMixinSeed,
    resetWizardContent,
    setContentType,
} from '../store/wizardContent.store';
import {cleanupWizardMixinsService, initWizardMixinsService} from './wizardMixins.service';

const mocks = vi.hoisted(() => ({
    fire: vi.fn(),
}));

vi.mock('../store/applications.store', () => ({
    $applications: {
        get: () => ({applications: [], loaded: false}),
        listen: () => () => undefined,
    },
    loadApplications: vi.fn(),
}));

vi.mock('../store/context/contextContent.store', () => ({
    $contextContent: {get: () => ({getId: () => 'content-1'})},
}));

vi.mock('../../../app/event/ContentRequiresSaveEvent', () => ({
    ContentRequiresSaveEvent: class {
        fire = mocks.fire;
    },
}));

vi.mock('../../../app/resource/GetContentMixinsRequest', () => ({
    GetContentMixinsRequest: class {
        sendAndParse(): Promise<unknown[]> {
            return Promise.resolve([]);
        }
    },
}));

vi.mock('../../../app/resource/GetApplicationMixinsRequest', () => ({
    GetApplicationMixinsRequest: class {
        sendAndParse(): Promise<unknown[]> {
            return Promise.resolve([
                {
                    getName: () => 'app:meta',
                    getDisplayName: () => 'Meta',
                    isOptional: () => false,
                    toForm: () => ({getFormItems: () => []}),
                },
            ]);
        }
    },
}));

function createContent(): Content {
    const builder = new ContentBuilder();
    builder.setData(new PropertyTree());
    builder.setName(new ContentName('content'));
    builder.setType(ContentTypeName.SITE);
    builder.setDisplayName('Content');
    builder.setMixins([]);
    builder.setWorkflow(Workflow.create().setState(WorkflowState.IN_PROGRESS).build());
    return builder.build();
}

describe('wizardMixins.service', () => {
    beforeEach(() => {
        resetWizardContent();
        mocks.fire.mockClear();
        initWizardMixinsService();
    });

    afterEach(() => {
        cleanupWizardMixinsService();
        vi.restoreAllMocks();
    });

    it('should seed mandatory mixins of a requested application into the draft only and trigger a save', async () => {
        initializeWizardContentState(createContent(), null, [], WorkflowState.IN_PROGRESS);
        setContentType({
            getContentTypeName: () => ContentTypeName.SITE,
            getTitle: () => 'Site',
            hasDisplayNameExpression: () => false,
        } as unknown as ContentType);

        requestMixinSeed(['app']);
        await vi.waitFor(() => expect(mocks.fire).toHaveBeenCalledTimes(1));

        expect($wizardDraftMixins.get().some((m) => m.getName().toString() === 'app:meta')).toBe(true);
        expect($wizardPersistedMixins.get().some((m) => m.getName().toString() === 'app:meta')).toBe(false);
        expect($wizardSectionChanges.get().mixins).toBe(true);
    });
});
