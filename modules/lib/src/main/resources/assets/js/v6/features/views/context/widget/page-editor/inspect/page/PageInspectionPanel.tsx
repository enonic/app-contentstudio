import {Button} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useCallback, useState} from 'react';
import {useI18n} from '../../../../../../hooks/useI18n';
import {ConfirmationDialog} from '../../../../../../shared/dialogs/ConfirmationDialog';
import {FormRenderer} from '../../../../../../shared/form/FormRenderer';
import {
    $contentContext,
    $pageEditorLifecycle,
    bumpInsertTabActivateNonce,
    requestCustomizePage,
    usePageState,
} from '../../../../../../store/page-editor';
import {$isCustomizeVisible, $isPageInspectionEmpty, $pageConfigDescriptor} from '../../../../../../store/page-inspection.store';
import {useInspectFormTracking} from '../useInspectFormTracking';
import {PageControllerSelector} from "./PageControllerSelector";

type ConfirmDialogState = {
    question: string;
    onConfirm: () => void;
};

const PAGE_INSPECTION_PANEL_NAME = "PageInspectionPanel";

export const PageInspectionPanel = (): ReactElement => {
    const page = usePageState();
    const ctx = useStore($contentContext);
    const lifecycle = useStore($pageEditorLifecycle);
    const descriptor = useStore($pageConfigDescriptor);
    const isCustomizeVisible = useStore($isCustomizeVisible);
    const isEmpty = useStore($isPageInspectionEmpty);

    const customizeLabel = useI18n("action.page.customize");
    const customizeQuestion = useI18n("dialog.page.customize.confirmation");
    const noTemplatesLabel = useI18n('text.notemplatesorblocks');

    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

    const handleCustomize = useCallback((): void => {
        setConfirmDialog({
            question: customizeQuestion,
            onConfirm: () => {
                requestCustomizePage();
                bumpInsertTabActivateNonce();
            },
        });
    }, [customizeQuestion]);

    const hasController = page?.hasController() ?? false;
    const configForm = descriptor?.getConfig() ?? null;
    const configRoot = hasController ? (page?.getConfig()?.getRoot() ?? null) : null;

    useInspectFormTracking(configForm, configRoot);

    if (isEmpty) {
        return (
            <div data-component={PAGE_INSPECTION_PANEL_NAME} className="flex flex-col -mx-5 p-5 bg-surface-primary">
                <p className="text-sm text-subtle">{noTemplatesLabel}</p>
            </div>
        );
    }

    return (
        <div data-component={PAGE_INSPECTION_PANEL_NAME} className="flex flex-col gap-5">
            <div className="flex flex-col -mx-5 p-5 bg-surface-primary gap-5">
                <PageControllerSelector />

                {isCustomizeVisible && (
                    <Button
                        label={customizeLabel}
                        variant="outline"
                        onClick={handleCustomize}
                        className="w-full"
                    />
                )}
            </div>

            {hasController && configForm && configRoot && (
                <FormRenderer
                    form={configForm}
                    propertySet={configRoot}
                    enabled={!lifecycle.isPageLocked}
                    applicationKey={ctx?.applicationKey ?? undefined}
                />
            )}

            <ConfirmationDialog.Root
                open={confirmDialog != null}
                onOpenChange={(open) => {
                    if (!open) setConfirmDialog(null);
                }}
            >
                {confirmDialog && (
                    <ConfirmationDialog.Portal>
                        <ConfirmationDialog.Overlay />
                        <ConfirmationDialog.Content>
                            <ConfirmationDialog.Body>
                                {confirmDialog.question}
                            </ConfirmationDialog.Body>
                            <ConfirmationDialog.Footer
                                onConfirm={() => {
                                    confirmDialog.onConfirm();
                                    setConfirmDialog(null);
                                }}
                                onCancel={() => setConfirmDialog(null)}
                            />
                        </ConfirmationDialog.Content>
                    </ConfirmationDialog.Portal>
                )}
            </ConfirmationDialog.Root>
        </div>
    );
};

PageInspectionPanel.displayName = PAGE_INSPECTION_PANEL_NAME;
