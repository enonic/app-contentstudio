import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ProgressDialogContent} from '../ProgressDialogContent';

type UnpublishDialogProgressContentProps = {
    total: number;
    progress: number;
    'data-component'?: string;
};

const UNPUBLISH_DIALOG_PROGRESS_CONTENT_NAME = 'UnpublishDialogProgressContent';

export const UnpublishDialogProgressContent = ({
    total,
    progress,
    'data-component': componentName = UNPUBLISH_DIALOG_PROGRESS_CONTENT_NAME,
}: UnpublishDialogProgressContentProps): ReactElement => {
    const title = useI18n('dialog.unpublish');
    const description = useI18n('dialog.unpublish.beingUnpublished', total);

    return (
        <ProgressDialogContent
            title={title}
            description={description}
            progress={progress}
            data-component={componentName}
        />
    );
};

UnpublishDialogProgressContent.displayName = UNPUBLISH_DIALOG_PROGRESS_CONTENT_NAME;
