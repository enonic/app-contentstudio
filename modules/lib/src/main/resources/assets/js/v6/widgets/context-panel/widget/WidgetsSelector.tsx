import { Button, cn, Combobox, Listbox, Menu } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ChevronDown } from 'lucide-react';
import { createPortal, useCallback, useEffect, useMemo, useState, type FocusEvent, type KeyboardEvent } from 'react';
import type { ExtensionView } from '../../../../app/view/context/ExtensionView';
import { $contextPanelMode, $isContextOpen } from '../../../shared/app-state/browsePanels.store';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { WidgetIcon } from '../../../shared/ui/icons/WidgetIcon';
import { LegacyElement } from '../../../shared/ui/LegacyElement';

type WidgetsSelectorProps = {
    widgetViews?: ExtensionView[];
    externalSelectedWidgetView?: ExtensionView;
    mobileToolbarTarget?: HTMLElement;
};

type SelectorViewProps = {
    widgetViews: ExtensionView[];
    selectedWidgetView?: ExtensionView;
    selectedWidgetKey: readonly string[];
    onSelect: (selectedWidgetKey: readonly string[]) => void;
};

const WIDGETS_SELECTOR_NAME = 'WidgetsSelector';
const TOOLBAR_HANDLED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Escape']);

const stopToolbarKeyHandling = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (TOOLBAR_HANDLED_KEYS.has(event.key)) {
        event.stopPropagation();
    }
};

function WidgetOption({ widgetView }: { widgetView: ExtensionView }) {
    return (
        <>
            <WidgetIcon widgetView={widgetView} className="size-6 shrink-0" />
            <div className="flex flex-col overflow-hidden">
                <span className="leading-5.5 font-semibold truncate group-data-[tone=inverse]:text-alt">
                    {widgetView.getExtensionName()}
                </span>
                <small className="leading-4.5 text-sm text-subtle truncate group-data-[state=checked]:text-alt group-data-[tone=inverse]:text-alt">
                    {widgetView.getExtensionDescription()}
                </small>
            </div>
        </>
    );
}

export const WidgetsSelector = ({
    widgetViews = [],
    externalSelectedWidgetView = undefined,
    mobileToolbarTarget,
}: WidgetsSelectorProps) => {
    const mode = useStore($contextPanelMode);
    const isContextOpen = useStore($isContextOpen);
    const [selectedWidgetKey, setSelectedWidgetKey] = useState<readonly string[]>([]);
    const selectedWidgetView = useMemo(
        () => getWidgetViewFromKey(widgetViews, selectedWidgetKey?.[0]),
        [widgetViews, selectedWidgetKey],
    );
    const mobileToolbarTargetElement = mode === 'mobile' && isContextOpen ? mobileToolbarTarget : undefined;

    // TODO: Enonic UI - backwards compatibility due to the active widget being handled by ContextView
    useEffect(() => {
        if (!externalSelectedWidgetView) return;

        const key = getWidgetKeyForSelector(externalSelectedWidgetView);

        handleSelectionChange([key]);
    }, [externalSelectedWidgetView]);

    const handleSelectionChange = useCallback(
        (selectedWidgetKey: readonly string[]) => {
            // Unable to deselect a widget
            if (selectedWidgetKey.length === 0) return;

            const key = selectedWidgetKey[0];

            setSelectedWidgetKey([key]);
            getWidgetViewFromKey(widgetViews, key)?.setActive();
        },
        [widgetViews],
    );

    const viewProps: SelectorViewProps = {
        widgetViews,
        selectedWidgetView,
        selectedWidgetKey,
        onSelect: handleSelectionChange,
    };

    return mobileToolbarTargetElement ? (
        createPortal(<WidgetsSelectorMenu {...viewProps} />, mobileToolbarTargetElement)
    ) : (
        <WidgetsSelectorCombobox {...viewProps} />
    );
};

WidgetsSelector.displayName = WIDGETS_SELECTOR_NAME;

function WidgetsSelectorMenu({ widgetViews, selectedWidgetView, selectedWidgetKey, onSelect }: SelectorViewProps) {
    const placeholder = useI18n('field.option.placeholder');
    const notFoundLabel = useI18n('field.contextPanel.selector.notfound');
    const selectedWidgetLabel = selectedWidgetView?.getExtensionName();

    return (
        <div data-component={WIDGETS_SELECTOR_NAME} className="flex h-full min-w-0 items-center">
            <Menu>
                <Menu.Trigger asChild onKeyDown={stopToolbarKeyHandling}>
                    <Button
                        className="w-fit px-2 gap-2 min-w-0 justify-start"
                        size="sm"
                        endIcon={ChevronDown}
                        endIconClassName="size-5 shrink-0"
                    >
                        {selectedWidgetView && (
                            <WidgetIcon
                                widgetView={selectedWidgetView}
                                strokeWidth={1.5}
                                className="size-5 shrink-0 mr-2"
                            />
                        )}
                        <span className="truncate">{selectedWidgetLabel || placeholder}</span>
                    </Button>
                </Menu.Trigger>
                <Menu.Portal>
                    <Menu.Content className="max-h-60 overflow-y-auto">
                        {widgetViews.length > 0 ? (
                            <Menu.RadioGroup
                                value={selectedWidgetKey[0] ?? ''}
                                onValueChange={(key) => onSelect([key])}
                                closeOnSelect
                            >
                                {widgetViews.map((widgetView) => {
                                    const key = getWidgetKeyForSelector(widgetView);

                                    return (
                                        <Menu.RadioItem key={key} value={key}>
                                            <WidgetOption widgetView={widgetView} />
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
}

function WidgetsSelectorCombobox({ widgetViews, selectedWidgetView, selectedWidgetKey, onSelect }: SelectorViewProps) {
    const placeholder = useI18n('field.option.placeholder');
    const notFoundLabel = useI18n('field.contextPanel.selector.notfound');
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState<string | undefined>();
    const filteredWidgetViews = useMemo(() => {
        if (!isOpen || !searchValue) return widgetViews;

        return widgetViews.filter((widgetView) =>
            widgetView.getExtensionName().toLowerCase().includes(searchValue.toLowerCase()),
        );
    }, [isOpen, searchValue, widgetViews]);
    const selectedWidgetLabel = selectedWidgetView?.getExtensionName();
    const inputValue = isOpen ? searchValue : selectedWidgetLabel;

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

    useEffect(() => setSearchValue(undefined), [selectedWidgetKey]);

    return (
        <div data-component={WIDGETS_SELECTOR_NAME} className="h-15 border-b border-bdr-soft p-1.5">
            <Combobox.Root
                value={inputValue}
                onChange={setSearchValue}
                onOpenChange={handleOpenChange}
                selection={selectedWidgetKey}
                onSelectionChange={onSelect}
                closeOnBlur={true}
            >
                <Combobox.Content className="w-full h-12">
                    <Combobox.Control className="border-none">
                        <Combobox.Search className="relative">
                            {selectedWidgetView && !isOpen && (
                                <div className="pointer-events-none flex items-center absolute inset-y-0 left-4.5">
                                    <WidgetIcon widgetView={selectedWidgetView} className="shrink-0 size-4" />
                                </div>
                            )}
                            <Combobox.Input
                                placeholder={placeholder}
                                onFocus={handleInputFocus}
                                className={cn(selectedWidgetView && !isOpen && 'font-semibold pl-10')}
                            />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>
                    <Combobox.Popup>
                        <Listbox.Content className="max-h-60 rounded-sm">
                            {filteredWidgetViews.length > 0 ? (
                                filteredWidgetViews.map((widgetView) => {
                                    const key = getWidgetKeyForSelector(widgetView);

                                    return (
                                        <Listbox.Item key={key} value={key}>
                                            <WidgetOption widgetView={widgetView} />
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
}

// We need to convert the widget key to a string that is an valid id.
function getWidgetKeyForSelector(widgetView: ExtensionView): string {
    return widgetView.getExtensionKey().replace(/[.:]/g, '-');
}

function getWidgetViewFromKey(widgetViews: ExtensionView[], key: string): ExtensionView | undefined {
    return widgetViews.find((wv) => getWidgetKeyForSelector(wv) === key);
}

export default class WidgetsSelectorElement extends LegacyElement<typeof WidgetsSelector, WidgetsSelectorProps> {
    constructor(props: WidgetsSelectorProps) {
        super(props, WidgetsSelector);
    }

    // Backwards compatibility

    updateState(widgetView: ExtensionView): void {
        this.props.setKey('externalSelectedWidgetView', widgetView);
    }

    setMobileToolbarTarget(target?: HTMLElement): void {
        this.props.setKey('mobileToolbarTarget', target);
    }

    updateExtensionsSelector(widgetViews: ExtensionView[], selectedView?: ExtensionView): void {
        this.props.setKey('widgetViews', widgetViews);

        if (selectedView) {
            this.props.setKey('externalSelectedWidgetView', selectedView);
        }
    }
}
