import { Result, ResultAsync } from 'neverthrow';
import { type Attachment, AttachmentBuilder } from '../../../../app/attachment/Attachment';
import { type AttachmentJson } from '../../../../app/attachment/AttachmentJson';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { AppError, UploadError } from '../../../shared/api/errors';
import { requestOptionalJson } from '../../../shared/api/client';
import { requestUploadJson } from '../../../shared/api/upload';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';
import { sanitizeName } from '../../../shared/lib/upload/upload';

export type UploadAttachmentSuccess = { identifier: string; attachment: Attachment };

export type UploadAttachmentFileOptions = {
    id: string;
    file: File;
    contentId: string;
    onProgress?: (id: string, progress: number) => void;
};

export type DeleteAttachmentOptions = {
    contentId: string;
    attachmentNames: string[];
};

/** Used by: features/shared/form/input-types/attachment-uploader */
export function uploadAttachmentFile({
    id,
    file,
    contentId,
    onProgress,
}: UploadAttachmentFileOptions): ResultAsync<UploadAttachmentSuccess, UploadError> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', sanitizeName(file.name));
    formData.append('id', contentId);

    return requestUploadJson<AttachmentJson>(getCmsApiUrl('createAttachment'), {
        formData,
        onProgress: (progress) => onProgress?.(id, progress),
    })
        .mapErr((error) => new UploadError(id, error.message, error))
        .andThen((json) => buildAttachment(id, json).map((attachment) => ({ identifier: id, attachment })));
}

/** Used by: features/shared/form/input-types/attachment-uploader */
export function deleteAttachment({ contentId, attachmentNames }: DeleteAttachmentOptions): ResultAsync<void, AppError> {
    // The endpoint answers 200 with the updated content JSON, which the caller discards.
    return requestOptionalJson<ContentJson>(getCmsApiUrl('deleteAttachment'), {
        method: 'POST',
        body: { contentId, attachmentNames },
    }).map(() => undefined);
}

/** Build the domain attachment, keeping a builder throw as a parse failure. */
function buildAttachment(id: string, json: AttachmentJson): Result<Attachment, UploadError> {
    return Result.fromThrowable(
        () => new AttachmentBuilder().fromJson(json).build(),
        () => new UploadError(id, 'Failed to parse response'),
    )();
}
