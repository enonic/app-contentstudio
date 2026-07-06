import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setActiveProjectResolver } from './cms';
import { buildImagePreviewUrl, buildImageRenderUrl } from './images';

beforeEach(() => {
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    setActiveProjectResolver(() => undefined);
});

//
// * buildImagePreviewUrl
//

describe('buildImagePreviewUrl', () => {
    it('should build the bare preview url scoped to the active project', () => {
        const url = buildImagePreviewUrl({ contentId: 'abc-1' });

        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/image/abc-1');
        expect(url).not.toContain('?');
    });

    it('should scope the url to an explicit project', () => {
        const url = buildImagePreviewUrl({ contentId: 'abc-1', projectName: 'other' });

        expect(url).toContain('/rest-v2/cs/cms/other/content/content/image/abc-1');
    });

    it('should append params unencoded in the legacy resolver order', () => {
        const url = buildImagePreviewUrl({
            contentId: 'abc-1',
            timestamp: new Date(1700000000000),
            size: 640.9,
            source: true,
            aspectRatio: '21:9',
            filter: 'rounded(5)',
            crop: false,
            scaleWidth: true,
        });

        expect(url.split('?')[1]).toBe(
            'ts=1700000000000&size=640&source=true&scale=21:9&filter=rounded(5)&crop=false&scaleWidth=true',
        );
    });

    it('should append only the set params', () => {
        const url = buildImagePreviewUrl({
            contentId: 'abc-1',
            timestamp: new Date(1700000000000),
            size: 480,
            crop: false,
        });

        expect(url.split('?')[1]).toBe('ts=1700000000000&size=480&crop=false');
    });

    it('should omit disabled and default-valued params entirely', () => {
        const url = buildImagePreviewUrl({
            contentId: 'abc-1',
            size: 0,
            source: false,
            crop: true,
            scaleWidth: false,
        });

        expect(url).not.toContain('?');
    });
});

//
// * buildImageRenderUrl
//

describe('buildImageRenderUrl', () => {
    it('should build the plain render placeholder without a style', () => {
        expect(buildImageRenderUrl('abc-1')).toBe('image://abc-1');
    });

    it('should append the style param for a styled image', () => {
        expect(buildImageRenderUrl('abc-1', 'banner')).toBe('image://abc-1?style=banner');
    });

    it('should use the original-media placeholder for the original-image style', () => {
        expect(buildImageRenderUrl('abc-1', 'editor-style-original')).toBe('media://abc-1');
    });
});
