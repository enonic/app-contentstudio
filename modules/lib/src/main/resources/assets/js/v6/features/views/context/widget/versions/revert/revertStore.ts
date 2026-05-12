import {atom} from 'nanostores';
import {type ContentId} from '../../../../../../../app/content/ContentId';

export type PendingRevert = {
    contentId: ContentId;
    versionId: string;
};

export const $pendingRevert = atom<PendingRevert | undefined>(undefined);

export const cancelRevert = (): void => {
    $pendingRevert.set(undefined);
};
