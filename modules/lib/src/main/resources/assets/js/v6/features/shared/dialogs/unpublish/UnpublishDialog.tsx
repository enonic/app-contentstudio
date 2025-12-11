import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $isUnpublishTargetSite,
    $unpublishDialog, $unpublishItemsCount,
    cancelUnpublishDialog,
    confirmUnpublishAction
} from '../../../store/dialogs/unpublishDialog.store';
import {DialogPresetGatedConfirmContent} from '../DialogPreset';
import {UnpublishDialogMainContent} from './UnpublishDialogMainContent';

type View = 'main' | 'confirmation' | 'progress';

const UNPUBLISH_DIALOG_NAME = 'UnpublishDialog';

export const UnpublishDialog = (): ReactElement => {
    const {open, items} = useStore($unpublishDialog, {keys: ['open', 'items']});
    const total = useStore($unpublishItemsCount);
    const hasSite = useStore($isUnpublishTargetSite);

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

    const handleUnpublish = async () => {
        if (total > 1 || hasSite) {
            setView('confirmation');
            return;
        }
        await confirmUnpublishAction(items);
    };

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
                    onConfirm={() => void handleUnpublish()}
                    onCancel={resetView}
                />}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

UnpublishDialog.displayName = UNPUBLISH_DIALOG_NAME;
