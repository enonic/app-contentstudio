import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type {ContentPath} from '../../../../../app/content/ContentPath';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentTreeSelectorItem} from '../../../../../app/item/ContentTreeSelectorItem';

const INVALID_TARGET_TYPES = [
    ContentTypeName.IMAGE,
    ContentTypeName.MEDIA,
    ContentTypeName.PAGE_TEMPLATE,
    ContentTypeName.FRAGMENT,
    ContentTypeName.MEDIA_DATA,
    ContentTypeName.MEDIA_AUDIO,
    ContentTypeName.MEDIA_ARCHIVE,
    ContentTypeName.MEDIA_VIDEO,
    ContentTypeName.MEDIA_CODE,
    ContentTypeName.MEDIA_EXECUTABLE,
    ContentTypeName.MEDIA_PRESENTATION,
    ContentTypeName.MEDIA_SPREADSHEET,
    ContentTypeName.MEDIA_UNKNOWN,
    ContentTypeName.MEDIA_DOCUMENT,
    ContentTypeName.MEDIA_VECTOR,
];

export const getFilterContentPaths = (
    items: readonly ContentSummaryAndCompareStatus[],
): ContentPath[] => {
    return items
        .map((item) => item.getPath())
        .filter((path): path is ContentPath => !!path);
};

export const getFilterExactPaths = (
    paths: readonly ContentPath[],
): ContentPath[] => {
    if (paths.length === 0) {
        return [];
    }

    const firstParent = paths[0]?.getParentPath?.();
    if (!firstParent) {
        return [];
    }

    const sameParent = paths.every((path) => {
        const parent = path.getParentPath?.();
        return parent?.equals(firstParent);
    });

    return sameParent ? [firstParent] : [];
};

export const isInvalidTargetType = (item: ContentTreeSelectorItem): boolean => {
    const type = item.getType();
    if (!type) {
        return false;
    }
    return INVALID_TARGET_TYPES.some((invalidType) => type.equals(invalidType));
};

export const isInvalidMoveTarget = (
    item: ContentTreeSelectorItem,
    filterContentPaths: readonly ContentPath[],
    filterExactPaths: readonly ContentPath[],
): boolean => {
    const path = item.getPath();
    if (!path) {
        return false;
    }

    if (filterContentPaths.some((contentPath) => path.equals(contentPath) || path.isDescendantOf(contentPath))) {
        return true;
    }

    if (filterExactPaths.some((exactPath) => path.equals(exactPath))) {
        return true;
    }

    return isInvalidTargetType(item);
};
