import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {
    $contentCache,
    setContent,
    setContents,
    removeContent,
    removeContents,
    clearContentCache,
    getContent,
    getContents,
    hasContent,
    getMissingIds,
    getAllContentIds,
    getIdByPath,
} from './content.store';
import {
    emitContentUpdated,
    emitContentCreated,
    emitContentDeleted,
    emitContentArchived,
    emitContentPublished,
} from './socket.store';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';

// Mock ContentSummaryAndCompareStatus
function createMockContent(id: string, displayName?: string): ContentSummaryAndCompareStatus {
    return {
        getId: () => id,
        getDisplayName: () => displayName ?? `Content ${id}`,
        getPath: () => null,
    } as ContentSummaryAndCompareStatus;
}

// Mock ContentSummaryAndCompareStatus with path
function createMockContentWithPath(id: string, pathStr: string, displayName?: string): ContentSummaryAndCompareStatus {
    return {
        getId: () => id,
        getDisplayName: () => displayName ?? `Content ${id}`,
        getPath: () => ({
            toString: () => pathStr,
            hasParentContent: () => pathStr.split('/').filter(Boolean).length > 1,
            getParentPath: () => {
                const parts = pathStr.split('/').filter(Boolean);
                if (parts.length <= 1) return null;
                return {
                    toString: () => '/' + parts.slice(0, -1).join('/'),
                    isRoot: () => parts.length === 2, // /content/xxx means parent is root
                };
            },
            isRoot: () => false,
            equals: (other: {toString: () => string}) => pathStr === other.toString(),
        }),
    } as ContentSummaryAndCompareStatus;
}

// Mock ContentServerChangeItem for delete/archive events
function createMockChangeItem(id: string): {getContentId: () => {toString: () => string}} {
    return {
        getContentId: () => ({
            toString: () => id,
        }),
    };
}

describe('content.store', () => {
    beforeEach(() => {
        clearContentCache();
    });

    describe('setContent', () => {
        it('adds content to cache', () => {
            const content = createMockContent('1');
            setContent(content);

            expect(getContent('1')).toBe(content);
        });

        it('updates existing content', () => {
            const content1 = createMockContent('1', 'Original');
            const content2 = createMockContent('1', 'Updated');

            setContent(content1);
            setContent(content2);

            expect(getContent('1')?.getDisplayName()).toBe('Updated');
        });
    });

    describe('setContents', () => {
        it('adds multiple contents to cache', () => {
            const contents = [createMockContent('1'), createMockContent('2'), createMockContent('3')];

            setContents(contents);

            expect(hasContent('1')).toBe(true);
            expect(hasContent('2')).toBe(true);
            expect(hasContent('3')).toBe(true);
        });

        it('does nothing with empty array', () => {
            setContents([]);
            expect(getAllContentIds()).toEqual([]);
        });

        it('updates existing and adds new content', () => {
            setContent(createMockContent('1', 'Original'));

            setContents([createMockContent('1', 'Updated'), createMockContent('2', 'New')]);

            expect(getContent('1')?.getDisplayName()).toBe('Updated');
            expect(getContent('2')?.getDisplayName()).toBe('New');
        });
    });

    describe('removeContent', () => {
        it('removes content from cache', () => {
            setContent(createMockContent('1'));
            removeContent('1');

            expect(hasContent('1')).toBe(false);
        });

        it('does nothing for non-existent content', () => {
            removeContent('non-existent');
            // Should not throw
            expect(getAllContentIds()).toEqual([]);
        });
    });

    describe('removeContents', () => {
        it('removes multiple contents from cache', () => {
            setContents([createMockContent('1'), createMockContent('2'), createMockContent('3')]);

            removeContents(['1', '3']);

            expect(hasContent('1')).toBe(false);
            expect(hasContent('2')).toBe(true);
            expect(hasContent('3')).toBe(false);
        });

        it('does nothing with empty array', () => {
            setContent(createMockContent('1'));
            removeContents([]);

            expect(hasContent('1')).toBe(true);
        });
    });

    describe('clearContentCache', () => {
        it('removes all content from cache', () => {
            setContents([createMockContent('1'), createMockContent('2')]);

            clearContentCache();

            expect(getAllContentIds()).toEqual([]);
        });
    });

    describe('getContent', () => {
        it('returns content by ID', () => {
            const content = createMockContent('1');
            setContent(content);

            expect(getContent('1')).toBe(content);
        });

        it('returns undefined for non-existent content', () => {
            expect(getContent('non-existent')).toBeUndefined();
        });
    });

    describe('getContents', () => {
        it('returns multiple contents by IDs', () => {
            setContents([createMockContent('1'), createMockContent('2'), createMockContent('3')]);

            const result = getContents(['1', '3']);

            expect(result).toHaveLength(2);
            expect(result[0].getId()).toBe('1');
            expect(result[1].getId()).toBe('3');
        });

        it('filters out missing content', () => {
            setContent(createMockContent('1'));

            const result = getContents(['1', 'missing', '2']);

            expect(result).toHaveLength(1);
            expect(result[0].getId()).toBe('1');
        });

        it('returns empty array for empty input', () => {
            expect(getContents([])).toEqual([]);
        });
    });

    describe('hasContent', () => {
        it('returns true for existing content', () => {
            setContent(createMockContent('1'));
            expect(hasContent('1')).toBe(true);
        });

        it('returns false for non-existent content', () => {
            expect(hasContent('1')).toBe(false);
        });
    });

    describe('getMissingIds', () => {
        it('returns IDs not in cache', () => {
            setContent(createMockContent('1'));

            const missing = getMissingIds(['1', '2', '3']);

            expect(missing).toEqual(['2', '3']);
        });

        it('returns all IDs when cache is empty', () => {
            const missing = getMissingIds(['1', '2']);
            expect(missing).toEqual(['1', '2']);
        });

        it('returns empty array when all IDs exist', () => {
            setContents([createMockContent('1'), createMockContent('2')]);

            const missing = getMissingIds(['1', '2']);

            expect(missing).toEqual([]);
        });
    });

    describe('getAllContentIds', () => {
        it('returns all content IDs', () => {
            setContents([createMockContent('1'), createMockContent('2')]);

            const ids = getAllContentIds();

            expect(ids.sort()).toEqual(['1', '2']);
        });

        it('returns empty array for empty cache', () => {
            expect(getAllContentIds()).toEqual([]);
        });
    });

    // Socket subscriptions are now self-initializing at module load.
    // They persist for the application lifetime and don't need explicit subscription.
    describe('socket subscriptions (self-initializing)', () => {
        afterEach(() => {
            clearContentCache();
        });

        it('updates cache on contentUpdated event', () => {
            const content = createMockContent('1', 'Updated');
            emitContentUpdated([content] as ContentSummaryAndCompareStatus[]);

            expect(getContent('1')?.getDisplayName()).toBe('Updated');
        });

        it('adds to cache on contentCreated event', () => {
            const content = createMockContent('1', 'New');
            emitContentCreated([content] as ContentSummaryAndCompareStatus[]);

            expect(getContent('1')?.getDisplayName()).toBe('New');
        });

        it('removes from cache on contentDeleted event', () => {
            setContent(createMockContent('1'));

            emitContentDeleted([createMockChangeItem('1')] as unknown as Parameters<typeof emitContentDeleted>[0]);

            expect(hasContent('1')).toBe(false);
        });

        it('removes from cache on contentArchived event', () => {
            setContent(createMockContent('1'));

            emitContentArchived([createMockChangeItem('1')] as unknown as Parameters<typeof emitContentArchived>[0]);

            expect(hasContent('1')).toBe(false);
        });

        it('updates cache on contentPublished event', () => {
            const content = createMockContent('1', 'Published');
            emitContentPublished([content] as ContentSummaryAndCompareStatus[]);

            expect(getContent('1')?.getDisplayName()).toBe('Published');
        });
    });

    describe('path-to-ID index', () => {
        describe('getIdByPath', () => {
            it('returns content ID for path in index', () => {
                const content = createMockContentWithPath('1', '/content/site');
                setContent(content);

                expect(getIdByPath('/content/site')).toBe('1');
            });

            it('returns undefined for path not in index', () => {
                expect(getIdByPath('/non-existent')).toBeUndefined();
            });
        });

        describe('setContent maintains path index', () => {
            it('adds path to index when content has path', () => {
                const content = createMockContentWithPath('1', '/content/site');
                setContent(content);

                expect(getIdByPath('/content/site')).toBe('1');
            });

            it('does not add to index when content has no path', () => {
                const content = createMockContent('1');
                setContent(content);

                // No exception should occur and index should be empty
                expect(getIdByPath('/content/site')).toBeUndefined();
            });
        });

        describe('setContents maintains path index', () => {
            it('adds paths to index for multiple contents', () => {
                const contents = [
                    createMockContentWithPath('1', '/content/site'),
                    createMockContentWithPath('2', '/content/folder'),
                    createMockContentWithPath('3', '/content/page'),
                ];
                setContents(contents);

                expect(getIdByPath('/content/site')).toBe('1');
                expect(getIdByPath('/content/folder')).toBe('2');
                expect(getIdByPath('/content/page')).toBe('3');
            });

            it('handles mixed contents with and without paths', () => {
                const contents = [
                    createMockContentWithPath('1', '/content/site'),
                    createMockContent('2'), // No path
                ];
                setContents(contents);

                expect(getIdByPath('/content/site')).toBe('1');
                expect(hasContent('2')).toBe(true);
            });
        });

        describe('removeContent cleans path index', () => {
            it('removes path from index when content is removed', () => {
                const content = createMockContentWithPath('1', '/content/site');
                setContent(content);
                expect(getIdByPath('/content/site')).toBe('1');

                removeContent('1');
                expect(getIdByPath('/content/site')).toBeUndefined();
            });
        });

        describe('removeContents cleans path index', () => {
            it('removes paths from index when contents are removed', () => {
                const contents = [
                    createMockContentWithPath('1', '/content/site'),
                    createMockContentWithPath('2', '/content/folder'),
                    createMockContentWithPath('3', '/content/page'),
                ];
                setContents(contents);

                removeContents(['1', '3']);

                expect(getIdByPath('/content/site')).toBeUndefined();
                expect(getIdByPath('/content/folder')).toBe('2');
                expect(getIdByPath('/content/page')).toBeUndefined();
            });
        });

        describe('clearContentCache clears path index', () => {
            it('clears path index when cache is cleared', () => {
                setContents([
                    createMockContentWithPath('1', '/content/site'),
                    createMockContentWithPath('2', '/content/folder'),
                ]);

                clearContentCache();

                expect(getIdByPath('/content/site')).toBeUndefined();
                expect(getIdByPath('/content/folder')).toBeUndefined();
            });
        });
    });
});
