import {vi} from 'vitest';
import {ContentId} from '../../../../app/content/ContentId';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentServerChangeItem} from '../../../../app/event/ContentServerChangeItem';

type ResolveResultOptions = {
    dependants?: ContentId[];
    required?: ContentId[];
    invalid?: ContentId[];
    inProgress?: ContentId[];
    notPublishable?: ContentId[];
};

type MockContentOptions = {
    displayName?: string;
    path?: string;
    hasChildren?: boolean;
    isOnline?: boolean;
};

// Returns an object that satisfies both ContentSummary and ContentSummaryAndCompareStatus
// by including getContentSummary() that returns a ContentSummary view of itself.
export function createMockContent(
    id: string,
    {
        displayName = `Content ${id}`,
        path,
        hasChildren = false,
        isOnline = false,
    }: MockContentOptions = {},
): ContentSummary & ContentSummaryAndCompareStatus {
    const contentId = new ContentId(id);
    const publishFromTime = isOnline ? new Date() : undefined;
    const publishTime = isOnline ? new Date() : undefined;

    const summary = {
        getId: () => id,
        getContentId: () => contentId,
        getDisplayName: () => displayName,
        getPath: () => path ? {toString: () => path} : undefined,
        hasChildren: () => hasChildren,
        getPublishFromTime: () => publishFromTime,
        getPublishTime: () => publishTime,
        getPublishFirstTime: () => publishTime,
        getContentSummary: () => summary as unknown as ContentSummary,
    };

    return summary as unknown as ContentSummary & ContentSummaryAndCompareStatus;
}

export function createMockChangeItem(id: string): ContentServerChangeItem {
    return {
        getContentId: () => ({
            toString: () => id,
        }),
    } as unknown as ContentServerChangeItem;
}

export function createResolveResult({
    dependants = [],
    required = [],
    invalid = [],
    inProgress = [],
    notPublishable = [],
}: ResolveResultOptions) {
    return {
        getDependants: () => dependants,
        getRequired: () => required,
        getInvalid: () => invalid,
        getInProgress: () => inProgress,
        getNotPublishable: () => notPublishable,
    };
}

export function createDeferredPromise<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });

    return {promise, resolve, reject};
}

export async function flushPromises(turns = 5): Promise<void> {
    for (let i = 0; i < turns; i += 1) {
        await Promise.resolve();
    }
}

export async function flushDebouncedReload(delayMs: number, turns = 5): Promise<void> {
    await flushPromises(turns);
    await vi.advanceTimersByTimeAsync(delayMs);
    await flushPromises(turns);
}
