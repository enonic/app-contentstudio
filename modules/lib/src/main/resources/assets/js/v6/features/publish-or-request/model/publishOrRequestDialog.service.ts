// Keeps the publish or request dialog in line with what changes on the server while it is open.
// Started from the app root; never a side effect of importing.

import { createGuardedSocketHandler } from '../../../shared/lib/store/createGuardedSocketHandler';
import { $contentRenamed, $contentUpdated } from '../../../shared/socket/socket.store';
import { applyPublishOrRequestContentChanges } from './commands/events';
import { $publishOrRequestDialog } from './publishOrRequestDialog.store';

export const start = (): void => {
    if (unsubscribers.length > 0) return;

    unsubscribers = [
        $contentUpdated.subscribe(onEvent((event) => applyPublishOrRequestContentChanges(event.data))),
        $contentRenamed.subscribe(onEvent((event) => applyPublishOrRequestContentChanges(event.data.items))),
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
