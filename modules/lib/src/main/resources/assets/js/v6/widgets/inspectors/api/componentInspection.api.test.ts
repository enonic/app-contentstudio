import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { loadComponentDescriptor, loadComponentDescriptors } from './componentInspection.api';

const { mockFromJson, mockByShortName } = vi.hoisted(() => ({
    mockFromJson: vi.fn((json: { key: string }) => ({
        key: json.key,
        setComponentType: (componentType: unknown) => ({ key: json.key, componentType }),
    })),
    mockByShortName: vi.fn((shortName: string) => ({ shortName })),
}));

vi.mock('../../../../app/page/Descriptor', () => ({
    Descriptor: { fromJson: mockFromJson },
}));

vi.mock('../../../../app/page/region/ComponentType', () => ({
    ComponentType: { byShortName: mockByShortName },
}));

// Shape returned by the mocked Descriptor parser; the real Descriptor keeps these private.
type ParsedDescriptor = { key: string; componentType: { shortName: string } };

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
    mockFromJson.mockClear();
    mockByShortName.mockClear();
});

describe('loadComponentDescriptors', () => {
    it('should GET the project-scoped parts schema endpoint and parse descriptors', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ descriptors: [{ key: 'a' }, { key: 'b' }] }));

        const result = await loadComponentDescriptors('part', contentId('c-1'));

        expect(result.isOk()).toBe(true);
        const descriptors = result._unsafeUnwrap() as unknown as ParsedDescriptor[];
        expect(descriptors.map((d) => d.key)).toEqual(['a', 'b']);
        expect(descriptors.every((d) => d.componentType.shortName === 'part')).toBe(true);

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('cms/test-project/content/schema/filter/parts');
        expect(url).toContain('contentId=c-1');
    });

    it('should request the layouts endpoint for the layout type', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ descriptors: [] }));

        await loadComponentDescriptors('layout', contentId('c-1'));

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('cms/test-project/content/schema/filter/layouts');
    });

    it('should resolve with an empty array when the response has no descriptors', async () => {
        mockFetch.mockResolvedValue(jsonResponse({}));

        const result = await loadComponentDescriptors('part', contentId('c-1'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await loadComponentDescriptors('part', contentId('c-1'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('loadComponentDescriptor', () => {
    it('should GET the descriptor endpoint with the encoded key and parse the descriptor', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ key: 'app:part-1' }));

        const result = await loadComponentDescriptor('part', 'app:part-1');

        expect(result.isOk()).toBe(true);
        const descriptor = result._unsafeUnwrap() as unknown as ParsedDescriptor;
        expect(descriptor.key).toBe('app:part-1');
        expect(descriptor.componentType.shortName).toBe('part');

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('content/page/part/descriptor');
        expect(url).toContain(`key=${encodeURIComponent('app:part-1')}`);
    });

    it('should not fetch again on a cache hit for the same key', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ key: 'k-hit' }));

        const first = await loadComponentDescriptor('part', 'k-hit');
        expect(first.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        const second = await loadComponentDescriptor('part', 'k-hit');
        expect(second.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache errors and refetch on the next call', async () => {
        mockFetch.mockResolvedValueOnce(errorResponse(500, 'Server Error'));

        const first = await loadComponentDescriptor('layout', 'k-err');
        expect(first.isErr()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        mockFetch.mockResolvedValueOnce(jsonResponse({ key: 'k-err' }));

        const second = await loadComponentDescriptor('layout', 'k-err');
        expect(second.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});
