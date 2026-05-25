import {cn, Dialog, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useMemo, useRef} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $isProjectDialogAccessModeDirty,
    $isProjectDialogDirty,
    $projectDialog,
    cancelProjectDialog,
    confirmProjectDialogAccessMode,
    createProject,
    revertProjectDialogAccessMode,
    updateProject,
    setProjectDialogStep,
    setProjectDialogView,
} from '../../../store/dialogs/projectDialog.store';
import {ConfirmationDialog} from '../ConfirmationDialog';
import {ProjectDialogSteps} from './steps';
import {ProgressDialogContent} from '../ProgressDialogContent';

const PROJECT_DIALOG_NAME = 'ProjectDialog';

export const ProjectDialog = (): ReactElement => {
    const {
        open,
        view,
        step,
        accessMode,
        readAccessProgress,
        nameData: {hasError},
        submitting,
        mode,
    } = useStore($projectDialog, {
        keys: ['open', 'view', 'step', 'accessMode', 'readAccessProgress', 'nameData', 'submitting', 'mode'],
    });

    const isDirty = useStore($isProjectDialogDirty);
    const isProjectDialogAccessModeDirty = useStore($isProjectDialogAccessModeDirty);
    const pendingStep = useRef<string | null>(null);

    const previousLabel = useI18n('action.previous');
    const nextLabel = useI18n('action.next');
    const createLabel = useI18n('dialog.project.wizard.action.submit');
    const updateLabel = useI18n('dialog.project.wizard.action.update');
    const submitLabel = mode === 'edit' ? updateLabel : createLabel;
    const dirtyConfirmTitle = useI18n('dialog.confirm.title');
    const dirtyConfirmDescription = useI18n('dialog.confirm.applyChanges');
    const accessConfirmTitle = useI18n('dialog.confirm.title');
    const accessConfirmDescription = useI18n('dialog.projectAccess.confirm');
    const applyingLabel = useI18n('dialog.projectAccess.applying');
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
        [parentStepTitle, nameStepTitle, accessStepTitle, roleStepTitle, applicationStepTitle, summaryStepTitle],
    );

    // Handlers
    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) return;

            if (view === 'dirty-confirmation' || view === 'access-confirmation') {
                setProjectDialogView('main');
                return;
            }

            if (isDirty) {
                setProjectDialogView('dirty-confirmation');
                return;
            }

            cancelProjectDialog();
        },
        [isDirty, view],
    );

    const handleSubmit = useCallback(() => {
        if (mode === 'edit') {
            updateProject();
        } else {
            createProject();
        }
    }, [mode]);

    const handleStepChange = useCallback(
        (newStep: string) => {
            if (step === 'step-access' && isProjectDialogAccessModeDirty && newStep !== 'step-name') {
                pendingStep.current = newStep;
                setProjectDialogView('access-confirmation');
                return;
            }
            setProjectDialogStep(newStep);
        },
        [step, isProjectDialogAccessModeDirty],
    );

    const handleAccessConfirm = useCallback(() => {
        confirmProjectDialogAccessMode();
        if (pendingStep.current) {
            setProjectDialogStep(pendingStep.current);
            pendingStep.current = null;
        }
        setProjectDialogView('main');
    }, []);

    const handleAccessCancel = useCallback(() => {
        pendingStep.current = null;
        revertProjectDialogAccessMode();
        setProjectDialogView('main');
    }, []);

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange} step={step} onStepChange={handleStepChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                {view === 'main' && (
                    <Dialog.Content
                        className='w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220'
                        data-component={PROJECT_DIALOG_NAME}
                    >
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

                        <Dialog.Footer className='flex flex-col'>
                            <Dialog.StepIndicator
                                previousLabel={previousLabel}
                                nextLabel={nextLabel}
                                lastStepLabel={submitLabel}
                                onLastStep={handleSubmit}
                                pending={submitting}
                                dots
                                renderDot={(dot, step) => (
                                    <Tooltip delay={150} side='top' value={String(stepsMap.get(step))}>
                                        {dot}
                                    </Tooltip>
                                )}
                            />
                        </Dialog.Footer>
                    </Dialog.Content>
                )}
                {view === 'dirty-confirmation' && (
                    <ConfirmationDialog.Content>
                        <ConfirmationDialog.DefaultHeader
                            title={dirtyConfirmTitle}
                            description={dirtyConfirmDescription}
                        />
                        <ConfirmationDialog.Footer onConfirm={() => cancelProjectDialog()} />
                    </ConfirmationDialog.Content>
                )}
                {view === 'access-confirmation' && (
                    <ConfirmationDialog.Content>
                        <ConfirmationDialog.DefaultHeader
                            title={accessConfirmTitle}
                            description={accessConfirmDescription}
                        />
                        <ConfirmationDialog.Footer onConfirm={handleAccessConfirm} onCancel={handleAccessCancel} />
                    </ConfirmationDialog.Content>
                )}
                {view === 'progress' && (
                    <ProgressDialogContent
                        title={applyingLabel}
                        progress={readAccessProgress ?? 0}
                        data-component={PROJECT_DIALOG_NAME}
                    />
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

ProjectDialog.displayName = PROJECT_DIALOG_NAME;
