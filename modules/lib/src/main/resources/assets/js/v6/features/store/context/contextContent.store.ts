import {atom, onMount} from 'nanostores';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {$currentItem as $treeContent} from '../contentTreeSelection.store';
import {$mode, getMode} from '../mode.store';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {$contentUpdated} from '../socket.store';

const $wizardContent = atom<ContentSummaryAndCompareStatus | null>(null);

export const $contextContent = atom<ContentSummaryAndCompareStatus | null>(null);

//
// * Public API
//

export const openContextContentForEdit = (): void => {
    const content = $contextContent.get();

    if (!content) {
        return;
    }

    new EditContentEvent([content]).fire();
};

export const setContextContent = (content: ContentSummaryAndCompareStatus): void => {
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

// Update the context content when the content is updated.
$contentUpdated.subscribe((event) => {
    if (!event?.data?.length) return;

    const contextContent = $contextContent.get();

    if (!contextContent) return;

    const updatedContextContent = event.data.find((item) => item.getId() === contextContent.getId());

    if (!updatedContextContent || getMode() !== 'wizard') return;

    setContextContent(updatedContextContent);
});
