import { type ResultAsync } from 'neverthrow';
import { getCmsRestUri } from '../../../shared/lib/url/cms';
import { UploadError } from '../../../shared/api/errors';
import { requestUploadJson } from '../../../shared/api/upload';

const ICON_SCALE_WIDTH = 150;

//
// * Types
//

export type UpdateProjectIconOptions = {
    projectName: string;
    file: File;
    onProgress?: (projectName: string, progress: number) => void;
};

//
// * Functions
//

export function updateProjectIcon({ projectName, file, onProgress }: UpdateProjectIconOptions): ResultAsync<void, UploadError> {
    const formData = new FormData();
    formData.append('name', projectName);
    formData.append('icon', file);
    formData.append('scaleWidth', String(ICON_SCALE_WIDTH));

    return requestUploadJson<void>(getCmsRestUri('project/modifyIcon'), {
        formData,
        onProgress: (progress) => onProgress?.(projectName, progress),
    }).mapErr((error) => new UploadError(projectName, error.message, error));
}
