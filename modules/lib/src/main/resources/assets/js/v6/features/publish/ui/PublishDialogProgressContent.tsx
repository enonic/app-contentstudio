import { type ReactElement } from 'react';
import { useAnimatedEllipsis } from '../../../shared/lib/hooks/useAnimatedEllipsis';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { ProgressDialogContent } from '../../../shared/ui/dialogs/ProgressDialogContent';

type PublishDialogProgressContentProps = {
    total: number;
    progress: number;
    resolving?: boolean;
    'data-component'?: string;
};

const PUBLISH_DIALOG_PROGRESS_CONTENT_NAME = 'PublishDialogProgressContent';

export const PublishDialogProgressContent = ({
    total,
    progress,
    resolving = false,
    'data-component': componentName = PUBLISH_DIALOG_PROGRESS_CONTENT_NAME,
}: PublishDialogProgressContentProps): ReactElement => {
    const title = useI18n('dialog.publish');
    const resolvingDescription = useAnimatedEllipsis(useI18n('dialog.statusBar.loading'), resolving);
    const publishDescription = useI18n('dialog.publish.beingPublished', total);

    return (
        <ProgressDialogContent
            title={title}
            description={resolving ? resolvingDescription : publishDescription}
            progress={resolving ? undefined : progress}
            data-component={componentName}
        />
    );
};

PublishDialogProgressContent.displayName = PUBLISH_DIALOG_PROGRESS_CONTENT_NAME;
