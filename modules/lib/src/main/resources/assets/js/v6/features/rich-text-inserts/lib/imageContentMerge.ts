import { type Content } from '../../../../app/content/Content';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { ImageHelper } from '../../../../app/util/ImageHelper';
import { isBlank } from '../../../shared/lib/format/isBlank';
import { type HtmlAreaImageDialogState } from '../model/htmlAreaImageDialog.types';

/**
 * How a fetched `Content` is reconciled into the open dialog state.
 *
 * - `attach` — store the content only; the editor markup owns alt text and caption.
 * - `seed` — store the content and fill blank alt text and caption from it.
 * - `metadata` — fill blank alt text and caption only; the caller already holds the content.
 *
 * Both merging modes answer a pending accessibility choice with `informative`, so an
 * image that arrives with alt text is classified without the user restating it.
 */
export type ImageContentMergeMode = 'attach' | 'seed' | 'metadata';

function getModifiedMs(content: ContentSummary | undefined): number | undefined {
    return content?.getModifiedTime()?.getTime();
}

/** A fetch that resolved out of order must not roll back fresher content. */
export function isStaleFetch(fetched: ContentSummary, known: ContentSummary | undefined): boolean {
    const fetchedMs = getModifiedMs(fetched);
    const knownMs = getModifiedMs(known);
    return fetchedMs != null && knownMs != null && fetchedMs < knownMs;
}

/**
 * A server event carrying nothing newer than the dialog already holds. Equal timestamps
 * count as echoes: re-fetching them cannot produce anything the dialog does not have.
 */
export function isEchoUpdate(updated: ContentSummary, known: ContentSummary | undefined): boolean {
    const updatedMs = getModifiedMs(updated);
    const knownMs = getModifiedMs(known);
    return updatedMs != null && knownMs != null && updatedMs <= knownMs;
}

/**
 * Reconcile a fetched `Content` into the dialog state, or return `prev` unchanged when the
 * result no longer applies. The single place that decides whether a fetch wins.
 */
export function mergeFetchedImageContent(
    prev: HtmlAreaImageDialogState,
    imageId: string,
    content: Content,
    mode: ImageContentMergeMode,
): HtmlAreaImageDialogState {
    if (!prev.open || prev.selectedImageId !== imageId) {
        return prev;
    }

    if (isStaleFetch(content, prev.selectedImageContent)) {
        return prev;
    }

    const next = mode === 'metadata' ? prev : { ...prev, selectedImageContent: content };

    if (mode === 'attach') {
        return next;
    }

    // Emptiness is decided by isBlank everywhere: a whitespace-only value that validation
    // already treats as empty must not outrank server text and block submit invisibly.
    const altText = isBlank(prev.altText) ? ImageHelper.getImageAltText(content) || '' : prev.altText;
    const caption = isBlank(prev.caption) ? ImageHelper.getImageCaption(content) || '' : prev.caption;

    // Alt text answers the accessibility question, but never overrides an explicit choice.
    const adoptInformative = prev.accessibility === '' && !isBlank(altText);

    return {
        ...next,
        altText,
        caption,
        accessibility: adoptInformative ? 'informative' : prev.accessibility,
    };
}
