import type { ReactElement } from 'react';
import { BrowseAppBar } from './BrowseAppBar';
import { BrowseSidebar } from './BrowseSidebar';
import { SidebarWidgetPanels } from './ui/widgets/SidebarWidgetPanels';

const BROWSE_APP_SHELL_NAME = 'BrowseAppShell';

// The browse layout: sidebar, app bar and the panel of whichever sidebar widget is active.
export const BrowseAppShell = (): ReactElement => {
    return (
        <div data-component={BROWSE_APP_SHELL_NAME} role="main" className="relative h-dvh text-main">
            <BrowseSidebar />
            <div className="header-widgets-block sm:ml-15">
                <BrowseAppBar />
                <SidebarWidgetPanels />
            </div>
        </div>
    );
};

BrowseAppShell.displayName = BROWSE_APP_SHELL_NAME;

export default BrowseAppShell;
