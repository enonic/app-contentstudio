import { Result, ResultAsync } from 'neverthrow';
import { type Content, ContentBuilder } from '../../../../app/content/Content';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';
import { UploadError } from '../../../shared/api/errors';
import { sanitizeName } from '../../../shared/lib/upload/upload';

const UPLOAD_PROGRESS_CAP = 99;

//
// * Types
//

export type UpdateThumbnailSuccess = {
    id: string;
    content: Content;
};

export type UpdateThumbnailError = {
    id: string;
    message: string;
};

export type UpdateThumbnailOptions = {
    contentId: string;
    file: File;
    onProgress?: (id: string, progress: number) => void;
};

//
// * Functions
//

export function updateThumbnail({
    contentId,
    file,
    onProgress,
}: UpdateThumbnailOptions): ResultAsync<UpdateThumbnailSuccess, UpdateThumbnailError> {
    const endpoint = getCmsApiUrl('updateThumbnail');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', sanitizeName(file.name));
    formData.append('id', contentId);

    return ResultAsync.fromPromise(
        new Promise<UpdateThumbnailSuccess>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) return;

                const progress = Math.min((event.loaded / event.total) * 100, UPLOAD_PROGRESS_CAP);
                onProgress?.(contentId, progress);
            };

            xhr.onerror = () => {
                reject(new UploadError(contentId, 'Network error'));
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress?.(contentId, 100);
                    try {
                        const json = JSON.parse(xhr.responseText);
                        const content = new ContentBuilder().fromContentJson(json).build();
                        resolve({ id: contentId, content });
                    } catch {
                        reject(new UploadError(contentId, 'Failed to parse response'));
                    }
                } else {
                    const message =
                        safeJsonParse(xhr.responseText)
                            .map((json) => json?.message as string)
                            .unwrapOr(undefined) ?? xhr.statusText;
                    reject(new UploadError(contentId, message));
                }
            };

            xhr.open('POST', endpoint);
            xhr.send(formData);
        }),
        (error): UpdateThumbnailError =>
            error instanceof UploadError ? { id: error.mediaIdentifier, message: error.message } : { id: '', message: String(error) }
    );
}

//
// * Utilities
//

const safeJsonParse = Result.fromThrowable(
    (text: string) => JSON.parse(text) as Record<string, unknown>,
    (e) => e as Error
);
