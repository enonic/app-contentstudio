import { atom, computed } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { FragmentComponent } from '../../../../app/page/region/FragmentComponent';
import { $inspectedItem, $pageVersion } from './page-editor/store';

//
// * State
//

export const $fragmentOptions = atom<ContentSummary[]>([]);

export const $isFragmentInspectionLoading = atom<boolean>(false);

export const $areFragmentOptionsResolved = atom(false);

//
// * Computed
//

export const $selectedFragmentId = computed([$inspectedItem, $pageVersion], (item): string | null => {
    if (item instanceof FragmentComponent && item.hasFragment()) {
        return item.getFragment().toString();
    }
    return null;
});

//
// * Commands
//

export function resetFragmentInspection(): void {
    $fragmentOptions.set([]);
    $areFragmentOptionsResolved.set(false);
    $isFragmentInspectionLoading.set(false);
}
