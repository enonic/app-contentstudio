import {showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper} from '../rendering/UriHelper';
import {Action} from 'lib-admin-ui/ui/Action';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';

interface OpenedWindow {
    openedWindow: Window;
    isBlocked: boolean;
}

export class BasePreviewAction extends Action {

    private notifyBlocked: () => void;

    constructor(label: string) {
        super(label, BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        // Notification is shown not less than once in a minute, if triggered
        this.notifyBlocked = AppHelper.debounce(() => {
            showWarning(i18n('notify.popupBlocker.sites'), false);
        }, 60000, true);
    }

    private popupCheck(win: Window) {
        const isBlocked = !win || win.closed || typeof win.closed === 'undefined';

        if (isBlocked) {
            this.notifyBlocked();
        }

        return isBlocked;
    }

    // should be called only in async block
    protected openWindow(content: ContentSummary) {
        const targetWindow = this.openBlankWindow(content);
        if (!targetWindow.isBlocked) {
            this.updateLocation(targetWindow.openedWindow, content, false);
        }
    }

    // should be called only in async block
    protected openWindows(contents: ContentSummary[]) {
        contents.forEach((content) => this.openWindow(content));
    }

    // should be called only in async block
    protected openBlankWindow(content: ContentSummary): OpenedWindow {
        const openedWindow = window.open('', content.getId());
        const isBlocked = this.popupCheck(openedWindow);
        return {openedWindow, isBlocked};
    }

    protected updateLocation(targetWindow: Window, content: ContentSummary, focus: boolean = true) {
        targetWindow.location.href = UriHelper.getPortalUri(content.getPath().toString(), RenderingMode.PREVIEW);
        if (focus) {
            targetWindow.focus(); // behavior depends on user settings for firefox
        }
    }
}
