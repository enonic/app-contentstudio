import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$publishProgress} from '../../../store/dialogs/publishDialog.store';
import {ProgressDialogContent} from '../ProgressDialogContent';

type PublishDialogProgressContentProps = {
    total: number;
};

export const PublishDialogProgressContent = ({total}: PublishDialogProgressContentProps): ReactElement => {
    const progress = useStore($publishProgress);
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
