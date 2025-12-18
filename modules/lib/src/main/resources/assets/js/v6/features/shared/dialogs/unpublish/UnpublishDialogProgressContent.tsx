import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ProgressDialogContent} from '../ProgressDialogContent';

type UnpublishDialogProgressContentProps = {
    total: number;
    progress: number;
};

export const UnpublishDialogProgressContent = ({total, progress}: UnpublishDialogProgressContentProps): ReactElement => {
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
