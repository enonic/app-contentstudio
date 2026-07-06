import { PropertyPath } from '@enonic/lib-admin-ui/data/PropertyPath';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Content } from '../../../../../../app/content/Content';
import type { ContentSummary } from '../../../../../../app/content/ContentSummary';
import type { ContentSelectorQueryParams } from '../../../../../entities/content/api/selectorQuery.api';
import { TAG_SITE_PATH, type TagConfig } from './TagConfig';

const mocks = vi.hoisted(() => ({
    fetchNearestSite: vi.fn(),
    selectorQueryCalls: [] as ContentSelectorQueryParams[],
    nextContents: [] as Content[],
}));

vi.mock('../../../../../entities/content/api/content.api', () => ({
    fetchNearestSite: mocks.fetchNearestSite,
}));

vi.mock('../../../../../entities/content/api/selectorQueryFull.api', async () => {
    const { okAsync } = await import('neverthrow');
    return {
        contentFullSelectorQuery: vi.fn((params: ContentSelectorQueryParams) => {
            mocks.selectorQueryCalls.push(params);
            return okAsync({
                contents: mocks.nextContents,
                hits: mocks.nextContents.length,
                totalHits: mocks.nextContents.length,
            });
        }),
    };
});

import { buildTagQueryField, suggestContentTags } from './ContentTagSuggester';

function resultOk<T>(value: T) {
    return {
        match: (success: (value: T) => unknown) => Promise.resolve(success(value)),
    };
}

function makeConfig(overrides: Partial<TagConfig> = {}): TagConfig {
    return {
        regexp: undefined,
        maxLength: -1,
        showCounter: false,
        allowPath: ['/content/*'],
        allowPathConfigured: true,
        ...overrides,
    };
}

function makeContextContent(): ContentSummary {
    return {
        getContentId: () => ({ toString: () => 'content-id' }),
    } as unknown as ContentSummary;
}

function makeContentWithTags(tags: string[]): Content {
    return {
        getContentData: () => ({
            getRoot: () => ({
                forEachProperty: (name: string, callback: (property: unknown, index: number) => void) => {
                    if (name !== 'tags') {
                        return;
                    }

                    tags.forEach((tag, index) => {
                        callback(
                            {
                                hasNonNullValue: () => true,
                                getType: () => ValueTypes.STRING,
                                getString: () => tag,
                            },
                            index,
                        );
                    });
                },
            }),
            getPropertySet: () => null,
        }),
    } as unknown as Content;
}

describe('ContentTagSuggester', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.selectorQueryCalls.length = 0;
        mocks.nextContents = [];
    });

    it('builds the fulltext field from the input property path', () => {
        expect(buildTagQueryField(PropertyPath.fromString('.tags'))).toBe('data.tags');
        expect(buildTagQueryField(PropertyPath.fromString('.metadata.tags'))).toBe('data.metadata.tags');
    });

    it('skips querying when default site scope has no nearest site', async () => {
        mocks.fetchNearestSite.mockReturnValue(resultOk(undefined));

        const result = await suggestContentTags({
            query: 'al',
            dataPath: PropertyPath.fromString('.tags'),
            content: makeContextContent(),
            config: makeConfig({ allowPath: [TAG_SITE_PATH], allowPathConfigured: false }),
        });

        expect(result).toEqual([]);
        expect(mocks.fetchNearestSite).toHaveBeenCalledOnce();
        expect(mocks.selectorQueryCalls).toHaveLength(0);
    });

    it('queries directly for explicit allowPath including the site wildcard', async () => {
        const content = makeContextContent();
        mocks.nextContents = [makeContentWithTags(['alpha'])];

        const result = await suggestContentTags({
            query: 'al',
            dataPath: PropertyPath.fromString('.tags'),
            content,
            config: makeConfig({ allowPath: [TAG_SITE_PATH], allowPathConfigured: true }),
        });

        // contentFullSelectorQuery is the Expand.FULL variant, so requesting it
        // preserves the former setExpand(Expand.FULL) intent.
        const params = mocks.selectorQueryCalls[0];
        expect(result).toEqual(['alpha']);
        expect(mocks.fetchNearestSite).not.toHaveBeenCalled();
        expect(mocks.selectorQueryCalls).toHaveLength(1);
        expect(params.size).toBe(10);
        expect(params.contentId).toBe('content-id');
        expect(params.allowedContentPaths).toEqual([TAG_SITE_PATH]);
        expect(params.contentTypeNames).toBeUndefined();
        expect(params.queryExpr?.toString()).toContain('data.tags');
    });

    it('passes configured allowed paths to the selector query request', async () => {
        await suggestContentTags({
            query: 'al',
            dataPath: PropertyPath.fromString('.tags'),
            content: makeContextContent(),
            config: makeConfig({ allowPath: ['/site-a/*', '/site-b/*'], allowPathConfigured: true }),
        });

        expect(mocks.selectorQueryCalls[0].allowedContentPaths).toEqual(['/site-a/*', '/site-b/*']);
    });

    it('prefix-filters, de-duplicates, and caps returned tags at 10', async () => {
        mocks.nextContents = [
            makeContentWithTags([
                'al0',
                'al1',
                'beta',
                'al1',
                'al2',
                'al3',
                'al4',
                'al5',
                'al6',
                'al7',
                'al8',
                'al9',
                'al10',
            ]),
        ];

        const result = await suggestContentTags({
            query: 'AL',
            dataPath: PropertyPath.fromString('.tags'),
            content: makeContextContent(),
            config: makeConfig(),
        });

        expect(result).toEqual(['al0', 'al1', 'al2', 'al3', 'al4', 'al5', 'al6', 'al7', 'al8', 'al9']);
    });

    it('uses startsWith filtering so special characters in the query are safe', async () => {
        mocks.nextContents = [makeContentWithTags(['al+tag', 'al.tag', 'al?tag'])];

        const result = await suggestContentTags({
            query: 'al+',
            dataPath: PropertyPath.fromString('.tags'),
            content: makeContextContent(),
            config: makeConfig(),
        });

        expect(result).toEqual(['al+tag']);
    });

    it('skips non-string values at the same data path', async () => {
        mocks.nextContents = [
            {
                getContentData: () => ({
                    getRoot: () => ({
                        forEachProperty: (name: string, callback: (property: unknown, index: number) => void) => {
                            if (name !== 'tags') {
                                return;
                            }

                            callback(
                                {
                                    hasNonNullValue: () => true,
                                    getType: () => ValueTypes.DATA,
                                    getString: () => {
                                        throw new Error('data values cannot be stringified');
                                    },
                                },
                                0,
                            );
                            callback(
                                {
                                    hasNonNullValue: () => true,
                                    getType: () => ValueTypes.STRING,
                                    getString: () => 'alpha',
                                },
                                1,
                            );
                        },
                    }),
                    getPropertySet: () => null,
                }),
            } as unknown as Content,
        ];

        const result = await suggestContentTags({
            query: 'al',
            dataPath: PropertyPath.fromString('.tags'),
            content: makeContextContent(),
            config: makeConfig(),
        });

        expect(result).toEqual(['alpha']);
    });
});
