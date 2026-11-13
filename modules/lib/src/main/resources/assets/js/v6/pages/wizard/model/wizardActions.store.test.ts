import { describe, expect, it, vi } from 'vitest';

vi.mock('./wizardContent.store', async () => {
    const { atom, map } = await import('nanostores');

    return {
        $wizardHasChanges: atom(false),
        $wizardContentPathExists: map({ fetching: false, exists: false }),
        $wizardContentState: atom(null),
        $contentType: atom(null),
    };
});

import { $previewResolution } from '../../../widgets/preview-panel/model/previewResolution.store';
import type { PreviewResult } from '../../../widgets/preview-panel/model/previewResolution.types';
import {
    $wizardActions,
    needsUnpublishedChildrenCheck,
    resolveSaveLabel,
    resolveWizardActions,
    type WizardActionEnvironment,
    type WizardActionFacts,
    type WizardActionId,
    type WizardPersistedFacts,
    type WizardSummaryFacts,
} from './wizardActions.store';

const persisted = (overrides: Partial<WizardPersistedFacts> = {}): WizardPersistedFacts => ({
    unnamed: false,
    deletable: true,
    editable: true,
    dataInherited: false,
    canDelete: true,
    ...overrides,
});

const summary = (overrides: Partial<WizardSummaryFacts> = {}): WizardSummaryFacts => ({
    online: false,
    published: false,
    hasChildren: false,
    inProgress: false,
    dataInherited: false,
    hasOriginProject: false,
    ...overrides,
});

const facts = (overrides: Partial<WizardActionFacts> = {}): WizardActionFacts => ({
    persisted: persisted(),
    summary: summary(),
    canModify: true,
    canPublish: true,
    existsInParentProject: false,
    deleteOnly: false,
    hasPublishRequest: false,
    ...overrides,
});

const env = (overrides: Partial<WizardActionEnvironment> = {}): WizardActionEnvironment => ({
    hasChanges: false,
    pathExists: false,
    contentState: 'ready',
    hasContentType: true,
    canRequestPublish: true,
    stashed: false,
    ...overrides,
});

const enabled = (id: WizardActionId, f: WizardActionFacts = facts(), e: WizardActionEnvironment = env()): boolean =>
    resolveWizardActions(f, e)[id].enabled;

const visible = (id: WizardActionId, f: WizardActionFacts = facts(), e: WizardActionEnvironment = env()): boolean =>
    resolveWizardActions(f, e)[id].visible;

describe('resolveWizardActions', () => {
    describe('save', () => {
        it('should need unsaved changes and a free path', () => {
            expect(enabled('save')).toBe(false);
            expect(enabled('save', facts(), env({ hasChanges: true }))).toBe(true);
            expect(enabled('save', facts(), env({ hasChanges: true, pathExists: true }))).toBe(false);
        });

        it('should need editable, modifiable content that is not inherited', () => {
            const changed = env({ hasChanges: true });

            expect(enabled('save', facts({ persisted: persisted({ editable: false }) }), changed)).toBe(false);
            expect(enabled('save', facts({ canModify: false }), changed)).toBe(false);
            expect(enabled('save', facts({ persisted: persisted({ dataInherited: true }) }), changed)).toBe(false);
        });

        it('should not look at the modify permission for new content', () => {
            expect(enabled('save', facts({ persisted: undefined, canModify: false }), env({ hasChanges: true }))).toBe(
                true,
            );
        });

        it('should be hidden for inherited content', () => {
            expect(visible('save')).toBe(true);
            expect(visible('save', facts({ persisted: persisted({ dataInherited: true }) }))).toBe(false);
        });

        it('should let Save and close follow the modify permission only', () => {
            expect(enabled('saveAndClose')).toBe(true);
            expect(enabled('saveAndClose', facts({ canModify: false }))).toBe(false);
        });
    });

    describe('archive, duplicate and move', () => {
        it('should archive new content and deletable content the user may delete', () => {
            expect(enabled('archive', facts({ persisted: undefined }))).toBe(true);
            expect(enabled('archive')).toBe(true);
            expect(enabled('archive', facts({ persisted: persisted({ deletable: false }) }))).toBe(false);
            expect(enabled('archive', facts({ persisted: persisted({ canDelete: false }) }))).toBe(false);
        });

        it('should keep archive in the delete-only mode', () => {
            expect(enabled('archive', facts({ deleteOnly: true }))).toBe(true);
        });

        it('should duplicate unless the parent forbids creating or the mode is delete-only', () => {
            expect(enabled('duplicate')).toBe(true);
            expect(enabled('duplicate', facts({ parentCanCreate: true }))).toBe(true);
            expect(enabled('duplicate', facts({ parentCanCreate: false }))).toBe(false);
            expect(enabled('duplicate', facts({ deleteOnly: true }))).toBe(false);
        });

        it('should move only named, persisted content', () => {
            expect(enabled('move')).toBe(true);
            expect(enabled('move', facts({ persisted: undefined }))).toBe(false);
            expect(enabled('move', facts({ persisted: persisted({ unnamed: true }) }))).toBe(false);
            expect(enabled('move', facts({ deleteOnly: true }))).toBe(false);
        });

        it('should not ask for a modify permission to move', () => {
            expect(enabled('move', facts({ canModify: false }))).toBe(true);
        });
    });

    describe('publish', () => {
        it('should publish valid content that is not online', () => {
            expect(enabled('publish')).toBe(true);
            expect(enabled('publish', facts({ summary: summary({ online: true }) }))).toBe(false);
            expect(enabled('publish', facts(), env({ contentState: 'invalid' }))).toBe(false);
            expect(enabled('publish', facts(), env({ contentState: null }))).toBe(false);
            expect(enabled('publish', facts(), env({ hasContentType: false }))).toBe(false);
        });

        it('should publish work in progress, which is marked as ready on the way', () => {
            expect(enabled('publish', facts(), env({ contentState: 'in-progress' }))).toBe(true);
        });

        it('should need the publish permission', () => {
            expect(enabled('publish', facts({ canPublish: false }))).toBe(false);
        });

        it('should not publish work in progress for a user who may not modify it', () => {
            expect(enabled('publish', facts({ canModify: false, summary: summary({ inProgress: true }) }))).toBe(false);
            expect(enabled('publish', facts({ canModify: false }))).toBe(true);
        });

        it('should stay off until the summary is known', () => {
            expect(enabled('publish', facts({ summary: undefined }))).toBe(false);
            expect(enabled('createIssue', facts({ summary: undefined }))).toBe(false);
            expect(enabled('unpublish', facts({ summary: undefined }))).toBe(false);
        });

        it('should publish the tree only when unpublished descendants are known to exist', () => {
            const parent = summary({ hasChildren: true });

            expect(enabled('publishTree', facts({ summary: parent }))).toBe(false);
            expect(enabled('publishTree', facts({ summary: parent, hasUnpublishedChildren: false }))).toBe(false);
            expect(enabled('publishTree', facts({ summary: parent, hasUnpublishedChildren: true }))).toBe(true);
            expect(enabled('publishTree', facts({ hasUnpublishedChildren: true }))).toBe(false);
        });

        it('should publish the tree of online content', () => {
            const onlineParent = summary({ hasChildren: true, online: true });

            expect(enabled('publishTree', facts({ summary: onlineParent, hasUnpublishedChildren: true }))).toBe(true);
        });

        it('should unpublish published content with the publish permission', () => {
            const published = summary({ published: true });

            expect(enabled('unpublish')).toBe(false);
            expect(enabled('unpublish', facts({ summary: published }))).toBe(true);
            expect(enabled('unpublish', facts({ summary: published, canPublish: false }))).toBe(false);
        });

        it('should mark as ready only work in progress the user may modify', () => {
            const inProgress = env({ contentState: 'in-progress' });

            expect(enabled('markAsReady')).toBe(false);
            expect(enabled('markAsReady', facts(), inProgress)).toBe(true);
            expect(enabled('markAsReady', facts({ canModify: false }), inProgress)).toBe(false);
        });

        it('should request publishing of valid content that is offline or has unpublished descendants', () => {
            const online = summary({ online: true, hasChildren: true });

            expect(enabled('requestPublish')).toBe(true);
            expect(enabled('requestPublish', facts(), env({ contentState: 'invalid' }))).toBe(false);
            expect(enabled('requestPublish', facts(), env({ canRequestPublish: false }))).toBe(false);
            expect(enabled('requestPublish', facts({ summary: online }))).toBe(false);
            expect(enabled('requestPublish', facts({ summary: online, hasUnpublishedChildren: true }))).toBe(true);
        });

        it('should always offer Create issue once the summary is known', () => {
            expect(enabled('createIssue', facts({ canPublish: false }))).toBe(true);
            expect(enabled('createIssue', facts(), env({ contentState: 'invalid' }))).toBe(true);
        });

        it('should show Open request only while a publish request exists', () => {
            expect(enabled('openRequest')).toBe(false);
            expect(visible('openRequest')).toBe(false);
            expect(enabled('openRequest', facts({ hasPublishRequest: true }))).toBe(true);
            expect(visible('openRequest', facts({ hasPublishRequest: true }))).toBe(true);
        });
    });

    describe('delete-only mode', () => {
        it('should hold back everything that publishes or copies the content', () => {
            const deleteOnly = facts({
                deleteOnly: true,
                summary: summary({ published: true, hasChildren: true }),
                hasUnpublishedChildren: true,
            });

            for (const id of ['publish', 'publishTree', 'unpublish', 'createIssue', 'duplicate', 'move'] as const) {
                expect(enabled(id, deleteOnly)).toBe(false);
            }
        });
    });

    describe('inherited content', () => {
        const inLayer = (dataInherited: boolean): WizardActionFacts =>
            facts({ existsInParentProject: true, summary: summary({ hasOriginProject: true, dataInherited }) });

        it('should offer Localize for inherited data and Reset for localized data', () => {
            expect(visible('localize', inLayer(true))).toBe(true);
            expect(enabled('localize', inLayer(true))).toBe(true);
            expect(visible('reset', inLayer(true))).toBe(false);

            expect(visible('reset', inLayer(false))).toBe(true);
            expect(enabled('reset', inLayer(false))).toBe(true);
            expect(visible('localize', inLayer(false))).toBe(false);
        });

        it('should show both disabled to a user who may not modify the content', () => {
            const readOnly = { ...inLayer(true), canModify: false };

            expect(visible('localize', readOnly)).toBe(true);
            expect(enabled('localize', readOnly)).toBe(false);
        });

        it('should hide both when the content is not in the parent project', () => {
            const own = facts({ summary: summary({ hasOriginProject: true }) });

            expect(visible('reset', own)).toBe(false);
            expect(visible('localize', own)).toBe(false);
        });
    });

    describe('stash', () => {
        it('should hold back the six actions that change the content tree or its publish state', () => {
            const all = facts({
                summary: summary({ published: true, hasChildren: true }),
                hasUnpublishedChildren: true,
            });
            const stashed = env({ stashed: true, hasChanges: true, contentState: 'in-progress' });

            for (const id of ['archive', 'duplicate', 'move', 'publish', 'publishTree', 'unpublish'] as const) {
                expect(enabled(id, all, env({ contentState: 'in-progress' }))).toBe(true);
                expect(enabled(id, all, stashed)).toBe(false);
            }

            for (const id of ['save', 'markAsReady', 'requestPublish', 'createIssue'] as const) {
                expect(enabled(id, all, stashed)).toBe(true);
            }
        });
    });
});

describe('activity', () => {
    it('should hold back Save and Save and close while Save is saving', () => {
        const saving = env({ hasChanges: true, activity: { saving: true, saved: false } });

        expect(enabled('save', facts(), saving)).toBe(false);
        expect(enabled('saveAndClose', facts(), saving)).toBe(false);
        expect(enabled('publish', facts(), saving)).toBe(true);
    });

    it('should hold back the action that is saving before it opens its dialog', () => {
        const busy = env({ activity: { busy: 'publish', saving: false, saved: false } });

        expect(enabled('publish', facts(), busy)).toBe(false);
        expect(enabled('requestPublish', facts(), busy)).toBe(true);
    });
});

describe('resolveSaveLabel', () => {
    it('should say Save until the Save action has saved once', () => {
        expect(resolveSaveLabel(false, env())).toBe('save');
    });

    it('should say Saving while the Save action is saving', () => {
        expect(resolveSaveLabel(false, env({ activity: { saving: true, saved: true } }))).toBe('saving');
    });

    it('should say Saved after a save until there is something to save again', () => {
        const saved = { saving: false, saved: true };

        expect(resolveSaveLabel(false, env({ activity: saved }))).toBe('saved');
        expect(resolveSaveLabel(false, env({ activity: saved, hasChanges: true }))).toBe('save');
        expect(resolveSaveLabel(true, env({ activity: saved }))).toBe('save');
    });
});

describe('needsUnpublishedChildrenCheck', () => {
    const parent = facts({ summary: summary({ hasChildren: true }) });

    it('should skip content without children or without a summary', () => {
        expect(needsUnpublishedChildrenCheck(facts(), env())).toBe(false);
        expect(needsUnpublishedChildrenCheck(facts({ summary: undefined }), env())).toBe(false);
    });

    it('should ask when the tree can be published', () => {
        expect(needsUnpublishedChildrenCheck(parent, env({ canRequestPublish: false }))).toBe(true);
    });

    it('should ask for valid content the user may request publishing for', () => {
        const noPublish = { ...parent, canPublish: false };

        expect(needsUnpublishedChildrenCheck(noPublish, env())).toBe(true);
        expect(needsUnpublishedChildrenCheck(noPublish, env({ canRequestPublish: false }))).toBe(false);
        expect(needsUnpublishedChildrenCheck(noPublish, env({ contentState: 'invalid' }))).toBe(false);
    });
});

describe('preview', () => {
    const settle = (pending: boolean, kind?: string): void => {
        $previewResolution.set({
            request: undefined,
            pending,
            result: kind ? ({ kind } as unknown as PreviewResult) : undefined,
        });
    };

    it('should be enabled only when the preview is resolved', () => {
        expect(resolveWizardActions(facts(), env()).preview.enabled).toBe(false);
        expect(resolveWizardActions(facts(), env({ previewReady: true })).preview.enabled).toBe(true);
        expect(resolveWizardActions(facts(), env({ previewReady: true, stashed: true })).preview.enabled).toBe(true);
    });

    it('should follow the preview resolution', () => {
        const unbind = $wizardActions.listen(() => undefined);
        const enabled = (): boolean => $wizardActions.get().preview.enabled;

        settle(false, 'ready');
        expect(enabled()).toBe(true);

        settle(true, 'ready');
        expect(enabled()).toBe(false);

        // a failed or cleared request leaves it off, as the pending one did
        settle(false, 'error');
        expect(enabled()).toBe(false);
        settle(false);
        expect(enabled()).toBe(false);

        settle(false, 'ready');
        expect(enabled()).toBe(true);

        // clearing after a ready result does not switch it off
        settle(false);
        expect(enabled()).toBe(true);

        unbind();
    });
});
