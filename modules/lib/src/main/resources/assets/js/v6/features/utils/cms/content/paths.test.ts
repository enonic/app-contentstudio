import {describe, expect, it} from 'vitest';
import {ContentId} from '../../../../../app/content/ContentId';
import {ContentPath} from '../../../../../app/content/ContentPath';
import {
    findContentIdsWithCreatedDescendants,
    formatContentFullPath,
    formatContentPath,
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
    const unnamedPathLabel = '<unnamed>';

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

    it('formats a named content path', () => {
        expect(formatContentPath(createContentPath('/parent/child'), unnamedPathLabel)).toBe('/parent/child');
        expect(formatContentPath(createContentPath('/content'), unnamedPathLabel)).toBe('/content');
    });

    it('normalizes unnamed elements in a content path', () => {
        expect(formatContentPath(createContentPath('/__unnamed__parent/juyjju'), unnamedPathLabel)).toBe('/<unnamed>/juyjju');
        expect(formatContentPath(createContentPath('/__unnamed__parent/__unnamed__child'), unnamedPathLabel))
            .toBe('/<unnamed>/<unnamed>');
    });

    it('formats a content path from a raw path string', () => {
        expect(formatContentPath('/__unnamed__parent/child', unnamedPathLabel)).toBe('/<unnamed>/child');
    });

    it('appends a leaf label to a normalized parent path', () => {
        expect(formatContentFullPath(createContentPath('/parent'), 'child', unnamedPathLabel)).toBe('/parent/child');
        expect(formatContentFullPath('/', 'child', unnamedPathLabel)).toBe('/child');
    });

    it('normalizes the parent path but appends the leaf label verbatim', () => {
        // The caller resolves the leaf label (a name or the unnamed placeholder) before passing it in.
        expect(formatContentFullPath('/__unnamed__parent', unnamedPathLabel, unnamedPathLabel)).toBe('/<unnamed>/<unnamed>');
        expect(formatContentFullPath('/__unnamed__parent', 'child', unnamedPathLabel)).toBe('/<unnamed>/child');
    });
});
