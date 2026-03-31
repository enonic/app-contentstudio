import {describe, expect, it} from 'vitest';
import {ContentId} from '../../../../../app/content/ContentId';
import {
    findContentIdsWithCreatedDescendants,
    isDescendantContentPath,
    type PathAwareContent,
    type PathLikeContent,
} from './paths';

function createPathItem(path?: string): PathLikeContent {
    return {
        getPath: () => path ? {toString: () => path} : undefined,
    };
}

function createPathAwareItem(id: string, path?: string): PathAwareContent {
    const contentId = new ContentId(id);

    return {
        getContentId: () => contentId,
        getPath: () => path ? {toString: () => path} : undefined,
    };
}

describe('content paths utils', () => {
    it('matches only descendant paths', () => {
        expect(isDescendantContentPath('/site/parent', '/site/parent/child')).toBe(true);
        expect(isDescendantContentPath('/site/parent', '/site/parent')).toBe(false);
        expect(isDescendantContentPath('/site/parent', '/site/parent-2/child')).toBe(false);
    });

    it('returns parent ids with created descendants', () => {
        const parentItems = [
            createPathAwareItem('1', '/site/parent'),
            createPathAwareItem('2', '/site/other'),
        ];
        const createdItems = [
            createPathItem('/site/parent/child'),
            createPathItem('/outside/item'),
        ];

        expect(findContentIdsWithCreatedDescendants(parentItems, createdItems).map(id => id.toString())).toEqual(['1']);
    });
});
