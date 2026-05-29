import {describe, expect, it} from 'vitest';
import {ContentId} from '../../../../../app/content/ContentId';
import {ContentPath} from '../../../../../app/content/ContentPath';
import {
    findContentIdsWithCreatedDescendants,
    getContentPathDisplayValues,
    getUnnamedContentPathLabel,
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

function createContentPath(path: string): ContentPath {
    return ContentPath.create().fromString(path).build();
}

describe('content paths utils', () => {
    const unnamedContentPathLabel = 'unnamed';

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

    it('resolves path label and full path for named content', () => {
        expect(getContentPathDisplayValues(createContentPath('/parent/child'), unnamedContentPathLabel)).toEqual({
            pathLabel: 'child',
            fullPath: '/parent/child',
        });
        expect(getContentPathDisplayValues(createContentPath('/content'), unnamedContentPathLabel)).toEqual({
            pathLabel: 'content',
            fullPath: '/content',
        });
    });

    it('normalizes unnamed path elements in path label and full path', () => {
        expect(getContentPathDisplayValues(createContentPath('/__unnamed__parent/juyjju'), unnamedContentPathLabel)).toEqual({
            pathLabel: 'juyjju',
            fullPath: '/<unnamed>/juyjju',
        });
        expect(getContentPathDisplayValues(createContentPath('/__unnamed__parent/__unnamed__child'), unnamedContentPathLabel)).toEqual({
            pathLabel: '<unnamed>',
            fullPath: '/<unnamed>/<unnamed>',
        });
    });

    it('resolves display values from a raw path string', () => {
        expect(getContentPathDisplayValues('/__unnamed__parent/child', unnamedContentPathLabel)).toEqual({
            pathLabel: 'child',
            fullPath: '/<unnamed>/child',
        });
    });

    it('formats unnamed content labels', () => {
        expect(getUnnamedContentPathLabel(unnamedContentPathLabel)).toBe('<unnamed>');
    });
});
