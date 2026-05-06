import {showError, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {Dialog, Skeleton, Tooltip} from '@enonic/ui';
import {ReactElement, useCallback, useMemo} from 'react';
import {
    $isPermissionsDialogDirty,
    $permissionsDialog,
    closePermissionsDialog,
    setPermissionsDialogReplaceAllChildPermissions,
    setPermissionsDialogStep,
    setPermissionsDialogView,
    updatePermissions,
} from '../../../store/dialogs/permissionsDialog.store';
import {useStore} from '@nanostores/preact';
import {PermissionsDialogSteps} from './steps';
import {useI18n} from '../../../hooks/useI18n';
import {useTaskProgress} from '../../../hooks/useTaskProgress';
import {ProgressBar} from '../../primitives/ProgressBar';
import {ConfirmationDialog} from '../ConfirmationDialog';

const PERMISSIONS_DIALOG_NAME = 'PermissionsDialog';

export const PermissionsDialog = (): ReactElement => {
    const {
        open,
        view,
        loading,
        step,
        taskId,
        applyTo,
        contentDescendantsCount,
        contentDisplayName,
        hasVisitedStrategyStep,
        replaceAllChildPermissions,
    } = useStore($permissionsDialog, {
        keys: [
            'open',
            'view',
            'loading',
            'step',
            'taskId',
            'applyTo',
            'contentDescendantsCount',
            'contentDisplayName',
            'hasVisitedStrategyStep',
            'replaceAllChildPermissions',
        ],
    });

    const isDirty = useStore($isPermissionsDialogDirty);

    // Memoized values
    const numberItemsToApplyTo = useMemo(
        () => (applyTo === 'single' ? 1 : applyTo === 'subtree' ? contentDescendantsCount : contentDescendantsCount + 1),
        [applyTo, contentDescendantsCount]
    );

    const isLeafContent = contentDescendantsCount === 0;

    const canGoToSummaryStep = useMemo(
        () => (isLeafContent ? isDirty : hasVisitedStrategyStep && (applyTo === 'tree' || applyTo === 'subtree' || isDirty)),
        [hasVisitedStrategyStep, isLeafContent, isDirty, applyTo]
    );

    // Constants
    const {progress} = useTaskProgress(taskId);
    const previousLabel = useI18n('action.previous');
    const nextLabel = useI18n('action.next');
    const permissionsAppliedSingleLabel = useI18n('dialog.permissions.permissionsAppliedSingle');
    const permissionsAppliedMultipleLabel = useI18n('dialog.permissions.permissionsAppliedMultiple', numberItemsToApplyTo);
    const permissionsFailedSingleLabel = useI18n('dialog.permissions.permissionsFailedSingle');
    const permissionsFailedMultipleLabel = useI18n('dialog.permissions.permissionsFailedMultiple', numberItemsToApplyTo);
    const replaceAllPermissionsLabel = useI18n('dialog.permissions.replaceAllPermissions', numberItemsToApplyTo);
    const applyPermissionsLabel = useI18n('dialog.permissions.applyChanges', numberItemsToApplyTo);
    const progressHelper = useI18n('dialog.permissions.title', contentDisplayName);
    const progressTitle = useI18n('dialog.permissions.progress.title');
    const confirmTitle = useI18n('dialog.confirm.title');
    const confirmDescription = useI18n('dialog.confirm.applyChanges');
    const replaceAllConfirmationTitle = useI18n('dialog.confirm.title');
    const replaceAllConfirmationDescription = useI18n('dialog.confirm.replaceAllPermissions.description');
    const stepAccessTooltip = useI18n('dialog.permissions.access.stepTooltip');
    const stepStrategyTooltip = useI18n('dialog.permissions.strategy.stepTooltip');
    const stepSummaryTooltip = useI18n('dialog.permissions.summary.stepTooltip');
    const stepsMap = useMemo(
        () =>
            new Map<string, string>([
                ['step-access', stepAccessTooltip],
                ['step-strategy', stepStrategyTooltip],
                ['step-summary', stepSummaryTooltip],
            ]),
        [stepAccessTooltip, stepStrategyTooltip, stepSummaryTooltip]
    );

    // Handlers
    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) return;

            if (view === 'confirmation' || view === 'replaceAllConfirmation') {
                setPermissionsDialogView('main');
                return;
            }

            if (taskId) {
                closePermissionsDialog();
                return;
            }

            if (isDirty) {
                setPermissionsDialogView('confirmation');
                return;
            }

            closePermissionsDialog();
        },
        [view, taskId, isDirty]
    );

    const handleSubmit = useCallback(() => {
        const successMessage = applyTo === 'single' ? permissionsAppliedSingleLabel : permissionsAppliedMultipleLabel;
        const failedMessage = applyTo === 'single' ? permissionsFailedSingleLabel : permissionsFailedMultipleLabel;

        updatePermissions((resultState, _) => {
            if (resultState === 'SUCCESS') {
                showSuccess(successMessage);
            } else if (resultState === 'WARNING') {
                showWarning(failedMessage);
            } else {
                showError(failedMessage);
            }
        });
    }, [
        applyTo,
        permissionsAppliedSingleLabel,
        permissionsFailedSingleLabel,
        permissionsAppliedMultipleLabel,
        permissionsFailedMultipleLabel,
    ]);

    const handleConfirm = useCallback(() => {
        closePermissionsDialog();
    }, []);

    const handleReplaceAllConfirm = useCallback(() => {
        setPermissionsDialogReplaceAllChildPermissions(true);
        setPermissionsDialogView('main');
    }, []);

    const handleReplaceAllCancel = useCallback(() => {
        setPermissionsDialogReplaceAllChildPermissions(false);
        setPermissionsDialogView('main');
    }, []);

    return (
        <Dialog.Root
            data-component={PERMISSIONS_DIALOG_NAME}
            open={open}
            onOpenChange={handleOpenChange}
            step={step}
            onStepChange={setPermissionsDialogStep}
        >
            <Dialog.Portal>
                <Dialog.Overlay />
                {view === 'main' && (
                    <Dialog.Content className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[90vh] lg:max-w-220">
                        {loading && (
                            <>
                                <Dialog.Header className="flex flex-col gap-2.5">
                                    <Skeleton shape="rectangle" className="h-6 w-36" />
                                    <Skeleton shape="rectangle" className="h-10 w-48" />
                                </Dialog.Header>
                                <Dialog.Body className="flex flex-col gap-7.5 mt-7.5">
                                    <div className="flex flex-col gap-2.5">
                                        <Skeleton shape="rectangle" className="h-10 w-full" />
                                        <Skeleton shape="rectangle" className="h-10 w-full" />
                                        <Skeleton shape="rectangle" className="h-10 w-full" />
                                        <Skeleton shape="rectangle" className="h-10 w-full" />
                                        <Skeleton shape="rectangle" className="h-10 w-full" />
                                        <Skeleton shape="rectangle" className="h-10 w-full" />
                                        <Skeleton shape="rectangle" className="h-10 w-full" />
                                        <Skeleton shape="rectangle" className="h-10 w-full" />
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        <Skeleton shape="rectangle" className="h-6 w-36" />
                                        <Skeleton shape="rectangle" className="h-6 w-48" />
                                        <Skeleton shape="rectangle" className="h-6 w-60" />
                                    </div>
                                </Dialog.Body>
                            </>
                        )}

                        {!loading && !taskId && (
                            <>
                                <PermissionsDialogSteps.AccessStep.Header />
                                {!isLeafContent && <PermissionsDialogSteps.StrategyStep.Header />}
                                <PermissionsDialogSteps.SummaryStep.Header />

                                <Dialog.Body className="p-2 -m-2">
                                    <PermissionsDialogSteps.AccessStep.Content />
                                    {!isLeafContent && <PermissionsDialogSteps.StrategyStep.Content locked={!isDirty} />}
                                    <PermissionsDialogSteps.SummaryStep.Content locked={!canGoToSummaryStep} />
                                </Dialog.Body>

                                <Dialog.Footer className="flex flex-col">
                                    <Dialog.StepIndicator
                                        dots
                                        previousLabel={previousLabel}
                                        nextLabel={nextLabel}
                                        lastStepLabel={replaceAllChildPermissions ? replaceAllPermissionsLabel : applyPermissionsLabel}
                                        onLastStep={handleSubmit}
                                        renderDot={(dot, step) => (
                                            <Tooltip delay={150} side="top" value={stepsMap.get(step) ?? ''}>
                                                {dot}
                                            </Tooltip>
                                        )}
                                    />
                                </Dialog.Footer>
                            </>
                        )}

                        {!loading && taskId && (
                            <>
                                <Dialog.StepHeader step="step-summary" helper={progressHelper} title={progressTitle} withClose />
                                <ProgressBar value={progress} />
                            </>
                        )}
                    </Dialog.Content>
                )}

                {view === 'replaceAllConfirmation' && (
                    <ConfirmationDialog.Content>
                        <ConfirmationDialog.DefaultHeader
                            title={replaceAllConfirmationTitle}
                            description={replaceAllConfirmationDescription}
                        />
                        <ConfirmationDialog.Footer
                            closeOnConfirm={false}
                            closeOnCancel={false}
                            onConfirm={handleReplaceAllConfirm}
                            onCancel={handleReplaceAllCancel}
                        />
                    </ConfirmationDialog.Content>
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

PermissionsDialog.displayName = PERMISSIONS_DIALOG_NAME;
