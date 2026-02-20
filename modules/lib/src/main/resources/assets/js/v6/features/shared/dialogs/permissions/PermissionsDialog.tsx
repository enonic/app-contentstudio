import {showError, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {Dialog, Skeleton} from '@enonic/ui';
import {ReactElement, useCallback, useMemo} from 'react';
import {
    $permissionsDialog,
    closePermissionsDialog,
    setPermissionsDialogStep,
    updatePermissions,
} from '../../../store/dialogs/permissionsDialog.store';
import {useStore} from '@nanostores/preact';
import {PermissionsDialogSteps} from './steps';
import {useI18n} from '../../../hooks/useI18n';
import {useTaskProgress} from '../../../hooks/useTaskProgress';
import {ProgressBar} from '../../primitives/ProgressBar';
import {compareAccessControlEntries} from '../../../utils/cms/permissions/accessControl';

const PERMISSIONS_DIALOG_NAME = 'PermissionsDialog';

export const PermissionsDialog = (): ReactElement => {
    const {
        open,
        loading,
        step,
        taskId,
        applyTo,
        contentDescendantsCount,
        initialAccessControlEntries,
        finalAccessControlEntries,
        contentDisplayName,
        hasVisitedStrategyStep,
    } = useStore($permissionsDialog, {
        keys: [
            'open',
            'loading',
            'step',
            'taskId',
            'applyTo',
            'contentDescendantsCount',
            'initialAccessControlEntries',
            'finalAccessControlEntries',
            'contentDisplayName',
            'hasVisitedStrategyStep',
        ],
    });

    // Memoized values
    const hasChanges = useMemo(() => {
        const {added, removed, modified} = compareAccessControlEntries(initialAccessControlEntries, finalAccessControlEntries);

        return added.length > 0 || removed.length > 0 || modified.length > 0;
    }, [initialAccessControlEntries, finalAccessControlEntries]);

    const numberItemsToApplyTo = useMemo(
        () => (applyTo === 'single' ? 1 : applyTo === 'subtree' ? contentDescendantsCount : contentDescendantsCount + 1),
        [applyTo, contentDescendantsCount]
    );

    const isLeafContent = useMemo(() => contentDescendantsCount === 0, [contentDescendantsCount]);

    const canGoToSummaryStep = useMemo(
        () => (isLeafContent ? hasChanges : hasVisitedStrategyStep && (applyTo === 'tree' || applyTo === 'subtree' || hasChanges)),
        [hasVisitedStrategyStep, isLeafContent, hasChanges, applyTo]
    );

    // Constants
    const {progress} = useTaskProgress(taskId);
    const previousLabel = useI18n('dialog.permissions.previous');
    const nextLabel = useI18n('dialog.permissions.next');
    const permissionsAppliedSingleLabel = useI18n('dialog.permissions.permissionsAppliedSingle');
    const permissionsAppliedMultipleLabel = useI18n('dialog.permissions.permissionsAppliedMultiple', numberItemsToApplyTo);
    const permissionsFailedSingleLabel = useI18n('dialog.permissions.permissionsFailedSingle');
    const permissionsFailedMultipleLabel = useI18n('dialog.permissions.permissionsFailedMultiple', numberItemsToApplyTo);
    const submitLabel = useI18n('dialog.permissions.submit', numberItemsToApplyTo);
    const progressHelper = useI18n('dialog.permissions.title', contentDisplayName);
    const progressTitle = useI18n('dialog.permissions.progress.title');
    const nothingToApplyLabel = useI18n('dialog.permissions.nothingToApply');
    const nextProcessedLabel = useMemo(() => {
        if (step === 'step-access') return hasChanges ? nextLabel : nothingToApplyLabel;
        if (step === 'step-strategy') return canGoToSummaryStep ? nextLabel : nothingToApplyLabel;
        return nextLabel;
    }, [step, hasChanges, canGoToSummaryStep, nextLabel, nothingToApplyLabel]);

    // Handlers
    const handleOpenChange = (open: boolean) => {
        if (open) return;

        closePermissionsDialog();
    };

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

                            <Dialog.Body className="p-2 -m-2">
                                <PermissionsDialogSteps.AccessStep.Content />
                            </Dialog.Body>

                            <Dialog.Footer className="flex flex-col">
                                <Dialog.StepIndicator
                                    previousLabel={previousLabel}
                                    nextLabel={nextProcessedLabel}
                                    lastStepLabel={submitLabel}
                                    onLastStep={handleSubmit}
                                    dots
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
            </Dialog.Portal>
        </Dialog.Root>
    );
};

PermissionsDialog.displayName = PERMISSIONS_DIALOG_NAME;
