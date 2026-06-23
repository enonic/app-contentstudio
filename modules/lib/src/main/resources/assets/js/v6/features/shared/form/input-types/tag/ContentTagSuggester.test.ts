import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {Content} from '../../../../../../app/content/Content';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {TAG_SITE_PATH, type TagConfig} from './TagConfig';

const mocks = vi.hoisted(() => ({
    fetchNearestSite: vi.fn(),
    requestInstances: [] as Record<string, ReturnType<typeof vi.fn>>[],
    nextContents: [] as Content[],
}));

vi.mock('../../../../api/content', () => ({
    fetchNearestSite: mocks.fetchNearestSite,
}));

vi.mock('../../../../../../app/resource/ContentSelectorQueryRequest', () => ({
    ContentSelectorQueryRequest: vi.fn(function ContentSelectorQueryRequest() {
        const instance = {
            setSize: vi.fn(),
            setContent: vi.fn(),
            setExpand: vi.fn(),
            setAllowedContentPaths: vi.fn(),
            setQueryExpr: vi.fn(),
            setContentTypeNames: vi.fn(),
            sendAndParse: vi.fn(() => Promise.resolve(mocks.nextContents)),
        };

        mocks.requestInstances.push(instance);
        return instance;
    }),
}));

import {buildTagQueryField, suggestContentTags} from './ContentTagSuggester';

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
        getContentId: () => ({toString: () => 'content-id'}),
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
        mocks.requestInstances.length = 0;
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
            config: makeConfig({allowPath: [TAG_SITE_PATH], allowPathConfigured: false}),
        });

        expect(result).toEqual([]);
        expect(mocks.fetchNearestSite).toHaveBeenCalledOnce();
        expect(mocks.requestInstances).toHaveLength(0);
    });

    it('queries directly for explicit allowPath including the site wildcard', async () => {
        const content = makeContextContent();
        mocks.nextContents = [makeContentWithTags(['alpha'])];

        const result = await suggestContentTags({
            query: 'al',
            dataPath: PropertyPath.fromString('.tags'),
            content,
            config: makeConfig({allowPath: [TAG_SITE_PATH], allowPathConfigured: true}),
        });

        const request = mocks.requestInstances[0];
        expect(result).toEqual(['alpha']);
        expect(mocks.fetchNearestSite).not.toHaveBeenCalled();
        expect(request.setSize).toHaveBeenCalledWith(10);
        expect(request.setContent).toHaveBeenCalledWith(content);
        expect(request.setExpand).toHaveBeenCalledWith(Expand.FULL);
        expect(request.setAllowedContentPaths).toHaveBeenCalledWith([TAG_SITE_PATH]);
        expect(request.setContentTypeNames).not.toHaveBeenCalled();
        expect(request.setQueryExpr.mock.calls[0][0].toString()).toContain('data.tags');
    });

    it('passes configured allowed paths to the selector query request', async () => {
        await suggestContentTags({
            query: 'al',
            dataPath: PropertyPath.fromString('.tags'),
            content: makeContextContent(),
            config: makeConfig({allowPath: ['/site-a/*', '/site-b/*'], allowPathConfigured: true}),
        });

        expect(mocks.requestInstances[0].setAllowedContentPaths).toHaveBeenCalledWith(['/site-a/*', '/site-b/*']);
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
