import type {Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {Button, Menu, Toolbar} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {type ReactElement, useCallback, useEffect, useState} from 'react';
import {ViewExtensionEvent} from '../../../../../../app/event/ViewExtensionEvent';
import {useI18n} from '../../../../hooks/useI18n';
import {$activeWidget, $liveViewWidgets, setActiveWidget} from '../../../../store/liveViewWidgets.store';

const COMPONENT_NAME = 'PreviewToolbarWidgetSelector';

function getWidgetKey(widget: Extension): string {
    return widget?.getDescriptorKey().toString();
}

export const PreviewToolbarWidgetSelector = (): ReactElement => {
    const activeWidget = useStore($activeWidget);
    const {widgets} = useStore($liveViewWidgets);
    const [isOpen, setIsOpen] = useState(false);
    const radioControlKey = activeWidget ? getWidgetKey(activeWidget) : '';

    // First trigger is needed in order to make ContentWizardPanel add 'rendered' class, allowing ContentActionCycleButton to be displayed
    useEffect(() => {
        if (!activeWidget) return;
        new ViewExtensionEvent(activeWidget).fire();
    }, []);

    const handleWidgetChange = useCallback((key: string) => {
        const widget = widgets.find((w) => getWidgetKey(w) === key);
        if (!widget) return;
        setIsOpen(false);
        setActiveWidget(widget);
        new ViewExtensionEvent(widget).fire();
    }, [widgets]);

    if (!activeWidget) return <></>;

    return (
        <Menu data-component={COMPONENT_NAME} open={isOpen} onOpenChange={setIsOpen}>
            <Toolbar.Item asChild>
                <Menu.Trigger asChild>
                    <Button
                        className="group"
                        endIcon={isOpen ? ChevronUp : ChevronDown}
                        size="sm"
                        aria-label={useI18n('wcag.preview.toolbar.widgetSelector.label')}
                    >
                        <img
                            className="size-3.5 @sm:hidden group-data-[active=true]:invert-100 dark:invert-100"
                            src={activeWidget.getFullIconUrl()}
                            alt={activeWidget.getDisplayName()}
                        />
                        <span className="hidden @sm:inline">{activeWidget?.getDisplayName()}</span>
                    </Button>
                </Menu.Trigger>
            </Toolbar.Item>
            <Menu.Portal>
                <Menu.Content>
                    <Menu.RadioGroup value={radioControlKey} onValueChange={handleWidgetChange}>
                        {widgets.map((widget) => (
                            <Menu.RadioItem
                                key={getWidgetKey(widget)}
                                value={getWidgetKey(widget)}
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

PreviewToolbarWidgetSelector.displayName = COMPONENT_NAME;
