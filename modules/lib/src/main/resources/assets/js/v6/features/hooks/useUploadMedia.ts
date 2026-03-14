import {type TargetedEvent, useCallback} from 'react';
import {type ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {type UploadMediaError, uploadMediaFile, type UploadMediaSuccess} from '../api/uploadMedia';
import {addUpload, completeUpload, failUpload, updateUploadProgress} from '../store/uploads.store';

//
// * Types
//
export type UseUploadMediaOptions = {
    parentContent?: ContentSummaryAndCompareStatus;
    onUploadStart?: (file: File) => void;
    onUploadProgress?: (mediaIdentifier: string, progress: number) => void;
    onUploadComplete?: (success: UploadMediaSuccess) => void;
    onUploadError?: (error: UploadMediaError) => void;
};

export type UseUploadMediaReturn = {
    handleInputChange: (event: TargetedEvent<HTMLInputElement>) => Promise<void>;
};

//
// * TODO: convert it to a hook
//
export const useUploadMedia = ({
    parentContent,
    onUploadStart = () => {},
    onUploadProgress = () => {},
    onUploadComplete = () => {},
    onUploadError = () => {},
}: UseUploadMediaOptions): UseUploadMediaReturn => {
    const resolvedOnUploadStart = (file: File) => {
        addUpload(file.name, file.name, parentContent?.getId() ?? null);
        onUploadStart(file);
    };

    const resolvedOnUploadProgress = (mediaIdentifier: string, progress: number) => {
        updateUploadProgress(mediaIdentifier, progress);
        onUploadProgress(mediaIdentifier, progress);
    };

    const resolvedOnUploadComplete = (success: UploadMediaSuccess) => {
        completeUpload(success.mediaIdentifier);
        onUploadComplete(success);
    };

    const resolvedOnUploadError = (error: UploadMediaError) => {
        failUpload(error.mediaIdentifier, error.message);
        onUploadError(error);
    };

    const handleInputChange = async (event: TargetedEvent<HTMLInputElement>) => {
        const {files} = event.currentTarget;

        if (!files || files.length === 0) return;

        const dataTransfer = new DataTransfer();

        Array.from(files).forEach((file) => dataTransfer.items.add(file));

        const tasks = Array.from(dataTransfer.files).map((file) => {
            resolvedOnUploadStart(file);

            return uploadMediaFile({
                id: file.name,
                file: file,
                parentContent,
                onProgress: resolvedOnUploadProgress,
            });
        });

        await Promise.all(tasks.map((task) => task.match(resolvedOnUploadComplete, resolvedOnUploadError)));
    };

    return {handleInputChange};
};
