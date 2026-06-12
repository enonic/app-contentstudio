import {type ContentId} from '../../../../../app/content/ContentId';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {fetchContentSummaries} from '../../../api/content';

export const DEPENDANT_LOAD_SIZE = 36;

export type DependantWindowState = {
    dependants: ContentSummary[];
    dependantIds: ContentId[];
    dependantWindow: number;
};

type WindowStore<S extends DependantWindowState> = {
    get: () => S;
    set: (value: S) => void;
};

export const orderSummariesByIds = (summaries: ContentSummary[], orderIds: ContentId[]): ContentSummary[] => {
    const indexById = new Map<string, number>();
    orderIds.forEach((id, index) => indexById.set(id.toString(), index));
    const indexOf = (item: ContentSummary): number =>
        indexById.get(item.getContentId().toString()) ?? orderIds.length;
    return [...summaries].sort((a, b) => indexOf(a) - indexOf(b));
};

export const mergeDependantWindow = (
    loaded: ContentSummary[],
    fetched: ContentSummary[],
    currentIds: ContentId[],
): ContentSummary[] => {
    const idSet = new Set(currentIds.map(id => id.toString()));
    const byId = new Map<string, ContentSummary>();
    for (const item of [...loaded, ...fetched]) {
        const key = item.getContentId().toString();
        if (idSet.has(key)) {
            byId.set(key, item);
        }
    }
    return orderSummariesByIds([...byId.values()], currentIds);
};

export type DependantWindowSlice = {
    summaries: ContentSummary[];
    failed: boolean;
};

// `failed` is true when a non-empty slice resolves to no summaries: fetchContentSummaries
// returns [] on a transient error, so callers must not advance past an unloaded slice.
export const fetchDependantWindowSlice = async (
    allIds: ContentId[],
    start: number,
): Promise<DependantWindowSlice> => {
    const sliceIds = allIds.slice(start, start + DEPENDANT_LOAD_SIZE);
    if (sliceIds.length === 0) {
        return {summaries: [], failed: false};
    }

    const summaries = await fetchContentSummaries(sliceIds);
    return {summaries, failed: summaries.length === 0};
};

export const pruneDependantWindow = <S extends DependantWindowState>(
    state: S,
    idsToRemove: Set<string>,
): {state: S; changed: boolean} => {
    const nextDependantIds = state.dependantIds.filter(id => !idsToRemove.has(id.toString()));
    if (nextDependantIds.length === state.dependantIds.length) {
        return {state, changed: false};
    }

    return {
        state: {
            ...state,
            dependantIds: nextDependantIds,
            dependantWindow: Math.min(state.dependantWindow, nextDependantIds.length),
        },
        changed: true,
    };
};

export const createDependantWindowLoader = <S extends DependantWindowState>(
    store: WindowStore<S>,
    getGuardId: () => number,
): (() => Promise<void>) => {
    let loadingMore = false;

    return async (): Promise<void> => {
        if (loadingMore) {
            return;
        }

        const {dependantIds, dependantWindow} = store.get();
        if (dependantWindow >= dependantIds.length) {
            return;
        }

        loadingMore = true;
        const guardId = getGuardId();
        try {
            const {summaries, failed} = await fetchDependantWindowSlice(dependantIds, dependantWindow);

            if (guardId !== getGuardId() || failed) {
                return;
            }

            const state = store.get();
            store.set({
                ...state,
                dependants: mergeDependantWindow(state.dependants, summaries, state.dependantIds),
                dependantWindow: Math.min(dependantWindow + DEPENDANT_LOAD_SIZE, state.dependantIds.length),
            });
        } catch (error) {
            console.error(error);
        } finally {
            loadingMore = false;
        }
    };
};
