import { useStore } from '@nanostores/preact';
import { useMemo, type ReactElement } from 'react';
import { $contextContent } from '../../model/contextContent.store';
import { $activeWidgetId, $isContextOpen } from '../../model/contextWidgets.store';
import { getVersionsWidgetKey } from '../../../../shared/lib/widget/versions/versions';
import { createContentStudioDefaults } from './config/defaults';
import { VersionsConfigProvider } from './config/VersionsConfigContext';
import { VersionsList } from './VersionsList';

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
        <VersionsConfigProvider config={config}>
            <VersionsList content={content} />
        </VersionsConfigProvider>
    );
};

VersionsWidget.displayName = 'VersionsWidget';
