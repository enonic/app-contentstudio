import type {ContentId} from '../../../../../app/content/ContentId';
import {ContentUnnamed} from '../../../../../app/content/ContentUnnamed';

export type ContentPathValue = {
    toString: () => string;
    getElements?: () => string[];
    getName?: () => string;
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

function getContentPathElements(path: ContentPathValue | string): string[] {
    if (!path) {
        return [];
    }

    if (typeof path === 'string') {
        return path.split('/').filter(Boolean);
    }

    return path.getElements?.() ?? path.toString().split('/').filter(Boolean);
}

export type ContentPathDisplayValues = {
    pathLabel: string;
    fullPath: string;
};

export function getUnnamedContentPathLabel(unnamedContentPathLabel: string): string {
    return `<${unnamedContentPathLabel}>`;
}

export function normalizeContentPathElement(pathElement: string, unnamedContentPathLabel: string): string {
    return pathElement.startsWith(ContentUnnamed.UNNAMED_PREFIX) ? getUnnamedContentPathLabel(unnamedContentPathLabel) : pathElement;
}

export function getContentPathDisplayValues(path: ContentPathValue | string, unnamedContentPathLabel: string): ContentPathDisplayValues {
    const elements = getContentPathElements(path).map((element: string) => normalizeContentPathElement(element, unnamedContentPathLabel));

    return {
        pathLabel: elements.at(-1) ?? '',
        fullPath: `/${elements.join('/')}`,
    };
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
