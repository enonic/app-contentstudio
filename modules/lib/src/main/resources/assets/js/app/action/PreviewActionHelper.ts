import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentSummary} from '../content/ContentSummary';
import {ProjectContext} from '../project/ProjectContext';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper} from '../rendering/UriHelper';
import {RepositoryId} from '../repository/RepositoryId';

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

    setPreviewUrl(widget: Readonly<Extension>, url?: string) {
        widget.getConfig().setProperty("previewUrl", url);
    }

    getPreviewUrl(widget: Readonly<Extension>): string {
        return widget.getConfig().getProperty("previewUrl");
    }

    getUrl(content: ContentSummary, extension?: Readonly<Extension>, mode: RenderingMode = RenderingMode.INLINE): string {
        if (!content) {
            throw new Error('Content parameter is required for preview');
        }

        if (!extension) {
            return UriHelper.getPortalUri(content.getPath().toString(), mode);
        }

        let url = this.getPreviewUrl(extension);
        // in case of automatic extension that will be url of the extension that actually renders the content
        if (!url) {
            url = extension.getFullUrl();
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
    openWindow(content: ContentSummary, extension?: Readonly<Extension>, mode: RenderingMode = RenderingMode.PREVIEW) {
        const targetWindow = this.openBlankWindow(content);
        if (!targetWindow.isBlocked) {
            this.updateLocation(targetWindow.openedWindow, content, extension, mode, false);
        }
    }

    // should be called only in async block
    openWindows(contents: ContentSummary[], widget?: Readonly<Extension>, mode: RenderingMode = RenderingMode.PREVIEW) {
        contents.forEach((content) => this.openWindow(content, widget, mode));
    }

    // should be called only in async block
    private openBlankWindow(content: ContentSummary): OpenedWindow {
        const openedWindow = window.open('', content.getId());
        const isBlocked = this.popupCheck(openedWindow);
        return {openedWindow, isBlocked};
    }

    private updateLocation(targetWindow: Window, content: ContentSummary, widget?: Readonly<Extension>, mode?: RenderingMode, focus: boolean = true) {
        targetWindow.location.href = this.getUrl(content, widget, mode);
        if (focus) {
            targetWindow.focus(); // behavior depends on user settings for firefox
        }
    }
}
