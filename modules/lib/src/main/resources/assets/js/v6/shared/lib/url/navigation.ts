import { showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { CONFIG } from '@enonic/lib-admin-ui/util/Config';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { resolveActiveProjectName } from './cms';

//
// * URL builders
//

const TOOL_URI_PROPERTY = 'toolUri';
const EDIT_ACTION = 'edit';
const INBOUND_ACTION = 'inbound';
const POPUP_BLOCKED_KEY = 'notify.popupBlocker.admin';

export type InboundReferencesUrlParams = {
    contentId: string;
    branch: string;
    project?: string;
    contentType?: string;
};

function getToolUri(): string {
    return CONFIG.getString(TOOL_URI_PROPERTY);
}

/**
 * Build the client-side edit URL for a content item. Reproduces the legacy
 * ContentUrlHelper.generateEditContentUrl for the no-flag case (v6 callers never
 * set displayAsNew/localized, so no query string is appended).
 *
 * @param contentId - Content identifier.
 * @param project - Optional project override; defaults to the active project.
 */
export function getEditContentUrl(contentId: string, project?: string): string {
    const projectName = project ?? resolveActiveProjectName() ?? '';
    return `${getToolUri()}/${projectName}/${EDIT_ACTION}/${contentId}`;
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

/**
 * Open (or focus an already-open) browser tab for editing a content item. Warns
 * via the message bus when the browser's popup blocker prevents opening the tab.
 *
 * @param contentId - Content identifier to edit.
 */
export function openEditContentTab(contentId: string): void {
    const project = resolveActiveProjectName() ?? '';
    const url = getEditContentUrl(contentId, project);
    const tabName = `${EDIT_ACTION}:${project}:${contentId}`;

    const win = openTabOrFocusExisting(url, tabName);

    if (isPopupBlocked(win)) {
        showWarning(i18n(POPUP_BLOCKED_KEY), false);
    }
}
