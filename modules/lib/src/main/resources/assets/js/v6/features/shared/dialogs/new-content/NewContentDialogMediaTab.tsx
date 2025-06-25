import {cn, Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Image} from 'lucide-react';
import {ReactElement, TargetedEvent} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $newContentDialog,
    closeNewContentDialog,
    uploadMediaFiles,
} from '../../../store/dialogs/newContentDialog.store';

const NEW_CONTENT_DIALOG_MEDIA_TAB_NAME = 'NewContentDialogMediaTab';

type NewContentDialogMediaTabProps = {
    tabName: string;
    isDragging?: boolean;
};

export const NewContentDialogMediaTab = ({
    tabName,
    isDragging = false,
}: NewContentDialogMediaTabProps): ReactElement => {
    const {parentContent} = useStore($newContentDialog);
    const hintLabel = useI18n('dialog.new.hint.upload');

    const handleChange = (event: TargetedEvent<HTMLInputElement>): void => {
        const {files} = event.currentTarget;

        const dataTransfer = new DataTransfer();

        Array.from(files).forEach((file) => dataTransfer.items.add(file));

        void uploadMediaFiles({
            dataTransfer,
            parentContent,
        });

        closeNewContentDialog();
    };

    return (
        <Tab.Content value={tabName} className='mt-0 h-full' data-component={NEW_CONTENT_DIALOG_MEDIA_TAB_NAME}>
            <div className='size-full'>
                <input
                    id='file-upload'
                    type='file'
                    multiple
                    onChange={handleChange}
                    className='peer sr-only'
                />
                <label
                    htmlFor='file-upload'
                    className={cn(
                        'relative flex flex-col gap-2.5 size-full items-center justify-center p-5',
                        'border border-dashed border-info-rev hover:cursor-pointer transition-all',
                        'peer-focus-visible:outline-none peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-3 peer-focus-visible:ring-offset-ring-offset',
                        isDragging && 'bg-info-rev/10 border-solid'
                    )}
                >
                    <Image size={28} />
                    <p className='text-subtle font-lg'>{hintLabel}</p>
                </label>
            </div>
        </Tab.Content>
    );
};

NewContentDialogMediaTab.displayName = NEW_CONTENT_DIALOG_MEDIA_TAB_NAME;
