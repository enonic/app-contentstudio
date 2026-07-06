import { atom, computed } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { FragmentComponent } from '../../../../app/page/region/FragmentComponent';
import { fetchFragmentSummaries } from '../api/fragments.api';
import { $contentContext, $inspectedItem, $pageVersion } from './page-editor/store';

//
// * State
//

export const $fragmentOptions = atom<ContentSummary[]>([]);

export const $isFragmentInspectionLoading = atom<boolean>(false);

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
// * Service
//

const cleanups: (() => void)[] = [];

export function initFragmentInspectionService(): void {
    cleanupFragmentInspection();

    const unsubContext = $contentContext.subscribe((ctx) => {
        if (!ctx) return;

        $isFragmentInspectionLoading.set(true);

        void (async () => {
            try {
                const result = await fetchFragmentSummaries(ctx.sitePath ?? undefined);

                if (result.isOk()) {
                    $fragmentOptions.set(result.value);
                }
                // On error, keep the empty list.
            } finally {
                $isFragmentInspectionLoading.set(false);
            }
        })();
    });
    cleanups.push(unsubContext);
}

export function cleanupFragmentInspection(): void {
    for (const fn of cleanups) fn();
    cleanups.length = 0;

    $fragmentOptions.set([]);
    $isFragmentInspectionLoading.set(false);
}
