import { describe, expect, it } from 'vitest';
import { type Content } from '../../../../app/content/Content';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { type HtmlAreaImageDialogState } from '../model/htmlAreaImageDialog.types';
import { isEchoUpdate, isStaleFetch, mergeFetchedImageContent } from './imageContentMerge';

const IMAGE_ID = 'image-1';

type ContentStub = {
    altText?: string;
    caption?: string;
    modifiedMs?: number;
};

function content({ altText, caption, modifiedMs }: ContentStub = {}): Content {
    const properties: Record<string, string | undefined> = { altText, caption };

    return {
        getId: () => IMAGE_ID,
        getModifiedTime: () => (modifiedMs == null ? undefined : new Date(modifiedMs)),
        getProperty: (name: string) => {
            const value = properties[name];
            return value == null ? undefined : { getString: () => value };
        },
        // No imageInfo mixin, so ImageHelper.getImageDescription falls through to null.
        getMixinByName: () => undefined,
    } as unknown as Content;
}

function summary(modifiedMs?: number): ContentSummary {
    return {
        getId: () => IMAGE_ID,
        getModifiedTime: () => (modifiedMs == null ? undefined : new Date(modifiedMs)),
    } as unknown as ContentSummary;
}

function state(overrides: Partial<HtmlAreaImageDialogState> = {}): HtmlAreaImageDialogState {
    return {
        open: true,
        selectedImageId: IMAGE_ID,
        selectedImageContent: undefined,
        altText: '',
        caption: '',
        accessibility: '',
        ...overrides,
    } as HtmlAreaImageDialogState;
}

describe('isStaleFetch', () => {
    it('should report a fetch older than the known content as stale', () => {
        expect(isStaleFetch(summary(100), summary(200))).toBe(true);
    });

    it('should accept a fetch with the same timestamp as the known content', () => {
        expect(isStaleFetch(summary(200), summary(200))).toBe(false);
    });

    it('should accept any fetch when either timestamp is missing', () => {
        expect(isStaleFetch(summary(), summary(200))).toBe(false);
        expect(isStaleFetch(summary(100), undefined)).toBe(false);
    });
});

describe('isEchoUpdate', () => {
    it('should treat an event with the same timestamp as an echo', () => {
        expect(isEchoUpdate(summary(200), summary(200))).toBe(true);
    });

    it('should not treat a newer event as an echo', () => {
        expect(isEchoUpdate(summary(300), summary(200))).toBe(false);
    });

    it('should not treat an event as an echo when either timestamp is missing', () => {
        expect(isEchoUpdate(summary(), summary(200))).toBe(false);
        expect(isEchoUpdate(summary(300), undefined)).toBe(false);
    });
});

describe('mergeFetchedImageContent', () => {
    it('should ignore the result when the dialog is closed', () => {
        const prev = state({ open: false });

        expect(mergeFetchedImageContent(prev, IMAGE_ID, content({ altText: 'A cat' }), 'seed')).toBe(prev);
    });

    it('should ignore the result when another image is selected', () => {
        const prev = state({ selectedImageId: 'image-2' });

        expect(mergeFetchedImageContent(prev, IMAGE_ID, content({ altText: 'A cat' }), 'seed')).toBe(prev);
    });

    it('should ignore a fetch that resolved out of order', () => {
        const prev = state({ selectedImageContent: summary(200) });

        expect(mergeFetchedImageContent(prev, IMAGE_ID, content({ altText: 'A cat', modifiedMs: 100 }), 'seed')).toBe(
            prev,
        );
    });

    describe('attach mode', () => {
        it('should store the content without touching alt text or caption', () => {
            const fetched = content({ altText: 'A cat', caption: 'Tabby' });

            const next = mergeFetchedImageContent(state(), IMAGE_ID, fetched, 'attach');

            expect(next.selectedImageContent).toBe(fetched);
            expect(next.altText).toBe('');
            expect(next.caption).toBe('');
            expect(next.accessibility).toBe('');
        });
    });

    describe('seed mode', () => {
        it('should store the content and fill blank alt text and caption', () => {
            const fetched = content({ altText: 'A cat', caption: 'Tabby' });

            const next = mergeFetchedImageContent(state(), IMAGE_ID, fetched, 'seed');

            expect(next.selectedImageContent).toBe(fetched);
            expect(next.altText).toBe('A cat');
            expect(next.caption).toBe('Tabby');
        });

        it('should classify the image as informative when it arrives with alt text', () => {
            const next = mergeFetchedImageContent(state(), IMAGE_ID, content({ altText: 'A cat' }), 'seed');

            expect(next.accessibility).toBe('informative');
        });

        it('should keep values the user already typed', () => {
            const prev = state({ altText: 'Mine', caption: 'My caption' });

            const next = mergeFetchedImageContent(
                prev,
                IMAGE_ID,
                content({ altText: 'A cat', caption: 'Tabby' }),
                'seed',
            );

            expect(next.altText).toBe('Mine');
            expect(next.caption).toBe('My caption');
        });
    });

    describe('metadata mode', () => {
        it('should fill blank fields without replacing the selected content', () => {
            const known = summary(100);
            const prev = state({ selectedImageContent: known });

            const next = mergeFetchedImageContent(
                prev,
                IMAGE_ID,
                content({ altText: 'A cat', modifiedMs: 100 }),
                'metadata',
            );

            expect(next.selectedImageContent).toBe(known);
            expect(next.altText).toBe('A cat');
        });

        it('should classify the image as informative when it arrives with alt text', () => {
            const next = mergeFetchedImageContent(state(), IMAGE_ID, content({ altText: 'A cat' }), 'metadata');

            expect(next.accessibility).toBe('informative');
        });
    });

    // The dialog is open while the server generates alt text, so the refresh it triggers
    // has to land in the already-mounted state. This is the issue #11252 path.
    describe('server-generated alt text', () => {
        it('should apply generated alt text and classify the image as informative', () => {
            const fetched = content({ altText: 'A cat sitting on a fence' });

            const next = mergeFetchedImageContent(state(), IMAGE_ID, fetched, 'seed');

            expect(next.selectedImageContent).toBe(fetched);
            expect(next.altText).toBe('A cat sitting on a fence');
            expect(next.accessibility).toBe('informative');
        });

        it('should replace a whitespace-only alt text instead of keeping it', () => {
            const prev = state({ altText: '   ' });

            const next = mergeFetchedImageContent(prev, IMAGE_ID, content({ altText: 'A cat' }), 'seed');

            expect(next.altText).toBe('A cat');
            expect(next.accessibility).toBe('informative');
        });

        it('should keep alt text the user typed', () => {
            const prev = state({ altText: 'Mine', accessibility: 'informative' });

            const next = mergeFetchedImageContent(prev, IMAGE_ID, content({ altText: 'A cat' }), 'seed');

            expect(next.altText).toBe('Mine');
            expect(next.accessibility).toBe('informative');
        });

        it('should not override an accessibility choice the user already made', () => {
            const prev = state({ accessibility: 'decorative' });

            const next = mergeFetchedImageContent(prev, IMAGE_ID, content({ altText: 'A cat' }), 'seed');

            expect(next.accessibility).toBe('decorative');
        });

        it('should leave accessibility unset when the server has no alt text', () => {
            const next = mergeFetchedImageContent(state(), IMAGE_ID, content({ caption: 'Tabby' }), 'seed');

            expect(next.altText).toBe('');
            expect(next.accessibility).toBe('');
        });

        it('should not classify the image as informative on whitespace-only server alt text', () => {
            const next = mergeFetchedImageContent(state(), IMAGE_ID, content({ altText: '   ' }), 'seed');

            expect(next.accessibility).toBe('');
        });
    });
});
