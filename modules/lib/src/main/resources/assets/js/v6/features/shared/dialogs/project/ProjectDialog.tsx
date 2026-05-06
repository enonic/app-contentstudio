import {cn, Dialog, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useMemo} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $isProjectDialogDirty,
    $projectDialog,
    closeProjectDialog,
    createProject,
    updateProject,
    setProjectDialogStep,
    setProjectDialogView,
} from '../../../store/dialogs/projectDialog.store';
import {ConfirmationDialog} from '../ConfirmationDialog';
import {ProjectDialogSteps} from './steps';

const NEW_PROJECT_DIALOG_NAME = 'ProjectDialog';

export const ProjectDialog = (): ReactElement => {
    const {
        open,
        view,
        step,
        accessMode,
        nameData: {hasError},
        submitting,
        mode,
    } = useStore($projectDialog, {keys: ['open', 'view', 'step', 'accessMode', 'nameData', 'submitting', 'mode']});

    const isDirty = useStore($isProjectDialogDirty);

    const previousLabel = useI18n('action.previous');
    const nextLabel = useI18n('action.next');
    const createLabel = useI18n('dialog.project.wizard.action.submit');
    const updateLabel = useI18n('dialog.project.wizard.action.update');
    const submitLabel = mode === 'edit' ? updateLabel : createLabel;
    const confirmTitle = useI18n('dialog.confirm.title');
    const confirmDescription = useI18n('dialog.confirm.applyChanges');
    const parentStepTitle = useI18n('dialog.project.wizard.parent.stepTitle');
    const nameStepTitle = useI18n('dialog.project.wizard.name.stepTitle');
    const accessStepTitle = useI18n('dialog.project.wizard.access.stepTitle');
    const roleStepTitle = useI18n('settings.items.wizard.step.roles');
    const applicationStepTitle = useI18n('settings.items.wizard.step.applications');
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
                setProjectDialogView('main');
                return;
            }

            if (isDirty) {
                setProjectDialogView('confirmation');
                return;
            }

            closeProjectDialog();
        },
        [isDirty, view]
    );

    const handleSubmit = useCallback(() => {
        if (mode === 'edit') {
            updateProject();
        } else {
            createProject();
        }
    }, [mode]);

    const handleConfirm = () => {
        closeProjectDialog();
    };

    return (
        <Dialog.Root
            data-component={NEW_PROJECT_DIALOG_NAME}
            open={open}
            onOpenChange={handleOpenChange}
            step={step}
            onStepChange={setProjectDialogStep}
        >
            <Dialog.Portal>
                <Dialog.Overlay />
                {view === 'main' && (
                    <Dialog.Content className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220">
                        <ProjectDialogSteps.ParentStep.Header />
                        <ProjectDialogSteps.NameStep.Header />
                        <ProjectDialogSteps.AccessStep.Header />
                        <ProjectDialogSteps.RoleStep.Header />
                        <ProjectDialogSteps.ApplicationStep.Header />
                        <ProjectDialogSteps.SummaryStep.Header />

                        <Dialog.Body className={cn(step !== 'step-summary' && 'p-2 -m-2')}>
                            <ProjectDialogSteps.ParentStep.Content />
                            <ProjectDialogSteps.NameStep.Content />
                            <ProjectDialogSteps.AccessStep.Content locked={hasError} />
                            <ProjectDialogSteps.RoleStep.Content locked={!accessMode || hasError} />
                            <ProjectDialogSteps.ApplicationStep.Content locked={!accessMode || hasError} />
                            <ProjectDialogSteps.SummaryStep.Content locked={!accessMode || hasError} />
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

ProjectDialog.displayName = NEW_PROJECT_DIALOG_NAME;
