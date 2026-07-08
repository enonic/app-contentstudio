import { Result, type ResultAsync } from 'neverthrow';
import { type Content, ContentBuilder } from '../../../../app/content/Content';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { UploadError } from '../../../shared/api/errors';
import { requestUploadJson } from '../../../shared/api/upload';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';
import { sanitizeName } from '../../../shared/lib/upload/upload';

//
// * Types
//

export type UpdateContentIconSuccess = {
    id: string;
    content: Content;
};

export type UpdateContentIconOptions = {
    contentId: string;
    file: File;
    onProgress?: (id: string, progress: number) => void;
};

//
// * Functions
//

export function updateContentIcon({
    contentId,
    file,
    onProgress,
}: UpdateContentIconOptions): ResultAsync<UpdateContentIconSuccess, UploadError> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', sanitizeName(file.name));
    formData.append('id', contentId);

    return requestUploadJson<ContentJson>(getCmsApiUrl('updateThumbnail'), {
        formData,
        onProgress: (progress) => onProgress?.(contentId, progress),
    })
        .mapErr((error) => new UploadError(contentId, error.message, error))
        .andThen((json) => buildContent(contentId, json).map((content) => ({ id: contentId, content })));
}

/** Build the domain content, keeping a builder throw as a parse failure. */
function buildContent(id: string, json: ContentJson): Result<Content, UploadError> {
    return Result.fromThrowable(
        () => new ContentBuilder().fromContentJson(json).build(),
        () => new UploadError(id, 'Failed to parse response')
    )();
}
