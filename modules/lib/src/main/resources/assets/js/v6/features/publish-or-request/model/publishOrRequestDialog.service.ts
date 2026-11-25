// Keeps the publish or request dialog in line with what changes on the server while it is open.
// Started from the app root; never a side effect of importing.

import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';
import { createGuardedSocketHandler } from '../../../shared/lib/store/createGuardedSocketHandler';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentDuplicated,
    $contentPublished,
    $contentRenamed,
    $contentUnpublished,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import {
    applyPublishOrRequestContentChanges,
    applyPublishOrRequestUnpublishedContents,
    refreshPublishOrRequestItemsWithNewDescendants,
    removePublishOrRequestContents,
} from './commands/events';
import { $publishOrRequestDialog } from './publishOrRequestDialog.store';

export const start = (): void => {
    if (unsubscribers.length > 0) return;

    unsubscribers = [
        $contentUpdated.subscribe(onEvent((event) => applyPublishOrRequestContentChanges(event.data))),
        $contentRenamed.subscribe(onEvent((event) => applyPublishOrRequestContentChanges(event.data.items))),
        $contentPublished.subscribe(onEvent((event) => applyPublishOrRequestContentChanges(event.data))),
        $contentUnpublished.subscribe(onEvent((event) => applyPublishOrRequestUnpublishedContents(event.data))),
        $contentDeleted.subscribe(onEvent((event) => removePublishOrRequestContents(toContentIds(event.data)))),
        $contentArchived.subscribe(onEvent((event) => removePublishOrRequestContents(toContentIds(event.data)))),
        $contentCreated.subscribe(onEvent((event) => void refreshPublishOrRequestItemsWithNewDescendants(event.data))),
        $contentDuplicated.subscribe(
            onEvent((event) => void refreshPublishOrRequestItemsWithNewDescendants(event.data)),
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

// Events are of no interest while the dialog is closed.
const onEvent = createGuardedSocketHandler(() => $publishOrRequestDialog.get().open);

const toContentIds = (items: ContentServerChangeItem[]): ContentId[] => items.map((item) => item.getContentId());
