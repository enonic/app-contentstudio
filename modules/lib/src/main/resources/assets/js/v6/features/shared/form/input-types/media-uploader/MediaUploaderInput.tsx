import {
    type ChangeEvent,
    type DragEvent as ReactDragEvent,
    type ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { type SelfManagedComponentProps } from '@enonic/lib-admin-ui/form2';
import { type Value } from '@enonic/lib-admin-ui/data/Value';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import { Button, cn, Link } from '@enonic/ui';
import { UploadIcon } from 'lucide-react';
import { type MediaUploaderAllowType, type MediaUploaderConfig } from './MediaUploaderConfig';
import { useMediaUploader } from './useMediaUploader';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { getCmsApiUrl } from '../../../../../shared/lib/url/cms';
import { $contextContent } from '../../../../../widgets/context-panel/model/contextContent.store';
import { ContentRequiresSaveEvent } from '../../../../../../app/event/ContentRequiresSaveEvent';
import { ContentId } from '../../../../../../app/content/ContentId';

const MEDIA_UPLOADER_INPUT_NAME = 'MediaUploaderInput';

export const MediaUploaderInput = ({ values, onChange, config, enabled }: SelfManagedComponentProps<MediaUploaderConfig>): ReactElement => {
    const noMediaLabel = useI18n('field.content.noattachment');
    const uploadLabel = useI18n('action.upload');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const value = values[0];
    const [contentId, setContentId] = useState<string>();
    // Local display source: single-occurrence value is only mutated through this component.
    const [fileName, setFileName] = useState<string>(() => getFileNameFromValue(value));
    const [isDragging, setIsDragging] = useState(false);

    const attachmentUrl = useMemo(() => {
        if (!contentId || !fileName) return undefined;

        return getCmsApiUrl(`media/${contentId}/${encodeURIComponent(fileName)}`);
    }, [contentId, fileName]);

    useEffect(() => {
        setContentId($contextContent.get()?.getId());
    }, []);

    // An existing DATA-format attachment locks replacement to the same extension (legacy parity);
    // otherwise the schema's allowExtensions applies, or no restriction when unset.
    const accept = useMemo(() => {
        if (isDataWithAttachment(value)) {
            return getFileExtension(getFileNameFromValue(value));
        }
        return buildAcceptString(config.allowExtensions);
    }, [value, config.allowExtensions]);

    const handleChange = useCallback(
        (uploadedFileName: string) => {
            if (value != null) {
                if (ValueTypes.DATA.equals(value.getType())) {
                    value.getPropertySet()?.setProperty('attachment', 0, ValueTypes.STRING.newValue(uploadedFileName));
                } else {
                    onChange(0, ValueTypes.STRING.newValue(uploadedFileName));
                }
            }

            setFileName(uploadedFileName);

            if (contentId) {
                new ContentRequiresSaveEvent(new ContentId(contentId)).fire();
            }
        },
        [value, onChange, contentId]
    );

    const { isUploading, progress, handleFiles } = useMediaUploader({ contentId, onChange: handleChange });

    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            if (!enabled) return;

            const { files } = e.currentTarget;
            if (!files || files.length === 0) return;

            const matched = filterFilesByAccept(files, accept);
            if (matched.length > 0) {
                void handleFiles(matched);
            }
            e.currentTarget.value = '';
        },
        [enabled, handleFiles, accept]
    );

    const handleDrop = useCallback(
        (e: ReactDragEvent<HTMLDivElement>) => {
            if (!enabled) return;

            e.preventDefault();
            setIsDragging(false);
            const matched = filterFilesByAccept(e.dataTransfer.files, accept);

            if (matched.length > 0) {
                void handleFiles(matched);
            }
        },
        [enabled, handleFiles, accept]
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

    const dropHandlers = config.hideDropZone ? undefined : { onDrop: handleDrop, onDragOver: handleDragOver, onDragLeave: handleDragLeave };

    return (
        <div data-component={MEDIA_UPLOADER_INPUT_NAME} className="flex flex-col gap-2.5" {...dropHandlers}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept || undefined}
                aria-label={uploadLabel}
                onChange={handleFileChange}
                className="hidden"
            />

            <div
                className={cn('w-full', !config.hideDropZone && isDragging && 'dash-border dash-border-select bg-bdr-select/8 rounded p-1')}
            >
                {attachmentUrl ? (
                    <Link className="flex items-center gap-2 truncate p-2" href={attachmentUrl} target="_blank">
                        {fileName}
                    </Link>
                ) : (
                    !isUploading && <p className="text-subtle text-center py-2">{noMediaLabel}</p>
                )}
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={openFileDialog}
                    variant="outline"
                    disabled={!enabled || isUploading}
                    className={cn(isUploading && 'pointer-events-none', 'relative text-sm')}
                >
                    {isUploading && (
                        <div
                            className="animate-pulse absolute top-0 left-0 h-full bg-success-rev opacity-30"
                            style={{ width: `${progress}%` }}
                        />
                    )}
                    {uploadLabel}
                    <UploadIcon size={20} absoluteStrokeWidth />
                </Button>
            </div>
        </div>
    );
};

MediaUploaderInput.displayName = MEDIA_UPLOADER_INPUT_NAME;

function getFileNameFromValue(value: Value | undefined): string {
    if (value == null || value.isNull()) return '';

    if (ValueTypes.DATA.equals(value.getType())) {
        return value.getPropertySet()?.getString('attachment') ?? '';
    }

    return value.getString() ?? '';
}

function isDataWithAttachment(value: Value | undefined): boolean {
    return value != null && ValueTypes.DATA.equals(value.getType()) && getFileNameFromValue(value) !== '';
}

// Builds an <input accept> string from the schema's allow-extension groups.
// Each group's `extensions` is a comma-separated list; entries are prefixed with '.'.
function buildAcceptString(allowExtensions: MediaUploaderAllowType[]): string {
    return allowExtensions
        .flatMap((group) => group.extensions.split(','))
        .map((extension) => extension.trim())
        .filter(Boolean)
        .map((extension) => (extension.startsWith('.') ? extension : `.${extension}`))
        .join(',');
}

function getFileExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.slice(dotIndex) : '';
}

function fileMatchesAccept(file: File, accept: string): boolean {
    const types = accept
        .split(',')
        .map((type) => type.trim().toLowerCase())
        .filter(Boolean);

    return types.some((type) => {
        if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type);
        if (type.endsWith('/*')) return file.type.startsWith(type.slice(0, -1));
        return file.type === type;
    });
}

function filterFilesByAccept(files: FileList | File[], accept: string): File[] {
    const fileArray = Array.from(files);
    if (!accept) return fileArray;

    return fileArray.filter((file) => fileMatchesAccept(file, accept));
}
