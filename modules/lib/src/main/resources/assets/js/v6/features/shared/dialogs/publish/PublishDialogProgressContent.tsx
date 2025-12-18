import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ProgressDialogContent} from '../ProgressDialogContent';

type PublishDialogProgressContentProps = {
    total: number;
    progress: number;
};

export const PublishDialogProgressContent = ({total, progress}: PublishDialogProgressContentProps): ReactElement => {
    const title = useI18n('dialog.publish');
    const description = useI18n('dialog.publish.beingPublished', total);

    return (
        <ProgressDialogContent
            title={title}
            description={description}
            progress={progress}
        />
    );
};
