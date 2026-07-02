import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { Button, Dialog, IconButton, Input, Tooltip } from '@enonic/ui';
import { Copy, FolderInput, LoaderCircle } from 'lucide-react';
import { type ChangeEvent, type FormEvent, type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import type { ContentSummary } from '../../../../../../app/content/ContentSummary';
import { exportContent, type ExportResult } from '../../../../api/importContent';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { ContentLabel } from '../../../../shared/content/ContentLabel';

const IMPORT_CONTENT_EXPORT_DIALOG_NAME = 'ImportContentExportDialog';

type ExportPhase =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'success'; result: ExportResult }
    | { kind: 'error'; message: string };

type ImportContentExportDialogProps = {
    open: boolean;
    content: ContentSummary;
    onClose: () => void;
    onSuccess?: (result: ExportResult) => void;
};

export const ImportContentExportDialog = ({
    open,
    content,
    onClose,
    onSuccess,
}: ImportContentExportDialogProps): ReactElement => {
    const title = useI18n('widget.import.export.dialog.title');
    const selectedLabel = useI18n('widget.import.selected.label');
    const nameLabel = useI18n('widget.import.export.dialog.name');
    const submitLabel = useI18n('widget.import.export.dialog.submit');
    const resultNameLabel = useI18n('widget.import.export.dialog.result.name');
    const copyLabel = useI18n('field.contextPanel.details.sections.info.copy');

    const defaultName = content.getName().toString();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [name, setName] = useState<string>(defaultName);
    const [phase, setPhase] = useState<ExportPhase>({ kind: 'idle' });

    const handleOpenAutoFocus = useCallback((event: Event) => {
        event.preventDefault();
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!open) return;
        setName(defaultName);
        setPhase({ kind: 'idle' });
    }, [open, defaultName]);

    const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setName(event.currentTarget.value);
    }, []);

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (phase.kind === 'loading') return;

            const contentId = content.getContentId().toString();
            const finalName = name.trim() || defaultName;
            setPhase({ kind: 'loading' });
            const result = await exportContent(contentId, { name: finalName });

            result.match(
                (exported) => {
                    setPhase({ kind: 'success', result: exported });
                    onSuccess?.(exported);
                },
                (err) => {
                    setPhase({ kind: 'error', message: err.message });
                },
            );
        },
        [phase.kind, content, name, defaultName, onSuccess],
    );

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) onClose();
        },
        [onClose],
    );

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    className="w-full gap-5.5 h-fit py-5 px-3 sm:py-8 sm:px-6 max-w-full md:max-w-120"
                    data-component={IMPORT_CONTENT_EXPORT_DIALOG_NAME}
                    onOpenAutoFocus={handleOpenAutoFocus}
                >
                    <Dialog.Header className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
                        <Dialog.Title className="col-start-1 row-start-1 min-w-0 font-semibold text-xl">
                            {title}
                        </Dialog.Title>
                        <Dialog.DefaultClose className="col-start-2 row-start-1 self-start justify-self-end" />
                    </Dialog.Header>

                    {phase.kind === 'success' ? (
                        <ResultView result={phase.result} nameLabel={resultNameLabel} copyLabel={copyLabel} />
                    ) : (
                        <form
                            className="contents"
                            onSubmit={(event) => {
                                void handleSubmit(event);
                            }}
                        >
                            <Dialog.Body className="flex flex-col gap-4 overflow-visible">
                                <div className="flex flex-col gap-2">
                                    <span className="text-base font-semibold">{selectedLabel}</span>
                                    <ContentLabel content={content} variant="normal" />
                                </div>
                                <Input
                                    ref={inputRef}
                                    label={nameLabel}
                                    value={name}
                                    placeholder={defaultName}
                                    onChange={handleNameChange}
                                    disabled={phase.kind === 'loading'}
                                />
                                {phase.kind === 'error' && <span className="text-sm text-error">{phase.message}</span>}
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button
                                    type="submit"
                                    size="lg"
                                    variant="solid"
                                    label={submitLabel}
                                    startIcon={phase.kind === 'loading' ? LoaderCircle : FolderInput}
                                    startIconClassName={phase.kind === 'loading' ? 'animate-spin' : undefined}
                                    disabled={phase.kind === 'loading'}
                                />
                            </Dialog.Footer>
                        </form>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

ImportContentExportDialog.displayName = IMPORT_CONTENT_EXPORT_DIALOG_NAME;

type ResultViewProps = {
    result: ExportResult;
    nameLabel: string;
    copyLabel: string;
};

const ResultView = ({ result, nameLabel, copyLabel }: ResultViewProps): ReactElement => {
    const nodeCount = result.exportedNodes?.length ?? 0;
    const nodesSummary = i18n('widget.import.export.dialog.result.nodes', nodeCount);

    const copyExportName = (): void => {
        void navigator?.clipboard?.writeText(result.exportName);
    };

    return (
        <Dialog.Body className="flex flex-col gap-4 overflow-visible">
            <div className="flex flex-col gap-1">
                <span className="text-sm text-subtle">{nameLabel}</span>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono break-all pl-5">{result.exportName}</code>
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
            <span className="text-sm text-subtle">{nodesSummary}</span>
        </Dialog.Body>
    );
};

ResultView.displayName = `${IMPORT_CONTENT_EXPORT_DIALOG_NAME}.Result`;
