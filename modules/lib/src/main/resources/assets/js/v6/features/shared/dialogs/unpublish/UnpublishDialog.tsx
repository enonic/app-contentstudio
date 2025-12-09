import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $isUnpublishTargetSite,
    $unpublishDialog, $unpublishItemsCount,
    cancelUnpublishDialog,
    confirmUnpublishAction
} from '../../../store/dialogs/unpublishDialog.store';
import {DialogPresetGatedConfirmContent} from '../DialogPreset';
import {UnpublishDialogMainContent} from './UnpublishDialogMainContent';
import {$progressValue} from '../../../store/dialogs/progress.store';
import {ProgressDialog} from '../ProgressDialog';

type View = 'main' | 'confirmation' | 'progress';

const UNPUBLISH_DIALOG_NAME = 'UnpublishDialog';

export const UnpublishDialog = (): ReactElement => {
    const {open, items} = useStore($unpublishDialog, {keys: ['open', 'items']});
    const total = useStore($unpublishItemsCount);
    const hasSite = useStore($isUnpublishTargetSite);
    // const progress = useStore($progressValue);

    const [view, setView] = useState<View>('main');

    const confirmTitle = useI18n('dialog.unpublish.confirm.title');
    const confirmDescription = useI18n('dialog.unpublish.confirm.subtitle');

    const resetView = () => setView('main');

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelUnpublishDialog();
            resetView();
        }
    };

    const startUnpublish = async () => {
        setView('progress');
        const started = await confirmUnpublishAction(items);
        if (!started) {
            setView('main');
        }
    };

    const handleUnpublish =  () => {
        if (total > 1 || hasSite) {
            setView('confirmation');
            return;
        }
        // await confirmUnpublishAction(items);
        // setView('progress');
        void startUnpublish();
    };

    useEffect(() => {
        if (!open) {
            resetView();
        }
    }, [open]);

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />

                {view === 'main' &&
                    <UnpublishDialogMainContent onUnpublish={() => void handleUnpublish()} />
                }
                {view === 'confirmation' && <DialogPresetGatedConfirmContent
                    className="sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
                    title={confirmTitle}
                    description={confirmDescription}
                    expected={total}
                    // onConfirm={() => void handleUnpublish()}
                    onConfirm={() => void startUnpublish()}
                    onCancel={resetView}
                />}
                {view === 'progress' &&
                    <UnpublishProgressView
                        total={total || items.length || 1}
                    />
                }
            </Dialog.Portal>
        </Dialog.Root>
    );
};

UnpublishDialog.displayName = UNPUBLISH_DIALOG_NAME;

type UnpublishProgressViewProps = {
    total: number;
};

const UnpublishProgressView = ({total}: UnpublishProgressViewProps): ReactElement => {
    const progress = useStore($progressValue);

    return (
        <ProgressDialog
            title={useI18n('dialog.unpublish')}
            description={useI18n('dialog.unpublish.beingUnpublished', total)}
            progress={progress}
        />
    );
};
