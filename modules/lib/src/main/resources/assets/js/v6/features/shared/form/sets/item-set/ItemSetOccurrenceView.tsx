import {cn, ContextMenu, FilledOctagonAlert, usePortalFocusContainer} from '@enonic/ui';
import {forwardRef, type MouseEvent, type ReactElement, type ReactNode, useCallback, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {useCloseOnScroll} from '../../../../hooks/useCloseOnScroll';
import {useIsNewOccurrence, useSetOccurrenceLabel} from '../set-occurrence';
import {MoreVertical} from 'lucide-react';
import {SetConfirmDelete, SetConfirmOverlay, useConfirmPosition} from '../set-confirmation';
import {Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';

type ItemSetOccurrenceViewProps = {
    index: number;
    grip: ReactNode;
    propertySet: PropertySet;
    formItems: FormItem[];
    fallbackLabel: string;
    expanded: boolean;
    isNew?: boolean;
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

export const ItemSetOccurrenceView = forwardRef<HTMLDivElement, ItemSetOccurrenceViewProps>(
    (
        {
            index,
            grip,
            propertySet,
            formItems,
            fallbackLabel,
            expanded,
            isNew: isNewProp = false,
            canAdd,
            canRemove,
            occurrences,
            hasErrors,
            onAddAbove,
            onAddBelow,
            onToggle,
            onRemove,
            children,
        },
        ref
    ): ReactElement => {
        const anchorRef = useRef<HTMLDivElement>(null);
        const confirmationRef = useRef<HTMLDivElement>(null);

        const [confirmingDelete, setConfirmingDelete] = useState(false);
        const [menuOpen, setMenuOpen] = useState(false);

        const showHeader = occurrences.getMinimum() !== 1 || occurrences.getMaximum() !== 1;
        const label = useSetOccurrenceLabel(propertySet, formItems, fallbackLabel);
        const isNew = useIsNewOccurrence(isNewProp);
        const confirmationPosition = useConfirmPosition({
            enabled: confirmingDelete,
            anchorRef,
            confirmationRef,
        });

        useCloseOnScroll(menuOpen, () => setMenuOpen(false));
        usePortalFocusContainer(confirmationRef, confirmingDelete);

        const addAboveLabel = useI18n('action.addAbove');
        const addBelowLabel = useI18n('action.addBelow');
        const deleteLabel = useI18n('action.delete');
        const moreActionsLabel = useI18n('tooltip.moreActions');

        const handleAddAbove = useCallback(() => {
            onAddAbove(index);
        }, [onAddAbove, index]);
        const handleAddBelow = useCallback(() => {
            onAddBelow(index);
        }, [onAddBelow, index]);
        const handleRemove = useCallback(() => {
            if (propertySet.isEmpty()) {
                onRemove(index);
                return;
            }
            if (!expanded) onToggle(index);
            setConfirmingDelete(true);
        }, [propertySet, expanded, onToggle, index, onRemove]);
        const handleCancelDelete = useCallback(() => {
            setConfirmingDelete(false);
        }, []);
        const handleConfirmDelete = useCallback(() => {
            setConfirmingDelete(false);
            onRemove(index);
        }, [onRemove, index]);
        const handleDotsClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.currentTarget.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, clientX: e.clientX, clientY: e.clientY}));
        }, []);

        return (
            <div
                ref={ref}
                className={cn('w-full', isNew && 'animate-in fade-in duration-500')}
                data-component={ITEM_SET_OCCURRENCE_VIEW_NAME}
            >
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
                        <div
                            className={cn(
                                'group flex rounded border border-transparent',
                                expanded &&
                                    'bg-surface-selected rounded-bl-none rounded-br-none border-bdr-soft [&_svg:first-child]:text-alt',
                                expanded && menuOpen && 'bg-surface-selected-hover',
                                expanded && !menuOpen && 'hover:bg-surface-selected-hover',
                                !expanded && menuOpen && 'bg-surface-neutral-hover',
                                !expanded && !menuOpen && 'hover:bg-surface-neutral-hover'
                            )}
                            data-tone={expanded ? 'inverse' : undefined}
                        >
                            {grip && <div className="flex items-center justify-center pl-2.5">{grip}</div>}
                            <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
                                <ContextMenu.Trigger className="flex w-full">
                                    <div
                                        ref={anchorRef}
                                        className={cn(
                                            'grid flex-1 min-w-0 items-center grid-cols-[1fr_auto] rounded',
                                            expanded && 'text-alt rounded-b-none'
                                        )}
                                    >
                                        <button
                                            type="button"
                                            className={cn(
                                                'flex items-center gap-1.5 truncate text-left cursor-pointer min-w-0 p-2.5 pr-0',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                                            )}
                                            aria-expanded={expanded}
                                            onClick={() => onToggle(index)}
                                        >
                                            <span className="truncate font-semibold text-base">{label.primary}</span>
                                            {hasErrors && !expanded && <FilledOctagonAlert size={16} className="text-error shrink-0" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDotsClick}
                                            aria-label={moreActionsLabel}
                                            className="rounded cursor-pointer text-subtle hover:text-alt hover:bg-surface-selected group-data-[tone=inverse]:text-alt mr-2.5 my-1.5 p-2"
                                        >
                                            <MoreVertical size={20} absoluteStrokeWidth />
                                        </button>
                                    </div>
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
                        </div>
                    )}

                    {(expanded || !showHeader) && (
                        <div
                            className={cn('flex flex-col gap-7.5 border px-4 py-4 border-bdr-soft', showHeader ? 'border-t-0' : 'rounded')}
                        >
                            {children}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

ItemSetOccurrenceView.displayName = ITEM_SET_OCCURRENCE_VIEW_NAME;
