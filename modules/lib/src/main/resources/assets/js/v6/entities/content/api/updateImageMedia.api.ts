import { Result, ResultAsync } from 'neverthrow';
import { type Content, ContentBuilder } from '../../../../app/content/Content';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { UploadError } from '../../../shared/api/errors';
import { requestUploadJson } from '../../../shared/api/upload';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

export type UpdateImageMediaSuccess = {
    mediaIdentifier: string;
    content: Content;
};

export type UpdateImageMediaOptions = {
    id: string;
    file: File;
    contentId: string;
    onProgress?: (id: string, progress: number) => void;
};

/** Used by: features/shared/form/input-types/image-uploader */
export function updateImageMedia({
    id,
    file,
    contentId,
    onProgress,
}: UpdateImageMediaOptions): ResultAsync<UpdateImageMediaSuccess, UploadError> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('content', contentId);

    return requestUploadJson<ContentJson>(getCmsApiUrl('updateMedia'), {
        formData,
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
