// Keeps the publish or request dialog in line with what changes on the server while it is open.
// Started from the app root; never a side effect of importing.

import type { MovedContentItem } from '../../../../app/browse/MovedContentItem';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';
import { createGuardedSocketHandler } from '../../../shared/lib/store/createGuardedSocketHandler';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentDuplicated,
    $contentMoved,
    $contentPermissionsUpdated,
    $contentPublished,
    $contentRenamed,
    $contentUnpublished,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import {
    applyPublishOrRequestContentChanges,
    applyPublishOrRequestPermissionChanges,
    applyPublishOrRequestUnpublishedContents,
    refreshPublishOrRequestItemsWithChangedDescendants,
    removePublishOrRequestContents,
} from './commands/events';
import { $publishOrRequestDialog } from './publishOrRequestDialog.store';

export const start = (): void => {
    if (unsubscribers.length > 0) return;

    unsubscribers = [
        $contentUpdated.subscribe(onEvent((event) => applyPublishOrRequestContentChanges(event.data))),
        $contentRenamed.subscribe(onEvent((event) => applyPublishOrRequestContentChanges(event.data.items))),
        $contentMoved.subscribe(onEvent((event) => applyPublishOrRequestContentChanges(toSummaries(event.data)))),
        $contentPublished.subscribe(
            onEvent((event) => {
                applyPublishOrRequestContentChanges(event.data);
                void refreshPublishOrRequestItemsWithChangedDescendants(event.data);
            }),
        ),
        $contentUnpublished.subscribe(onEvent((event) => applyPublishOrRequestUnpublishedContents(event.data))),
        $contentPermissionsUpdated.subscribe(onEvent((event) => applyPublishOrRequestPermissionChanges(event.data))),
        $contentDeleted.subscribe(onEvent((event) => removePublishOrRequestContents(toContentIds(event.data)))),
        $contentArchived.subscribe(onEvent((event) => removePublishOrRequestContents(toContentIds(event.data)))),
        $contentCreated.subscribe(
            onEvent((event) => void refreshPublishOrRequestItemsWithChangedDescendants(event.data)),
        ),
        $contentDuplicated.subscribe(
            onEvent((event) => void refreshPublishOrRequestItemsWithChangedDescendants(event.data)),
        ),
    ];
};

export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};

// *
// * Internal
// *

let unsubscribers: (() => void)[] = [];

// Events are of no interest while the dialog is closed, nor while it is being submitted:
// what is sent is what was on screen.
const onEvent = createGuardedSocketHandler(() => {
    const { open, submitting } = $publishOrRequestDialog.get();

    return open && submitting == null;
});

const toContentIds = (items: ContentServerChangeItem[]): ContentId[] => items.map((item) => item.getContentId());

const toSummaries = (moved: MovedContentItem[]): ContentSummary[] => moved.map(({ item }) => item.getContentSummary());
