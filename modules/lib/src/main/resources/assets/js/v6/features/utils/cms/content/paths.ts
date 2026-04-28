import type {ContentId} from '../../../../../app/content/ContentId';
import {ContentUnnamed} from '../../../../../app/content/ContentUnnamed';

type ContentPathValue = {
    toString: () => string;
} | null | undefined;

export type PathLikeContent = {
    getPath?: () => ContentPathValue;
};

export type PathAwareContent = PathLikeContent & {
    getContentId: () => ContentId;
};

function getContentPath(item: PathLikeContent): string | undefined {
    return item.getPath?.()?.toString();
}

export function isDescendantContentPath(parentPath: string | undefined, childPath: string | undefined): boolean {
    if (!parentPath || !childPath || parentPath === childPath) {
        return false;
    }

    const parentPrefix = parentPath === '/' ? '/' : `${parentPath}/`;
    return childPath.startsWith(parentPrefix);
}

export function findContentIdsWithCreatedDescendants(
    parentItems: readonly PathAwareContent[],
    createdItems: readonly PathLikeContent[],
): ContentId[] {
    if (parentItems.length === 0 || createdItems.length === 0) {
        return [];
    }

    const matchedIds = new Map<string, ContentId>();

    parentItems.forEach(parentItem => {
        const parentPath = getContentPath(parentItem);
        if (!parentPath) {
            return;
        }

        const hasMatchingChild = createdItems.some(item => isDescendantContentPath(parentPath, getContentPath(item)));
        if (hasMatchingChild) {
            const id = parentItem.getContentId();
            matchedIds.set(id.toString(), id);
        }
    });

    return Array.from(matchedIds.values());
}

export function normalizeContentPathName(pathName: string): string {
    return pathName?.startsWith(ContentUnnamed.UNNAMED_PREFIX) ? '' : pathName;
}


