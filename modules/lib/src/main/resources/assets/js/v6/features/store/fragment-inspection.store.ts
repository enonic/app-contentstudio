import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {atom, computed} from 'nanostores';
import type {ContentSummary} from '../../../app/content/ContentSummary';
import {FragmentComponent} from '../../../app/page/region/FragmentComponent';
import {FragmentContentSummaryRequest} from '../../../app/resource/FragmentContentSummaryRequest';
import {$contentContext, $inspectedItem, $pageVersion} from './page-editor/store';

//
// * State
//

export const $fragmentOptions = atom<ContentSummary[]>([]);

export const $isFragmentInspectionLoading = atom<boolean>(false);

//
// * Computed
//

export const $selectedFragmentId = computed(
    [$inspectedItem, $pageVersion],
    (item): string | null => {
        if (item instanceof FragmentComponent && item.hasFragment()) {
            return item.getFragment().toString();
        }
        return null;
    },
);

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
                const fragments = await loadFragmentSummaries(ctx.sitePath);
                $fragmentOptions.set(fragments);
            } catch {
                // Failed to load — keep empty list
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

//
// * Internal
//

async function loadFragmentSummaries(sitePath: string | null): Promise<ContentSummary[]> {
    const request = new FragmentContentSummaryRequest();
    request.setAllowedContentTypeNames([ContentTypeName.FRAGMENT]);
    request.setSize(-1);
    if (sitePath) {
        request.setParentSitePath(sitePath);
    }

    // Q.Promise is thenable — await works directly
    return await request.sendAndParse() as unknown as ContentSummary[];
}
