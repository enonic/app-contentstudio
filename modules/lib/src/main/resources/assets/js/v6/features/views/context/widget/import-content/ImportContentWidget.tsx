import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { Button, IconButton, Input, RadioGroup, Separator, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { FolderInput, FolderOutput, RefreshCw, X } from 'lucide-react';
import Q from 'q';
import { type ChangeEvent, type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { type ContentSummaryAndCompareStatus } from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import { type ExtensionItemViewType } from '../../../../../../app/view/context/ExtensionItemView';
import { type ExportResult, fetchExports, type ImportResult } from '../../../../api/importContent';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { LegacyElement } from '../../../../../shared/ui/LegacyElement';
import { ContentLabel } from '../../../../shared/content/ContentLabel';
import { $contextContent } from '../../../../store/context/contextContent.store';
import { $activeWidgetId, $isContextOpen } from '../../../../store/contextWidgets.store';
import { IMPORT_CONTENT_WIDGET_KEY } from '../../../../../shared/lib/widget/import-content';
import { ImportContentExportDialog } from './ImportContentExportDialog';
import { ImportContentImportDialog } from './ImportContentImportDialog';

const IMPORT_CONTENT_WIDGET_NAME = 'ImportContentWidget';

type StatusKind = 'idle' | 'info' | 'error';
type Status = { kind: StatusKind; message: string };

const IDLE: Status = { kind: 'idle', message: '' };

const ImportContentWidget = (): ReactElement | null => {
    const isContextOpen = useStore($isContextOpen);
    const activeWidget = useStore($activeWidgetId);
    const content = useStore($contextContent);
    const isActiveWidget = activeWidget === IMPORT_CONTENT_WIDGET_KEY;

    const selectedSectionLabel = useI18n('widget.import.selected.label');
    const listHeadingLabel = useI18n('widget.import.list.heading');
    const emptyLabel = useI18n('widget.import.list.empty');
    const refreshLabel = useI18n('widget.import.list.refresh');
    const filterPlaceholder = useI18n('widget.import.list.filter');
    const clearFilterLabel = useI18n('widget.import.list.filter.clear');
    const exportLabel = useI18n('widget.import.export.button');
    const importLabel = useI18n('widget.import.button');
    const loadingLabel = useI18n('widget.import.status.loading');
    const listErrorLabel = useI18n('widget.import.status.error.list');

    const [exports, setExports] = useState<string[]>([]);
    const [selected, setSelected] = useState<string>('');
    const [filter, setFilter] = useState<string>('');
    const [busy, setBusy] = useState<'list' | 'export' | 'import' | null>(null);
    const [status, setStatus] = useState<Status>(IDLE);
    const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
    const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);

    const trimmedFilter = filter.trim();

    const visibleExports = useMemo(() => {
        const needle = trimmedFilter.toLowerCase();
        if (!needle) return exports;
        return exports.filter((name) => name.toLowerCase().includes(needle));
    }, [exports, trimmedFilter]);

    const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setFilter(event.currentTarget.value);
        setSelected('');
    }, []);

    const clearFilter = useCallback(() => {
        setFilter('');
        setSelected('');
    }, []);

    const contentId = content?.getContentId()?.toString();
    const hasContent = contentId != null;
    const canRender = isContextOpen && isActiveWidget;

    const refresh = useCallback(
        async (preserveSelected?: string) => {
            setBusy('list');
            setStatus({ kind: 'info', message: loadingLabel });
            const result = await fetchExports();
            result.match(
                (list) => {
                    setExports(list);
                    setSelected(preserveSelected && list.includes(preserveSelected) ? preserveSelected : '');
                    setStatus(IDLE);
                },
                (err) => {
                    setExports([]);
                    setSelected('');
                    setStatus({ kind: 'error', message: err.message || listErrorLabel });
                },
            );
            setBusy(null);
        },
        [loadingLabel, listErrorLabel],
    );

    useEffect(() => {
        setSelected('');
        setFilter('');
        setStatus(IDLE);
        setExportDialogOpen(false);
        setImportDialogOpen(false);
    }, [contentId]);

    useEffect(() => {
        if (!canRender) return;
        void refresh();
    }, [canRender, refresh]);

    const handleOpenExportDialog = useCallback(() => {
        setExportDialogOpen(true);
    }, []);

    const handleCloseExportDialog = useCallback(() => {
        setExportDialogOpen(false);
    }, []);

    const handleExportSuccess = useCallback(
        (exported: ExportResult) => {
            setStatus({ kind: 'info', message: i18n('widget.import.status.exported', exported.exportName) });
            void refresh(exported.exportName);
        },
        [refresh],
    );

    const handleOpenImportDialog = useCallback(() => {
        if (!selected) return;
        setImportDialogOpen(true);
    }, [selected]);

    const handleCloseImportDialog = useCallback(() => {
        setImportDialogOpen(false);
    }, []);

    const handleImportSuccess = useCallback((imported: ImportResult) => {
        const total = (imported.addedNodes?.length ?? 0) + (imported.updatedNodes?.length ?? 0);
        setStatus({ kind: 'info', message: i18n('widget.import.status.imported', total) });
    }, []);

    if (!canRender) return null;

    return (
        <div data-component={IMPORT_CONTENT_WIDGET_NAME} className="flex flex-col gap-6 h-full overflow-hidden p-1.5">
            {content && (
                <section className="flex flex-col gap-3 shrink-0">
                    <Separator label={selectedSectionLabel} />
                    <ContentLabel content={content} variant="normal" />
                    <Button
                        size="sm"
                        variant="outline"
                        label={exportLabel}
                        startIcon={FolderInput}
                        disabled={!hasContent || busy != null}
                        onClick={handleOpenExportDialog}
                        className="self-start"
                    />
                </section>
            )}

            <section className="flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex items-center gap-2 shrink-0">
                    <Separator label={listHeadingLabel} className="flex-1 min-w-0" />
                    <Tooltip delay={300} value={refreshLabel}>
                        <IconButton
                            variant="text"
                            icon={RefreshCw}
                            aria-label={refreshLabel}
                            disabled={busy != null}
                            onClick={() => void refresh(selected || undefined)}
                        />
                    </Tooltip>
                </div>

                <Input
                    type="text"
                    value={filter}
                    onChange={handleFilterChange}
                    placeholder={filterPlaceholder}
                    aria-label={filterPlaceholder}
                    className="shrink-0"
                    endAddon={
                        filter ? (
                            <button
                                type="button"
                                onClick={clearFilter}
                                aria-label={clearFilterLabel}
                                className="flex items-center justify-center px-3 text-subtle hover:text-main cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                            >
                                <X size={16} />
                            </button>
                        ) : undefined
                    }
                />

                {visibleExports.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-subtle border border-bdr-soft rounded-sm">
                        {trimmedFilter ? i18n('widget.import.list.empty.filtered', trimmedFilter) : emptyLabel}
                    </p>
                ) : (
                    <RadioGroup.Root
                        name="import-content-exports"
                        value={selected}
                        onValueChange={setSelected}
                        className="flex flex-col gap-1 border border-bdr-soft rounded-sm overflow-y-auto overflow-x-hidden p-1.5 flex-1 min-h-0"
                    >
                        {visibleExports.map((name) => (
                            <RadioGroup.Item
                                key={name}
                                value={name}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer hover:bg-surface-neutral-hover w-full min-w-0"
                            >
                                <RadioGroup.Indicator />
                                <Tooltip value={name} side="left" className="flex-1 min-w-0">
                                    <span className="font-mono text-sm text-left truncate block w-full">{name}</span>
                                </Tooltip>
                            </RadioGroup.Item>
                        ))}
                    </RadioGroup.Root>
                )}

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        size="sm"
                        variant="outline"
                        label={importLabel}
                        startIcon={FolderOutput}
                        disabled={!selected || busy != null}
                        onClick={handleOpenImportDialog}
                    />
                </div>

                {status.kind !== 'idle' && (
                    <span
                        className={`text-sm truncate shrink-0 ${status.kind === 'error' ? 'text-error' : 'text-subtle'}`}
                    >
                        {status.message}
                    </span>
                )}
            </section>

            {content && (
                <ImportContentExportDialog
                    open={exportDialogOpen}
                    content={content}
                    onClose={handleCloseExportDialog}
                    onSuccess={handleExportSuccess}
                />
            )}

            <ImportContentImportDialog
                open={importDialogOpen}
                content={content}
                exportName={selected}
                onClose={handleCloseImportDialog}
                onSuccess={handleImportSuccess}
            />
        </div>
    );
};

ImportContentWidget.displayName = IMPORT_CONTENT_WIDGET_NAME;

export class ImportContentWidgetElement
    extends LegacyElement<typeof ImportContentWidget>
    implements ExtensionItemViewType
{
    constructor() {
        super({}, ImportContentWidget);
    }

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentAndUpdateView(_item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        return Q();
    }

    public fetchExtensionContents(_url: string, _contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}

export { ImportContentWidget };
