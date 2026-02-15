import {Button, cn, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback} from 'react';
import {
    $isNewProjectDialogDirty,
    $newProjectDialog,
    closeNewProjectDialog,
    createProject,
    setNewProjectDialogStep,
    setNewProjectDialogView,
} from '../../../store/dialogs/newProjectDialog.store';
import {NewProjectDialogSteps} from './steps';
import {useI18n} from '../../../hooks/useI18n';
import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

const NEW_PROJECT_DIALOG_NAME = 'NewProjectDialog';

export const NewProjectDialog = (): ReactElement => {
    const {
        open,
        view,
        step,
        accessMode,
        nameData: {hasError},
        submitting,
    } = useStore($newProjectDialog, {keys: ['open', 'view', 'step', 'accessMode', 'nameData', 'submitting']});

    const isDirty = useStore($isNewProjectDialogDirty);

    const previousLabel = useI18n('dialog.project.wizard.previous');
    const nextLabel = useI18n('dialog.project.wizard.next');
    const submitLabel = useI18n('dialog.project.wizard.action.submit');
    const confirmTitle = useI18n('dialog.confirm.newProject.title');
    const confirmDescription = useI18n('dialog.confirm.newProject.description');
    const cancelLabel = useI18n('action.cancel');
    const confirmLabel = useI18n('action.confirm');

    // Handlers
    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) return;

            if (isDirty) {
                setNewProjectDialogView('confirmation');
                return;
            }

            closeNewProjectDialog();
        },
        [isDirty]
    );

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

    const handleResetView = () => {
        setNewProjectDialogView('main');
    };

    const handleConfirm = () => {
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
                {view === 'main' && (
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
                )}
                {view === 'confirmation' && (
                    <Dialog.Content className="max-w-180 w-fit sm:min-w-152 text-main gap-2.5">
                        <Dialog.DefaultHeader title={confirmTitle} description={confirmDescription} withClose />
                        <Dialog.Footer className="mt-5">
                            <Button size="lg" label={cancelLabel} variant="outline" onClick={handleResetView} />
                            <Button
                                size="lg"
                                label={confirmLabel}
                                variant="solid"
                                className="bg-btn-error text-alt hover:bg-btn-error-hover active:bg-btn-error-active focus-visible:ring-error/50"
                                onClick={handleConfirm}
                            />
                        </Dialog.Footer>
                    </Dialog.Content>
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

NewProjectDialog.displayName = NEW_PROJECT_DIALOG_NAME;
