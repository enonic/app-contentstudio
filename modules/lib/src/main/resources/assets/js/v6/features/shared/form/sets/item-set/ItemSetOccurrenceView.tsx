import {cn, ContextMenu, FilledOctagonAlert, usePortalFocusContainer} from '@enonic/ui';
import {type ReactElement, type ReactNode, useCallback, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {useSetOccurrenceLabel} from '../set-occurrence';
import {ChevronRight} from 'lucide-react';
import {SetConfirmDelete, SetConfirmOverlay, useConfirmPosition} from '../set-confirmation';
import {Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';

type ItemSetOccurrenceViewProps = {
    index: number;
    grip: ReactNode;
    propertySet: PropertySet;
    formItems: FormItem[];
    fallbackLabel: string;
    expanded: boolean;
    canAdd: boolean;
    canRemove: boolean;
    occurrences: Occurrences;
    hasErrors: boolean;
    onAddAbove: (index: number) => void;
    onAddBelow: (index: number) => void;
    onToggle: (index: number) => void;
    onRemove: (index: number) => void;
    children: ReactNode;
};

const ITEM_SET_OCCURRENCE_VIEW_NAME = 'ItemSetOccurrenceView';

export const ItemSetOccurrenceView = ({
    index,
    grip,
    propertySet,
    formItems,
    fallbackLabel,
    expanded,
    canAdd,
    canRemove,
    occurrences,
    hasErrors,
    onAddAbove,
    onAddBelow,
    onToggle,
    onRemove,
    children,
}: ItemSetOccurrenceViewProps): ReactElement => {
    const showHeader = occurrences.getMinimum() !== 1 || occurrences.getMaximum() !== 1;
    const label = useSetOccurrenceLabel(propertySet, formItems, fallbackLabel);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const confirmationRef = useRef<HTMLDivElement>(null);
    const confirmationPosition = useConfirmPosition({
        enabled: confirmingDelete,
        anchorRef,
        confirmationRef,
    });
    usePortalFocusContainer(confirmationRef, confirmingDelete);

    const addAboveLabel = useI18n('action.addAbove');
    const addBelowLabel = useI18n('action.addBelow');
    const deleteLabel = useI18n('action.delete');

    const handleAddAbove = useCallback(() => {
        onAddAbove(index);
    }, [onAddAbove, index]);
    const handleAddBelow = useCallback(() => {
        onAddBelow(index);
    }, [onAddBelow, index]);
    const handleRemove = useCallback(() => {
        if (!expanded) onToggle(index);
        setConfirmingDelete(true);
    }, [expanded, onToggle, index]);
    const handleCancelDelete = useCallback(() => {
        setConfirmingDelete(false);
    }, []);
    const handleConfirmDelete = useCallback(() => {
        setConfirmingDelete(false);
        onRemove(index);
    }, [onRemove, index]);

    return (
        <div className="w-full" data-component={ITEM_SET_OCCURRENCE_VIEW_NAME}>
            {confirmingDelete && <SetConfirmOverlay />}

            <div
                className={cn(confirmingDelete && 'relative z-40 bg-surface-neutral pointer-events-none select-none')}
                inert={confirmingDelete}
            >
                {confirmingDelete && (
                    <SetConfirmDelete
                        ref={confirmationRef}
                        position={confirmationPosition}
                        onCancel={handleCancelDelete}
                        onConfirm={handleConfirmDelete}
                    />
                )}

                {showHeader && (
                    <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
                        <ContextMenu.Trigger>
                            <button
                                ref={anchorRef}
                                type="button"
                                className={cn(
                                    'grid items-center gap-2.5 p-2.5 w-full cursor-pointer',
                                    grip ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]',
                                    expanded
                                        ? cn(
                                              'rounded border bg-surface-selected rounded-bl-none rounded-br-none border-bdr-soft text-alt [&_svg:first-child]:text-alt',
                                              menuOpen ? 'bg-surface-selected-hover' : 'hover:bg-surface-selected-hover'
                                          )
                                        : menuOpen
                                          ? 'bg-surface-neutral-hover'
                                          : 'hover:bg-surface-neutral-hover'
                                )}
                                aria-expanded={expanded}
                                onClick={() => onToggle(index)}
                            >
                                {grip}
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="truncate font-semibold text-left text-base">{label.primary}</span>
                                    {hasErrors && !expanded && <FilledOctagonAlert size={16} className="text-error shrink-0" />}
                                </div>
                                <ChevronRight
                                    size={30}
                                    absoluteStrokeWidth
                                    className={cn('shrink-0 transition-transform', expanded ? '-rotate-90' : 'rotate-90')}
                                />
                            </button>
                        </ContextMenu.Trigger>

                        <ContextMenu.Portal>
                            <ContextMenu.Content>
                                <ContextMenu.Item disabled={!canAdd} onClick={handleAddAbove}>
                                    <span>{addAboveLabel}</span>
                                </ContextMenu.Item>
                                <ContextMenu.Item disabled={!canAdd} onClick={handleAddBelow}>
                                    <span>{addBelowLabel}</span>
                                </ContextMenu.Item>
                                <ContextMenu.Item disabled={!canRemove} onClick={handleRemove}>
                                    <span>{deleteLabel}</span>
                                </ContextMenu.Item>
                            </ContextMenu.Content>
                        </ContextMenu.Portal>
                    </ContextMenu>
                )}

                {(expanded || !showHeader) && (
                    <div className={cn('flex flex-col gap-7.5 border px-4 py-4 border-bdr-soft', showHeader ? 'border-t-0' : 'rounded')}>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

ItemSetOccurrenceView.displayName = ITEM_SET_OCCURRENCE_VIEW_NAME;
