import {map} from 'nanostores';
import {type ContentSummary} from '../../../../../../../app/content/ContentSummary';
import {type ContentVersion} from '../../../../../../../app/ContentVersion';

type CompareVersionsDialogState = {
    open: boolean;
    contentId: string | null;
    contentPath: string | null;
    leftVersion: ContentVersion | null;
    rightVersion: ContentVersion | null;
    showAllContent: boolean;
};

const initialState: CompareVersionsDialogState = {
    open: false,
    contentId: null,
    contentPath: null,
    leftVersion: null,
    rightVersion: null,
    showAllContent: false,
};

export const $compareVersionsDialog = map<CompareVersionsDialogState>({...initialState});

export const openCompareVersionsDialog = (
    content: ContentSummary,
    versions: [ContentVersion, ContentVersion],
): void => {
    const contentId = content.getContentId();
    if (!contentId) {
        return;
    }

    const [left, right] = versions;

    $compareVersionsDialog.set({
        ...initialState,
        open: true,
        contentId: contentId.toString(),
        contentPath: content.getPath()?.toString() ?? null,
        leftVersion: left,
        rightVersion: right,
    });
};

export const closeCompareVersionsDialog = (): void => {
    $compareVersionsDialog.set({...initialState});
};

export const setCompareVersionsShowAll = (showAll: boolean): void => {
    $compareVersionsDialog.setKey('showAllContent', showAll);
};
