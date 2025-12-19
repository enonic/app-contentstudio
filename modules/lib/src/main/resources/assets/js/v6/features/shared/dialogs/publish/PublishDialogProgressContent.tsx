import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ProgressDialogContent} from '../ProgressDialogContent';

type PublishDialogProgressContentProps = {
    total: number;
    progress: number;
    'data-component'?: string;
};

const PUBLISH_DIALOG_PROGRESS_CONTENT_NAME = 'PublishDialogProgressContent';

export const PublishDialogProgressContent = ({
    total,
    progress,
    'data-component': componentName = PUBLISH_DIALOG_PROGRESS_CONTENT_NAME,
}: PublishDialogProgressContentProps): ReactElement => {
    const title = useI18n('dialog.publish');
    const description = useI18n('dialog.publish.beingPublished', total);

    return (
        <ProgressDialogContent
            title={title}
            description={description}
            progress={progress}
            data-component={componentName}
        />
    );
};

PublishDialogProgressContent.displayName = PUBLISH_DIALOG_PROGRESS_CONTENT_NAME;
