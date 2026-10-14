import { atom, onMount } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { $mode } from '../../../shared/app-state/mode.store';
import { $currentItem as $treeContent } from './content-selection.store';

const $wizardContent = atom<ContentSummary | null>(null);

// The content the UI is about: the wizard's content in wizard mode, the tree's current item in browser mode.
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
