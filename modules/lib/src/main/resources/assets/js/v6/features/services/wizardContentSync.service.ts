import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { showFeedback } from '@enonic/lib-admin-ui/notify/MessageBus';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import type { Content } from '../../../app/content/Content';
import type { ContentId } from '../../../app/content/ContentId';
import type { ContentSummary } from '../../../app/content/ContentSummary';
import { GetContentByIdRequest } from '../../../app/resource/GetContentByIdRequest';
import { $contentRenamed, $contentUpdated } from '../../shared/socket/socket.store';
import {
    $wizardPersistedWorkflowState,
    applyWorkflowFromServer,
    applyServerSidePersistedContent,
    onWizardPersistedContentSet,
} from '../store/wizardContent.store';
import { resetMixinChangedPaths } from '../store/wizardMixinData.store';

//
// * State
//

let unsubscribePersistedContent: (() => void) | null = null;
const unsubscribeSocketListeners: (() => void)[] = [];

let wizardContentId: ContentId | null = null;
let lastKnownModifiedTimeMs: number | null = null;
let pendingFetchToken = 0;

//
// * Private
//

function applyContentToStores(content: Content): void {
    const { syncedMixinNames } = applyServerSidePersistedContent(content);

    // Per-mixin changedPaths live outside the wizard store.
    for (const name of syncedMixinNames) {
        resetMixinChangedPaths(name);
    }

    showFeedback(i18n('notify.wizard.serverUpdate'));
}

function findMatchingSummary(contents: readonly ContentSummary[] | undefined): ContentSummary | null {
    if (!wizardContentId || !contents?.length) {
        return null;
    }

    return contents.find((summary) => wizardContentId?.equals(summary.getContentId())) ?? null;
}

function getModifiedTimeMs(content: Content | ContentSummary | null | undefined): number | null {
    const modifiedTime = content?.getModifiedTime();
    return modifiedTime ? modifiedTime.getTime() : null;
}

async function fetchAndApply(contentId: ContentId): Promise<void> {
    const token = ++pendingFetchToken;

    try {
        const content = await new GetContentByIdRequest(contentId).sendAndParse();

        if (token !== pendingFetchToken) return;

        // Own save may have completed during the await — its modifiedTime would
        // already be recorded. A stale fetch must not roll the form back.
        const fetchedMs = getModifiedTimeMs(content);
        if (fetchedMs != null && lastKnownModifiedTimeMs != null && fetchedMs < lastKnownModifiedTimeMs) {
            return;
        }

        applyContentToStores(content);
        lastKnownModifiedTimeMs = fetchedMs;
    } catch (error) {
        if (token === pendingFetchToken) {
            DefaultErrorHandler.handle(error);
        }
    }
}

function handleSummaryEvent(contents: readonly ContentSummary[] | undefined): void {
    const summary = findMatchingSummary(contents);
    if (summary == null) return;

    const summaryModifiedMs = getModifiedTimeMs(summary);
    const isEcho =
        summaryModifiedMs != null && lastKnownModifiedTimeMs != null && summaryModifiedMs <= lastKnownModifiedTimeMs;

    if (isEcho) {
        // A strictly-older echo is stale — ignore it. Applying its outdated workflow
        // would roll back a newer state, e.g. revert READY to IN_PROGRESS after
        // mark-as-ready when the earlier in-progress save's event arrives late.
        if (summaryModifiedMs < lastKnownModifiedTimeMs) {
            return;
        }
        const summaryWorkflowState = summary.getWorkflow()?.getState() ?? null;
        if (summaryWorkflowState !== $wizardPersistedWorkflowState.get()) {
            applyWorkflowFromServer(summaryWorkflowState);
        }
        return;
    }

    void fetchAndApply(summary.getContentId());
}

//
// * Public API
//

export function recordOwnContentModification(content: Content | ContentSummary | null | undefined): void {
    const modifiedMs = getModifiedTimeMs(content);
    if (modifiedMs == null) return;

    if (lastKnownModifiedTimeMs == null || modifiedMs > lastKnownModifiedTimeMs) {
        lastKnownModifiedTimeMs = modifiedMs;
    }
}

// nanostores subscribe() fires once synchronously with the current value; drop
// that replay so we don't act on an event from before the wizard opened.
function subscribeFresh<T>(
    atom: { subscribe: (cb: (value: T) => void) => () => void },
    handler: (value: T) => void,
): () => void {
    let primed = false;
    return atom.subscribe((value) => {
        if (!primed) {
            primed = true;
            return;
        }
        handler(value);
    });
}

export function initWizardContentSyncService(): void {
    cleanupWizardContentSyncService();

    unsubscribePersistedContent = onWizardPersistedContentSet((content: Content) => {
        wizardContentId = content.getContentId();
        lastKnownModifiedTimeMs = getModifiedTimeMs(content);
    });

    unsubscribeSocketListeners.push(
        subscribeFresh($contentUpdated, (event) => handleSummaryEvent(event?.data)),
        subscribeFresh($contentRenamed, (event) => handleSummaryEvent(event?.data?.items)),
    );
}

export function cleanupWizardContentSyncService(): void {
    unsubscribePersistedContent?.();
    unsubscribePersistedContent = null;

    while (unsubscribeSocketListeners.length > 0) {
        const unsubscribe = unsubscribeSocketListeners.pop();
        unsubscribe?.();
    }

    wizardContentId = null;
    lastKnownModifiedTimeMs = null;
    pendingFetchToken += 1;
}
