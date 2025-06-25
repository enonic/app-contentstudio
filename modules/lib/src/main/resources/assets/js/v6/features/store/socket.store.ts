import {atom} from 'nanostores';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentServerChangeItem} from '../../../app/event/ContentServerChangeItem';
import type {MovedContentItem} from '../../../app/browse/MovedContentItem';
import type {ContentPath} from '../../../app/content/ContentPath';

//
// * Event Types
//

type ContentEvent<T = ContentSummaryAndCompareStatus[]> = {
    timestamp: number;
    data: T;
};

type ContentRenamedData = {
    items: ContentSummaryAndCompareStatus[];
    oldPaths: ContentPath[];
};

//
// * Stores
//

/** Connection state */
export const $socketConnected = atom<boolean>(false);

/** Content created events */
export const $contentCreated = atom<ContentEvent | null>(null);

/** Content updated events */
export const $contentUpdated = atom<ContentEvent | null>(null);

/** Content deleted events */
export const $contentDeleted = atom<ContentEvent<ContentServerChangeItem[]> | null>(null);

/** Content moved events */
export const $contentMoved = atom<ContentEvent<MovedContentItem[]> | null>(null);

/** Content renamed events */
export const $contentRenamed = atom<ContentEvent<ContentRenamedData> | null>(null);

/** Content archived events */
export const $contentArchived = atom<ContentEvent<ContentServerChangeItem[]> | null>(null);

/** Content published events */
export const $contentPublished = atom<ContentEvent | null>(null);

/** Content unpublished events */
export const $contentUnpublished = atom<ContentEvent | null>(null);

/** Content duplicated events */
export const $contentDuplicated = atom<ContentEvent | null>(null);

/** Content sorted events */
export const $contentSorted = atom<ContentEvent | null>(null);

/** Content permissions updated events */
export const $contentPermissionsUpdated = atom<ContentEvent | null>(null);

//
// * Internal API (for socketService only)
//

export const setSocketConnected = (connected: boolean): void => {
    $socketConnected.set(connected);
};

export const emitContentCreated = (data: ContentSummaryAndCompareStatus[]): void => {
    $contentCreated.set({timestamp: Date.now(), data});
};

export const emitContentUpdated = (data: ContentSummaryAndCompareStatus[]): void => {
    $contentUpdated.set({timestamp: Date.now(), data});
};

export const emitContentDeleted = (data: ContentServerChangeItem[]): void => {
    $contentDeleted.set({timestamp: Date.now(), data});
};

export const emitContentMoved = (data: MovedContentItem[]): void => {
    $contentMoved.set({timestamp: Date.now(), data});
};

export const emitContentRenamed = (items: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]): void => {
    $contentRenamed.set({timestamp: Date.now(), data: {items, oldPaths}});
};

export const emitContentArchived = (data: ContentServerChangeItem[]): void => {
    $contentArchived.set({timestamp: Date.now(), data});
};

export const emitContentPublished = (data: ContentSummaryAndCompareStatus[]): void => {
    $contentPublished.set({timestamp: Date.now(), data});
};

export const emitContentUnpublished = (data: ContentSummaryAndCompareStatus[]): void => {
    $contentUnpublished.set({timestamp: Date.now(), data});
};

export const emitContentDuplicated = (data: ContentSummaryAndCompareStatus[]): void => {
    $contentDuplicated.set({timestamp: Date.now(), data});
};

export const emitContentSorted = (data: ContentSummaryAndCompareStatus[]): void => {
    $contentSorted.set({timestamp: Date.now(), data});
};

export const emitContentPermissionsUpdated = (data: ContentSummaryAndCompareStatus[]): void => {
    $contentPermissionsUpdated.set({timestamp: Date.now(), data});
};
