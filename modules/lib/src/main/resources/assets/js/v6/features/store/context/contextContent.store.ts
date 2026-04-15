import {atom, computed, onMount} from 'nanostores';
import {$currentItem as $treeContent} from '../contentTreeSelection.store';
import {$mode, getMode} from '../mode.store';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {type CompareResult, compareContent} from '../../api/compare';
import {calcSecondaryStatus, calcTreePublishStatus} from '../../utils/cms/content/status';
import {$contentMoved, $contentPublished, $contentUnpublished, $contentUpdated} from '../socket.store';

const $wizardContent = atom<ContentSummary | null>(null);

export const $contextContent = atom<ContentSummary | null>(null);

//
// * Public API
//


export const setWizardContent = (content: ContentSummary): void => {
    $wizardContent.set(content);
};

//
// * Initialization
//

// Avoid defining contextContent as computed, since that would depend on both wizardContent and treeContent, which would imply in non-relevant dependencies.
// If mode is browser, the only relevant store is the tree content store.
// If mode is wizard, the only relevant store is the wizard content store.
onMount($contextContent, () => {
    let contentUnsubscription: (() => void) | undefined;

    const modeUnsubscription = $mode.subscribe((mode) => {
        contentUnsubscription?.();

        if (mode === 'wizard') {
            contentUnsubscription = $wizardContent.subscribe(() => {
                $contextContent.set($wizardContent.get());
            });
            return;
        }

        if (mode === 'browser') {
            contentUnsubscription = $treeContent.subscribe(() => {
                $contextContent.set($treeContent.get());
            });
            return;
        }

        $contextContent.set(null);
        contentUnsubscription = undefined;
    });

    return () => {
        contentUnsubscription?.();
        modeUnsubscription();
    };
});

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

$contentUpdated.subscribe((event) => updateWizardContentFromEvent(event?.data));

$contentPublished.subscribe((event) => updateWizardContentFromEvent(event?.data));

$contentUnpublished.subscribe((event) => updateWizardContentFromEvent(event?.data));

$contentMoved.subscribe((event) => updateWizardContentFromEvent(event?.data?.map((moved) => moved.item.getContentSummary())));

//
// * Compare status verification
//

const $contextCompareResult = atom<CompareResult | undefined>(undefined);
const $contextCompareLoading = atom<boolean>(false);

export const $contextContentCompareResult = computed($contextCompareResult, (result) => result);
export const $isContextCompareLoading = computed($contextCompareLoading, (loading) => loading);

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

$contextContent.subscribe((content) => {
    $contextCompareResult.set(undefined);

    if (!content || !needsCompareVerification(content)) {
        $contextCompareLoading.set(false);
        return;
    }

    void fetchContextCompareStatus(content);
});
