import {Combobox, VirtualizedTreeList, cn} from '@enonic/ui';
import {forwardRef, Fragment, ReactNode, useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactElement} from 'react';
import type {VirtuosoHandle} from 'react-virtuoso';
import {Virtuoso} from 'react-virtuoso';
import {buildKey} from '../../utils/format/keys';

//
// * Types
//

export type LanguageSelectorOption = {
    id: string;
    label: string;
    disabled?: boolean;
};

export type LanguageSelectorProps = {
    options: LanguageSelectorOption[];
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    label?: string;
    disabled?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    usePortal?: boolean;
    className?: string;
};

type LanguageFlatNode = {
    id: string;
    data: LanguageSelectorOption;
    level: number;
    parentId: null;
    hasChildren: false;
    isExpanded: false;
    nodeType: 'node';
};

//
// * Constants
//

const LANGUAGE_SELECTOR_NAME = 'LanguageSelector';

const ROW_HEIGHT = 32;
const MAX_HEIGHT = 240;
const GAP = 6;
const PADDING = 8;

//
// * Virtuoso Components
//

const virtuosoComponents = {
    Scroller: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, className, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className={cn('rounded-sm *:p-1', className)}>
            {children}
        </div>
    )),
    List: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, className, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className={cn('flex flex-col gap-y-1.5', className)}>
            {children}
        </div>
    )),
};

//
// * Helpers
//

const toOptionKey = (value: string): string => buildKey(value);

const matchesQuery = (option: LanguageSelectorOption, normalizedQuery: string): boolean => {
    if (!normalizedQuery) {
        return true;
    }
    return option.label.toLowerCase().includes(normalizedQuery);
};

//
// * Component
//

export const LanguageSelector = ({
    label,
    options,
    selection,
    onSelectionChange,
    disabled = false,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    usePortal = false,
    className,
}: LanguageSelectorProps): ReactElement => {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);

    const selectedIds = selection ?? [];
    const safeSelection = useMemo(() => new Set(selectedIds.map(toOptionKey)), [selectedIds]);

    const optionMap = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
    const optionKeyMap = useMemo(() => {
        return new Map(options.map((option) => [toOptionKey(option.id), option.id]));
    }, [options]);
    const selectionDisplay = useMemo(() => {
        const selectedId = selectedIds[0];
        return selectedId ? optionMap.get(selectedId)?.label ?? selectedId : '';
    }, [selectedIds, optionMap]);

    useEffect(() => {
        if (!open) {
            setInputValue(selectionDisplay);
        }
    }, [open, selectionDisplay]);

    const visibleOptions = useMemo(() => {
        if (!open) {
            return options;
        }
        const normalizedQuery = inputValue.trim().toLowerCase();
        return options.filter((option) => matchesQuery(option, normalizedQuery));
    }, [open, options, inputValue]);

    // Convert options to flat nodes for VirtualizedTreeList
    const flatNodes = useMemo(
        (): LanguageFlatNode[] =>
            visibleOptions.map((option) => ({
                id: toOptionKey(option.id),
                data: option,
                level: 1,
                parentId: null,
                hasChildren: false,
                isExpanded: false,
                nodeType: 'node' as const,
            })),
        [visibleOptions]
    );

    // Calculate dynamic height
    const treeHeight = useMemo(() => {
        const count = flatNodes.length;
        const contentHeight = count * ROW_HEIGHT + Math.max(count - 1, 0) * GAP + PADDING;
        return Math.min(contentHeight, MAX_HEIGHT);
    }, [flatNodes.length]);

    // Reset active to first item when filtered list changes
    useEffect(() => {
        if (open) {
            const firstNode = flatNodes[0];
            if (firstNode) {
                const activeInList = activeId && flatNodes.some((node) => node.id === activeId);
                if (!activeInList) {
                    setActiveId(firstNode.id);
                }
            } else {
                setActiveId(null);
            }
        }
    }, [flatNodes, activeId, open]);

    const handleOpenChange = (next: boolean): void => {
        setOpen(next);
        if (next && !open) {
            setInputValue('');
            // Set initial active to first item
            const firstNode = flatNodes[0];
            if (firstNode) {
                setActiveId(firstNode.id);
            }
        }
    };

    const handleSelectionChange = (next: ReadonlySet<string>): void => {
        const nextArray = Array.from(next);
        const decodedSelection = nextArray.map((value) => optionKeyMap.get(value) ?? value);
        const selectedIds = decodedSelection.slice(0, 1);
        const selectedId = selectedIds[0];
        const nextDisplay = selectedId ? optionMap.get(selectedId)?.label ?? selectedId : '';

        setInputValue(nextDisplay);
        onSelectionChange(selectedIds);
        setOpen(false);
    };

    return (
        <div data-component={LANGUAGE_SELECTOR_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {label && <span className="text-md font-semibold text-subtle">{label}</span>}
            <Combobox.Root
                open={open}
                onOpenChange={handleOpenChange}
                value={inputValue}
                onChange={setInputValue}
                contentType="tree"
                closeOnBlur={false}
                disabled={disabled}
            >
                <Combobox.Content className="relative">
                    <Combobox.Control>
                        <Combobox.Search>
                            <Combobox.SearchIcon />
                            <Combobox.Input placeholder={searchPlaceholder ?? placeholder} aria-label={label} />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>
                    <ConditionalPortal usePortal={usePortal}>
                        <Combobox.Popup>
                            {flatNodes.length === 0 && emptyLabel ? (
                                <div className="px-4.5 py-2 text-sm text-subtle">{emptyLabel}</div>
                            ) : (
                                <Combobox.TreeContent style={{height: treeHeight}}>
                                    <VirtualizedTreeList
                                        items={flatNodes}
                                        preserveFilteredSelection
                                        clearSelectionOnEscape={false}
                                        selection={safeSelection}
                                        onSelectionChange={handleSelectionChange}
                                        selectionMode="single"
                                        active={activeId}
                                        onActiveChange={setActiveId}
                                        virtuosoRef={virtuosoRef}
                                        aria-label={label}
                                        className="h-full"
                                    >
                                        {({items, getItemProps, containerProps}) => (
                                            <Virtuoso<LanguageFlatNode>
                                                ref={virtuosoRef}
                                                data={items as LanguageFlatNode[]}
                                                components={virtuosoComponents}
                                                {...containerProps}
                                                className={cn('h-full', containerProps.className)}
                                                itemContent={(index, node) => {
                                                    const itemProps = getItemProps(index, node);
                                                    return (
                                                        <VirtualizedTreeList.Row {...itemProps}>
                                                            <VirtualizedTreeList.RowContent>
                                                                <span className="text-sm font-medium group-data-[tone=inverse]:text-alt">
                                                                    {node.data.label}
                                                                </span>
                                                            </VirtualizedTreeList.RowContent>
                                                        </VirtualizedTreeList.Row>
                                                    );
                                                }}
                                            />
                                        )}
                                    </VirtualizedTreeList>
                                </Combobox.TreeContent>
                            )}
                        </Combobox.Popup>
                    </ConditionalPortal>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

LanguageSelector.displayName = LANGUAGE_SELECTOR_NAME;

//
// * Utility
//

const ConditionalPortal = ({usePortal, children}: {usePortal: boolean; children: ReactNode}): ReactElement => {
    if (usePortal) {
        return <Combobox.Portal>{children}</Combobox.Portal>;
    }
    return <Fragment>{children}</Fragment>;
};
