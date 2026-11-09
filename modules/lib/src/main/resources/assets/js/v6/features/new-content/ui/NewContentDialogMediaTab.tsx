import { Tab } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Image } from 'lucide-react';
import { type ReactElement, useCallback } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import {
    $newContentDialog,
    closeNewContentDialog,
    setIsDragging,
    uploadDroppedMedia,
} from '../model/newContentDialog.store';
import { DropZone } from '../../../shared/ui/DropZone';

const NEW_CONTENT_DIALOG_MEDIA_TAB_NAME = 'NewContentDialogMediaTab';

type NewContentDialogMediaTabProps = {
    tabName: string;
};

export const NewContentDialogMediaTab = ({ tabName }: NewContentDialogMediaTabProps): ReactElement => {
    const { parentContent, project, isDragging, onUploaded } = useStore($newContentDialog, {
        keys: ['parentContent', 'project', 'isDragging', 'onUploaded'],
    });
    const hintLabel = useI18n('dialog.new.hint.upload');

    const handleFiles = useCallback(
        (files: FileList) => {
            setIsDragging(false);

            const dataTransfer = new DataTransfer();
            Array.from(files).forEach((file) => dataTransfer.items.add(file));

            void uploadDroppedMedia({ dataTransfer, parentContent, projectName: project?.getName(), onUploaded });

            closeNewContentDialog();
        },
        [parentContent, project, onUploaded],
    );

    return (
        <Tab.Content value={tabName} className="mt-0 h-full" data-component={NEW_CONTENT_DIALOG_MEDIA_TAB_NAME}>
            <DropZone
                icon={<Image size={28} />}
                hint={hintLabel}
                multiple
                isDragging={isDragging}
                onFiles={handleFiles}
            />
        </Tab.Content>
    );
};

NewContentDialogMediaTab.displayName = NEW_CONTENT_DIALOG_MEDIA_TAB_NAME;
