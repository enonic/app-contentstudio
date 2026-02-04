import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ProgressDialogContent} from '../ProgressDialogContent';

type DeleteDialogProgressContentProps = {
    total: number;
    progress: number;
    'data-component'?: string;
};

const DELETE_DIALOG_PROGRESS_CONTENT_NAME = 'DeleteDialogProgressContent';

export const DeleteDialogProgressContent = ({
    total,
    progress,
    'data-component': componentName = DELETE_DIALOG_PROGRESS_CONTENT_NAME,
}: DeleteDialogProgressContentProps): ReactElement => {
    const archiveTitle = useI18n('dialog.archive.progress.title');
    const archiveDescription = useI18n('dialog.archiving', total);

    return (
        <ProgressDialogContent
            title={archiveTitle}
            description={archiveDescription}
            progress={progress}
            data-component={componentName}
            className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
        />
    );
};

DeleteDialogProgressContent.displayName = DELETE_DIALOG_PROGRESS_CONTENT_NAME;
