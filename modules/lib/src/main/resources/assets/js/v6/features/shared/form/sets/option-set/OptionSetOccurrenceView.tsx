import {cn, ContextMenu, FilledOctagonAlert, usePortalFocusContainer} from '@enonic/ui';
import {forwardRef, type MouseEvent, type ReactElement, type ReactNode, useCallback, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {useCloseOnScroll} from '../../../../hooks/useCloseOnScroll';
import {useIsNewOccurrence, useSetOccurrenceLabel} from '../set-occurrence';
import {ItemLabel} from '../../../ItemLabel';
import {MoreVertical} from 'lucide-react';
import {OptionSetConfirmAdd, SetConfirmDelete, SetConfirmOverlay, useConfirmPosition} from '../set-confirmation';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {isLockedSingleOccurrence} from './isLockedSingleOccurrence';
import {useOptionSetHasBody} from './useOptionSetHasBody';
import {useOptionSetSelection} from './useOptionSetSelection';

type OptionSetOccurrenceViewProps = {
    index: number;
    grip: ReactNode;
    propertySet: PropertySet;
    optionSet: FormOptionSet;
    formItems: FormItem[];
    fallbackLabel: string;
    expanded: boolean;
    isNew?: boolean;
    canAdd: boolean;
    canRemove: boolean;
    hasErrors: boolean;
    onAddAbove: (index: number, selectedName?: string) => void;
    onAddBelow: (index: number, selectedName?: string) => void;
    onToggle: (index: number) => void;
    onRemove: (index: number) => void;
    onReset?: (index: number) => void;
    children: ReactNode;
};

const OPTION_SET_OCCURRENCE_VIEW_NAME = 'OptionSetOccurrenceView';

export const OptionSetOccurrenceView = forwardRef<HTMLDivElement, OptionSetOccurrenceViewProps>(
    (
        {
            index,
            grip,
            propertySet,
            optionSet,
            formItems,
            fallbackLabel,
            expanded,
            isNew: isNewProp = false,
            canAdd,
            canRemove,
            hasErrors,
            onAddAbove,
            onAddBelow,
            onToggle,
            onRemove,
            onReset,
            children,
        },
        ref
    ): ReactElement => {
        const anchorRef = useRef<HTMLDivElement>(null);
        const confirmationRef = useRef<HTMLDivElement>(null);
        const isNew = useIsNewOccurrence(isNewProp);
        const hasBody = useOptionSetHasBody(optionSet, propertySet);
        const {selectedNames} = useOptionSetSelection(optionSet, propertySet);
        const canDelete = canRemove || (onReset != null && selectedNames.length > 0);
        const label = useSetOccurrenceLabel(propertySet, formItems, fallbackLabel);
        const addAboveLabel = useI18n('action.addAbove');
        const addBelowLabel = useI18n('action.addBelow');
        const deleteLabel = useI18n('action.delete');

        const [confirmingAdd, setConfirmingAdd] = useState<'above' | 'below' | null>(null);
        const [confirmingDelete, setConfirmingDelete] = useState(false);
        const [menuOpen, setMenuOpen] = useState(false);

        useCloseOnScroll(menuOpen, () => setMenuOpen(false));

        const isRadio = optionSet.isRadioSelection();
        const showHeader = !isLockedSingleOccurrence(optionSet);
        const showBody = expanded || !showHeader;
        const showExpandedChrome = expanded && hasBody;
        const isConfirming = confirmingDelete || confirmingAdd != null;
        const confirmationPosition = useConfirmPosition({enabled: isConfirming, anchorRef, confirmationRef});
        usePortalFocusContainer(confirmationRef, isConfirming);

        const handleRequestAddAbove = useCallback(() => {
            if (!isRadio) {
                onAddAbove(index);
                return;
            }
            setConfirmingAdd('above');
        }, [isRadio, onAddAbove, index]);
        const handleRequestAddBelow = useCallback(() => {
            if (!isRadio) {
                onAddBelow(index);
                return;
            }
            setConfirmingAdd('below');
        }, [isRadio, onAddBelow, index]);
        const handleCancelAdd = useCallback(() => {
            setConfirmingAdd(null);
        }, []);
        const handleConfirmAdd = useCallback(
            (selectedName: string) => {
                const mode = confirmingAdd;
                setConfirmingAdd(null);
                if (mode === 'above') onAddAbove(index, selectedName);
                else if (mode === 'below') onAddBelow(index, selectedName);
            },
            [confirmingAdd, onAddAbove, onAddBelow, index]
        );
        const handleToggle = useCallback(() => {
            if (!hasBody) return;
            onToggle(index);
        }, [hasBody, onToggle, index]);
        const handleRemove = useCallback(() => {
            if (!canDelete) return;
            if (!expanded) onToggle(index);
            setConfirmingDelete(true);
        }, [canDelete, expanded, onToggle, index]);
        const handleCancelDelete = useCallback(() => {
            setConfirmingDelete(false);
        }, []);
        const handleConfirmDelete = useCallback(() => {
            setConfirmingDelete(false);
            if (canRemove) {
                onRemove(index);
            } else {
                onReset?.(index);
            }
        }, [canRemove, onRemove, onReset, index]);
        const handleDotsClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.currentTarget.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, clientX: e.clientX, clientY: e.clientY}));
        }, []);

        return (
            <div ref={ref} className={cn('w-full', isNew && 'animate-in fade-in duration-500')} data-component={OPTION_SET_OCCURRENCE_VIEW_NAME}>
                {isConfirming && <SetConfirmOverlay />}

                <div
                    className={cn(
                        isConfirming && 'pointer-events-none select-none',
                        confirmingDelete && 'relative z-40 bg-surface-neutral'
                    )}
                    inert={isConfirming}
                >
                    {confirmingDelete && (
                        <SetConfirmDelete
                            ref={confirmationRef}
                            position={confirmationPosition}
                            onCancel={handleCancelDelete}
                            onConfirm={handleConfirmDelete}
                        />
                    )}

                    {confirmingAdd && (
                        <OptionSetConfirmAdd
                            ref={confirmationRef}
                            position={confirmationPosition}
                            optionSet={optionSet}
                            onCancel={handleCancelAdd}
                            onConfirm={handleConfirmAdd}
                        />
                    )}

                    {showHeader && (
                        <div
                            className={cn(
                                'group flex rounded border border-transparent',
                                showExpandedChrome &&
                                    'bg-surface-selected border-bdr-soft rounded-bl-none rounded-br-none [&_svg:first-child]:text-alt',
                                showExpandedChrome && menuOpen && 'bg-surface-selected-hover',
                                showExpandedChrome && !menuOpen && 'hover:bg-surface-selected-hover',
                                !showExpandedChrome && menuOpen && 'bg-surface-neutral-hover',
                                !showExpandedChrome && !menuOpen && 'hover:bg-surface-neutral-hover'
                            )}
                            data-tone={showExpandedChrome && 'inverse'}
                        >
                            {grip && <div className="flex items-center justify-center pl-2.5">{grip}</div>}
                            <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
                                <ContextMenu.Trigger className="flex w-full">
                                    <div
                                        ref={anchorRef}
                                        className={cn(
                                            'grid flex-1 min-w-0 items-center grid-cols-[1fr_auto] rounded',
                                            showExpandedChrome && 'text-alt rounded-b-none'
                                        )}
                                    >
                                        <button
                                            type="button"
                                            className={cn(
                                                'flex items-center gap-1.5 truncate text-left min-w-0 p-2.5 pr-0',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                                                hasBody ? 'cursor-pointer' : 'cursor-default'
                                            )}
                                            aria-expanded={hasBody ? expanded : undefined}
                                            onClick={handleToggle}
                                        >
                                            <ItemLabel
                                                icon={null}
                                                primary={label.primary}
                                                secondary={label.secondary}
                                                className="min-w-0"
                                            />
                                            {hasErrors && !expanded && <FilledOctagonAlert size={16} className="text-error shrink-0" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDotsClick}
                                            className="cursor-pointer text-subtle hover:text-main group-data-[tone=inverse]:text-alt p-2.5 pl-0"
                                        >
                                            <MoreVertical size={20} absoluteStrokeWidth />
                                        </button>
                                    </div>
                                </ContextMenu.Trigger>

                                <ContextMenu.Portal>
                                    <ContextMenu.Content>
                                        <ContextMenu.Item disabled={!canAdd} onClick={handleRequestAddAbove}>
                                            <span>{addAboveLabel}</span>
                                        </ContextMenu.Item>
                                        <ContextMenu.Item disabled={!canAdd} onClick={handleRequestAddBelow}>
                                            <span>{addBelowLabel}</span>
                                        </ContextMenu.Item>
                                        <ContextMenu.Item disabled={!canDelete} onClick={handleRemove}>
                                            <span>{deleteLabel}</span>
                                        </ContextMenu.Item>
                                    </ContextMenu.Content>
                                </ContextMenu.Portal>
                            </ContextMenu>
                        </div>
                    )}

                    {showBody && hasBody && (
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

OptionSetOccurrenceView.displayName = OPTION_SET_OCCURRENCE_VIEW_NAME;
