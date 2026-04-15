import {Image} from 'lucide-react';
import {type ReactElement, useCallback} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useHtmlAreaImageDialogContext} from './HtmlAreaImageDialogContext';
import {uploadMediaFile} from '../../../api/uploadMedia';
import {DropZone} from '../../DropZone';

export const ImageUploadZone = (): ReactElement => {
    const {
        state: {uploading, uploadProgress, uploadError, parentContent},
        selectImage,
        setUploadState,
    } = useHtmlAreaImageDialogContext();

    const hintLabel = useI18n('dialog.new.hint.upload');
    const uploadingLabel = useI18n('action.uploading');

    const handleFiles = useCallback((files: FileList) => {
        const file = files[0];
        if (!file) {
            return;
        }

        setUploadState(true, 0, undefined);

        const id = `upload-${Date.now()}`;

        uploadMediaFile({
            id,
            file,
            parentContent: parentContent ?? undefined,
            onProgress: (_id, progress) => {
                setUploadState(true, progress, undefined);
            },
        }).match(
            (success) => {
                setUploadState(false, 100, undefined);
                selectImage(success.content);
            },
            (error) => {
                setUploadState(false, 0, error.message);
            },
        );
    }, [parentContent, selectImage, setUploadState]);

    if (uploading) {
        return (
            <div className='flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-info-rev p-8'>
                <div className='text-sm text-subtle'>{uploadingLabel}</div>
                <div className='w-full max-w-60 h-2 rounded-full bg-muted overflow-hidden'>
                    <div
                        className='h-full bg-accent rounded-full transition-[width] duration-200'
                        style={{width: `${uploadProgress}%`}}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <DropZone
                icon={<Image size={28} />}
                hint={hintLabel}
                accept='image/*'
                onFiles={handleFiles}
            />
            {uploadError && (
                <div className='text-sm text-error'>{uploadError}</div>
            )}
        </>
    );
};

ImageUploadZone.displayName = 'ImageUploadZone';
