import {type ChangeEvent, type DragEvent as ReactDragEvent, type ReactElement, useCallback, useMemo, useRef, useState} from 'react';
import {type SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {type AttachmentUploaderConfig} from './AttachmentUploaderConfig';
import {useAttachmentUploader} from './useAttachmentUploader';
import {useI18n} from '../../../../hooks/useI18n';
import {AttachmentUploaderButton} from './AttachmentUploaderButton';
import {AttachmentUploaderList} from './AttachmentUploaderList';
import {cn} from '@enonic/ui';

const ATTACHMENT_UPLOADER_INPUT_NAME = 'AttachmentUploaderInput';

export const AttachmentUploaderInput = ({
    onAdd,
    onRemove,
    occurrences,
    values,
    input,
    config,
    enabled,
}: SelfManagedComponentProps<AttachmentUploaderConfig>): ReactElement => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const noAttachmentLabel = useI18n('field.content.noattachment');
    const attachmentNames: string[] = useMemo(() => values.filter((v) => v.isNotNull()).map((v) => v.getString()), [values]);
    const [isDragging, setIsDragging] = useState(false);
    const {progress, canUpload, isUploading, isMultiple, contentId, handleFiles, handleRemove} = useAttachmentUploader({
        values,
        onAdd,
        onRemove,
        occurrences,
        inputName: input.getName(),
    });

    // Handlers
    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);
    const handleFileChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            if (!enabled) return;

            const {files} = e.currentTarget;

            if (!files || files.length === 0) return;

            void handleFiles(files);
        },
        [enabled, handleFiles]
    );
    const handleDrop = useCallback(
        (e: ReactDragEvent<HTMLDivElement>) => {
            if (!enabled) return;

            e.preventDefault();
            setIsDragging(false);
            const {files} = e.dataTransfer;

            if (files.length > 0) {
                void handleFiles(files);
            }
        },
        [enabled, handleFiles]
    );
    const handleDragOver = useCallback(
        (e: ReactDragEvent<HTMLDivElement>) => {
            if (!enabled) return;

            e.preventDefault();
            setIsDragging(true);
        },
        [enabled]
    );
    const handleDragLeave = useCallback(() => {
        if (!enabled) return;

        setIsDragging(false);
    }, [enabled]);

    const dropHandlers = config.hideDropZone
        ? undefined
        : {onDrop: handleDrop, onDragOver: handleDragOver, onDragLeave: handleDragLeave};

    return (
        <div data-component={ATTACHMENT_UPLOADER_INPUT_NAME} className="flex flex-col gap-2.5" {...dropHandlers}>
            <input ref={fileInputRef} type="file" multiple={isMultiple} onChange={handleFileChange} className="hidden" />

            <div className={cn('w-full', !config.hideDropZone && canUpload && isDragging && 'border border-dashed rounded p-1')}>
                <AttachmentUploaderList
                    names={attachmentNames}
                    contentId={contentId}
                    onRemove={handleRemove}
                    disabled={!enabled}
                />
                {attachmentNames.length === 0 && !isUploading && <p className="text-subtle text-center py-2">{noAttachmentLabel}</p>}
            </div>

            {(canUpload || isUploading) && (
                <div className="flex justify-end">
                    <AttachmentUploaderButton disabled={!enabled} progress={progress} onClick={openFileDialog} />
                </div>
            )}
        </div>
    );
};

AttachmentUploaderInput.displayName = ATTACHMENT_UPLOADER_INPUT_NAME;
