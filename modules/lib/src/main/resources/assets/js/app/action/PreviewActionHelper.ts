import {UriHelper} from '../rendering/UriHelper';
import {RenderingMode} from '../rendering/RenderingMode';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentSummary} from '../content/ContentSummary';
import {type Widget} from '@enonic/lib-admin-ui/content/Widget';
import {RepositoryId} from '../repository/RepositoryId';
import {ProjectContext} from '../project/ProjectContext';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

interface OpenedWindow {
    openedWindow: Window;
    isBlocked: boolean;
}

export class PreviewActionHelper {

    protected additionalParams: Record<string, string>;

    private notifyBlocked: () => void;

    constructor(additionalParams?: Record<string, string>) {
        // Notification is shown not less than once in a minute, if triggered
        this.notifyBlocked = AppHelper.debounce(() => {
            NotifyManager.get().showWarning(i18n('notify.popupBlocker.sites'), false);
        }, 60000, true);

        this.additionalParams = additionalParams || {};
    }

    private popupCheck(win: Window) {
        const isBlocked = !win || win.closed || typeof win.closed === 'undefined';

        if (isBlocked) {
            this.notifyBlocked();
        }

        return isBlocked;
    }

    setPreviewUrl(widget: Widget, url?: string) {
        widget.getConfig().setProperty("previewUrl", url);
    }

    getPreviewUrl(widget: Widget): string {
        return widget.getConfig().getProperty("previewUrl");
    }

    getUrl(content: ContentSummary, widget?: Widget, mode: RenderingMode = RenderingMode.INLINE): string {
        if (!content) {
            throw new Error('Content parameter is required for preview');
        }

        if (!widget) {
            return UriHelper.getPortalUri(content.getPath().toString(), mode);
        }

        let url = this.getPreviewUrl(widget);
        // in case of automatic widget that will be url of the widget that actually renders the content
        if (!url) {
            url = widget.getFullUrl();
        }

        const params = new URLSearchParams({
            contentPath: content.getPath().toString(),
            contentId: content.getContentId().toString(),
            type: content.getType().toString(),
            repo: `${RepositoryId.CONTENT_REPO_PREFIX}${ProjectContext.get().getProject().getName()}`,
            branch: CONFIG.getString('branch'),
            mode,
            cb: Date.now().toString()
        })

        for (const key in this.additionalParams) {
            params.append(key, this.additionalParams[key]);
        }

        return `${url}?${params.toString()}`;
    }

    // should be called only in async block
    openWindow(content: ContentSummary, widget?: Widget, mode: RenderingMode = RenderingMode.PREVIEW) {
        const targetWindow = this.openBlankWindow(content);
        if (!targetWindow.isBlocked) {
            this.updateLocation(targetWindow.openedWindow, content, widget, mode, false);
        }
    }

    // should be called only in async block
    openWindows(contents: ContentSummary[], widget?: Widget, mode: RenderingMode = RenderingMode.PREVIEW) {
        contents.forEach((content) => this.openWindow(content, widget, mode));
    }

    // should be called only in async block
    private openBlankWindow(content: ContentSummary): OpenedWindow {
        const openedWindow = window.open('', content.getId());
        const isBlocked = this.popupCheck(openedWindow);
        return {openedWindow, isBlocked};
    }

    private updateLocation(targetWindow: Window, content: ContentSummary, widget?: Widget, mode?: RenderingMode, focus: boolean = true) {
        targetWindow.location.href = this.getUrl(content, widget, mode);
        if (focus) {
            targetWindow.focus(); // behavior depends on user settings for firefox
        }
    }
}
