import {type TargetedEvent, useCallback, useMemo, useRef} from 'react';
import {type ContentSummary} from '../../../app/content/ContentSummary';
import {type UploadMediaError, uploadMediaFile, type UploadMediaSuccess} from '../api/uploadMedia';
import {addUpload, completeUpload, failUpload, updateUploadProgress} from '../store/uploads.store';

//
// * Types
//

export type UseUploadMediaOptions = {
    parentContent?: ContentSummary;
    onUploadStart?: (file: File) => void;
    onUploadProgress?: (mediaIdentifier: string, progress: number) => void;
    onUploadComplete?: (success: UploadMediaSuccess) => void;
    onUploadError?: (error: UploadMediaError) => void;
};

export type UseUploadMediaReturn = {
    handleInputChange: (event: TargetedEvent<HTMLInputElement>) => Promise<void>;
};

//
// * Hook
//

const NOOP = () => {};

export const useUploadMedia = ({
    parentContent,
    onUploadStart = NOOP,
    onUploadProgress = NOOP,
    onUploadComplete = NOOP,
    onUploadError = NOOP,
}: UseUploadMediaOptions): UseUploadMediaReturn => {
    const ref = useRef({parentContent, onUploadStart, onUploadProgress, onUploadComplete, onUploadError});
    ref.current = {parentContent, onUploadStart, onUploadProgress, onUploadComplete, onUploadError};

    const handleInputChange = useCallback(async (event: TargetedEvent<HTMLInputElement>) => {
        const {files} = event.currentTarget;

        if (!files || files.length === 0) return;

        const {parentContent, onUploadStart} = ref.current;

        const dataTransfer = new DataTransfer();

        Array.from(files).forEach((file) => dataTransfer.items.add(file));

        const tasks = Array.from(dataTransfer.files).map((file) => {
            addUpload(file.name, file.name, parentContent?.getId() ?? null);
            onUploadStart(file);

            return uploadMediaFile({
                id: file.name,
                file,
                parentContent,
                onProgress: (mediaIdentifier, progress) => {
                    updateUploadProgress(mediaIdentifier, progress);
                    ref.current.onUploadProgress(mediaIdentifier, progress);
                },
            });
        });

        await Promise.all(
            tasks.map((task) =>
                task.match(
                    (success) => {
                        completeUpload(success.mediaIdentifier);
                        ref.current.onUploadComplete(success);
                    },
                    (error) => {
                        failUpload(error.mediaIdentifier, error.message);
                        ref.current.onUploadError(error);
                    }
                )
            )
        );
    }, []);

    return useMemo(() => ({handleInputChange}), [handleInputChange]);
};
