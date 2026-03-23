import {ResultAsync} from 'neverthrow';
import {type Content, ContentBuilder} from '../../../app/content/Content';
import {ContentPath} from '../../../app/content/ContentPath';
import {type ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {type Project} from '../../../app/settings/data/project/Project';
import {UrlHelper} from '../../../app/util/UrlHelper';
import {UploadError} from './errors';
import {$activeProject} from '../store/projects.store';
import {generateUniqueName} from '../utils/image/generateUniqueName';

const FORBIDDEN_CHARS = /[/*?|:]/g;
export const UPLOAD_PROGRESS_CAP = 99;

//
// * Types
//

export type UploadMediaSuccess = {mediaIdentifier: string; content: Content};
export type UploadMediaError = {mediaIdentifier: string; message: string};

export type UploadMediaFileOptions = {
    id: string;
    file: File;
    parentContent?: ContentSummaryAndCompareStatus;
    onProgress?: (id: string, progress: number) => void;
};

export type UploadDataUrlImageOptions = {
    id: string;
    imageSource: string;
    name: string;
    parentContent?: ContentSummaryAndCompareStatus;
    onProgress?: (id: string, progress: number) => void;
};

export type UploadRemoteImageOptions = {
    id: string;
    imageSource: string;
    parentContent?: ContentSummaryAndCompareStatus;
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
                    reject(new UploadError(mediaIdentifier, JSON.parse(xhr.responseText)?.message || xhr.statusText));
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
                    reject(new UploadError(mediaIdentifier, JSON.parse(xhr.responseText)?.message || xhr.statusText));
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

function getParentPath(parentContent?: ContentSummaryAndCompareStatus): string {
    return parentContent ? parentContent.getContentSummary().getPath().toString() : ContentPath.getRoot().toString();
}

function sanitizeName(name: string): string {
    return name.normalize('NFC').replace(FORBIDDEN_CHARS, '_');
}
