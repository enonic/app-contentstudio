import { atom, computed } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { FragmentComponent } from '../../../../app/page/region/FragmentComponent';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentCreated,
    $contentDeleted,
    $contentMoved,
    $contentRenamed,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import { fetchFragmentSummaries } from '../api/fragments.api';
import { $contentContext, $contentScopeKey, $inspectedItem, $pageVersion } from './page-editor/store';

//
// * State
//

export const $fragmentOptions = atom<ContentSummary[]>([]);

export const $isFragmentInspectionLoading = atom<boolean>(false);

export const $areFragmentOptionsResolved = atom<boolean>(false);

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
let started = false;
let activeScopeKey: string | null = null;
let activeIdentityKey: string | null = null;
let abortController: AbortController | null = null;

function identityKey(): string | null {
    const ctx = $contentContext.get();
    return ctx
        ? JSON.stringify([ctx.contentId.toString(), ctx.contentTypeName.toString(), ctx.siteId?.toString() ?? null])
        : null;
}

function refreshFragments(): void {
    const ctx = $contentContext.get();
    const scopeKey = $contentScopeKey.get();
    if (!ctx || !scopeKey || scopeKey !== activeScopeKey) return;

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;
    $isFragmentInspectionLoading.set(true);

    void (async () => {
        try {
            const result = await fetchFragmentSummaries(ctx.sitePath ?? undefined, controller.signal);
            if (!controller.signal.aborted && activeScopeKey === scopeKey && result.isOk()) {
                $fragmentOptions.set(result.value);
                $areFragmentOptionsResolved.set(true);
            }
        } catch {
            // Keep the last successful options on a failed refresh.
        } finally {
            if (!controller.signal.aborted) {
                abortController = null;
                $isFragmentInspectionLoading.set(false);
            }
        }
    })();
}

export function initFragmentInspectionService(): void {
    if (started) {
        if (!$areFragmentOptionsResolved.get() && !$isFragmentInspectionLoading.get()) refreshFragments();
        return;
    }
    started = true;

    cleanups.push(
        $contentScopeKey.subscribe((scopeKey) => {
            if (scopeKey === activeScopeKey) return;
            const nextIdentityKey = identityKey();
            const sameIdentity = nextIdentityKey !== null && nextIdentityKey === activeIdentityKey;
            activeScopeKey = scopeKey;
            activeIdentityKey = nextIdentityKey;
            abortController?.abort();
            abortController = null;
            $isFragmentInspectionLoading.set(false);
            if (!sameIdentity) {
                $fragmentOptions.set([]);
                $areFragmentOptionsResolved.set(false);
            }
            if (scopeKey) refreshFragments();
        }),
    );

    // A fragment can change without the edited page changing scope.
    const reloadDebounced = createDebounce(refreshFragments, 300);
    const knownFragmentChanged = (id: string): boolean => $fragmentOptions.get().some((item) => item.getId() === id);
    const onFragmentChanged = (event: { data: ContentSummary[] } | null): void => {
        if (event?.data.some((item) => item.getType().isFragment())) reloadDebounced();
    };
    cleanups.push(
        $contentCreated.listen(onFragmentChanged),
        $contentUpdated.listen(onFragmentChanged),
        $contentDeleted.listen((event) => {
            if (event?.data.some((item) => knownFragmentChanged(item.getContentId().toString()))) reloadDebounced();
        }),
        $contentMoved.listen((event) => {
            if (event?.data.some((item) => item.item.getContentSummary().getType().isFragment())) reloadDebounced();
        }),
        $contentRenamed.listen((event) => {
            if (event?.data.items.some((item) => item.getType().isFragment())) reloadDebounced();
        }),
        () => reloadDebounced.cancel(),
    );
}

export function cleanupFragmentInspection(): void {
    for (const fn of cleanups) fn();
    cleanups.length = 0;
    started = false;
    activeScopeKey = null;
    activeIdentityKey = null;
    abortController?.abort();
    abortController = null;
    $fragmentOptions.set([]);
    $areFragmentOptionsResolved.set(false);
    $isFragmentInspectionLoading.set(false);
}
