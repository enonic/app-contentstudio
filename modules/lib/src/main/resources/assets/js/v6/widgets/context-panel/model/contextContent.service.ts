import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { compareContent } from '../../../entities/content';
import { getMode } from '../../../shared/app-state/mode.store';
import { calcSecondaryStatus, calcTreePublishStatus } from '../../../shared/lib/cms/content/status';
import {
    $contentMoved,
    $contentPublished,
    $contentUnpublished,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import {
    $contextCompareLoading,
    $contextCompareResult,
    $contextContent,
    setWizardContent,
} from './contextContent.store';

//
// * Context Content Service
//
// Keeps the wizard context content in sync with socket events and verifies
// the compare (modified) status whenever the context content changes.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Socket Sync
//

// Update wizard content when content changes come through socket events.
// Only relevant in wizard mode, since browser mode derives context from the tree selection store.
const updateWizardContentFromEvent = (data: ContentSummary[] | undefined): void => {
    if (!data?.length || getMode() !== 'wizard') return;

    const contextContent = $contextContent.get();
    if (!contextContent) return;

    const match = data.find((item) => item.getId() === contextContent.getId());
    if (match) {
        setWizardContent(match);
    }
};

//
// * Compare Status Verification
//

function needsCompareVerification(content: Readonly<ContentSummary>): boolean {
    const publishStatus = calcTreePublishStatus(content as ContentSummary);
    return calcSecondaryStatus(publishStatus, content as ContentSummary) === 'modified';
}

async function fetchContextCompareStatus(content: Readonly<ContentSummary>): Promise<void> {
    $contextCompareLoading.set(true);

    try {
        const result = await compareContent([content.getId()]);

        // Verify content hasn't changed while request was in-flight
        if ($contextContent.get()?.getId() !== content.getId()) return;

        $contextCompareResult.set(result.get(content.getId()));
    } catch (error) {
        console.error(error);
    } finally {
        $contextCompareLoading.set(false);
    }
}

//
// * Service Lifecycle
//

/**
 * Start the context content wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        $contentUpdated.subscribe((event) => updateWizardContentFromEvent(event?.data)),
        $contentPublished.subscribe((event) => updateWizardContentFromEvent(event?.data)),
        $contentUnpublished.subscribe((event) => updateWizardContentFromEvent(event?.data)),
        $contentMoved.subscribe((event) =>
            updateWizardContentFromEvent(event?.data?.map((moved) => moved.item.getContentSummary())),
        ),
        $contextContent.subscribe((content) => {
            $contextCompareResult.set(undefined);

            if (!content || !needsCompareVerification(content)) {
                $contextCompareLoading.set(false);
                return;
            }

            void fetchContextCompareStatus(content);
        }),
    ];
};

/**
 * Stop the context content wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
