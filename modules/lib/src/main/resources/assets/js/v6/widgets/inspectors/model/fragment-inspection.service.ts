import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { ComponentAddedEvent } from '../../../../app/page/region/ComponentAddedEvent';
import { ComponentFragmentCreatedEvent } from '../../../../app/page/region/ComponentFragmentCreatedEvent';
import { PageState } from '../../../../app/wizard/page/PageState';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentCreated,
    $contentDeleted,
    $contentMoved,
    $contentRenamed,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import { fetchFragmentSummaries } from '../api/fragments.api';
import {
    $areFragmentOptionsResolved,
    $fragmentOptions,
    $isFragmentInspectionLoading,
    resetFragmentInspection,
} from './fragment-inspection.store';
import { $contentContext, $contentScopeKey } from './page-editor/store';
import { isSameInspectionOwner } from './page-editor/inspectionScope';

const cleanups: (() => void)[] = [];
let abortController: AbortController | null = null;
const locallyCreatedFragments = new Map<string, ContentSummary>();
const reloadDebounced = createDebounce(refreshFragments, 300);

function refreshFragments(): void {
    const ctx = $contentContext.get();
    const scopeKey = $contentScopeKey.get();
    if (!ctx || !scopeKey) {
        return;
    }

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;
    $isFragmentInspectionLoading.set(true);

    void (async () => {
        try {
            const result = await fetchFragmentSummaries(ctx.sitePath ?? undefined, controller.signal);
            if (controller.signal.aborted || $contentScopeKey.get() !== scopeKey || result.isErr()) {
                return;
            }
            for (const item of result.value) {
                locallyCreatedFragments.delete(item.getId());
            }
            $fragmentOptions.set([...result.value, ...locallyCreatedFragments.values()]);
            $areFragmentOptionsResolved.set(true);
        } catch {
            // Keep the last successful options on failure.
        } finally {
            if (abortController === controller) {
                abortController = null;
                $isFragmentInspectionLoading.set(false);
            }
        }
    })();
}

export const start = (): void => {
    if (cleanups.length > 0) {
        if (!$areFragmentOptionsResolved.get() && !abortController) {
            refreshFragments();
        }
        return;
    }

    let previousContext: ReturnType<typeof $contentContext.get> = null;
    cleanups.push(
        $contentScopeKey.subscribe((scopeKey) => {
            const context = $contentContext.get();
            const sameOwner = isSameInspectionOwner(previousContext, context);
            previousContext = context;
            abortController?.abort();
            abortController = null;
            if (!sameOwner) {
                locallyCreatedFragments.clear();
                $fragmentOptions.set([]);
            }
            $areFragmentOptionsResolved.set(false);
            $isFragmentInspectionLoading.set(false);
            if (scopeKey) {
                refreshFragments();
            }
        }),
    );

    // The new component is selected before a socket event or search index update arrives.
    const pageEvents = PageState.getEvents();
    const onComponentAdded = (event: ComponentAddedEvent): void => {
        if (!(event instanceof ComponentFragmentCreatedEvent) || !$contentScopeKey.get()) {
            return;
        }
        const fragment = event.getFragmentContent();
        locallyCreatedFragments.set(fragment.getId(), fragment);
        $fragmentOptions.set([...$fragmentOptions.get().filter((item) => item.getId() !== fragment.getId()), fragment]);
        refreshFragments();
    };
    pageEvents.onComponentAdded(onComponentAdded);
    cleanups.push(() => pageEvents.unComponentAdded(onComponentAdded));

    const onFragmentChanged = (event: { data: ContentSummary[] } | null): void => {
        if (event?.data.some((item) => item.getType().isFragment())) {
            reloadDebounced();
        }
    };
    cleanups.push(
        $contentCreated.listen(onFragmentChanged),
        $contentUpdated.listen(onFragmentChanged),
        $contentDeleted.listen((event) => {
            if (
                !event?.data.some((item) =>
                    $fragmentOptions.get().some((f) => f.getId() === item.getContentId().toString()),
                )
            ) {
                return;
            }
            for (const item of event.data) {
                locallyCreatedFragments.delete(item.getContentId().toString());
            }
            reloadDebounced();
        }),
        $contentMoved.listen((event) => {
            if (event?.data.some((item) => item.item.getContentSummary().getType().isFragment())) {
                reloadDebounced();
            }
        }),
        $contentRenamed.listen((event) => {
            if (event?.data.items.some((item) => item.getType().isFragment())) {
                reloadDebounced();
            }
        }),
    );
};

export const stop = (): void => {
    for (const fn of cleanups) fn();
    cleanups.length = 0;
    reloadDebounced.cancel();
    abortController?.abort();
    abortController = null;
    locallyCreatedFragments.clear();
    resetFragmentInspection();
};
