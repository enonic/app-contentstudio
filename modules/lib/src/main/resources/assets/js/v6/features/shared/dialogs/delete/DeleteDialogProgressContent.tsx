import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import type {DeleteAction} from '../../../store/dialogs/deleteDialog.store';
import {ProgressDialogContent} from '../ProgressDialogContent';

type DeleteDialogProgressContentProps = {
    action: DeleteAction;
    total: number;
    progress: number;
    'data-component'?: string;
};

const DELETE_DIALOG_PROGRESS_CONTENT_NAME = 'DeleteDialogProgressContent';

export const DeleteDialogProgressContent = ({
    action,
    total,
    progress,
    'data-component': componentName = DELETE_DIALOG_PROGRESS_CONTENT_NAME,
}: DeleteDialogProgressContentProps): ReactElement => {
    const archiveTitle = useI18n('dialog.archive.progress.title');
    const deleteTitle = useI18n('dialog.delete.progress.title');
    const archiveDescription = useI18n('dialog.archiving', total);
    const deleteDescription = useI18n('dialog.deleting', total);

    const isArchive = action === 'archive';
    const title = isArchive ? archiveTitle : deleteTitle;
    const description = isArchive ? archiveDescription : deleteDescription;

    return (
        <ProgressDialogContent
            title={title}
            description={description}
            progress={progress}
            data-component={componentName}
            className="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
        />
    );
};

DeleteDialogProgressContent.displayName = DELETE_DIALOG_PROGRESS_CONTENT_NAME;
