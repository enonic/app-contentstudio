import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentId} from '../../../app/content/ContentId';
import type {Content} from '../../../app/content/Content';
import type {ContentSummary} from '../../../app/content/ContentSummary';
import {emitContentUpdated} from '../store/socket.store';
import {cleanupWizardContentSyncService, initWizardContentSyncService, recordOwnContentModification} from './wizardContentSync.service';

const CONTENT_ID = 'content-1';
const BASE_MODIFIED_MS = 1_000;

const mocks = vi.hoisted(() => ({
    persistedCallback: {current: null as ((content: Content) => void) | null},
    applyServerSidePersistedContent: vi.fn(() => ({syncedMixinNames: new Set<string>()})),
    sendAndParse: vi.fn(),
}));

vi.mock('../store/wizardContent.store', () => ({
    onWizardPersistedContentSet: (callback: (content: Content) => void) => {
        mocks.persistedCallback.current = callback;
        return () => {
            mocks.persistedCallback.current = null;
        };
    },
    applyServerSidePersistedContent: mocks.applyServerSidePersistedContent,
}));

vi.mock('../store/wizardMixinData.store', () => ({
    resetMixinChangedPaths: vi.fn(),
}));

vi.mock('../../../app/resource/GetContentByIdRequest', () => ({
    GetContentByIdRequest: class {
        sendAndParse = mocks.sendAndParse;
    },
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showFeedback: vi.fn(),
}));

vi.mock('@enonic/lib-admin-ui/util/Messages', () => ({
    i18n: (key: string) => key,
}));

vi.mock('@enonic/lib-admin-ui/DefaultErrorHandler', () => ({
    DefaultErrorHandler: {handle: vi.fn()},
}));

function summary({id = CONTENT_ID, modifiedMs}: {id?: string; modifiedMs: number}): ContentSummary {
    return {
        getContentId: () => new ContentId(id),
        getModifiedTime: () => new Date(modifiedMs),
    } as unknown as ContentSummary;
}

function setWizardContent(modifiedMs: number): void {
    mocks.persistedCallback.current?.({
        getContentId: () => new ContentId(CONTENT_ID),
        getModifiedTime: () => new Date(modifiedMs),
    } as unknown as Content);
}

describe('wizardContentSync.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        initWizardContentSyncService();
        setWizardContent(BASE_MODIFIED_MS);
    });

    afterEach(() => {
        cleanupWizardContentSyncService();
        vi.restoreAllMocks();
    });

    it('ignores an echo event whose modifiedTime matches the wizard baseline', () => {
        emitContentUpdated([summary({modifiedMs: BASE_MODIFIED_MS})]);

        expect(mocks.sendAndParse).not.toHaveBeenCalled();
    });

    it('fetches and applies full content for a non-echo update', async () => {
        mocks.sendAndParse.mockResolvedValue({
            getModifiedTime: () => new Date(BASE_MODIFIED_MS + 1_000),
        } as unknown as Content);

        emitContentUpdated([summary({modifiedMs: BASE_MODIFIED_MS + 1_000})]);

        await vi.waitFor(() => expect(mocks.applyServerSidePersistedContent).toHaveBeenCalledTimes(1));
    });

    it('treats the echo from a recorded own change (e.g. localize) as an echo, not a server update', () => {
        const localizedMs = BASE_MODIFIED_MS + 1_000;

        recordOwnContentModification(summary({modifiedMs: localizedMs}));

        emitContentUpdated([summary({modifiedMs: localizedMs})]);

        expect(mocks.sendAndParse).not.toHaveBeenCalled();
        expect(mocks.applyServerSidePersistedContent).not.toHaveBeenCalled();
    });

    it('ignores events for other content', () => {
        emitContentUpdated([summary({id: 'other', modifiedMs: BASE_MODIFIED_MS})]);

        expect(mocks.sendAndParse).not.toHaveBeenCalled();
    });
});
