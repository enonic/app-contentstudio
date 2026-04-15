import {atom} from 'nanostores';
import type {ContentId} from '../../../app/content/ContentId';
import type {ContentSummary} from '../../../app/content/ContentSummary';
import type {ContentServerChangeItem} from '../../../app/event/ContentServerChangeItem';
import type {MovedContentItem} from '../../../app/browse/MovedContentItem';
import type {ContentPath} from '../../../app/content/ContentPath';

//
// * Event Types
//

export type ContentEvent<T = ContentSummary[]> = {
    timestamp: number;
    data: T;
};

export type ContentRenamedData = {
    items: ContentSummary[];
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
export const $contentPermissionsUpdated = atom<ContentEvent<ContentId[]> | null>(null);

//
// * Internal API (for socketService only)
//

export const setSocketConnected = (connected: boolean): void => {
    $socketConnected.set(connected);
};

export const emitContentCreated = (data: ContentSummary[]): void => {
    $contentCreated.set({timestamp: Date.now(), data});
};

export const emitContentUpdated = (data: ContentSummary[]): void => {
    $contentUpdated.set({timestamp: Date.now(), data});
};

export const emitContentDeleted = (data: ContentServerChangeItem[]): void => {
    $contentDeleted.set({timestamp: Date.now(), data});
};

export const emitContentMoved = (data: MovedContentItem[]): void => {
    $contentMoved.set({timestamp: Date.now(), data});
};

export const emitContentRenamed = (items: ContentSummary[], oldPaths: ContentPath[]): void => {
    $contentRenamed.set({timestamp: Date.now(), data: {items, oldPaths}});
};

export const emitContentArchived = (data: ContentServerChangeItem[]): void => {
    $contentArchived.set({timestamp: Date.now(), data});
};

export const emitContentPublished = (data: ContentSummary[]): void => {
    $contentPublished.set({timestamp: Date.now(), data});
};

export const emitContentUnpublished = (data: ContentSummary[]): void => {
    $contentUnpublished.set({timestamp: Date.now(), data});
};

export const emitContentDuplicated = (data: ContentSummary[]): void => {
    $contentDuplicated.set({timestamp: Date.now(), data});
};

export const emitContentSorted = (data: ContentSummary[]): void => {
    $contentSorted.set({timestamp: Date.now(), data});
};

export const emitContentPermissionsUpdated = (data: ContentId[]): void => {
    $contentPermissionsUpdated.set({timestamp: Date.now(), data});
};
