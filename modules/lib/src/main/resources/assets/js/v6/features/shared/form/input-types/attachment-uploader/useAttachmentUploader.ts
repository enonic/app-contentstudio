import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import { type Value } from '@enonic/lib-admin-ui/data/Value';
import { type Occurrences } from '@enonic/lib-admin-ui/form/Occurrences';
import { type SelfManagedComponentProps } from '@enonic/lib-admin-ui/form2';
import {
    deleteAttachment,
    uploadAttachmentFile,
    type UploadAttachmentSuccess,
} from '../../../../../entities/content/api/uploadAttachment.api';
import { type UploadError } from '../../../../../shared/api';
import {
    $uploads,
    addUpload,
    completeUpload,
    failUpload,
    updateUploadProgress,
} from '../../../../../entities/content/model/uploads.store';
import { clearAttachmentServerError } from '../../../../../pages/wizard/model/wizardValidation.store';
import { listenKeys } from 'nanostores';
import { $contextContent } from '../../../../../widgets/context-panel/model/contextContent.store';
import { $wizardDraftPage } from '../../../../../pages/wizard/model/wizardContent.store';
import { isAttachmentInUse } from '../../../../../shared/lib/page/isAttachmentInUse';
import { ContentRequiresSaveEvent } from '../../../../../../app/event/ContentRequiresSaveEvent';
import { ContentId } from '../../../../../../app/content/ContentId';
import { showError, showFeedback } from '@enonic/lib-admin-ui/notify/MessageBus';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';

//
// * Types
//

type UploadingItem = {
    id: string;
    name: string;
    progress: number;
};

type UseAttachmentUploaderOptions = {
    values: Value[];
    onAdd: SelfManagedComponentProps['onAdd'];
    onRemove: SelfManagedComponentProps['onRemove'];
    occurrences: Occurrences;
    inputName: string;
};

//
// * Hook
//

export const useAttachmentUploader = ({
    values,
    onAdd,
    onRemove,
    occurrences,
    inputName,
}: UseAttachmentUploaderOptions) => {
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

            await Promise.all(
                filesToUpload.map((file, index) => {
                    const uploadId = newUploading[index].id;
                    addUpload(uploadId, file.name, contentId);

                    return uploadAttachmentFile({
                        id: uploadId,
                        file,
                        contentId,
                        onProgress: (id, progress) => {
                            updateUploadProgress(id, progress);
                            setUploads((prev) => prev.map((item) => (item.id === id ? { ...item, progress } : item)));
                        },
                    }).match(
                        (success: UploadAttachmentSuccess) => {
                            completeUpload(success.identifier);
                            setUploads((prev) => prev.filter((item) => item.id !== success.identifier));

                            const attachmentName = success.attachment.getName().toString();
                            const isDuplicate = values.some((v) => v.getString() === attachmentName);
                            if (!isDuplicate) {
                                onAdd(ValueTypes.STRING.newValue(attachmentName));
                            }

                            showFeedback(i18n('notify.upload.success', attachmentName));
                        },
                        (error: UploadError) => {
                            failUpload(error.mediaIdentifier, error.message);
                            setUploads((prev) => prev.filter((item) => item.id !== error.mediaIdentifier));
                            showError(i18n('notify.upload.error', file.name, error.message));
                        },
                    );
                }),
            ).then(() => {
                fireContentRequiresSaveEvent(contentId);
            });
        },
        [occurrences, values.length, uploads.length, onAdd, contentId],
    );

    const handleRemove = useCallback(
        async (index: number) => {
            const attachmentName = values[index]?.getString();

            if (!contentId || !attachmentName) return;

            const inUse = isAttachmentInUse($wizardDraftPage.get(), inputName, attachmentName);

            if (inUse) {
                onRemove(index);
                clearAttachmentServerError(attachmentName);
                fireContentRequiresSaveEvent(contentId);
                return;
            }

            const result = await deleteAttachment({ contentId, attachmentNames: [attachmentName] });

            result.match(
                () => {
                    onRemove(index);
                    clearAttachmentServerError(attachmentName);
                    fireContentRequiresSaveEvent(contentId);
                },
                (error) => {
                    showError(error.message);
                },
            );
        },
        [values, onRemove, contentId, inputName],
    );

    return { progress, canUpload, isUploading, isMultiple, contentId, handleFiles, handleRemove };
};

// Utilities
const fireContentRequiresSaveEvent = (contentId: string) => {
    new ContentRequiresSaveEvent(new ContentId(contentId)).fire();
};
