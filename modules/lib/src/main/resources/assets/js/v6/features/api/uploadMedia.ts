import {ResultAsync} from 'neverthrow';
import {Content, ContentBuilder} from '../../../app/content/Content';
import {ContentPath} from '../../../app/content/ContentPath';
import {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {Project} from '../../../app/settings/data/project/Project';
import {UrlHelper} from '../../../app/util/UrlHelper';
import {$activeProject} from '../store/projects.store';
import {generateUniqueName} from '../utils/image/generateUniqueName';

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
    imageSource: string;
    parentContent?: ContentSummaryAndCompareStatus;
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
    formData.append('name', file.name);
    formData.append('parent', getParentPath(parentContent));

    const mediaIdentifier = id;

    return ResultAsync.fromPromise(
        new Promise<UploadMediaSuccess>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) return;

                const progress = (event.loaded / event.total) * 100;
                onProgress?.(id, progress);
            };

            xhr.onerror = () => {
                reject({mediaIdentifier, message: 'Network error'});
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const json = JSON.parse(xhr.responseText);
                        const content = new ContentBuilder().fromContentJson(json).build();
                        resolve({mediaIdentifier, content});
                    } catch {
                        reject({mediaIdentifier, message: 'Failed to parse response'});
                    }
                } else {
                    reject({
                        mediaIdentifier,
                        message: JSON.parse(xhr.responseText)?.message || xhr.statusText,
                    });
                }
            };

            xhr.open('POST', endpoint);
            xhr.send(formData);
        }),
        (error: UploadMediaError) => error
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
    imageSource,
    parentContent,
}: UploadRemoteImageOptions): ResultAsync<UploadMediaSuccess, UploadMediaError> {
    const project = $activeProject.get() as Project;
    const endpoint = UrlHelper.getCmsRestUri(
        `${UrlHelper.getCMSPath(null, project)}/content/content/createMediaFromUrl`
    );

    const mediaIdentifier = generateUniqueName(imageSource);

    const body = JSON.stringify({
        url: imageSource,
        name: mediaIdentifier,
        parent: getParentPath(parentContent),
    });

    return ResultAsync.fromPromise(
        new Promise<UploadMediaSuccess>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.onerror = () => {
                reject({mediaIdentifier, message: 'Network error'});
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const json = JSON.parse(xhr.responseText);
                        const content = new ContentBuilder().fromContentJson(json).build();
                        resolve({mediaIdentifier, content});
                    } catch {
                        reject({mediaIdentifier, message: 'Failed to parse response'});
                    }
                } else {
                    reject({
                        mediaIdentifier,
                        message: JSON.parse(xhr.responseText)?.message || xhr.statusText,
                    });
                }
            };

            xhr.open('POST', endpoint);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(body);
        }),
        (error: UploadMediaError) => error
    );
}

//
// * Utilities
//

function getParentPath(parentContent?: ContentSummaryAndCompareStatus): string {
    return parentContent ? parentContent.getContentSummary().getPath().toString() : ContentPath.getRoot().toString();
}
