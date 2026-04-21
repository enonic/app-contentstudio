import {cn, ContextMenu, FilledOctagonAlert, usePortalFocusContainer} from '@enonic/ui';
import {type ReactElement, type ReactNode, useCallback, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {useSetOccurrenceLabel} from '../set-occurrence/';
import {ItemLabel} from '../../../ItemLabel';
import {ChevronRight} from 'lucide-react';
import {OptionSetConfirmAdd, SetConfirmDelete, SetConfirmOverlay, useConfirmPosition} from '../set-confirmation';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';

type OptionSetOccurrenceViewProps = {
    index: number;
    grip: ReactNode;
    propertySet: PropertySet;
    optionSet: FormOptionSet;
    formItems: FormItem[];
    fallbackLabel: string;
    expanded: boolean;
    canAdd: boolean;
    canRemove: boolean;
    hasErrors: boolean;
    onAddAbove: (index: number, selectedName?: string) => void;
    onAddBelow: (index: number, selectedName?: string) => void;
    onToggle: (index: number) => void;
    onRemove: (index: number) => void;
    children: ReactNode;
};

const OPTION_SET_OCCURRENCE_VIEW_NAME = 'OptionSetOccurrenceView';

export const OptionSetOccurrenceView = ({
    index,
    grip,
    propertySet,
    optionSet,
    formItems,
    fallbackLabel,
    expanded,
    canAdd,
    canRemove,
    hasErrors,
    onAddAbove,
    onAddBelow,
    onToggle,
    onRemove,
    children,
}: OptionSetOccurrenceViewProps): ReactElement => {
    const occurrences = optionSet.getOccurrences();
    const showHeader = occurrences.getMinimum() !== 1 || occurrences.getMaximum() !== 1;
    const label = useSetOccurrenceLabel(propertySet, formItems, fallbackLabel);
    const [confirmingAdd, setConfirmingAdd] = useState<'above' | 'below' | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const confirmationRef = useRef<HTMLDivElement>(null);
    const isConfirming = confirmingDelete || confirmingAdd != null;
    const confirmationPosition = useConfirmPosition({enabled: isConfirming, anchorRef, confirmationRef});
    usePortalFocusContainer(confirmationRef, isConfirming);

    const addAboveLabel = useI18n('action.addAbove');
    const addBelowLabel = useI18n('action.addBelow');
    const deleteLabel = useI18n('action.delete');

    const isRadio = optionSet.isRadioSelection();
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
        <div className="w-full" data-component={OPTION_SET_OCCURRENCE_VIEW_NAME}>
            {isConfirming && <SetConfirmOverlay />}

            <div
                className={cn(isConfirming && 'pointer-events-none select-none', confirmingDelete && 'relative z-40 bg-surface-neutral')}
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
                    <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
                        <ContextMenu.Trigger>
                            <button
                                ref={anchorRef}
                                type="button"
                                data-tone={expanded ? 'inverse' : undefined}
                                className={cn(
                                    'group grid items-center gap-2.5 p-2.5 w-full cursor-pointer',
                                    grip ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]',
                                    expanded
                                        ? cn(
                                              'rounded border bg-surface-selected rounded-bl-none rounded-br-none text-alt border-bdr-soft [&_svg:first-child]:text-alt',
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
                                    <ItemLabel icon={null} primary={label.primary} secondary={label.secondary} className="min-w-0" />
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
                                <ContextMenu.Item disabled={!canAdd} onClick={handleRequestAddAbove}>
                                    <span>{addAboveLabel}</span>
                                </ContextMenu.Item>
                                <ContextMenu.Item disabled={!canAdd} onClick={handleRequestAddBelow}>
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

OptionSetOccurrenceView.displayName = OPTION_SET_OCCURRENCE_VIEW_NAME;
