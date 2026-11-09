import type { ContentPath } from '../../../../../app/content/ContentPath';
import type { ContentTreeSelectorItem } from '../../../../../app/item/ContentTreeSelectorItem';
import { CONTENT_TYPE } from '../../../../shared/lib/cms/schema/contentTypeName';

const INVALID_TARGET_TYPES = [
    CONTENT_TYPE.MEDIA_IMAGE,
    CONTENT_TYPE.MEDIA,
    CONTENT_TYPE.PAGE_TEMPLATE,
    CONTENT_TYPE.FRAGMENT,
    CONTENT_TYPE.MEDIA_DATA,
    CONTENT_TYPE.MEDIA_AUDIO,
    CONTENT_TYPE.MEDIA_ARCHIVE,
    CONTENT_TYPE.MEDIA_VIDEO,
    CONTENT_TYPE.MEDIA_CODE,
    CONTENT_TYPE.MEDIA_EXECUTABLE,
    CONTENT_TYPE.MEDIA_PRESENTATION,
    CONTENT_TYPE.MEDIA_SPREADSHEET,
    CONTENT_TYPE.MEDIA_UNKNOWN,
    CONTENT_TYPE.MEDIA_DOCUMENT,
    CONTENT_TYPE.MEDIA_VECTOR,
];

export const getFilterContentPaths = (items: readonly { getPath(): ContentPath | null }[]): ContentPath[] => {
    return items.map((item) => item.getPath()).filter((path): path is ContentPath => !!path);
};

export const getFilterExactPaths = (paths: readonly ContentPath[]): ContentPath[] => {
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
    const type = item.getType()?.toString();
    if (!type) {
        return false;
    }
    return INVALID_TARGET_TYPES.some((invalidType) => type === invalidType);
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
