import {ReactElement, useCallback, useState} from 'react';
import {$activeWidget, $liveviewWidgets, setActiveWidget} from '../../../store/liveviewWidgets.store';
import {useStore} from '@nanostores/preact';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {ViewWidgetEvent} from '../../../../../app/event/ViewWidgetEvent';
import {Button, Menu} from '@enonic/ui';
import {ChevronDown, ChevronUp} from 'lucide-react';

function getWidgetKey(widget: Widget): string {
    return widget.getWidgetDescriptorKey().toString();
}

export const PreviewToolbarWidgetSelector = (): ReactElement => {
    const activeWidget = useStore($activeWidget);
    const {widgets} = useStore($liveviewWidgets);
    const [isOpen, setIsOpen] = useState(false);
    const [radioControlKey, setRadioControlKey] = useState(getWidgetKey(activeWidget));

    const handleWidgetClick = useCallback((widget: Widget) => {
        new ViewWidgetEvent(widget).fire();
        setActiveWidget(widget);
        setIsOpen(false);
    }, []);

    if (!activeWidget) return <></>;

    return (
        <Menu open={isOpen} onOpenChange={setIsOpen}>
            <Menu.Trigger asChild>
                <Button endIcon={isOpen ? ChevronUp : ChevronDown} size="sm">
                    <img
                        className="size-6.5 @sm:hidden dark:invert-100"
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
                                    <span className="text-xs">{widget.getDescription()}</span>
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
