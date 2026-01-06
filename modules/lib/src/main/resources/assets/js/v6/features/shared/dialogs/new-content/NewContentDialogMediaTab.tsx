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

    const handleChange = async (event: TargetedEvent<HTMLInputElement>) => {
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
        <Tab.Content value={tabName} className="h-full py-7.5 mt-0">
            <input id="file-upload" type="file" multiple onChange={handleChange} className="hidden" />
            <label
                htmlFor="file-upload"
                className={cn(
                    'relative flex flex-col gap-2.5 size-full items-center justify-center p-7.5 border border-dashed border-info-rev hover:cursor-pointer transition-all',
                    isDragging && 'bg-info-rev/10 border-solid'
                )}
            >
                <Image size={28} />
                <p className="text-subtle font-lg">{hintLabel}</p>
            </label>
        </Tab.Content>
    );
};

NewContentDialogMediaTab.displayName = NEW_CONTENT_DIALOG_MEDIA_TAB_NAME;
