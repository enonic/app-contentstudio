import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ProgressDialogContent} from '../ProgressDialogContent';

type DuplicateDialogProgressContentProps = {
    total: number;
    progress: number;
    'data-component'?: string;
};

const DUPLICATE_DIALOG_PROGRESS_CONTENT_NAME = 'DuplicateDialogProgressContent';

export const DuplicateDialogProgressContent = ({
    total,
    progress,
    'data-component': componentName = DUPLICATE_DIALOG_PROGRESS_CONTENT_NAME,
}: DuplicateDialogProgressContentProps): ReactElement => {
    const title = useI18n('dialog.duplicate');
    const description = useI18n('field.progress.duplicating', total);

    return (
        <ProgressDialogContent
            title={title}
            description={description}
            progress={progress}
            data-component={componentName}
        />
    );
};

DuplicateDialogProgressContent.displayName = DUPLICATE_DIALOG_PROGRESS_CONTENT_NAME;
