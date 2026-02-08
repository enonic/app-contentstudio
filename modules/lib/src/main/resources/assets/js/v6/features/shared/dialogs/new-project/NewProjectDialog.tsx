import {cn, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {
    $newProjectDialog,
    closeNewProjectDialog,
    createProject,
    setNewProjectDialogStep,
} from '../../../store/dialogs/newProjectDialog.store';
import {NewProjectDialogSteps} from './steps';
import {useI18n} from '../../../hooks/useI18n';
import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

const NEW_PROJECT_DIALOG_NAME = 'NewProjectDialog';

export const NewProjectDialog = (): ReactElement => {
    const {
        open,
        step,
        accessMode,
        nameData: {hasError},
        submitting,
    } = useStore($newProjectDialog, {keys: ['open', 'step', 'accessMode', 'nameData', 'submitting']});

    const previousLabel = useI18n('dialog.project.wizard.previous');
    const nextLabel = useI18n('dialog.project.wizard.next');
    const submitLabel = useI18n('dialog.project.wizard.action.submit');

    const handleOpenChange = (open: boolean) => {
        if (open) return;

        closeNewProjectDialog();
    };

    const handleSubmit = () => {
        createProject()
            .map(({project}) => {
                closeNewProjectDialog();
                showSuccess(i18n('notify.settings.project.created', project.getDisplayName()));
            })
            .mapErr((error) => {
                console.error(error);
                showError(error.message);
            });
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
                    <NewProjectDialogSteps.SummaryStep.Header />

                    <Dialog.Body className={cn(step !== 'step-summary' && 'p-1.5')}>
                        <NewProjectDialogSteps.ParentStep.Content />
                        <NewProjectDialogSteps.LanguageStep.Content />
                        <NewProjectDialogSteps.AccessStep.Content />
                        <NewProjectDialogSteps.RoleStep.Content locked={!accessMode} />
                        <NewProjectDialogSteps.ApplicationStep.Content locked={!accessMode} />
                        <NewProjectDialogSteps.NameStep.Content locked={!accessMode} />
                        <NewProjectDialogSteps.SummaryStep.Content locked={!accessMode || hasError} />
                    </Dialog.Body>

                    <Dialog.Footer className="flex flex-col">
                        <Dialog.StepIndicator
                            previousLabel={previousLabel}
                            nextLabel={nextLabel}
                            lastStepLabel={submitLabel}
                            onLastStep={handleSubmit}
                            pending={submitting}
                            dots
                        />
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

NewProjectDialog.displayName = NEW_PROJECT_DIALOG_NAME;
