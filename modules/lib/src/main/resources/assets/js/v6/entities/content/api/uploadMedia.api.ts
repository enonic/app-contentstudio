import { Result, ResultAsync } from 'neverthrow';
import { type Content, ContentBuilder } from '../../../../app/content/Content';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { ContentPath } from '../../../../app/content/ContentPath';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { UploadError } from '../../../shared/api/errors';
import { requestUploadJson } from '../../../shared/api/upload';
import { generateUniqueName } from '../../../shared/lib/image/generateUniqueName';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';
import { sanitizeName } from '../../../shared/lib/upload/upload';

export type UploadMediaSuccess = { mediaIdentifier: string; content: Content };

export type UploadMediaFileOptions = {
    id: string;
    file: File;
    parentContent?: ContentSummary;
    onProgress?: (id: string, progress: number) => void;
};

export type UploadRemoteImageOptions = {
    id: string;
    imageSource: string;
    parentContent?: ContentSummary;
    onProgress?: (id: string, progress: number) => void;
};

/** Used by: entities/content/lib/useUploadMedia.ts, features/new-content */
export function uploadMediaFile({
    id,
    file,
    parentContent,
    onProgress,
}: UploadMediaFileOptions): ResultAsync<UploadMediaSuccess, UploadError> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', sanitizeName(file.name));
    formData.append('parent', getParentPath(parentContent));

    return requestUploadJson<ContentJson>(getCmsApiUrl('createMedia'), {
        formData,
        onProgress: (progress) => onProgress?.(id, progress),
    })
        .mapErr((error) => new UploadError(id, error.message, error))
        .andThen((json) => buildContent(id, json).map((content) => ({ mediaIdentifier: id, content })));
}

/** Used by: features/new-content */
export function uploadRemoteImage({
    id,
    imageSource,
    parentContent,
    onProgress,
}: UploadRemoteImageOptions): ResultAsync<UploadMediaSuccess, UploadError> {
    const body = {
        url: imageSource,
        name: generateUniqueName(imageSource),
        parent: getParentPath(parentContent),
    };

    return requestUploadJson<ContentJson>(getCmsApiUrl('createMediaFromUrl'), {
        body,
        onProgress: (progress) => onProgress?.(id, progress),
    })
        .mapErr((error) => new UploadError(id, error.message, error))
        .andThen((json) => buildContent(id, json).map((content) => ({ mediaIdentifier: id, content })));
}

/** Build the domain content, keeping a builder throw as a parse failure. */
function buildContent(id: string, json: ContentJson): Result<Content, UploadError> {
    return Result.fromThrowable(
        () => new ContentBuilder().fromContentJson(json).build(),
        () => new UploadError(id, 'Failed to parse response'),
    )();
}

function getParentPath(parentContent?: ContentSummary): string {
    return parentContent ? parentContent.getPath().toString() : ContentPath.getRoot().toString();
}
