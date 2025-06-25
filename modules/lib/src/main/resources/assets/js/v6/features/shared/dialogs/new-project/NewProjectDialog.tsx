import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {cn, Dialog, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useMemo} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $isNewProjectDialogDirty,
    $newProjectDialog,
    closeNewProjectDialog,
    createProject,
    setNewProjectDialogStep,
    setNewProjectDialogView,
} from '../../../store/dialogs/newProjectDialog.store';
import {ConfirmationDialog} from '../ConfirmationDialog';
import {NewProjectDialogSteps} from './steps';

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
    const parentStepTitle = useI18n('dialog.project.wizard.parent.stepTitle');
    const nameStepTitle = useI18n('dialog.project.wizard.name.stepTitle');
    const accessStepTitle = useI18n('dialog.project.wizard.access.stepTitle');
    const roleStepTitle = useI18n('dialog.project.wizard.role.stepTitle');
    const applicationStepTitle = useI18n('dialog.project.wizard.application.stepTitle');
    const summaryStepTitle = useI18n('dialog.project.wizard.summary.stepTitle');
    const stepsMap = useMemo(
        () =>
            new Map<string, string>([
                ['step-parent', parentStepTitle],
                ['step-name', nameStepTitle],
                ['step-access', accessStepTitle],
                ['step-role', roleStepTitle],
                ['step-application', applicationStepTitle],
                ['step-summary', summaryStepTitle],
            ]),
        [parentStepTitle, nameStepTitle, accessStepTitle, roleStepTitle, applicationStepTitle, summaryStepTitle]
    );

    // Handlers
    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) return;

            if (view === 'confirmation') {
                setNewProjectDialogView('main');
                return;
            }

            if (isDirty) {
                setNewProjectDialogView('confirmation');
                return;
            }

            closeNewProjectDialog();
        },
        [isDirty, view]
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
                        <NewProjectDialogSteps.NameStep.Header />
                        <NewProjectDialogSteps.AccessStep.Header />
                        <NewProjectDialogSteps.RoleStep.Header />
                        <NewProjectDialogSteps.ApplicationStep.Header />
                        <NewProjectDialogSteps.SummaryStep.Header />

                        <Dialog.Body className={cn(step !== 'step-summary' && 'p-2 -m-2')}>
                            <NewProjectDialogSteps.ParentStep.Content />
                            <NewProjectDialogSteps.NameStep.Content />
                            <NewProjectDialogSteps.AccessStep.Content locked={hasError} />
                            <NewProjectDialogSteps.RoleStep.Content locked={!accessMode || hasError} />
                            <NewProjectDialogSteps.ApplicationStep.Content locked={!accessMode || hasError} />
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
                                renderDot={(dot, step) => (
                                    <Tooltip delay={150} side="top" value={String(stepsMap.get(step))}>
                                        {dot}
                                    </Tooltip>
                                )}
                            />
                        </Dialog.Footer>
                    </Dialog.Content>
                )}
                {view === 'confirmation' && (
                    <ConfirmationDialog.Content>
                        <ConfirmationDialog.DefaultHeader title={confirmTitle} description={confirmDescription} />
                        <ConfirmationDialog.Footer onConfirm={handleConfirm} />
                    </ConfirmationDialog.Content>
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

NewProjectDialog.displayName = NEW_PROJECT_DIALOG_NAME;
