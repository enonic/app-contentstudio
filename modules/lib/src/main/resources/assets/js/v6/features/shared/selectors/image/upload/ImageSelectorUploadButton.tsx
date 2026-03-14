import {Button} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {UploadIcon} from 'lucide-react';
import {ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {listenKeys} from 'nanostores';
import {$uploads, removeUpload} from '../../../../store/uploads.store';
import {UploadMediaError, UploadMediaSuccess} from '../../../../api/uploadMedia';
import {useUploadMedia} from '../../../../hooks/useUploadMedia';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export type ImageSelectorUploadButtonProps = {
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    disabled: boolean;
    multiple: boolean;
};

const IMAGE_SELECTOR_UPLOAD_BUTTON_NAME = 'ImageSelectorUploadButton';

export const ImageSelectorUploadButton = ({
    selection,
    onSelectionChange,
    disabled,
    multiple,
}: ImageSelectorUploadButtonProps): ReactElement => {
    const [progress, setProgress] = useState<number>(0);
    const [uploadIds, setUploadIds] = useState<string[]>([]);
    const uploadParent = useStore($contextContent);
    const highestProgress = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selection
    const selectionRef = useRef(selection);
    useEffect(() => {
        selectionRef.current = selection;
    }, [selection]);

    // Tracking progress of all uploads based on the upload ids
    useEffect(() => {
        if (uploadIds.length === 0) return;

        const unlisten = listenKeys($uploads, uploadIds, (uploads) => {
            const activeIds = uploadIds.filter((id) => uploads[id]);

            if (activeIds.length === 0) {
                highestProgress.current = 0;
                setProgress(0);
                return;
            }

            const progress = activeIds.reduce((acc, id) => acc + uploads[id].progress / activeIds.length, 0);

            if (progress >= 100) {
                setProgress(0);
            } else {
                // Avoid progress decreasing due to completion of other uploads
                const finalProgress = Math.max(highestProgress.current, progress);
                highestProgress.current = finalProgress;
                setProgress(finalProgress);
            }
        });
        return () => unlisten();
    }, [uploadIds, setProgress]);

    // Handlers
    const onUploadStart = useCallback(
        (file: File) => {
            setUploadIds((prev) => [...prev, file.name]);
        },
        [setUploadIds]
    );

    const onUploadComplete = useCallback(
        (success: UploadMediaSuccess) => {
            const uploadedContent = success.content;
            const updated = [...selectionRef.current, uploadedContent.getId()];
            selectionRef.current = updated;
            onSelectionChange(updated);
            removeUpload(success.mediaIdentifier);
            setUploadIds((prev) => prev.filter((id) => id !== success.mediaIdentifier));
        },
        [onSelectionChange, setUploadIds]
    );

    const onUploadError = useCallback(
        (error: UploadMediaError) => {
            removeUpload(error.mediaIdentifier);
            setUploadIds((prev) => prev.filter((id) => id !== error.mediaIdentifier));
            showError(i18n('notify.upload.error', error.mediaIdentifier, error.message));
        },
        [setUploadIds]
    );

    const {handleInputChange} = useUploadMedia({
        parentContent: uploadParent,
        onUploadStart,
        onUploadComplete,
        onUploadError,
    });

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, [setProgress]);

    return (
        <div data-component={IMAGE_SELECTOR_UPLOAD_BUTTON_NAME} className="flex items-center justify-center self-stretch">
            <input
                tabIndex={-1}
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept="image/*"
                onChange={handleInputChange}
                className="sr-only"
            />
            <Button
                onClick={handleUploadClick}
                disabled={disabled}
                className="relative bg-surface-primary w-full h-full rounded-none border border-bdr-subtle rounded-tr rounded-br"
            >
                <div className="absolute top-0 left-0 h-full bg-success-rev opacity-30" style={{width: `${progress}%`}} />
                <UploadIcon size={20} absoluteStrokeWidth />
            </Button>
        </div>
    );
};
