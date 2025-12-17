import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$deleteProgressValue, type DeleteAction} from '../../../store/dialogs/deleteDialog.store';
import {ProgressDialogContent} from '../ProgressDialogContent';

type DeleteDialogProgressContentProps = {
    action: DeleteAction;
    total: number;
};

export const DeleteDialogProgressContent = ({action, total}: DeleteDialogProgressContentProps): ReactElement => {
    const progress = useStore($deleteProgressValue);

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
            className="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
        />
    );
};
