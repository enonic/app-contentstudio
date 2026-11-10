import { Action } from '@enonic/lib-admin-ui/ui/Action';
import { KeyBindings } from '@enonic/lib-admin-ui/ui/KeyBindings';
import { type ReactElement, useEffect, useState } from 'react';
import { ContentBrowsePanel } from '../../../../../app/browse/ContentBrowsePanel';
import { LegacyElementHost } from '../../../../shared/ui/LegacyElementHost';

const CONTENT_BROWSE_WIDGET_NAME = 'ContentBrowseWidget';

export type ContentBrowseWidgetProps = {
    active: boolean;
};

// Legacy island: the browse panel is still a lib-admin-ui panel until the
// toolbar and the tree move into React (#11015, phases 5 and 6).
export const ContentBrowseWidget = ({ active }: ContentBrowseWidgetProps): ReactElement => {
    const [panel, setPanel] = useState<ContentBrowsePanel>();

    // ! Created in an effect, never during render: the panel's constructor renders
    // ! its own React islands synchronously, which would reset the hook context.
    useEffect(() => {
        setPanel(new ContentBrowsePanel());
    }, []);

    // The browse shortcuts still live on legacy actions; they bind only while this widget is the visible one.
    useEffect(() => {
        if (!active || panel == null) return;

        const bindings = Action.getKeyBindings(panel.getActions());
        KeyBindings.get().bindKeys(bindings);

        return () => KeyBindings.get().unbindKeys(bindings);
    }, [active, panel]);

    return (
        <div data-component={CONTENT_BROWSE_WIDGET_NAME} className="relative size-full">
            {panel && <LegacyElementHost element={panel} className="size-full" />}
        </div>
    );
};

ContentBrowseWidget.displayName = CONTENT_BROWSE_WIDGET_NAME;
