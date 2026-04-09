import {IconButton, Input} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {PenIcon, XIcon} from 'lucide-react';
import {type ReactElement, useCallback, useMemo} from 'react';
import {EditContentEvent} from '../../../../../app/event/EditContentEvent';
import {useI18n} from '../../../hooks/useI18n';
import {$activeProject} from '../../../store/projects.store';
import {ImageSelector} from '../../selectors/image';
import {useHtmlAreaImageDialogContext} from './HtmlAreaImageDialogContext';
import {ImageAccessibilityField} from './ImageAccessibilityField';
import {ImagePreview} from './ImagePreview';
import {ImageToolbar} from './ImageToolbar';
import {ImageUploadZone} from './ImageUploadZone';

export const HtmlAreaImageDialogContent = (): ReactElement => {
    const {
        state: {selectedImageId, selectedImageContent, caption},
        deselectImage,
        selectImageById,
        setCaption,
    } = useHtmlAreaImageDialogContext();

    const captionLabel = useI18n('dialog.image.formitem.caption');
    const imageLabel = useI18n('dialog.image.formitem.image');

    const hasImage = selectedImageId != null;
    const selection = useMemo(() => selectedImageId ? [selectedImageId] : [], [selectedImageId]);

    const handleSelectionChange = useCallback((newSelection: readonly string[]) => {
        if (newSelection.length > 0) {
            selectImageById(newSelection[0]);
        } else {
            deselectImage();
        }
    }, [selectImageById, deselectImage]);

    const activeProject = useStore($activeProject);

    const handleEdit = useCallback(() => {
        if (selectedImageContent) {
            new EditContentEvent([selectedImageContent], activeProject).fire();
        }
    }, [selectedImageContent, activeProject]);

    return (
        <div className='flex flex-col gap-5'>
            {!hasImage && (
                <>
                    <ImageSelector
                        selection={selection}
                        onSelectionChange={handleSelectionChange}
                        selectionMode='single'
                        label={imageLabel}
                        withUpload
                    />
                    <ImageUploadZone />
                </>
            )}

            {hasImage && selectedImageContent && (
                <>
                    <div className='flex flex-col gap-2.5'>
                        <div className='flex items-center gap-2.5 min-w-0'>
                            <div className='min-w-0 flex-1'>
                                <span className='font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis'>
                                    {selectedImageContent.getDisplayName() || selectedImageContent.getType()?.getLocalName()}
                                </span>
                                <span className='text-subtle text-sm block whitespace-nowrap overflow-hidden text-ellipsis'>
                                    {selectedImageContent.getPath()?.toString() ?? ''}
                                </span>
                            </div>
                            <div className='flex gap-1.5 shrink-0'>
                                <IconButton icon={PenIcon} onClick={handleEdit} />
                                <IconButton icon={XIcon} onClick={deselectImage} />
                            </div>
                        </div>
                    </div>
                    <ImageToolbar />
                    <ImagePreview />
                    <Input
                        label={captionLabel}
                        value={caption}
                        onChange={(event) => setCaption(event.currentTarget.value)}
                    />
                    <ImageAccessibilityField />
                </>
            )}
        </div>
    );
};

HtmlAreaImageDialogContent.displayName = 'HtmlAreaImageDialogContent';
