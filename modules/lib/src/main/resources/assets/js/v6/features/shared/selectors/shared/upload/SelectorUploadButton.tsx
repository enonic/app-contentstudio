import {Button, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {UploadIcon} from 'lucide-react';
import {type ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {listenKeys} from 'nanostores';
import {$uploads, removeUpload} from '../../../../store/uploads.store';
import {UploadMediaError, UploadMediaSuccess} from '../../../../api/uploadMedia';
import {useUploadMedia} from '../../../../hooks/useUploadMedia';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export type SelectorUploadButtonProps = {
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    disabled: boolean;
    multiple: boolean;
    /** MIME type filter for the file input (e.g. "image/*") */
    accept?: string;
};

const SELECTOR_UPLOAD_BUTTON_NAME = 'SelectorUploadButton';

export const SelectorUploadButton = ({
    selection,
    onSelectionChange,
    disabled,
    multiple,
    accept,
}: SelectorUploadButtonProps): ReactElement => {
    const [progress, setProgress] = useState<number>(0);
    const [uploadIds, setUploadIds] = useState<string[]>([]);
    const [newContentIds, setNewContentIds] = useState<string[]>([]);
    const uploadParent = useStore($contextContent);
    const highestProgress = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isUploading = uploadIds.length > 0;

    const selectionRef = useRef(selection);
    selectionRef.current = selection;

    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;

    // Update selection when uploads are complete
    // Tracks progress of all uploads based on the upload ids
    useEffect(() => {
        if (uploadIds.length === 0) {
            if (newContentIds.length > 0) {
                onSelectionChangeRef.current([...selectionRef.current, ...newContentIds]);
                setNewContentIds([]);
            }
            setProgress(0);
            return;
        }

        const unlisten = listenKeys($uploads, uploadIds, (uploads) => {
            const activeIds = uploadIds.filter((id) => uploads[id]);

            if (activeIds.length === 0) {
                highestProgress.current = 0;
                setProgress(0);
                return;
            }

            const progress = activeIds.reduce((acc, id) => acc + uploads[id].progress / activeIds.length, 0);

            // Avoid progress decreasing due to completion of other uploads
            const finalProgress = Math.min(100, Math.max(highestProgress.current, progress));
            highestProgress.current = finalProgress;
            setProgress(finalProgress);
        });
        return () => unlisten();
    }, [uploadIds]);

    // Handlers
    const onUploadStart = useCallback(
        (file: File) => {
            setUploadIds((prev) => [...prev, file.name]);
        },
        [setUploadIds]
    );

    const onUploadComplete = useCallback((success: UploadMediaSuccess) => {
        const contentId = success.content.getId();
        setNewContentIds((prev) => [...prev, contentId]);
        removeUpload(success.mediaIdentifier);
        setUploadIds((prev) => prev.filter((id) => id !== success.mediaIdentifier));
    }, []);

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
    }, []);

    return (
        <div data-component={SELECTOR_UPLOAD_BUTTON_NAME} className="flex items-center justify-center self-stretch">
            <input
                tabIndex={-1}
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleInputChange}
                className="sr-only"
            />
            <Button
                onClick={handleUploadClick}
                variant="solid"
                disabled={disabled}
                className={cn(
                    isUploading && 'pointer-events-none',
                    'relative w-full h-full rounded-none border border-bdr-subtle rounded-tr rounded-br bg-surface-selected',
                    'hover:outline-1 hover:outline-bdr-subtle',
                    'focus-within:outline-none focus-within:ring-3 focus-within:ring-ring focus-within:ring-offset-3 focus-within:ring-offset-ring-offset transition-highlight'
                )}
            >
                {isUploading && (
                    <div className="animate-pulse absolute top-0 left-0 h-full bg-success-rev opacity-30" style={{width: `${progress}%`}} />
                )}
                <UploadIcon size={20} absoluteStrokeWidth />
            </Button>
        </div>
    );
};

SelectorUploadButton.displayName = SELECTOR_UPLOAD_BUTTON_NAME;
