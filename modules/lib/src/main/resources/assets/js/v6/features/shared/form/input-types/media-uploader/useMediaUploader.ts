import { useCallback, useEffect, useState } from 'react';
import { listenKeys } from 'nanostores';
import { showError, showFeedback } from '@enonic/lib-admin-ui/notify/MessageBus';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import { type Content } from '../../../../../../app/content/Content';
import { updateMediaFile, type UploadMediaSuccess } from '../../../../../entities/content/api/uploadMedia.api';
import { type UploadError } from '../../../../../shared/api';
import { randomId } from '../../../../../shared/lib/crypto/id';
import {
    $uploads,
    addUpload,
    completeUpload,
    failUpload,
    removeUpload,
    updateUploadProgress,
} from '../../../../../entities/content/model/uploads.store';

//
// * Types
//

type UseMediaUploaderOptions = {
    contentId?: string;
    onChange: (fileName: string) => void;
};

type UseMediaUploaderResult = {
    isUploading: boolean;
    progress: number;
    handleFiles: (files: FileList | File[]) => Promise<void>;
};

//
// * Hook
//

export const useMediaUploader = ({ contentId, onChange }: UseMediaUploaderOptions): UseMediaUploaderResult => {
    const [progress, setProgress] = useState<number>(0);
    const [uploadId, setUploadId] = useState<string>();

    // Track progress of the media being uploaded
    useEffect(() => {
        if (!uploadId) {
            setProgress(0);
            return;
        }

        return listenKeys($uploads, [uploadId], (uploads) => {
            const activeUpload = uploads[uploadId];

            if (!activeUpload) {
                setProgress(0);
                return;
            }

            setProgress(activeUpload.progress);
        });
    }, [uploadId]);

    // Replace the content's own source binary with the first dropped/selected file
    const handleFiles = useCallback(
        async (files: FileList | File[]) => {
            if (!contentId || files.length === 0) return;

            const file = files[0];
            const uploadId = `media-upload-${randomId()}`;

            setUploadId(uploadId);
            addUpload(uploadId, file.name, contentId);

            const result = await updateMediaFile({
                id: uploadId,
                file,
                contentId,
                onProgress: (id, prog) => {
                    updateUploadProgress(id, prog);
                },
            });

            result.match(
                (success: UploadMediaSuccess) => {
                    completeUpload(success.mediaIdentifier);
                    removeUpload(success.mediaIdentifier);
                    setUploadId(undefined);

                    const fileName = getMediaFileName(success.content);
                    onChange(fileName);
                    showFeedback(i18n('notify.upload.success', fileName));
                },
                (error: UploadError) => {
                    failUpload(error.mediaIdentifier, error.message);
                    removeUpload(error.mediaIdentifier);
                    setUploadId(undefined);
                    showError(i18n('notify.upload.error', file.name, error.message));
                },
            );
        },
        [contentId, onChange],
    );

    return { isUploading: !!uploadId, progress, handleFiles };
};

// Reads the source file name from the uploaded media content's `media` property,
// handling both the STRING and DATA/attachment property shapes.
function getMediaFileName(content: Content): string {
    const mediaProperty = content.getContentData().getProperty('media');

    if (mediaProperty == null) return '';

    if (ValueTypes.DATA.equals(mediaProperty.getType())) {
        return mediaProperty.getPropertySet()?.getProperty('attachment')?.getValue()?.getString() ?? '';
    }

    return mediaProperty.getValue()?.getString() ?? '';
}
