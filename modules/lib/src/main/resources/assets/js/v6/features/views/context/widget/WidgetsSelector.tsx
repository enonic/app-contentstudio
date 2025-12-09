import {useEffect, useState} from 'react';
import {WidgetView} from '../../../../../app/view/context/WidgetView';
import {LegacyElement} from '../../../shared/LegacyElement';
import {cn, Selector} from '@enonic/ui';
import {WidgetIcon} from '../../../shared/icons/WidgetIcon';
import {useI18n} from '../../../hooks/useI18n';

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
    const selectorPlaceholder = useI18n('field.contextPanel.selector.placeholder');
    const [value, setValue] = useState<string | undefined>();

    // TODO: Enonic UI - backwards compatibility due to the active widget being handled by ContextView
    useEffect(() => {
        setValue(externalSelectedWidgetView?.getWidgetName());
    }, [externalSelectedWidgetView]);

    const onValueChange = (newValue: string) => {
        widgetViews.find((widgetView) => widgetView.getWidgetName() === newValue)?.setActive();
    };

    return (
        <Selector.Root value={value} onValueChange={onValueChange}>
            <Selector.Trigger className="h-15 shrink-0">
                <Selector.Value placeholder={selectorPlaceholder}>
                    <WidgetsSelectorItem
                        widgetView={widgetViews.find((widgetView) => widgetView.getWidgetName() === value)}
                    />
                </Selector.Value>
                <Selector.Icon />
            </Selector.Trigger>
            <Selector.Content>
                <Selector.Viewport>
                    {widgetViews.map((widgetView) => {
                        const name = widgetView.getWidgetName();

                        return (
                            <Selector.Item key={name} value={name} textValue={name}>
                                <WidgetsSelectorItem widgetView={widgetView} secondary />
                                <Selector.ItemIndicator />
                            </Selector.Item>
                        );
                    })}
                </Selector.Viewport>
            </Selector.Content>
        </Selector.Root>
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
        <div
            data-component={WIDGETS_SELECTOR_ITEM_NAME}
            className="grid grid-cols-[auto_1fr] gap-2.5 items-center w-full"
        >
            <WidgetIcon widgetView={widgetView} className="size-6" />

            <div className="flex flex-col text-left overflow-hidden">
                <span
                    className={cn(
                        secondary ? 'text-xs' : 'text-sm',
                        'font-semibold truncate w-full group-data-[tone=inverse]:text-alt'
                    )}
                >
                    {name}
                </span>

                {secondary && (
                    <small className="text-xs text-subtle truncate w-full group-data-[tone=inverse]:text-alt">
                        {description}
                    </small>
                )}
            </div>
        </div>
    );
};

WidgetsSelectorItem.displayName = WIDGETS_SELECTOR_ITEM_NAME;

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
