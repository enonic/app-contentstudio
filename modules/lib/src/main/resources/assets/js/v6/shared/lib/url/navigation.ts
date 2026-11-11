import { notifyWarning } from '../../notifications';
import { i18n } from '../../i18n';
import { $config } from '../../config/config.store';
import { resolveActiveProjectName } from './cms';

//
// * URL builders
//

const EDIT_ACTION = 'edit';
const INBOUND_ACTION = 'inbound';
// Read by the legacy ContentAppHelper from the wizard's location.
const DISPLAY_AS_NEW_PARAM = 'displayAsNew';
const POPUP_BLOCKED_KEY = 'notify.popupBlocker.admin';

export type InboundReferencesUrlParams = {
    contentId: string;
    branch: string;
    project?: string;
    contentType?: string;
};

function getToolUri(): string {
    return $config.get().toolUri;
}

/**
 * Build the client-side edit URL for a content item. Reproduces the legacy
 * ContentUrlHelper.generateEditContentUrl (no v6 caller sets the localized flag).
 *
 * @param contentId - Content identifier.
 * @param project - Optional project override; defaults to the active project.
 * @param displayAsNew - Show the wizard as for a content just created.
 */
export function getEditContentUrl(contentId: string, project?: string, displayAsNew = false): string {
    const projectName = project ?? resolveActiveProjectName() ?? '';
    const query = displayAsNew ? `?${DISPLAY_AS_NEW_PARAM}=true` : '';
    return `${getToolUri()}/${projectName}/${EDIT_ACTION}/${contentId}${query}`;
}

/**
 * Build the client-side hash URL that opens the inbound-references view for a
 * content item. Mirrors the legacy ContentUrlHelper.generateDependenciesURL for
 * the INBOUND dependency type.
 *
 * @param params - Content id, branch, optional project override and content type.
 */
export function getInboundReferencesUrl({
    contentId,
    branch,
    project,
    contentType,
}: InboundReferencesUrlParams): string {
    const projectName = project ?? resolveActiveProjectName() ?? '';
    const typePostfix = contentType ? `/${contentType}` : '';
    return `${getToolUri()}#/${projectName}/${INBOUND_ACTION}/${branch}/${contentId}${typePostfix}`;
}

//
// * Tab management
//

// Single tab registry for the whole admin app: the legacy ContentUrlHelper
// delegates here, so v6 and legacy paths dedupe each other's wizard tabs.
let openWindows: Window[] = [];

function isPopupBlocked(win: Window | null): boolean {
    return !win || win.closed || typeof win.closed === 'undefined';
}

/**
 * Open a browser tab and track it in the shared tab registry.
 */
export function openNewTab(url: string): Window | null {
    const newWindow = window.open(url);
    if (newWindow) {
        openWindows.push(newWindow);
    }
    return newWindow;
}

/**
 * Focus an already-tracked tab whose window name matches, or open a new one.
 */
export function openTabOrFocusExisting(url: string, name: string): Window | null {
    const existing = openWindows.find((win) => win.name === name);

    if (existing) {
        if (existing.closed) {
            openWindows = openWindows.filter((win) => win !== existing);
        } else {
            existing.focus();
            return existing;
        }
    }

    return openNewTab(url);
}

export type OpenEditContentTabOptions = {
    /** Project the content lives in; defaults to the active project. */
    project?: string;
    /** Show the wizard as for a content just created. */
    displayAsNew?: boolean;
};

/**
 * Open (or focus an already-open) browser tab for editing a content item. Warns
 * via the message bus when the browser's popup blocker prevents opening the tab.
 *
 * @param contentId - Content identifier to edit.
 */
export function openEditContentTab(contentId: string, { project, displayAsNew }: OpenEditContentTabOptions = {}): void {
    const projectName = project ?? resolveActiveProjectName() ?? '';
    const url = getEditContentUrl(contentId, projectName, displayAsNew);
    const tabName = `${EDIT_ACTION}:${projectName}:${contentId}`;

    const win = openTabOrFocusExisting(url, tabName);

    if (isPopupBlocked(win)) {
        notifyWarning(i18n(POPUP_BLOCKED_KEY), { autoHide: false });
    }
}
