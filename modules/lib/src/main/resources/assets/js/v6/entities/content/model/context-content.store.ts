import { atom, computed, onMount } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { $mode } from '../../../shared/app-state/mode.store';
import { $activeId, $currentItem, $selection } from './content-selection.store';
import { $contentCache } from './content.store';

type BrowseContextTarget = {
    id: string;
    selection: ReadonlySet<string>;
    activeId: string | null;
};

const $wizardContent = atom<ContentSummary | null>(null);

// An explicitly requested item, honored until the tree selection or active item changes.
const $browseContextTarget = atom<BrowseContextTarget | null>(null);

const $treeContent = computed(
    [$currentItem, $browseContextTarget, $selection, $activeId, $contentCache],
    (currentItem, target, selection, activeId, cache) => {
        if (target == null || target.selection !== selection || target.activeId !== activeId) return currentItem;
        return cache[target.id] ?? currentItem;
    },
);

// The content the UI is about: the wizard's content in wizard mode, the tree's current item in browser mode.
export const $contextContent = atom<ContentSummary | null>(null);

//
// * Public API
//

export const setWizardContent = (content: ContentSummary): void => {
    $wizardContent.set(content);
};

export const setBrowseContextTarget = (id: string): void => {
    $browseContextTarget.set({ id, selection: $selection.get(), activeId: $activeId.get() });
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
