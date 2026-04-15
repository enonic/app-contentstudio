import {map} from 'nanostores';
import type {ContentSummary} from '../../../../app/content/ContentSummary';

type CompareVersionsDialogState = {
    open: boolean;
    contentId: string | null;
    contentPath: string | null;
    leftVersionId: string | null;
    rightVersionId: string | null;
    showAllContent: boolean;
};

const initialState: CompareVersionsDialogState = {
    open: false,
    contentId: null,
    contentPath: null,
    leftVersionId: null,
    rightVersionId: null,
    showAllContent: false,
};

export const $compareVersionsDialog = map<CompareVersionsDialogState>({...initialState});

export const openCompareVersionsDialog = (content: ContentSummary, versionIds: string[]): void => {
    if (!content || versionIds.length !== 2) {
        return;
    }

    const contentId = content.getContentId();
    if (!contentId) {
        return;
    }

    $compareVersionsDialog.set({
        ...{...initialState},
        open: true,
        contentId: contentId.toString(),
        contentPath: content.getPath()?.toString() ?? null,
        leftVersionId: versionIds[0],
        rightVersionId: versionIds[1],
    });
};

export const closeCompareVersionsDialog = (): void => {
    $compareVersionsDialog.set({...initialState});
};

export const setCompareVersionsShowAll = (showAll: boolean): void => {
    $compareVersionsDialog.setKey('showAllContent', showAll);
};
