import {Tab} from '@enonic/ui';
import {ReactElement} from 'react';
import {$newContentDialog, closeNewContentDialog} from '../../../store/dialogs/newContentDialog.store';
import {useStore} from '@nanostores/preact';
import {Image} from 'lucide-react';
import {TargetedEvent} from 'preact';
import {uploadMediaFiles} from './NewContentDialogUpload';
import {useI18n} from '../../../hooks/useI18n';

const NEW_CONTENT_DIALOG_MEDIA_TAB_NAME = 'NewContentDialogMediaTab';

export const NewContentDialogMediaTab = ({tabName}: {tabName: string}): ReactElement => {
    const {parentContent} = useStore($newContentDialog);
    const hintLabel = useI18n('dialog.new.hint.upload');

    const handleChange = async (event: TargetedEvent<HTMLInputElement>) => {
        const {files} = event.currentTarget;

        const dataTransfer = new DataTransfer();

        Array.from(files).forEach((file) => dataTransfer.items.add(file));

        uploadMediaFiles({
            dataTransfer,
            parentContent,
        });

        closeNewContentDialog();
    };

    return (
        <Tab.Content value={tabName} className="py-7.5 min-h-50 h-full">
            <input id="file-upload" type="file" multiple onChange={handleChange} className="hidden" />
            <label
                for="file-upload"
                className="flex flex-col gap-2.5 size-full items-center justify-center border border-dashed border-info-rev p-7.5"
            >
                <Image size={28} />
                <p className="text-subtle font-lg">{hintLabel}</p>
            </label>
        </Tab.Content>
    );
};

NewContentDialogMediaTab.displayName = NEW_CONTENT_DIALOG_MEDIA_TAB_NAME;
