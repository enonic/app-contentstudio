import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$moveItemsCount} from '../../../store/dialogs/moveDialog.store';
import {ProgressDialogContent} from '../ProgressDialogContent';

type MoveDialogProgressContentProps = {
    destinationPath?: string | null;
    progress: number;
    'data-component'?: string;
};

const MOVE_DIALOG_PROGRESS_CONTENT_NAME = 'MoveDialogProgressContent';

export const MoveDialogProgressContent = ({
    destinationPath,
    progress,
    'data-component': componentName = MOVE_DIALOG_PROGRESS_CONTENT_NAME,
}: MoveDialogProgressContentProps): ReactElement => {
    const total = useStore($moveItemsCount);
    const isMultiple = total > 1;
    const title = useI18n(isMultiple ? 'dialog.move.multi' : 'dialog.move.single');
    const progressLabel = useI18n(isMultiple ? 'dialog.move.progressMessage.multi' : 'dialog.move.progressMessage.single');
    const description = destinationPath ? `${progressLabel} ${destinationPath}` : progressLabel;

    return (
        <ProgressDialogContent
            title={title}
            description={description}
            progress={progress}
            data-component={componentName}
        />
    );
};

MoveDialogProgressContent.displayName = MOVE_DIALOG_PROGRESS_CONTENT_NAME;
