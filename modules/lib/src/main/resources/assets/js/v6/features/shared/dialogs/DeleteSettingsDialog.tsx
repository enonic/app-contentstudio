import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../hooks/useI18n';
import {
    $deleteSettingsDialog,
    closeDeleteSettingsDialog,
    executeDeleteSettingsDialogAction
} from '../../store/dialogs/deleteSettingsDialog.store';
import {ConfirmationDialog} from './ConfirmationDialog';
import {DialogPresetGatedConfirmContent} from './DialogPreset';

const DELETE_SETTINGS_DIALOG_NAME = 'DeleteSettingsDialog';

export const DeleteSettingsDialog = (): ReactElement => {
    const {open, expected, projectName} = useStore($deleteSettingsDialog, {keys: ['open', 'expected', 'projectName']});

    const confirmTitle = useI18n('dialog.confirmDelete');
    const confirmDescription = useI18n('dialog.project.delete.confirm.subheader');

    const handleOpenChange = (next: boolean): void => {
        if (!next) {
            closeDeleteSettingsDialog();
        }
    };

    return (
        <ConfirmationDialog.Root data-component={DELETE_SETTINGS_DIALOG_NAME} open={open} onOpenChange={handleOpenChange}>
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay />
                <DialogPresetGatedConfirmContent
                    className="sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
                    title={confirmTitle}
                    description={confirmDescription}
                    expected={expected}
                    onConfirm={() => executeDeleteSettingsDialogAction()}
                    onCancel={closeDeleteSettingsDialog}
                    validate={(value) => value === expected && !!projectName}
                />
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};

DeleteSettingsDialog.displayName = DELETE_SETTINGS_DIALOG_NAME;
