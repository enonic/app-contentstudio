import {Combobox, Listbox} from '@enonic/ui';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {WidgetView} from '../../../../../app/view/context/WidgetView';
import {useI18n} from '../../../hooks/useI18n';
import {WidgetIcon} from '../../../shared/icons/WidgetIcon';
import {LegacyElement} from '../../../shared/LegacyElement';

type WidgetsSelectorProps = {
    widgetViews?: WidgetView[];
    externalSelectedWidgetView?: WidgetView;
};

const WIDGETS_SELECTOR_NAME = 'WidgetsSelector';

const WidgetsSelector = ({widgetViews = [], externalSelectedWidgetView = undefined}: WidgetsSelectorProps) => {
    const placeholder = useI18n('field.option.placeholder');
    const notFoundLabel = useI18n('field.contextPanel.selector.notfound');
    const [searchValue, setSearchValue] = useState<string | undefined>();
    const [selectedWidgetKey, setSelectedWidgetKey] = useState<readonly string[]>([]);

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
            getWidgetViewFromKey(widgetViews, key)?.setActive();
        },
        [widgetViews]
    );

    return (
        <div
            data-component={WIDGETS_SELECTOR_NAME}
            className="h-15 p-1.5 border-b border-bdr-soft">
            <Combobox.Root
                value={searchValue}
                onChange={setSearchValue}
                selection={selectedWidgetKey}
                onSelectionChange={handleSelectionChange}
                closeOnBlur={false}
            >
                <Combobox.Content className="h-12 w-full">
                    <Combobox.Control className="border-none">
                        <Combobox.Search>
                            {selectedWidgetView && (
                                <Combobox.Value className="gap-2.5 w-full">
                                    <WidgetIcon widgetView={selectedWidgetView} className="size-6 shrink-0" />
                                    <span className="text-sm font-semibold truncate">{selectedWidgetView.getWidgetName()}</span>
                                </Combobox.Value>
                            )}
                            <Combobox.Input placeholder={placeholder} />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>
                    <Combobox.Popup>
                        <Listbox.Content className="max-h-60 rounded-sm">
                            {filteredWidgetViews.length > 0 ? (
                                filteredWidgetViews.map((widgetView) => {
                                    const key = getWidgetKeyForSelector(widgetView);
                                    const name = widgetView.getWidgetName();
                                    const description = widgetView.getWidgetDescription();

                                    return (
                                        <Listbox.Item key={key} value={key}>
                                            <WidgetIcon widgetView={widgetView} className="size-6 shrink-0" />
                                            <div className="flex flex-col overflow-hidden text-xs">
                                                <span className='font-semibold truncate group-data-[tone=inverse]:text-alt'>{name}</span>
                                                <small className="text-subtle truncate group-data-[tone=inverse]:text-alt">{description}</small>
                                            </div>
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
