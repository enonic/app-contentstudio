import {describe, expect, it} from 'vitest';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentPath} from '../../../../../app/content/ContentPath';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentTreeSelectorItem} from '../../../../../app/item/ContentTreeSelectorItem';
import {getFilterContentPaths, getFilterExactPaths, isInvalidMoveTarget, isInvalidTargetType} from './pathSelectorFilters';

function createPath(pathStr: string): ContentPath {
    return ContentPath.create().fromString(pathStr).build();
}

function createMockItem(pathStr: string | null, typeName?: ContentTypeName): ContentTreeSelectorItem {
    return {
        getPath: () => (pathStr ? createPath(pathStr) : null),
        getType: () => typeName ?? null,
    } as ContentTreeSelectorItem;
}

function createMockContent(pathStr: string | null): ContentSummaryAndCompareStatus {
    return {
        getPath: () => (pathStr ? createPath(pathStr) : null),
    } as ContentSummaryAndCompareStatus;
}

describe('getFilterContentPaths', () => {
    it('should extract paths from items', () => {
        const items = [createMockContent('/site/a'), createMockContent('/site/b')];
        const result = getFilterContentPaths(items);
        expect(result).toHaveLength(2);
        expect(result[0]?.toString()).toBe('/site/a');
        expect(result[1]?.toString()).toBe('/site/b');
    });

    it('should filter out null paths', () => {
        const items = [createMockContent('/site/a'), createMockContent(null), createMockContent('/site/c')];
        const result = getFilterContentPaths(items);
        expect(result).toHaveLength(2);
        expect(result[0]?.toString()).toBe('/site/a');
        expect(result[1]?.toString()).toBe('/site/c');
    });

    it('should return empty array for empty input', () => {
        expect(getFilterContentPaths([])).toEqual([]);
    });
});

describe('getFilterExactPaths', () => {
    it('should return parent path when all items share same parent', () => {
        const paths = [createPath('/site/a'), createPath('/site/b')];
        const result = getFilterExactPaths(paths);
        expect(result).toHaveLength(1);
        expect(result[0]?.toString()).toBe('/site');
    });

    it('should return empty when items have different parents', () => {
        const paths = [createPath('/site1/a'), createPath('/site2/b')];
        const result = getFilterExactPaths(paths);
        expect(result).toEqual([]);
    });

    it('should return empty for empty input', () => {
        expect(getFilterExactPaths([])).toEqual([]);
    });

    it('should return empty when path has no parent', () => {
        const paths = [createPath('/')];
        const result = getFilterExactPaths(paths);
        expect(result).toEqual([]);
    });
});

describe('isInvalidTargetType', () => {
    it('should return true for IMAGE type', () => {
        expect(isInvalidTargetType(createMockItem('/a', ContentTypeName.IMAGE))).toBe(true);
    });

    it('should return true for MEDIA type', () => {
        expect(isInvalidTargetType(createMockItem('/a', ContentTypeName.MEDIA))).toBe(true);
    });

    it('should return true for PAGE_TEMPLATE type', () => {
        expect(isInvalidTargetType(createMockItem('/a', ContentTypeName.PAGE_TEMPLATE))).toBe(true);
    });

    it('should return true for FRAGMENT type', () => {
        expect(isInvalidTargetType(createMockItem('/a', ContentTypeName.FRAGMENT))).toBe(true);
    });

    it('should return true for MEDIA_VIDEO type', () => {
        expect(isInvalidTargetType(createMockItem('/a', ContentTypeName.MEDIA_VIDEO))).toBe(true);
    });

    it('should return false for FOLDER type', () => {
        expect(isInvalidTargetType(createMockItem('/a', ContentTypeName.FOLDER))).toBe(false);
    });

    it('should return false for SITE type', () => {
        expect(isInvalidTargetType(createMockItem('/a', ContentTypeName.SITE))).toBe(false);
    });

    it('should return false when type is null', () => {
        expect(isInvalidTargetType(createMockItem('/a'))).toBe(false);
    });
});

describe('isInvalidMoveTarget', () => {
    it('should return true when target path matches a content path', () => {
        const contentPaths = [createPath('/site/a')];
        const result = isInvalidMoveTarget(createMockItem('/site/a'), contentPaths, []);
        expect(result).toBe(true);
    });

    it('should return true when target is descendant of a content path', () => {
        const contentPaths = [createPath('/site/a')];
        const result = isInvalidMoveTarget(createMockItem('/site/a/child'), contentPaths, []);
        expect(result).toBe(true);
    });

    it('should return true when target path matches an exact path', () => {
        const exactPaths = [createPath('/site')];
        const result = isInvalidMoveTarget(createMockItem('/site'), [], exactPaths);
        expect(result).toBe(true);
    });

    it('should return true when target has invalid type', () => {
        const result = isInvalidMoveTarget(createMockItem('/other', ContentTypeName.IMAGE), [], []);
        expect(result).toBe(true);
    });

    it('should return false for valid target', () => {
        const contentPaths = [createPath('/site/a')];
        const exactPaths = [createPath('/site')];
        const result = isInvalidMoveTarget(createMockItem('/other/folder', ContentTypeName.FOLDER), contentPaths, exactPaths);
        expect(result).toBe(false);
    });

    it('should return false when item has no path', () => {
        const result = isInvalidMoveTarget(createMockItem(null), [createPath('/site/a')], []);
        expect(result).toBe(false);
    });
});
