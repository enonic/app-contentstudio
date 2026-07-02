import { Button, cn } from '@enonic/ui';
import { UploadIcon } from 'lucide-react';
import { type ReactElement, useCallback, useRef } from 'react';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';

export type SelectorUploadButtonProps = {
    /** Upload the selected files */
    onFiles: (files: FileList | File[]) => void;
    /** Aggregate upload progress (0-100) */
    progress: number;
    /** Whether one or more uploads are in flight */
    isUploading: boolean;
    disabled: boolean;
    multiple: boolean;
    /** MIME type filter for the file input (e.g. "image/*") */
    accept?: string;
};

const SELECTOR_UPLOAD_BUTTON_NAME = 'SelectorUploadButton';

export const SelectorUploadButton = ({
    onFiles,
    progress,
    isUploading,
    disabled,
    multiple,
    accept,
}: SelectorUploadButtonProps): ReactElement => {
    const uploadMediaLabel = useI18n('tooltip.button.uploadMedia');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = useCallback(() => {
        const { files } = fileInputRef.current ?? {};
        if (files && files.length > 0) {
            onFiles(files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onFiles]);

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
                aria-label={uploadMediaLabel}
                onChange={handleInputChange}
                className="sr-only"
            />
            <Button
                onClick={handleUploadClick}
                variant="solid"
                disabled={disabled}
                aria-label={uploadMediaLabel}
                className={cn(
                    isUploading && 'pointer-events-none',
                    'relative w-full h-full rounded-none border border-bdr-subtle rounded-tr rounded-br bg-surface-selected',
                    'focus-within:ring-3 focus-within:ring-ring focus-within:ring-offset-3 focus-within:ring-offset-ring-offset transition-highlight',
                )}
            >
                {isUploading && (
                    <div
                        className="animate-pulse absolute top-0 left-0 h-full bg-success-rev opacity-30"
                        style={{ width: `${progress}%` }}
                    />
                )}
                <UploadIcon size={20} absoluteStrokeWidth />
            </Button>
        </div>
    );
};

SelectorUploadButton.displayName = SELECTOR_UPLOAD_BUTTON_NAME;
