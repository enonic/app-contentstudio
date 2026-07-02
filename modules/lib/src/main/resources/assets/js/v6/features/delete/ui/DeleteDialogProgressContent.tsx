import { type ReactElement } from 'react';
import { useAnimatedEllipsis } from '../../../shared/lib/hooks/useAnimatedEllipsis';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import type { TaskPhase } from '../../../entities/task';
import { ProgressDialogContent } from '../../../shared/ui/dialogs/ProgressDialogContent';

type DeleteDialogProgressContentProps = {
    total: number;
    progress: number;
    phase?: TaskPhase;
    'data-component'?: string;
};

const DELETE_DIALOG_PROGRESS_CONTENT_NAME = 'DeleteDialogProgressContent';

export const DeleteDialogProgressContent = ({
    total,
    progress,
    phase,
    'data-component': componentName = DELETE_DIALOG_PROGRESS_CONTENT_NAME,
}: DeleteDialogProgressContentProps): ReactElement => {
    const archiveTitle = useI18n('dialog.archive.progress.title');
    const resolvingDescription = useAnimatedEllipsis(useI18n('dialog.statusBar.loading'), phase == null);
    const unpublishDescription = useI18n('dialog.unpublish.beingUnpublished', total);
    const archiveDescription = useI18n('dialog.archiving', total);

    const descriptionByPhase: Partial<Record<TaskPhase, string>> = {
        unpublish: unpublishDescription,
        archive: archiveDescription,
    };

    return (
        <ProgressDialogContent
            title={archiveTitle}
            description={phase ? descriptionByPhase[phase] : resolvingDescription}
            progress={phase ? progress : undefined}
            data-component={componentName}
            className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
        />
    );
};

DeleteDialogProgressContent.displayName = DELETE_DIALOG_PROGRESS_CONTENT_NAME;
