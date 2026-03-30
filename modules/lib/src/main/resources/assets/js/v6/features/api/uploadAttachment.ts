import {Result, ResultAsync} from 'neverthrow';
import {type AttachmentJson} from '../../../app/attachment/AttachmentJson';
import {ContentPath} from '../../../app/content/ContentPath';
import {type Project} from '../../../app/settings/data/project/Project';
import {UrlHelper} from '../../../app/util/UrlHelper';
import {UploadError} from './errors';
import {$activeProject} from '../store/projects.store';
import {sanitizeName} from '../utils/upload/upload';

const UPLOAD_PROGRESS_CAP = 99;

//
// * Types
//

export type UploadAttachmentSuccess = {identifier: string; attachment: AttachmentJson};
export type UploadAttachmentError = {identifier: string; message: string};

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

//
// * Functions
//

export function uploadAttachmentFile({
    id,
    file,
    contentId,
    onProgress,
}: UploadAttachmentFileOptions): ResultAsync<UploadAttachmentSuccess, UploadAttachmentError> {
    const project = $activeProject.get() as Project;
    const endpoint = UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath(ContentPath.CONTENT_ROOT, project)}/content/createAttachment`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', sanitizeName(file.name));
    formData.append('id', contentId);

    return ResultAsync.fromPromise(
        new Promise<UploadAttachmentSuccess>((resolve, reject) => {
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
                        const attachment: AttachmentJson = JSON.parse(xhr.responseText);
                        resolve({identifier: id, attachment});
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
        (error): UploadAttachmentError =>
            error instanceof UploadError
                ? {identifier: error.mediaIdentifier, message: error.message}
                : {identifier: '', message: String(error)}
    );
}

export function deleteAttachment({contentId, attachmentNames}: DeleteAttachmentOptions): ResultAsync<void, Error> {
    const project = $activeProject.get() as Project;
    const endpoint = UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath(ContentPath.CONTENT_ROOT, project)}/content/deleteAttachment`);

    return ResultAsync.fromPromise(
        fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({contentId, attachmentNames}),
        }).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        }),
        (error): Error => (error instanceof Error ? error : new Error(String(error)))
    );
}

//
// * Utilities
//

const safeJsonParse = Result.fromThrowable(
    (text: string) => JSON.parse(text) as Record<string, unknown>,
    (e) => e as Error
);
