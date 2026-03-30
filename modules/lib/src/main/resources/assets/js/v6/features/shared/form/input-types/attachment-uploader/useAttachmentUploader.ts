import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {type Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';
import {type SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {
    deleteAttachment,
    uploadAttachmentFile,
    type UploadAttachmentError,
    type UploadAttachmentSuccess,
} from '../../../../api/uploadAttachment';
import {$uploads, addUpload, completeUpload, failUpload, updateUploadProgress} from '../../../../store/uploads.store';
import {listenKeys} from 'nanostores';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {ContentRequiresSaveEvent} from '../../../../../../app/event/ContentRequiresSaveEvent';
import {ContentId} from '../../../../../../app/content/ContentId';

//
// * Types
//

export type UploadingItem = {
    id: string;
    name: string;
    progress: number;
};

type UseAttachmentUploaderOptions = {
    values: Value[];
    onAdd: SelfManagedComponentProps['onAdd'];
    onRemove: SelfManagedComponentProps['onRemove'];
    occurrences: Occurrences;
};

//
// * Hook
//

export const useAttachmentUploader = ({values, onAdd, onRemove, occurrences}: UseAttachmentUploaderOptions) => {
    const [progress, setProgress] = useState<number>(0);
    const [uploads, setUploads] = useState<UploadingItem[]>([]);
    const [contentId, setContentId] = useState<string>();
    const highestProgress = useRef<number>(0);
    const uploadIds = useMemo(() => uploads.map((item) => item.id), [uploads]);
    const isUploading = useMemo(() => uploads.length > 0, [uploads]);
    const isMultiple = occurrences.getMaximum() !== 1;

    // Get content ID from context content
    useEffect(() => {
        setContentId($contextContent.get()?.getId());
    }, []);

    // Progress tracking (all attachments)
    useEffect(() => {
        if (uploads.length === 0) {
            highestProgress.current = 0;
            setProgress(0);
            return;
        }

        return listenKeys($uploads, uploadIds, (uploadStore) => {
            const activeIds = uploadIds.filter((id) => uploadStore[id]);

            if (activeIds.length === 0) {
                highestProgress.current = 0;
                setProgress(0);
                return;
            }

            const progress = activeIds.reduce((acc, id) => acc + uploadStore[id].progress / activeIds.length, 0);

            // Avoid progress decreasing due to completion of other uploads
            const finalProgress = Math.min(100, Math.max(highestProgress.current, progress));
            highestProgress.current = finalProgress;
            setProgress(finalProgress);
        });
    }, [uploads]);

    // Check if uploads are allowed
    const canUpload = useMemo(() => {
        const max = occurrences.getMaximum();
        return max === 0 || values.length + uploads.length < max;
    }, [occurrences, values.length, uploads.length]);

    // Handlers
    const handleFiles = useCallback(
        async (files: FileList) => {
            if (!contentId || files.length === 0) return;

            const max = occurrences.getMaximum();
            const allowed = max === 0 ? files.length : Math.max(0, max - values.length - uploads.length);
            const filesToUpload = Array.from(files).slice(0, allowed);

            if (filesToUpload.length === 0) return;

            let counter = 0;
            const newUploading: UploadingItem[] = filesToUpload.map((file) => ({
                id: `${file.name}-${Date.now()}-${counter++}`,
                name: file.name,
                progress: 0,
            }));

            setUploads((prev) => [...prev, ...newUploading]);

            const tasks = filesToUpload.map((file, index) => {
                const uploadId = newUploading[index].id;
                addUpload(uploadId, file.name, contentId);

                return uploadAttachmentFile({
                    id: uploadId,
                    file,
                    contentId,
                    onProgress: (id, progress) => {
                        updateUploadProgress(id, progress);
                        setUploads((prev) => prev.map((item) => (item.id === id ? {...item, progress} : item)));
                    },
                });
            });

            await Promise.all(
                tasks.map((task) =>
                    task.match(
                        (success: UploadAttachmentSuccess) => {
                            completeUpload(success.identifier);
                            setUploads((prev) => prev.filter((item) => item.id !== success.identifier));
                            onAdd(ValueTypes.STRING.newValue(success.attachment.name));
                        },
                        (error: UploadAttachmentError) => {
                            failUpload(error.identifier, error.message);
                            setUploads((prev) => prev.filter((item) => item.id !== error.identifier));
                        }
                    )
                )
            ).then(() => {
                fireContentRequiresSaveEvent(contentId);
            });
        },
        [occurrences, values.length, uploads.length, onAdd, contentId]
    );

    const handleRemove = useCallback(
        async (index: number) => {
            const attachmentName = values[index]?.getString();

            if (!contentId || !attachmentName) return;

            const result = await deleteAttachment({contentId, attachmentNames: [attachmentName]});

            result.match(
                () => {
                    onRemove(index);
                    fireContentRequiresSaveEvent(contentId);
                },
                (error) => {
                    console.error('Failed to delete attachment:', error.message);
                }
            );
        },
        [values, onRemove, contentId]
    );

    return {progress, canUpload, isUploading, isMultiple, handleFiles, handleRemove};
};

// Utilities
const fireContentRequiresSaveEvent = (contentId: string) => {
    new ContentRequiresSaveEvent(new ContentId(contentId)).fire();
};
