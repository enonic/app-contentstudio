import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {$newProjectDialog, closeNewProjectDialog, setNewProjectDialogStep} from '../../../store/dialogs/newProjectDialog.store';
import {NewProjectDialogSteps} from './steps';
import {useI18n} from '../../../hooks/useI18n';

const NEW_PROJECT_DIALOG_NAME = 'NewProjectDialog';

export const NewProjectDialog = (): ReactElement => {
    const {open, step, accessMode} = useStore($newProjectDialog);
    const previousLabel = useI18n('dialog.project.wizard.previous');
    const nextLabel = useI18n('dialog.project.wizard.next');

    const handleOpenChange = (open: boolean) => {
        if (open) return;

        closeNewProjectDialog();
    };

    return (
        <Dialog.Root
            data-component={NEW_PROJECT_DIALOG_NAME}
            open={open}
            onOpenChange={handleOpenChange}
            step={step}
            onStepChange={setNewProjectDialogStep}
        >
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220">
                    <NewProjectDialogSteps.ParentStep.Header />
                    <NewProjectDialogSteps.LanguageStep.Header />
                    <NewProjectDialogSteps.AccessStep.Header />
                    <NewProjectDialogSteps.RoleStep.Header />
                    <NewProjectDialogSteps.ApplicationStep.Header />
                    <NewProjectDialogSteps.NameStep.Header />

                    <Dialog.Body className="p-1.5">
                        <NewProjectDialogSteps.ParentStep.Content />
                        <NewProjectDialogSteps.LanguageStep.Content />
                        <NewProjectDialogSteps.AccessStep.Content />
                        <NewProjectDialogSteps.RoleStep.Content locked={!accessMode} />
                        <NewProjectDialogSteps.ApplicationStep.Content locked={!accessMode} />
                        <NewProjectDialogSteps.NameStep.Content locked={!accessMode} />
                    </Dialog.Body>

                    <Dialog.Footer className="flex flex-col">
                        <Dialog.StepIndicator previousLabel={previousLabel} nextLabel={nextLabel} dots />
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

NewProjectDialog.displayName = NEW_PROJECT_DIALOG_NAME;
