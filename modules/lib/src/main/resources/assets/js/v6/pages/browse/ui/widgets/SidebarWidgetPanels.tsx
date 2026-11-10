import { useStore } from '@nanostores/preact';
import { type ReactElement, useEffect, useState } from 'react';
import {
    $sidebarWidgets,
    getWidgetKey,
    isContentBrowseWidget,
} from '../../../../widgets/context-panel/model/sidebarWidgets.store';
import { $isBrowseSidebarOpen } from '../../model/browseSidebar.store';
import { ContentBrowseWidget } from './ContentBrowseWidget';
import { ExternalSidebarWidget } from './ExternalSidebarWidget';

const SIDEBAR_WIDGET_PANELS_NAME = 'SidebarWidgetPanels';
const SIDEBAR_WIDGET_PANEL_NAME = 'SidebarWidgetPanel';

export const SidebarWidgetPanels = (): ReactElement => {
    const { widgets, activeWidgetId } = useStore($sidebarWidgets);
    const isSidebarOpen = useStore($isBrowseSidebarOpen);

    // A widget mounts on its first activation and then stays, hidden, so its state survives switching.
    const [mountedIds, setMountedIds] = useState<readonly string[]>([]);

    useEffect(() => {
        if (activeWidgetId == null) return;
        setMountedIds((ids) => (ids.includes(activeWidgetId) ? ids : [...ids, activeWidgetId]));
    }, [activeWidgetId]);

    const isMounted = (id: string | undefined): boolean =>
        id != null && (id === activeWidgetId || mountedIds.includes(id));

    return (
        <div
            data-component={SIDEBAR_WIDGET_PANELS_NAME}
            className="absolute inset-x-0 bottom-0 top-15 sm:left-15"
            inert={isSidebarOpen}
        >
            {widgets
                .filter((widget) => isMounted(getWidgetKey(widget)))
                .map((widget) => {
                    const id = getWidgetKey(widget);
                    const active = id === activeWidgetId;

                    return (
                        <div
                            key={id}
                            data-component={SIDEBAR_WIDGET_PANEL_NAME}
                            data-widget={id}
                            hidden={!active}
                            className="absolute inset-0"
                        >
                            {isContentBrowseWidget(widget) ? (
                                <ContentBrowseWidget active={active} />
                            ) : (
                                <ExternalSidebarWidget widget={widget} active={active} />
                            )}
                        </div>
                    );
                })}
        </div>
    );
};

SidebarWidgetPanels.displayName = SIDEBAR_WIDGET_PANELS_NAME;
