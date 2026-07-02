import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { Button, Checkbox, type CheckboxChecked, Dialog, IconButton, Tooltip } from '@enonic/ui';
import { Copy, FolderOutput, LoaderCircle } from 'lucide-react';
import { type FormEvent, type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { importContent, type ImportResult } from '../../api/importContent.api';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { PathSelector } from '../../../../features/shared/selectors/path/PathSelector';
import { createRootContent, ROOT_ID } from '../../../../features/shared/selectors/path/PathSelectorRoot';

const IMPORT_CONTENT_IMPORT_DIALOG_NAME = 'ImportContentImportDialog';

type ImportPhase =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'success'; result: ImportResult }
    | { kind: 'error'; message: string };

type ImportContentImportDialogProps = {
    open: boolean;
    content?: ContentSummary | null;
    exportName: string;
    onClose: () => void;
    onSuccess?: (result: ImportResult) => void;
};

export const ImportContentImportDialog = ({
    open,
    content,
    exportName,
    onClose,
    onSuccess,
}: ImportContentImportDialogProps): ReactElement => {
    const title = useI18n('widget.import.import.dialog.title');
    const sourceLabel = useI18n('widget.import.import.dialog.source');
    const targetLabel = useI18n('widget.import.import.dialog.target');
    const submitLabel = useI18n('widget.import.import.dialog.submit');
    const keepLabel = useI18n('widget.import.import.dialog.keepPublishFirst');
    const resultNameLabel = useI18n('widget.import.export.dialog.result.name');
    const copyLabel = useI18n('field.contextPanel.details.sections.info.copy');

    const initialId = content?.getContentId().toString() ?? ROOT_ID;
    const initialItem = useMemo(() => content ?? createRootContent(), [content]);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [targetId, setTargetId] = useState<string | null>(initialId);
    const [keepPublishFirst, setKeepPublishFirst] = useState<boolean>(true);
    const [phase, setPhase] = useState<ImportPhase>({ kind: 'idle' });

    useEffect(() => {
        if (!open) return;
        setTargetId(initialId);
        setKeepPublishFirst(true);
        setPhase({ kind: 'idle' });
    }, [open, initialId]);

    const handleTargetChange = useCallback((id: string | null) => {
        setTargetId(id);
    }, []);

    const handleKeepChange = useCallback((checked: CheckboxChecked) => {
        setKeepPublishFirst(checked === true);
    }, []);

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (phase.kind === 'loading') return;
            if (!targetId) return;
            setPhase({ kind: 'loading' });

            const result = await importContent(targetId, exportName, { keepPublishFirst });

            result.match(
                (imported) => {
                    setPhase({ kind: 'success', result: imported });
                    onSuccess?.(imported);
                },
                (err) => {
                    setPhase({ kind: 'error', message: err.message });
                },
            );
        },
        [phase.kind, targetId, exportName, keepPublishFirst, onSuccess],
    );

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) onClose();
        },
        [onClose],
    );

    const handleOpenAutoFocus = useCallback((event: Event) => {
        event.preventDefault();
        inputRef.current?.focus();
    }, []);

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    className="w-full gap-5.5 h-fit py-5 px-3 sm:py-8 sm:px-6 max-w-full md:min-w-160 md:max-w-180"
                    data-component={IMPORT_CONTENT_IMPORT_DIALOG_NAME}
                    onOpenAutoFocus={handleOpenAutoFocus}
                >
                    <Dialog.Header className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
                        <Dialog.Title className="col-start-1 row-start-1 min-w-0 font-semibold text-xl">
                            {title}
                        </Dialog.Title>
                        <Dialog.DefaultClose className="col-start-2 row-start-1 self-start justify-self-end" />
                    </Dialog.Header>

                    {phase.kind === 'success' ? (
                        <ResultView
                            result={phase.result}
                            exportName={exportName}
                            nameLabel={resultNameLabel}
                            copyLabel={copyLabel}
                        />
                    ) : (
                        <form
                            className="contents"
                            onSubmit={(event) => {
                                void handleSubmit(event);
                            }}
                        >
                            <Dialog.Body className="flex flex-col gap-4 overflow-visible">
                                <div className="flex flex-col gap-2">
                                    <span className="text-base font-semibold">{sourceLabel}</span>
                                    <code className="text-sm font-mono break-all pl-5">{exportName}</code>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-base font-semibold">{targetLabel}</span>
                                    <PathSelector
                                        label={targetLabel}
                                        selectedId={targetId}
                                        initialItem={initialItem}
                                        hideWhenSelected
                                        disabled={phase.kind === 'loading'}
                                        inputRef={inputRef}
                                        onSelectionChange={handleTargetChange}
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={keepPublishFirst}
                                        onCheckedChange={handleKeepChange}
                                        disabled={phase.kind === 'loading'}
                                    />
                                    <span className="text-sm">{keepLabel}</span>
                                </label>
                                {phase.kind === 'error' && <span className="text-sm text-error">{phase.message}</span>}
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button
                                    type="submit"
                                    size="lg"
                                    variant="solid"
                                    label={submitLabel}
                                    startIcon={phase.kind === 'loading' ? LoaderCircle : FolderOutput}
                                    startIconClassName={phase.kind === 'loading' ? 'animate-spin' : undefined}
                                    disabled={phase.kind === 'loading' || !targetId}
                                />
                            </Dialog.Footer>
                        </form>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

ImportContentImportDialog.displayName = IMPORT_CONTENT_IMPORT_DIALOG_NAME;

type ResultViewProps = {
    result: ImportResult;
    exportName: string;
    nameLabel: string;
    copyLabel: string;
};

const ResultView = ({ result, exportName, nameLabel, copyLabel }: ResultViewProps): ReactElement => {
    const added = result.addedNodes?.length ?? 0;
    const updated = result.updatedNodes?.length ?? 0;
    const summary = i18n('widget.import.import.dialog.result.summary', added, updated);

    const copyExportName = (): void => {
        void navigator?.clipboard?.writeText(exportName);
    };

    return (
        <Dialog.Body className="flex flex-col gap-4 overflow-visible">
            <div className="flex flex-col gap-1">
                <span className="text-sm text-subtle">{nameLabel}</span>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono break-all pl-5">{exportName}</code>
                    <Tooltip value={copyLabel} side="left">
                        <IconButton
                            size="sm"
                            icon={Copy}
                            iconSize={14}
                            aria-label={copyLabel}
                            onClick={copyExportName}
                            className="shrink-0"
                        />
                    </Tooltip>
                </div>
            </div>
            <span className="text-sm text-subtle">{summary}</span>
        </Dialog.Body>
    );
};

ResultView.displayName = `${IMPORT_CONTENT_IMPORT_DIALOG_NAME}.Result`;
