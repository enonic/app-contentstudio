import { atom, computed, onMount } from 'nanostores';
import { $currentItem as $treeContent } from '../../../entities/content';
import type { CompareResult } from '../../../entities/content';
import { $mode } from '../../../shared/app-state/mode.store';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

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

//
// * Compare Status State
//

// Written by contextContent.service.ts, which verifies the compare status.
export const $contextCompareResult = atom<CompareResult | undefined>(undefined);
export const $contextCompareLoading = atom<boolean>(false);

export const $contextContentCompareResult = computed($contextCompareResult, (result) => result);
export const $isContextCompareLoading = computed($contextCompareLoading, (loading) => loading);
