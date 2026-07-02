import { type ReactElement } from 'react';
import { useAnimatedEllipsis } from '../../../../shared/lib/hooks/useAnimatedEllipsis';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { ProgressDialogContent } from '../ProgressDialogContent';

type UnpublishDialogProgressContentProps = {
    total: number;
    progress: number;
    resolving?: boolean;
    'data-component'?: string;
};

const UNPUBLISH_DIALOG_PROGRESS_CONTENT_NAME = 'UnpublishDialogProgressContent';

export const UnpublishDialogProgressContent = ({
    total,
    progress,
    resolving = false,
    'data-component': componentName = UNPUBLISH_DIALOG_PROGRESS_CONTENT_NAME,
}: UnpublishDialogProgressContentProps): ReactElement => {
    const title = useI18n('dialog.unpublish');
    const resolvingDescription = useAnimatedEllipsis(useI18n('dialog.statusBar.loading'), resolving);
    const unpublishDescription = useI18n('dialog.unpublish.beingUnpublished', total);

    return (
        <ProgressDialogContent
            title={title}
            description={resolving ? resolvingDescription : unpublishDescription}
            progress={resolving ? undefined : progress}
            data-component={componentName}
        />
    );
};

UnpublishDialogProgressContent.displayName = UNPUBLISH_DIALOG_PROGRESS_CONTENT_NAME;
