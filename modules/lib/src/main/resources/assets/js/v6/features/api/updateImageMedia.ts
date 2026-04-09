import {Result, ResultAsync} from 'neverthrow';
import {type Content, ContentBuilder} from '../../../app/content/Content';
import {getCmsApiUrl} from '../utils/url/cms';
import {UploadError} from './errors';

const UPLOAD_PROGRESS_CAP = 99;

//
// * Types
//

export type UpdateImageMediaSuccess = {
    mediaIdentifier: string;
    content: Content
};

export type UpdateImageMediaError = {
    mediaIdentifier: string;
    message: string
};

export type UpdateImageMediaOptions = {
    id: string;
    file: File;
    contentId: string;
    onProgress?: (id: string, progress: number) => void;
};

//
// * Functions
//

export function updateImageMedia({
    id,
    file,
    contentId,
    onProgress,
}: UpdateImageMediaOptions): ResultAsync<UpdateImageMediaSuccess, UpdateImageMediaError> {
    const endpoint = getCmsApiUrl('updateMedia');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('content', contentId);

    return ResultAsync.fromPromise(
        new Promise<UpdateImageMediaSuccess>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) return;

                const progress = Math.min((event.loaded / event.total) * 100, UPLOAD_PROGRESS_CAP);
                onProgress?.(id, progress);
            };

            xhr.onerror = () => {
                reject(new UploadError(id, 'Network error'));
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress?.(id, 100);
                    try {
                        const json = JSON.parse(xhr.responseText);
                        const content = new ContentBuilder().fromContentJson(json).build();
                        resolve({mediaIdentifier: id, content});
                    } catch {
                        reject(new UploadError(id, 'Failed to parse response'));
                    }
                } else {
                    const message =
                        safeJsonParse(xhr.responseText)
                            .map((json) => json?.message as string)
                            .unwrapOr(undefined) ?? xhr.statusText;
                    reject(new UploadError(id, message));
                }
            };

            xhr.open('POST', endpoint);
            xhr.send(formData);
        }),
        (error): UpdateImageMediaError =>
            error instanceof UploadError ? error.toResult() : {mediaIdentifier: '', message: String(error)}
    );
}

//
// * Utilities
//

const safeJsonParse = Result.fromThrowable(
    (text: string) => JSON.parse(text) as Record<string, unknown>,
    (e) => e as Error
);
