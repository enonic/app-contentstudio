import { PropertyTree } from '@enonic/lib-admin-ui/data/PropertyTree';
import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { okAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentBuilder, type Content } from '../../../../app/content/Content';
import { ContentId } from '../../../../app/content/ContentId';
import { ContentName } from '../../../../app/content/ContentName';
import { Mixin } from '../../../../app/content/Mixin';
import { MixinName } from '../../../../app/content/MixinName';
import type { ContentType } from '../../../../app/inputtype/schema/ContentType';
import { Workflow } from '../../../../app/content/Workflow';
import { WorkflowState } from '../../../../app/content/WorkflowState';
import {
    $wizardDraftMixins,
    $wizardPersistedMixins,
    $wizardSectionChanges,
    applyServerSidePersistedContent,
    initializeWizardContentState,
    requestMixinSeed,
    resetWizardContent,
    setContentType,
} from './wizardContent.store';
import { cleanupWizardMixinsService, initWizardMixinsService } from './wizardMixins.service';

const mocks = vi.hoisted(() => ({
    fire: vi.fn(),
    getContentMixins: vi.fn(),
}));

vi.mock('../../../entities/application/applications.store', () => ({
    $applications: {
        get: () => ({ applications: [], loaded: false }),
        listen: () => () => undefined,
    },
    loadApplications: vi.fn(),
}));

vi.mock('../../../widgets/context-panel/model/contextContent.store', () => ({
    $contextContent: { get: () => ({ getId: () => 'content-1' }) },
}));

vi.mock('../../../../app/event/ContentRequiresSaveEvent', () => ({
    ContentRequiresSaveEvent: class {
        fire = mocks.fire;
    },
}));

vi.mock('../api/mixins.api', async () => {
    const { okAsync: ok } = await import('neverthrow');
    return {
        fetchContentMixins: () => mocks.getContentMixins(),
        fetchApplicationMixins: () =>
            ok([
                {
                    getName: () => 'app:meta',
                    getDisplayName: () => 'Meta',
                    isOptional: () => false,
                    toForm: () => ({ getFormItems: () => [] }),
                },
            ]),
    };
});

function createContent({ mixins = [], id }: { mixins?: Mixin[]; id?: string } = {}): Content {
    const builder = new ContentBuilder();
    builder.setData(new PropertyTree());
    builder.setName(new ContentName('content'));
    builder.setType(ContentTypeName.SITE);
    builder.setDisplayName('Content');
    builder.setMixins(mixins);
    builder.setWorkflow(Workflow.create().setState(WorkflowState.IN_PROGRESS).build());
    if (id) {
        builder.setContentId(new ContentId(id));
    }
    return builder.build();
}

describe('wizardMixins.service', () => {
    beforeEach(() => {
        resetWizardContent();
        mocks.fire.mockClear();
        mocks.getContentMixins.mockClear();
        mocks.getContentMixins.mockReturnValue(okAsync([]));
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

    it('should reload content mixin descriptors when the server mixin set changes', async () => {
        initializeWizardContentState(createContent({ id: 'content-1' }), null, [], WorkflowState.IN_PROGRESS);
        await vi.waitFor(() => expect(mocks.getContentMixins).toHaveBeenCalled());
        mocks.getContentMixins.mockClear();

        applyServerSidePersistedContent(
            createContent({ id: 'content-1', mixins: [new Mixin(new MixinName('appA:seo'), new PropertyTree())] }),
        );

        await vi.waitFor(() => expect(mocks.getContentMixins).toHaveBeenCalledTimes(1));
    });
});
