import {UriHelper} from '../rendering/UriHelper';
import {RenderingMode} from '../rendering/RenderingMode';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';

interface OpenedWindow {
    openedWindow: Window;
    isBlocked: boolean;
}

export class PreviewActionHelper {

    private notifyBlocked: () => void;

    constructor() {
        // Notification is shown not less than once in a minute, if triggered
        this.notifyBlocked = AppHelper.debounce(() => {
            NotifyManager.get().showWarning(i18n('notify.popupBlocker.sites'), false);
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
    openWindow(content: ContentSummary) {
        const targetWindow = this.openBlankWindow(content);
        if (!targetWindow.isBlocked) {
            this.updateLocation(targetWindow.openedWindow, content, false);
        }
    }

    // should be called only in async block
    openWindows(contents: ContentSummary[]) {
        contents.forEach((content) => this.openWindow(content));
    }

    // should be called only in async block
    private openBlankWindow(content: ContentSummary): OpenedWindow {
        const openedWindow = window.open('', content.getId());
        const isBlocked = this.popupCheck(openedWindow);
        return {openedWindow, isBlocked};
    }

    private updateLocation(targetWindow: Window, content: ContentSummary, focus: boolean = true) {
        targetWindow.location.href = UriHelper.getPortalUri(content.getPath().toString(), RenderingMode.PREVIEW);
        if (focus) {
            targetWindow.focus(); // behavior depends on user settings for firefox
        }
    }
}
