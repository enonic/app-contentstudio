import { type TargetedEvent, useCallback, useMemo, useRef } from 'react';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { uploadMediaFile, type UploadMediaSuccess } from '../api/uploadMedia.api';
import { type UploadError } from '../../../shared/api';
import { addUpload, completeUpload, failUpload, updateUploadProgress } from '../model/uploads.store';

//
// * Types
//

export type UseUploadMediaOptions = {
    parentContent?: ContentSummary;
    onUploadStart?: (file: File) => void;
    onUploadProgress?: (mediaIdentifier: string, progress: number) => void;
    onUploadComplete?: (success: UploadMediaSuccess) => void;
    onUploadError?: (error: UploadError) => void;
};

export type UseUploadMediaReturn = {
    handleFiles: (files: FileList | File[]) => Promise<void>;
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
    const ref = useRef({ parentContent, onUploadStart, onUploadProgress, onUploadComplete, onUploadError });
    ref.current = { parentContent, onUploadStart, onUploadProgress, onUploadComplete, onUploadError };

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;

        const { parentContent, onUploadStart } = ref.current;

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
                    },
                ),
            ),
        );
    }, []);

    const handleInputChange = useCallback(
        (event: TargetedEvent<HTMLInputElement>) => handleFiles(event.currentTarget.files ?? []),
        [handleFiles],
    );

    return useMemo(() => ({ handleFiles, handleInputChange }), [handleFiles, handleInputChange]);
};
