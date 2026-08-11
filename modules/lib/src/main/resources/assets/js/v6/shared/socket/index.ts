import { computed } from 'nanostores';
import {
    $socketConnected as $socketConnectedAtom,
    $contentCreated as $contentCreatedAtom,
    $contentUpdated as $contentUpdatedAtom,
    $contentDeleted as $contentDeletedAtom,
    $contentMoved as $contentMovedAtom,
    $contentRenamed as $contentRenamedAtom,
    $contentArchived as $contentArchivedAtom,
    $contentPublished as $contentPublishedAtom,
    $contentUnpublished as $contentUnpublishedAtom,
    $contentDuplicated as $contentDuplicatedAtom,
    $contentSorted as $contentSortedAtom,
    $contentPermissionsUpdated as $contentPermissionsUpdatedAtom,
} from './socket.store';

export type { ContentEvent, ContentRenamedData } from './socket.store';
export {
    start as startSocketService,
    stop as stopSocketService,
    isRunning as isSocketServiceRunning,
} from './socket.service';

//
// * Read-only views
//
// The signal atoms stay private to the slice; only the socket service emits.
//

export const $socketConnected = computed($socketConnectedAtom, (value) => value);
export const $contentCreated = computed($contentCreatedAtom, (value) => value);
export const $contentUpdated = computed($contentUpdatedAtom, (value) => value);
export const $contentDeleted = computed($contentDeletedAtom, (value) => value);
export const $contentMoved = computed($contentMovedAtom, (value) => value);
export const $contentRenamed = computed($contentRenamedAtom, (value) => value);
export const $contentArchived = computed($contentArchivedAtom, (value) => value);
export const $contentPublished = computed($contentPublishedAtom, (value) => value);
export const $contentUnpublished = computed($contentUnpublishedAtom, (value) => value);
export const $contentDuplicated = computed($contentDuplicatedAtom, (value) => value);
export const $contentSorted = computed($contentSortedAtom, (value) => value);
export const $contentPermissionsUpdated = computed($contentPermissionsUpdatedAtom, (value) => value);
