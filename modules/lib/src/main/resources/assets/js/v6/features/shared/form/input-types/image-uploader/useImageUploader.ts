import {useCallback, useEffect, useState} from 'react';
import {listenKeys} from 'nanostores';
import {showError, showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {updateImageMedia, type UpdateImageMediaError, type UpdateImageMediaSuccess} from '../../../../api/updateImageMedia';
import {$uploads, addUpload, completeUpload, failUpload, removeUpload, updateUploadProgress} from '../../../../store/uploads.store';
import type {ContentId} from '../../../../../../app/content/ContentId';

//
// * Types
//

type UseImageUploaderOptions = {
    contentId?: ContentId;
    onChange: (value: string) => void;
};

type UseImageUploaderResult = {
    isUploading: boolean;
    progress: number;
    handleFiles: (files: FileList) => Promise<void>;
};

//
// * Hook
//

export const useImageUploader = ({contentId, onChange}: UseImageUploaderOptions): UseImageUploaderResult => {
    const [progress, setProgress] = useState<number>(0);
    const [uploadId, setUploadId] = useState<string>();

    // Track progress of the image being uploaded
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

    // Handle the files being uploaded
    const handleFiles = useCallback(
        async (files: FileList) => {
            if (!contentId || files.length === 0) return;

            const file = files[0];
            const uploadId = `image-upload-${crypto.randomUUID()}`;

            setUploadId(uploadId);
            addUpload(uploadId, file.name, contentId.toString());

            const result = await updateImageMedia({
                id: uploadId,
                file,
                contentId: contentId.toString(),
                onProgress: (id, prog) => {
                    updateUploadProgress(id, prog);
                },
            });

            result.match(
                (success: UpdateImageMediaSuccess) => {
                    completeUpload(success.mediaIdentifier);
                    removeUpload(success.mediaIdentifier);
                    setUploadId(undefined);
                    const content = success.content;
                    const attachmentName = content.getAttachments().getAttachment(0)?.getName()?.toString() ?? '';
                    onChange(attachmentName);
                    showFeedback(i18n('notify.upload.success', content.getDisplayName()));
                },
                (error: UpdateImageMediaError) => {
                    failUpload(error.mediaIdentifier, error.message);
                    removeUpload(error.mediaIdentifier);
                    setUploadId(undefined);
                    showError(i18n('notify.upload.error', file.name, error.message));
                }
            );
        },
        [contentId, onChange]
    );

    return {isUploading: !!uploadId, progress, handleFiles};
};
