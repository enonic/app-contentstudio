import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$unpublishProgress} from '../../../store/dialogs/unpublishDialog.store';
import {ProgressDialogContent} from '../ProgressDialogContent';

type UnpublishDialogProgressContentProps = {
    total: number;
};

export const UnpublishDialogProgressContent = ({total}: UnpublishDialogProgressContentProps): ReactElement => {
    const progress = useStore($unpublishProgress);
    const title = useI18n('dialog.unpublish');
    const description = useI18n('dialog.unpublish.beingUnpublished', total);

    return (
        <ProgressDialogContent
            title={title}
            description={description}
            progress={progress}
        />
    );
};
