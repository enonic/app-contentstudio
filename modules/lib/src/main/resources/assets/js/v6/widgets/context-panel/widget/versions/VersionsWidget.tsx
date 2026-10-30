import { useStore } from '@nanostores/preact';
import { useMemo, type ReactElement } from 'react';
import { $contextContent } from '../../model/contextContent.store';
import { $activeWidgetId, $isContextOpen } from '../../model/contextWidgets.store';
import { getVersionsWidgetKey } from '../../../../shared/lib/widget/versions/versions';
import { createContentStudioDefaults } from './config/defaults';
import { VersionsConfigProvider } from './config/VersionsConfigContext';
import { VersionsList } from './VersionsList';

const VERSIONS_WIDGET_NAME = 'VersionsWidget';

export const VersionsWidget = (): ReactElement | null => {
    const isContextOpen = useStore($isContextOpen);
    const activeWidget = useStore($activeWidgetId);
    const isActiveWidget = activeWidget === getVersionsWidgetKey();
    const content = useStore($contextContent);
    const config = useMemo(() => createContentStudioDefaults(), []);

    if (!isContextOpen || !isActiveWidget || !content) {
        return null;
    }

    return (
        <div data-component={VERSIONS_WIDGET_NAME}>
            <VersionsConfigProvider config={config}>
                <VersionsList content={content} />
            </VersionsConfigProvider>
        </div>
    );
};

VersionsWidget.displayName = VERSIONS_WIDGET_NAME;
