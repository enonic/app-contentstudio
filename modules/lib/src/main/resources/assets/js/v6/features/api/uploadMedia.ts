import {Result, ResultAsync} from 'neverthrow';
import {type Content, ContentBuilder} from '../../../app/content/Content';
import {ContentPath} from '../../../app/content/ContentPath';
import {type ContentSummary} from '../../../app/content/ContentSummary';
import {type Project} from '../../../app/settings/data/project/Project';
import {UrlHelper} from '../../../app/util/UrlHelper';
import {UploadError} from './errors';
import {$activeProject} from '../store/projects.store';
import {generateUniqueName} from '../utils/image/generateUniqueName';
import {sanitizeName} from '../utils/upload/upload';

const UPLOAD_PROGRESS_CAP = 99;

//
// * Types
//

export type UploadMediaSuccess = {mediaIdentifier: string; content: Content};
export type UploadMediaError = {mediaIdentifier: string; message: string};

export type UploadMediaFileOptions = {
    id: string;
    file: File;
    parentContent?: ContentSummary;
    onProgress?: (id: string, progress: number) => void;
};

export type UploadDataUrlImageOptions = {
    id: string;
    imageSource: string;
    name: string;
    parentContent?: ContentSummary;
    onProgress?: (id: string, progress: number) => void;
};

export type UploadRemoteImageOptions = {
    id: string;
    imageSource: string;
    parentContent?: ContentSummary;
    onProgress?: (id: string, progress: number) => void;
};

//
// * Functions
//

export function uploadMediaFile({
    id,
    file,
    parentContent,
    onProgress,
}: UploadMediaFileOptions): ResultAsync<UploadMediaSuccess, UploadMediaError> {
    const project = $activeProject.get() as Project;
    const endpoint = UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath(null, project)}/content/content/createMedia`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', sanitizeName(file.name));
    formData.append('parent', getParentPath(parentContent));

    const mediaIdentifier = id;

    return ResultAsync.fromPromise(
        new Promise<UploadMediaSuccess>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) return;

                // ? We cap it to make sure only the onLoad will call onProgress with 100%.
                const progress = Math.min((event.loaded / event.total) * 100, UPLOAD_PROGRESS_CAP);
                onProgress?.(id, progress);
            };

            xhr.onerror = () => {
                reject(new UploadError(mediaIdentifier, 'Network error'));
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress?.(id, 100);
                    try {
                        const json = JSON.parse(xhr.responseText);
                        const content = new ContentBuilder().fromContentJson(json).build();
                        resolve({mediaIdentifier, content});
                    } catch {
                        reject(new UploadError(mediaIdentifier, 'Failed to parse response'));
                    }
                } else {
                    const message =
                        safeJsonParse(xhr.responseText)
                            .map((json) => json?.message as string)
                            .unwrapOr(undefined) ?? xhr.statusText;
                    reject(new UploadError(mediaIdentifier, message));
                }
            };

            xhr.open('POST', endpoint);
            xhr.send(formData);
        }),
        (error): UploadMediaError => (error instanceof UploadError ? error.toResult() : {mediaIdentifier: '', message: String(error)})
    );
}

export function uploadDataUrlImage({
    id,
    imageSource,
    name,
    parentContent,
    onProgress,
}: UploadDataUrlImageOptions): ResultAsync<UploadMediaSuccess, UploadMediaError> {
    return ResultAsync.fromPromise(
        fetch(imageSource).then((response) => response.blob()),
        (): UploadMediaError => ({mediaIdentifier: id, message: 'Failed to load image from URL'})
    )
        .map((blob) => new File([blob], name))
        .andThen((file) => uploadMediaFile({id, file, parentContent, onProgress}));
}

export function uploadRemoteImage({
    id,
    imageSource,
    parentContent,
    onProgress,
}: UploadRemoteImageOptions): ResultAsync<UploadMediaSuccess, UploadMediaError> {
    const project = $activeProject.get() as Project;
    const endpoint = UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath(null, project)}/content/content/createMediaFromUrl`);

    const mediaIdentifier = id;

    const body = JSON.stringify({
        url: imageSource,
        name: generateUniqueName(imageSource),
        parent: getParentPath(parentContent),
    });

    return ResultAsync.fromPromise(
        new Promise<UploadMediaSuccess>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) return;

                const progress = Math.min((event.loaded / event.total) * 100, UPLOAD_PROGRESS_CAP);
                onProgress?.(id, progress);
            };

            xhr.onerror = () => {
                reject(new UploadError(mediaIdentifier, 'Network error'));
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress?.(id, 100);
                    try {
                        const json = JSON.parse(xhr.responseText);
                        const content = new ContentBuilder().fromContentJson(json).build();
                        resolve({mediaIdentifier, content});
                    } catch {
                        reject(new UploadError(mediaIdentifier, 'Failed to parse response'));
                    }
                } else {
                    const message =
                        safeJsonParse(xhr.responseText)
                            .map((json) => json?.message as string)
                            .unwrapOr(undefined) ?? xhr.statusText;
                    reject(new UploadError(mediaIdentifier, message));
                }
            };

            xhr.open('POST', endpoint);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(body);
        }),
        (error): UploadMediaError => (error instanceof UploadError ? error.toResult() : {mediaIdentifier: '', message: String(error)})
    );
}

//
// * Utilities
//

const safeJsonParse = Result.fromThrowable(
    (text: string) => JSON.parse(text) as Record<string, unknown>,
    (e) => e as Error
);

function getParentPath(parentContent?: ContentSummary): string {
    return parentContent ? parentContent.getPath().toString() : ContentPath.getRoot().toString();
}
