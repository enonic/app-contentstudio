import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {MovedContentItem} from '../../../../app/browse/MovedContentItem';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentIds} from '../../../../app/content/ContentIds';
import {ContentPath} from '../../../../app/content/ContentPath';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {MoveContentRequest} from '../../../../app/resource/MoveContentRequest';
import {$contentMoved} from '../socket.store';

//
// * Store State
//

type MoveDialogStore = {
    // Dialog state
    open: boolean;
    loading: boolean;
    failed: boolean;
    // Content
    items: ContentSummaryAndCompareStatus[];
    targetPath: ContentPath | null;
    // Pending operation (after dialog closes)
    submitting: boolean;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
};

const initialState: MoveDialogStore = {
    open: false,
    loading: false,
    failed: false,
    items: [],
    targetPath: null,
    submitting: false,
    pendingIds: [],
    pendingTotal: 0,
};

export const $moveDialog = map<MoveDialogStore>(structuredClone(initialState));

//
// * Derived State
//

export const $moveItemsCount = computed($moveDialog, ({items}) => items.length);

export const $isMoveDialogReady = computed($moveDialog, (state) => {
    return state.open && !state.loading && !state.failed && !state.submitting && state.items.length > 0 && state.targetPath !== null;
});

//
// * Instance Guard
//

// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;

//
// * Public API
//

export const openMoveDialog = (items: ContentSummaryAndCompareStatus[]): void => {
    if (items.length === 0) {
        return;
    }

    $moveDialog.set({
        ...structuredClone(initialState),
        open: true,
        items,
    });
};

export const cancelMoveDialog = (): void => {
    const {submitting} = $moveDialog.get();
    if (submitting) {
        return;
    }

    resetMoveDialogContext();
};

export const resetMoveDialogContext = (): void => {
    instanceId += 1;
    $moveDialog.set(structuredClone(initialState));
};

export const setMoveTargetPath = (path: ContentPath | null): void => {
    $moveDialog.setKey('targetPath', path);
};

export const executeMoveDialogAction = async (): Promise<void> => {
    const state = $moveDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0 || !state.targetPath) {
        return;
    }

    const totalCount = state.items.length;
    const pendingIds = state.items.map(item => item.getContentId().toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();

    const contentIds = ContentIds.from(state.items.map(item => item.getContentId()));
    const request = new MoveContentRequest(contentIds, state.targetPath);

    try {
        $moveDialog.set({
            ...state,
            open: false,
            submitting: true,
            pendingIds,
            pendingTotal: totalCount,
            pendingPrimaryName,
        });

        await request.sendAndParse();
    } catch (error) {
        showError(error?.message ?? String(error));
        $moveDialog.set({
            ...state,
            submitting: false,
            pendingIds: [],
            pendingTotal: 0,
        });
    }
};

//
// * Completion Handling
//

const handleMoveCompletionEvent = (movedItems: MovedContentItem[]): void => {
    const ids = new Set(movedItems.map(moved => moved.item.getContentId().toString()));
    const state = $moveDialog.get();
    const {pendingIds} = state;

    if (pendingIds.length === 0) {
        return;
    }

    const remaining = pendingIds.filter(id => !ids.has(id));
    if (remaining.length === 0) {
        const total = state.pendingTotal || pendingIds.length;
        const message = total > 1
            ? i18n('notify.item.movedMultiple', total)
            : i18n('notify.item.moved', state.pendingPrimaryName ?? '');
        NotifyManager.get().showSuccess(message);
        resetMoveDialogContext();
        return;
    }

    $moveDialog.setKey('pendingIds', remaining);
};

//
// * Socket Event Handlers
//

$contentMoved.subscribe((event) => {
    if (!event) {
        return;
    }
    handleMoveCompletionEvent(event.data);
});
