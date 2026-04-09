import {type ChangeEvent, type ReactElement, useCallback, useRef} from 'react';
import {Button, cn} from '@enonic/ui';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {UploadIcon} from 'lucide-react';
import {useImageUploader} from '../useImageUploader';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {useI18n} from '../../../../../hooks/useI18n';
import {ContentRequiresSaveEvent} from '../../../../../../../app/event/ContentRequiresSaveEvent';
import {getImageUrl} from '../lib/image';
import {resetPropertySet} from '../lib/propertySet';

export const ImageUploaderInputUploadButton = (): ReactElement => {
    const {contentId, project, value, enabled, setOrientation, setImageUrl, setCrop, setFocus} = useImageUploaderContext();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadLabel = useI18n('action.upload');

    // Handlers
    const handleChange = useCallback(
        (attachmentName: string) => {
            if (!contentId || !project) return;

            if (resetPropertySet(value)) {
                const set = value.getPropertySet();
                set.setProperty('attachment', 0, ValueTypes.STRING.newValue(attachmentName));

                setOrientation(1);
                setCrop(null);
                setFocus(null);
                setImageUrl(getImageUrl(contentId, project));

                new ContentRequiresSaveEvent(contentId).fire();
            }
        },
        [contentId, project, value, setOrientation, setImageUrl, setCrop, setFocus]
    );

    const {isUploading, progress, handleFiles} = useImageUploader({contentId, onChange: handleChange});

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            if (!enabled) return;

            const {files} = e.currentTarget;
            if (!files || files.length === 0) return;

            void handleFiles(files);
            e.currentTarget.value = '';
        },
        [enabled, handleFiles]
    );

    return (
        <>
            <input tabIndex={-1} ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
            <Button
                onClick={handleUploadClick}
                variant="outline"
                disabled={!enabled || isUploading}
                className={cn(isUploading && 'pointer-events-none', 'relative text-sm')}
            >
                {isUploading && (
                    <div className="animate-pulse absolute top-0 left-0 h-full bg-success-rev opacity-30" style={{width: `${progress}%`}} />
                )}
                {uploadLabel}
                <UploadIcon size={20} absoluteStrokeWidth />
            </Button>
        </>
    );
};

ImageUploaderInputUploadButton.displayName = 'ImageUploaderInputUploadButton';
