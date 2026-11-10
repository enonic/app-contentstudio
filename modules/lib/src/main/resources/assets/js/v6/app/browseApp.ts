import { Router } from '../../app/Router';
import { routeBrowseUrl } from '../pages/browse/model/browseRoute.service';
import { setMode } from '../shared/app-state/mode.store';
import { start as startSidebarWidgetsService } from '../widgets/context-panel/model/sidebarWidgets.service';

/**
 * Switches the React root to the browse shell. Called from the application
 * bootstrap once the projects are resolved and one of them is active.
 */
export function startBrowseApp(): void {
    // ! Read before the sidebar service rewrites the hash to the active widget.
    const path = Router.getPath();

    startSidebarWidgetsService();
    setMode('browser');
    routeBrowseUrl(path);
}
