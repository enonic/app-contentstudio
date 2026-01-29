import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {WidgetView} from '../../../../../app/view/context/WidgetView';
import {LegacyElement} from '../../../shared/LegacyElement';
import {Button, cn, Combobox, IconButton, Listbox} from '@enonic/ui';
import {WidgetIcon} from '../../../shared/icons/WidgetIcon';
import {useI18n} from '../../../hooks/useI18n';
import {ChevronDown} from 'lucide-react';

type WidgetsSelectorProps = {
    widgetViews?: WidgetView[];
    externalSelectedWidgetView?: WidgetView;
};

type WidgetsSelectorItemProps = {
    widgetView?: WidgetView;
    secondary?: boolean;
};

const WIDGETS_SELECTOR_NAME = 'WidgetsSelector';

const WidgetsSelector = ({widgetViews = [], externalSelectedWidgetView = undefined}: WidgetsSelectorProps) => {
    const placeholder = useI18n('field.option.placeholder');
    const notFoundLabel = useI18n('field.contextPanel.selector.notfound');
    const [searchValue, setSearchValue] = useState<string | undefined>();
    const [selectedWidgetKey, setSelectedWidgetKey] = useState<readonly string[]>([]);
    const [isComboboxOpen, setIsComboboxOpen] = useState<boolean>(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const filteredWidgetViews = useMemo(() => {
        if (!searchValue) return widgetViews;

        return widgetViews.filter((widgetView) => widgetView.getWidgetName().toLowerCase().includes(searchValue.toLowerCase()));
    }, [searchValue, widgetViews]);

    const selectedWidgetView = useMemo(() => getWidgetViewFromKey(widgetViews, selectedWidgetKey?.[0]), [widgetViews, selectedWidgetKey]);

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
            setSearchValue(undefined);
            setIsComboboxOpen(false);
            getWidgetViewFromKey(widgetViews, key)?.setActive();

            requestAnimationFrame(() => {
                buttonRef.current?.focus();
            });
        },
        [widgetViews]
    );

    return (
        <div className="h-15 p-1.5 border-b border-bdr-soft">
            <Combobox.Root
                value={searchValue}
                onChange={setSearchValue}
                selection={selectedWidgetKey}
                onSelectionChange={handleSelectionChange}
                open={isComboboxOpen}
                onOpenChange={setIsComboboxOpen}
                closeOnBlur
            >
                <Combobox.Content className="h-12 w-full" hidden={!isComboboxOpen}>
                    <Combobox.Control className="border-none">
                        <Combobox.Search>
                            <Combobox.Input placeholder={placeholder} />
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
                                            <WidgetsSelectorItem widgetView={widgetView} secondary />
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

            {!isComboboxOpen && (
                <Button
                    ref={buttonRef}
                    className="h-12 flex items-center gap-3 justify-between w-full cursor-pointer py-2.25 pl-5 pr-0 group"
                    onClick={() => setIsComboboxOpen(true)}
                >
                    <WidgetsSelectorItem widgetView={selectedWidgetView} />

                    <IconButton
                        type="button"
                        variant="text"
                        size="sm"
                        iconSize="lg"
                        icon={ChevronDown}
                        tabIndex={-1}
                        className={cn('mr-1.25 shrink-0 text-subtle bg-transparent hover:bg-transparent group-hover:text-main')}
                    />
                </Button>
            )}
        </div>
    );
};

WidgetsSelector.displayName = WIDGETS_SELECTOR_NAME;

const WIDGETS_SELECTOR_ITEM_NAME = 'WidgetsSelectorItem';

const WidgetsSelectorItem = ({widgetView, secondary = false}: WidgetsSelectorItemProps) => {
    if (!widgetView) {
        return null;
    }

    const name = widgetView.getWidgetName();
    const description = widgetView.getWidgetDescription();

    return (
        <div data-component={WIDGETS_SELECTOR_ITEM_NAME} className="grid grid-cols-[auto_1fr] gap-2.5 items-center w-full">
            <WidgetIcon widgetView={widgetView} className="size-6" />

            <div className="flex flex-col text-left overflow-hidden">
                <span className={cn(secondary ? 'text-xs' : 'text-sm', 'font-semibold truncate w-full group-data-[tone=inverse]:text-alt')}>
                    {name}
                </span>

                {secondary && (
                    <small className="text-xs text-subtle truncate w-full group-data-[tone=inverse]:text-alt">{description}</small>
                )}
            </div>
        </div>
    );
};

WidgetsSelectorItem.displayName = WIDGETS_SELECTOR_ITEM_NAME;

// We need to convert the widget key to a string that is an valid id.
function getWidgetKeyForSelector(widgetView?: WidgetView): string | undefined {
    if (!widgetView) {
        return undefined;
    }

    return widgetView.getWidgetKey().replace(/[.:]/g, '-');
}

function getWidgetViewFromKey(widgetViews: WidgetView[], key: string): WidgetView | undefined {
    return widgetViews.find((wv) => getWidgetKeyForSelector(wv) === key);
}

export default class WidgetsSelectorElement extends LegacyElement<typeof WidgetsSelector, WidgetsSelectorProps> {
    constructor(props: WidgetsSelectorProps) {
        super(props, WidgetsSelector);
    }

    // Backwards compatibility

    updateState(widgetView: WidgetView): void {
        this.props.setKey('externalSelectedWidgetView', widgetView);
    }

    updateWidgetsSelector(widgetViews: WidgetView[], selectedView?: WidgetView): void {
        this.props.setKey('widgetViews', widgetViews);

        if (selectedView) {
            this.props.setKey('externalSelectedWidgetView', selectedView);
        }
    }
}
