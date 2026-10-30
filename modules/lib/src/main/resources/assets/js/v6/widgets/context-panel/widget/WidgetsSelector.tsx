import { Button, cn, Combobox, Listbox, Menu } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ChevronDown } from 'lucide-react';
import {
    type FocusEvent,
    type KeyboardEvent,
    type ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { focusContextPanelTarget } from '../../../shared/lib/dom/contextPanelFocus';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import type { ContextWidget } from '../model/contextWidget.types';
import { $activeWidget, $contextWidgets, setActiveWidget } from '../model/contextWidgets.store';
import { WidgetIcon } from '../ui/WidgetIcon';

const WIDGETS_SELECTOR_NAME = 'WidgetsSelector';
const TOOLBAR_HANDLED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Escape']);

const stopToolbarKeyHandling = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (TOOLBAR_HANDLED_KEYS.has(event.key)) {
        event.stopPropagation();
    }
};

const toSelectorId = (widget: ContextWidget): string => widget.key.replace(/[.:]/g, '-');

const findBySelectorId = (widgets: readonly ContextWidget[], id: string | undefined): ContextWidget | undefined =>
    widgets.find((widget) => toSelectorId(widget) === id);

type SelectionState = {
    widgets: readonly ContextWidget[];
    selectedWidget: ContextWidget | undefined;
    selection: readonly string[];
    onSelect: (selection: readonly string[]) => void;
};

function useWidgetSelection(): SelectionState {
    const widgets = useStore($contextWidgets);
    const selectedWidget = useStore($activeWidget);

    const selection = useMemo(() => (selectedWidget ? [toSelectorId(selectedWidget)] : []), [selectedWidget]);

    const onSelect = useCallback((next: readonly string[]) => {
        if (next.length === 0) return;

        const widget = findBySelectorId($contextWidgets.get(), next[0]);
        if (widget) setActiveWidget(widget.key);
    }, []);

    return { widgets, selectedWidget, selection, onSelect };
}

function WidgetOption({ widget }: { widget: ContextWidget }): ReactElement {
    return (
        <>
            <WidgetIcon widget={widget} className="size-6 shrink-0" />
            <div className="flex flex-col overflow-hidden">
                <span className="leading-5.5 font-semibold truncate group-data-[tone=inverse]:text-alt">
                    {widget.title}
                </span>
                <small className="leading-4.5 text-sm text-subtle truncate group-data-[state=checked]:text-alt group-data-[tone=inverse]:text-alt">
                    {widget.description}
                </small>
            </div>
        </>
    );
}

//
// * WidgetsSelectorMenu
//

export type WidgetsSelectorMenuProps = {
    className?: string;
};

export const WidgetsSelectorMenu = ({ className }: WidgetsSelectorMenuProps): ReactElement => {
    const { widgets, selectedWidget, selection, onSelect } = useWidgetSelection();
    const placeholder = useI18n('field.option.placeholder');
    const notFoundLabel = useI18n('field.contextPanel.selector.notfound');

    return (
        <div data-component={WIDGETS_SELECTOR_NAME} className={cn('flex h-full min-w-0 items-center', className)}>
            <Menu>
                <Menu.Trigger asChild onKeyDown={stopToolbarKeyHandling}>
                    <Button
                        className="w-fit px-2 gap-2 min-w-0 justify-start"
                        size="sm"
                        endIcon={ChevronDown}
                        endIconClassName="size-5 shrink-0"
                    >
                        {selectedWidget && (
                            <WidgetIcon widget={selectedWidget} strokeWidth={1.5} className="size-5 shrink-0 mr-2" />
                        )}
                        <span className="truncate">{selectedWidget?.title || placeholder}</span>
                    </Button>
                </Menu.Trigger>
                <Menu.Portal>
                    <Menu.Content className="max-h-60 overflow-y-auto">
                        {widgets.length > 0 ? (
                            <Menu.RadioGroup
                                value={selection[0] ?? ''}
                                onValueChange={(id) => onSelect([id])}
                                closeOnSelect
                            >
                                {widgets.map((widget) => {
                                    const id = toSelectorId(widget);

                                    return (
                                        <Menu.RadioItem key={id} value={id}>
                                            <WidgetOption widget={widget} />
                                        </Menu.RadioItem>
                                    );
                                })}
                            </Menu.RadioGroup>
                        ) : (
                            <div className="px-4 py-3 text-sm text-subtle">{notFoundLabel}</div>
                        )}
                    </Menu.Content>
                </Menu.Portal>
            </Menu>
        </div>
    );
};

WidgetsSelectorMenu.displayName = 'WidgetsSelectorMenu';

//
// * WidgetsSelector
//

export type WidgetsSelectorProps = {
    className?: string;
};

export const WidgetsSelector = ({ className }: WidgetsSelectorProps): ReactElement => {
    const { widgets, selectedWidget, selection, onSelect } = useWidgetSelection();
    const placeholder = useI18n('field.option.placeholder');
    const notFoundLabel = useI18n('field.contextPanel.selector.notfound');

    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState<string | undefined>();

    const filteredWidgets = useMemo(() => {
        if (!isOpen || !searchValue) return widgets;

        const needle = searchValue.toLowerCase();
        return widgets.filter((widget) => widget.title.toLowerCase().includes(needle));
    }, [isOpen, searchValue, widgets]);

    const inputValue = isOpen ? searchValue : selectedWidget?.title;

    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);

        if (!open) {
            setSearchValue(undefined);
        }
    }, []);

    const handleInputFocus = useCallback(
        (event: FocusEvent<HTMLInputElement>): void => {
            if (!isOpen && event.currentTarget.value) {
                event.currentTarget.select();
            }
        },
        [isOpen],
    );

    const handleInputKeyDownCapture = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (isOpen || event.key !== 'ArrowUp' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (focusContextPanelTarget('toggle')) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    useEffect(() => setSearchValue(undefined), [selection]);

    return (
        <div data-component={WIDGETS_SELECTOR_NAME} className={cn('h-15 border-b border-bdr-soft p-1.5', className)}>
            <Combobox.Root
                value={inputValue}
                onChange={setSearchValue}
                onOpenChange={handleOpenChange}
                selection={selection}
                onSelectionChange={onSelect}
                closeOnBlur={true}
            >
                <Combobox.Content className="w-full h-12">
                    <Combobox.Control className="border-none">
                        <Combobox.Search className="relative">
                            {selectedWidget && !isOpen && (
                                <div className="pointer-events-none flex items-center absolute inset-y-0 left-4.5">
                                    <WidgetIcon widget={selectedWidget} className="shrink-0 size-4" />
                                </div>
                            )}
                            <Combobox.Input
                                data-context-panel-selector
                                placeholder={placeholder}
                                onFocus={handleInputFocus}
                                onKeyDownCapture={handleInputKeyDownCapture}
                                className={cn(selectedWidget && !isOpen && 'font-semibold pl-10')}
                            />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>
                    <Combobox.Popup>
                        <Listbox.Content className="max-h-60 rounded-sm">
                            {filteredWidgets.length > 0 ? (
                                filteredWidgets.map((widget) => {
                                    const id = toSelectorId(widget);

                                    return (
                                        <Listbox.Item key={id} value={id}>
                                            <WidgetOption widget={widget} />
                                        </Listbox.Item>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-3 text-sm text-subtle">{notFoundLabel}</div>
                            )}
                        </Listbox.Content>
                    </Combobox.Popup>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

WidgetsSelector.displayName = WIDGETS_SELECTOR_NAME;
