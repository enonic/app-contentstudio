import { StyleHelper } from '../../../../app/inputtype/ui/text/styles/StyleHelper';
import { getCmsApiUrl } from './cms';
import { appendUrlParams } from './params';

const URL_PREFIX_RENDER = 'image://';
const URL_PREFIX_RENDER_ORIGINAL = 'media://';

type ImageUrlParams = {
    size?: number | null;
    crop?: boolean | null;
};

export function createImageUrl(url: string, params: ImageUrlParams): string {
    const queryIndex = url.indexOf('?');
    const base = queryIndex >= 0 ? url.substring(0, queryIndex) : url;

    // Preserve the existing query (e.g. the server's `ts` cache-buster) so a re-uploaded
    // icon yields a distinct, non-stale src, while overriding our own params by key.
    const search = new URLSearchParams(queryIndex >= 0 ? url.substring(queryIndex + 1) : '');
    for (const [key, value] of Object.entries(params)) {
        if (value != null) search.set(key, String(value));
    }

    return `${base}?${search.toString()}`;
}

export type ImagePreviewUrlParams = {
    contentId: string;
    projectName?: string;
    timestamp?: Date;
    size?: number;
    source?: boolean;
    aspectRatio?: string;
    filter?: string;
    crop?: boolean;
    scaleWidth?: boolean;
};

/**
 * Build a CMS REST preview URL for an image content, byte-identical to the legacy
 * `ImageUrlResolver.resolveForPreview`. Query params are appended raw (unencoded)
 * in the fixed legacy resolver order.
 * Used by: features/shared/form/input-types/image-uploader/lib/image,
 * features/shared/selectors/image/ImageSelectorItemView,
 * features/shared/form/input-types/html-area/setupEditor,
 * features/rich-text-inserts/ui/htmlarea-image/HtmlAreaImageDialogContext.
 */
export function buildImagePreviewUrl(params: ImagePreviewUrlParams): string {
    const { contentId, projectName, timestamp, size, source, aspectRatio, filter, crop, scaleWidth } = params;

    const base = getCmsApiUrl(`image/${contentId}`, projectName);

    const query: Record<string, unknown> = {};
    if (timestamp) query.ts = timestamp.getTime();
    if (size) query.size = Math.floor(size);
    if (source === true) query.source = true;
    if (aspectRatio) query.scale = aspectRatio;
    if (filter) query.filter = filter;
    if (crop === false) query.crop = false;
    if (scaleWidth === true) query.scaleWidth = true;

    return appendUrlParams(base, query, false);
}

/**
 * Build a render placeholder URL (`image://` / `media://`) for an image content,
 * mirroring the legacy `ImageUrlResolver.resolveForRender`.
 * Used by: features/shared/form/input-types/html-area/setupEditor,
 * features/rich-text-inserts/ui/htmlarea-image/HtmlAreaImageDialogContext.
 */
export function buildImageRenderUrl(contentId: string, styleName: string = ''): string {
    if (StyleHelper.isOriginalImage(styleName)) {
        return `${URL_PREFIX_RENDER_ORIGINAL}${contentId}`;
    }

    return styleName ? `${URL_PREFIX_RENDER}${contentId}?style=${styleName}` : `${URL_PREFIX_RENDER}${contentId}`;
}
