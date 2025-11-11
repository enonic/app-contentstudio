import {ReactElement, useCallback, useEffect, useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {Button, Menu} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {$activeWidget, $liveViewWidgets, setActiveWidget} from '../../../../store/liveViewWidgets.store';
import {ViewWidgetEvent} from '../../../../../../app/event/ViewWidgetEvent';

function getWidgetKey(widget: Widget): string {
    return widget.getWidgetDescriptorKey().toString();
}

export const PreviewToolbarWidgetSelector = (): ReactElement => {
    const activeWidget = useStore($activeWidget);
    const {widgets} = useStore($liveViewWidgets);
    const [isOpen, setIsOpen] = useState(false);
    const [radioControlKey, setRadioControlKey] = useState(getWidgetKey(activeWidget));

    // First trigger is needed in order to make ContentWizardPanel add 'rendered' class, allowing ContentActionCycleButton to be displayed
    useEffect(() => {
        if (!activeWidget) return;
        new ViewWidgetEvent(activeWidget).fire();
    }, []);

    const handleWidgetClick = useCallback((widget: Widget) => {
        setIsOpen(false);
        setActiveWidget(widget);
        new ViewWidgetEvent(widget).fire();
    }, []);

    if (!activeWidget) return <></>;

    return (
        <Menu open={isOpen} onOpenChange={setIsOpen}>
            <Menu.Trigger asChild>
                <Button endIcon={isOpen ? ChevronUp : ChevronDown} size="sm">
                    <img
                        className="size-3.5 @sm:hidden @dark:invert-100"
                        src={activeWidget.getFullIconUrl()}
                        alt={activeWidget.getDisplayName()}
                    />
                    <span className="hidden @sm:inline">{activeWidget?.getDisplayName()}</span>
                </Button>
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Content>
                    <Menu.RadioGroup value={radioControlKey} onValueChange={setRadioControlKey}>
                        {widgets.map((widget) => (
                            <Menu.RadioItem
                                key={getWidgetKey(widget)}
                                value={getWidgetKey(widget)}
                                onClick={() => handleWidgetClick(widget)}
                            >
                                <Menu.ItemIndicator>
                                    <img
                                        className="size-6.5 dark:invert-100 group-data-[state=checked]:invert-100"
                                        src={widget.getFullIconUrl()}
                                        alt={widget.getDisplayName()}
                                    />
                                </Menu.ItemIndicator>
                                <p className="ml-2">
                                    <span className="font-semibold block">{widget.getDisplayName()}</span>
                                    <span className="text-xs text-subtle group-data-[state=checked]:text-alt">
                                        {widget.getDescription()}
                                    </span>
                                </p>
                            </Menu.RadioItem>
                        ))}
                    </Menu.RadioGroup>
                </Menu.Content>
            </Menu.Portal>
        </Menu>
    );
};

PreviewToolbarWidgetSelector.displayName = 'PreviewToolbarWidgetSelector';
