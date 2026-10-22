import { cn, Dialog, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ReactElement, useCallback, useEffect, useMemo, useRef } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
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
} from '../model/projectDialog.store';
import { ConfirmationDialog } from '../../../shared/ui/dialogs/ConfirmationDialog';
import { ProjectDialogSteps } from './steps';
import { ProgressDialogContent } from '../../../shared/ui/dialogs/ProgressDialogContent';

const PROJECT_DIALOG_NAME = 'ProjectDialog';

export const ProjectDialog = (): ReactElement => {
    const {
        open,
        view,
        step,
        accessMode,
        readAccessProgress,
        nameData: { hasError },
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

    const projectInputRef = useRef<HTMLInputElement>(null);
    const languageInputRef = useRef<HTMLInputElement>(null);
    const nameStepRef = useRef<HTMLDivElement>(null);
    const navigationBackwardsRef = useRef(false);
    const accessModeRef = useRef<HTMLDivElement>(null);
    const roleInputRef = useRef<HTMLInputElement>(null);
    const applicationInputRef = useRef<HTMLInputElement>(null);
    const footerRef = useRef<HTMLElement>(null);
    const keyboardNavigationRef = useRef(false);
    const handleStepAutoFocus = useCallback(
        (event?: Event): void => {
            event?.preventDefault();
            if (step === 'step-summary' && !keyboardNavigationRef.current) {
                return;
            }

            // Read applied selections on entry without moving focus when they change.
            const { parentProjects, roles, applications } = $projectDialog.get();
            const nameInputs = nameStepRef.current?.querySelectorAll<HTMLInputElement>(
                'input:not([disabled]):not([readonly]):not([type="hidden"])',
            );
            const targets = {
                'step-parent': [parentProjects.length ? null : projectInputRef.current, languageInputRef.current],
                'step-name': Array.from(nameInputs ?? []).filter((input) => !input.value.trim()),
                'step-access': [
                    accessModeRef.current?.querySelector<HTMLButtonElement>('[role="radio"][aria-checked="true"]') ??
                        accessModeRef.current,
                ],
                'step-role': Object.keys(roles).length ? [] : [roleInputRef.current],
                'step-application': applications.length ? [] : [applicationInputRef.current],
            };
            const backwards = navigationBackwardsRef.current && step !== 'step-parent' && step !== 'step-summary';
            const target =
                targets[step]?.find(Boolean) ??
                footerRef.current?.querySelector<HTMLButtonElement>(
                    `[data-component="Dialog.StepIndicator"] > button:${backwards ? 'first' : 'last'}-child`,
                );
            target?.focus();
        },
        [step],
    );

    useEffect(() => {
        if (!open || view !== 'main') {
            return;
        }

        // Run after the stepper's own navigation focus handling.
        const frame = requestAnimationFrame(() => handleStepAutoFocus());
        return () => cancelAnimationFrame(frame);
    }, [open, view, handleStepAutoFocus]);

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
            if (newStep !== step) {
                const stepIds = Array.from(stepsMap.keys());
                navigationBackwardsRef.current = stepIds.indexOf(newStep) < stepIds.indexOf(step);
            }
            if (step === 'step-access' && isProjectDialogAccessModeDirty && newStep !== 'step-name') {
                pendingStep.current = newStep;
                setProjectDialogView('access-confirmation');
                return;
            }
            setProjectDialogStep(newStep);
        },
        [step, isProjectDialogAccessModeDirty, stepsMap],
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
                        className="w-full h-full max-sm:max-h-none sm:h-fit gap-10 p-5 md:p-10  md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
                        onOpenAutoFocus={handleStepAutoFocus}
                        onKeyDownCapture={() => {
                            keyboardNavigationRef.current = true;
                        }}
                        onPointerDownCapture={() => {
                            keyboardNavigationRef.current = false;
                        }}
                        data-component={PROJECT_DIALOG_NAME}
                    >
                        <ProjectDialogSteps.ParentStep.Header />
                        <ProjectDialogSteps.NameStep.Header />
                        <ProjectDialogSteps.AccessStep.Header />
                        <ProjectDialogSteps.RoleStep.Header />
                        <ProjectDialogSteps.ApplicationStep.Header />
                        <ProjectDialogSteps.SummaryStep.Header />

                        <Dialog.Body className={cn(step !== 'step-summary' && 'p-2 -m-2')}>
                            <ProjectDialogSteps.ParentStep.Content
                                projectSelectorRef={projectInputRef}
                                languageSelectorRef={languageInputRef}
                            />
                            <ProjectDialogSteps.NameStep.Content nameStepRef={nameStepRef} />
                            <ProjectDialogSteps.AccessStep.Content locked={hasError} accessModeRef={accessModeRef} />
                            <ProjectDialogSteps.RoleStep.Content
                                locked={!accessMode || hasError}
                                roleInputRef={roleInputRef}
                            />
                            <ProjectDialogSteps.ApplicationStep.Content
                                locked={!accessMode || hasError}
                                applicationInputRef={applicationInputRef}
                            />
                            <ProjectDialogSteps.SummaryStep.Content locked={!accessMode || hasError} />
                        </Dialog.Body>

                        <Dialog.Footer ref={footerRef} className="flex flex-col">
                            <Dialog.StepIndicator
                                previousLabel={previousLabel}
                                nextLabel={nextLabel}
                                lastStepLabel={submitLabel}
                                onLastStep={handleSubmit}
                                pending={submitting}
                                keyboardShortcuts
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
