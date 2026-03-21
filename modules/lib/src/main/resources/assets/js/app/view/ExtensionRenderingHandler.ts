import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {type IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {type Mask} from '@enonic/lib-admin-ui/ui/mask/Mask';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {listenKeys} from 'nanostores';
import Q from 'q';
import {PreviewLabelElement} from '../../v6/features/shared/PreviewLabel';
import {$app, getResolvedTheme} from '../../v6/features/store/app.store';
import {$isWidgetRenderable} from '../../v6/features/store/contextWidgets.store';
import {$autoModeWidgets, WIDGET_AUTO_DESCRIPTOR} from '../../v6/features/store/liveViewWidgets.store';
import {EmulatedDeviceEvent} from '../../v6/features/utils/dom/events/registry';
import {PreviewActionHelper} from '../action/PreviewActionHelper';
import {type ContentSummary} from '../content/ContentSummary';
import {ViewExtensionEvent} from '../event/ViewExtensionEvent';
import {RenderingMode} from '../rendering/RenderingMode';
import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {EmulatorDevice} from './context/extension/emulator/EmulatorDevice';

export enum PREVIEW_TYPE {
    SUCCESS,
    EMPTY,
    FAILED,
    MISSING,
}

export class ExtensionRenderingHandler {

    private PREVIEW_HEADER_NAME = 'enonic-widget-data';

    protected readonly renderer: ExtensionRenderer;

    private previewType: PREVIEW_TYPE;

    private itemRenderable: Q.Promise<boolean> = Q(false);

    private previewHelper: PreviewActionHelper;

    private emptyView: DivEl;

    protected messageView: DivEl;

    private messageLabel: PreviewLabelElement;

    private summary: ContentSummary;

    protected mode: RenderingMode;

    protected renderableChangedListeners: ((isRenderable: boolean, wasRenderable: boolean) => void)[] = [];


    constructor(renderer: ExtensionRenderer, previewHelper?: PreviewActionHelper) {
        this.renderer = renderer;
        this.mode = RenderingMode.INLINE;
        this.previewHelper = previewHelper || new PreviewActionHelper();
        this.emptyView = this.createEmptyView();
        this.messageView = this.createErrorView();
    }


    public async render(summary: ContentSummary, extension: Extension): Promise<boolean> {

        const deferred = Q.defer<boolean>();

        const wasRenderable = await this.isItemRenderable();
        this.itemRenderable = deferred.promise;

        if (!extension || !summary) {
            this.setPreviewType(PREVIEW_TYPE.EMPTY);
            deferred.resolve(false);
            return;
        }

        this.summary = summary;

        this.showMask();
        this.renderer.getPreviewAction()?.setEnabled(false);
        let isRenderable: boolean;

        $isWidgetRenderable.set(false);

        return this.doRender(summary, extension)
            .then((result) => {
                isRenderable = result.isRenderable();
                $isWidgetRenderable.set(isRenderable);

                if (isRenderable) {
                    this.handlePreviewSuccess(result.getResponse(), result.getData());
                } else {
                    // handle last item failure meaning no one was successful
                    this.handlePreviewFailure(result.getResponse(), result.getData());
                }

                return isRenderable;
            })
            .catch((err) => {
                this.setPreviewType(PREVIEW_TYPE.FAILED);
                this.hideMask();
                isRenderable = false;

                return false;
            }).finally(() => {
                deferred.resolve(isRenderable);
                if (isRenderable !== wasRenderable) {
                    this.notifyRenderableChanged(isRenderable, wasRenderable);
                }
                return isRenderable;
            });
    }

    public isItemRenderable(): Q.Promise<boolean> {
        return this.itemRenderable;
    }

    public layout() {
        this.bindListeners();
        this.renderer.getChildrenContainer().appendChildren(this.emptyView, this.messageView);
    }

    public empty() {
        this.setPreviewType(PREVIEW_TYPE.EMPTY);
    }

    protected createEmptyView(): DivEl {
        return this.createMessageView(i18n('panel.noselection'), 'no-selection-message bg-surface-primary');
    }

    protected createErrorView(): DivEl {
        this.messageLabel = new PreviewLabelElement({messages: [this.getDefaultMessage()], showIcon: true, className: 'text-xl'});
        const wrapper = new DivEl('no-preview-message bg-surface-primary');
        wrapper.appendChild(this.messageLabel);
        return wrapper;
    }

    protected createMessageView(message: string, className?: string, showIcon?: boolean): DivEl {
        const wrapper = new DivEl(className);
        const label = new PreviewLabelElement({messages: [message], showIcon, className: 'text-xl'});
        wrapper.appendChild(label);
        return wrapper;
    }

    protected setPreviewType(previewType: PREVIEW_TYPE, messages?: string[]) {
        this.renderer.removeClass('extension-preview empty-preview message-preview');

        switch (previewType) {
            case PREVIEW_TYPE.SUCCESS: {
                this.renderer.addClass('extension-preview');
                break;
            }
            case PREVIEW_TYPE.FAILED: {
                this.renderer.addClass('message-preview');
            this.showPreviewMessages(messages || [i18n('field.preview.failed'), i18n('field.preview.failed.description')]);
                break;
            }
            case PREVIEW_TYPE.MISSING: {
                this.renderer.addClass('message-preview');
            this.showPreviewMessages(messages || [i18n('field.preview.failed'), i18n('field.preview.missing.description')]);
                break;
            }
            case PREVIEW_TYPE.EMPTY:
            default: {
                this.renderer.addClass('empty-preview');
                break;
            }
        }

        this.previewType = previewType;
    }

    protected showPreviewMessages(messages: string[]) {
        this.messageLabel.setProps({messages, showIcon: true});
    }

    protected handlePreviewSuccess(response: Response, data: Record<string, never>) {
        this.renderer.getPreviewAction()?.setEnabled(true);
        this.setPreviewType(PREVIEW_TYPE.SUCCESS);

        const contentType = response.headers.get('content-type');
        let mainType = 'other';
        if (contentType) {
            mainType = contentType.split('/')[0];
        }

        this.renderer.getIFrameEl()
            .setSrc(response.url)
            .setClass(mainType);
    }

    protected handlePreviewFailure(response?: Response, data?: Record<string, never>) {
        // previewAction was set to false in the beginning of loading

        const statusCode = response.status;
        if (statusCode > 0) {

            const messages: string[] = (data?.messages as string[])?.length ? data.messages : undefined;

            switch (statusCode) {
                case StatusCode.NOT_FOUND:
                case StatusCode.I_AM_A_TEAPOT:
                    this.setPreviewType(PREVIEW_TYPE.MISSING, messages || [this.getDefaultMessage()]);
                    break;
                default:
                    this.setPreviewType(PREVIEW_TYPE.FAILED, messages);
                    break;
            }
            this.hideMask();
            return;
        }

        this.setPreviewType(PREVIEW_TYPE.EMPTY);
        this.hideMask();
    }

    protected getDefaultMessage(): string {
        return i18n('field.preview.notAvailable');
    }

    protected extractPreviewData(response: Response): Record<string, never> {
        try {
            const data = response.headers.get(this.PREVIEW_HEADER_NAME);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            // no data
        }
        return {};
    }

    private async doRender(summary: ContentSummary, selectedMode: Extension): Promise<RenderResult> {
        if (!selectedMode || !summary) {
            return new RenderResult();
        }
        const isAuto = selectedMode.getDescriptorKey().getName() === WIDGET_AUTO_DESCRIPTOR;
        const items = isAuto ? $autoModeWidgets.get() : [selectedMode];
        let response: Response;
        let extension: Extension;
        let isOk: boolean;
        let data: Record<string, never>;
        if (isAuto) {
            // clear previous preview url for this mode
            this.previewHelper.setPreviewUrl(selectedMode);
        }
        for (extension of items) {
            const url = this.previewHelper.getUrl(summary, extension, this.mode) + '&auto=' + isAuto;
            response = await fetch(url, {method: 'HEAD', credentials: 'include'});

            data = this.extractPreviewData(response);
            if (data.redirect) {
                // follow redirect manually to get data headers first
                try {
                    response = await fetch(data.redirect, {method: 'HEAD', credentials: 'include'});
                } catch (e) {
                    response = this.createErrorResponse(e, data.redirect);
                }
            }

            isOk = this.isResponseOk(response, isAuto);
            if (isOk) {
                break;
            }
        }
        if (isAuto && isOk) {
            // don't save the final url, because they are different for different modes
            this.previewHelper.setPreviewUrl(selectedMode, extension.getFullUrl());
        }

        return new RenderResult(isOk, extension, response, data);
    }

    private isResponseOk(response: Response, isAuto: boolean) {
        return response.ok || !isAuto && response.status !== StatusCode.I_AM_A_TEAPOT;
    }

    private createErrorResponse(error: Error, url: string): Response {
        const resp = new Response(null, {
            status: StatusCode.NOT_FOUND,
            statusText: error.message || 'Endpoint not reachable'
        });
        // The url property cannot be set via the constructor, so we define it manually
        Object.defineProperty(resp, 'url', {value: url, writable: false, enumerable: true, configurable: false})
        return resp;
    }

    private applyImageStyles(frameWindow: Window) {
        const body = frameWindow.document.body;
        if (body) {
            body.style.display = 'flex';
            body.style.justifyContent = 'center';
            body.style.alignItems = 'center';
            // Apply theme-aware background color
            const isDark = getResolvedTheme() === 'dark';
            body.style.backgroundColor = isDark ? '#242829' : '#ffffff';
        }

        let img: HTMLImageElement | SVGElement = frameWindow.document.querySelector('svg');
        if (img) {
            img.style.margin = '0 auto';
            img.style.height = '100%';
        } else {
            img = frameWindow.document.querySelector('body > img');
        }
        if (img) {
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
        }
    }

    protected handleExtensionEvent(event: ViewExtensionEvent) {
        if (!this.summary) {
            return;
        }

        void this.render(this.summary, event.getExtension());
    }

    protected handleEmulatorEvent(device: EmulatorDevice) {
        if (this.messageView) {
            this.messageView.getEl().setWidth(device.getWidthWithUnits());
            this.messageView.getEl().setHeight(device.getHeightWithUnits());
        }

        // Keep no selection message intact,
        // Since no toolbar shown when no content is selected
        const subjects = [
            this.renderer.getIFrameEl().getHTMLElement(),
            this.messageView.getHTMLElement()
        ];

        const isFullscreen = device.equals(EmulatorDevice.getFullscreen())|| !device.isValid();

        subjects.forEach(s => {
            s.style.width = !isFullscreen ? device.getWidthWithUnits() : '';
            s.style.height = !isFullscreen ? device.getHeightWithUnits() : '';
        });

        this.renderer.getEl().toggleClass('emulated', !isFullscreen);
    }

    protected bindListeners() {
        ViewExtensionEvent.on(this.handleExtensionEvent.bind(this));
        EmulatedDeviceEvent.listen(this.handleEmulatorEvent.bind(this));

        const iframe = this.renderer.getIFrameEl();
        let unsubscribeTheme: () => void;
        iframe.onLoaded((event: UIEvent) => {
            if (this.previewType === PREVIEW_TYPE.EMPTY) {
                return;
            }
            // Subscribe to theme changes to update image background
            unsubscribeTheme = listenKeys($app, ['theme'], () => {
                if (iframe.getClass() === 'image') {
                    const frameWindow = iframe.getHTMLElement()['contentWindow'];
                    if (frameWindow) {
                        this.applyImageStyles(frameWindow);
                    }
                }
            });

            this.hideMask();

            const frameWindow = iframe.getHTMLElement()['contentWindow'];

            switch (iframe.getClass()) {
                case 'image':
                    this.applyImageStyles(frameWindow);
                    break;
                case 'text':
                    try {
                        frameWindow.addEventListener('click', (event) => this.frameClickHandler(frameWindow, event));
                } catch (error) { /* error */ }
                    break;
                default:
                    break;
            }
        });
        iframe.unLoaded(() => unsubscribeTheme?.());
    }

    private frameClickHandler(frameWindow: Window, event: MouseEvent) {
        const clickedLink: string = this.getClickedLink(event);
        if (clickedLink) {
            if (!!frameWindow && !UriHelper.isNavigatingOutsideOfXP(clickedLink, frameWindow)) {
                const contentPreviewPath = UriHelper.trimUrlParams(
                    UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(clickedLink,
                        frameWindow)));
                if (!UriHelper.isNavigatingWithinSamePage(contentPreviewPath, frameWindow) &&
                    !UriHelper.isDownloadLink(contentPreviewPath)) {
                    new ContentPreviewPathChangedEvent(contentPreviewPath).fire();
                }
            }
        }
    }

    private getClickedLink(event: UIEvent): string {
        if (event.target && (event.target as HTMLElement).tagName.toLowerCase() === 'a') {
            return (event.target as HTMLLinkElement).href;
        }

        let el = event.target as HTMLElement;
        if (el) {
            while (el.parentNode) {
                el = el.parentNode as HTMLElement;
                if (el.tagName && el.tagName.toLowerCase() === 'a') {
                    return (el as HTMLLinkElement).href;
                }
            }
        }
        return '';
    }

    public showMask() {
        if (this.renderer.isVisible()) {
            this.renderer.getMask()?.show();
            this.renderer.addClass('loading');
        }
    }

    public hideMask() {
        this.renderer.getMask()?.hide();
        this.renderer.removeClass('loading');
    }

    public onRenderableChanged(listener: (isRenderable: boolean, wasRenderable: boolean) => void) {
        this.renderableChangedListeners.push(listener);
    }

    public unRenderableChanged(listener: (isRenderable: boolean, wasRenderable: boolean) => void) {
        this.renderableChangedListeners = this.renderableChangedListeners.filter(l => l !== listener);
    }

    protected notifyRenderableChanged(isRenderable: boolean, wasRenderable: boolean) {
        this.renderableChangedListeners.forEach(listener => listener(isRenderable, wasRenderable));
    }
}

export interface ExtensionRenderer
    extends Element {

    getIFrameEl(): IFrameEl;

    getChildrenContainer(): DivEl;

    getPreviewAction(): Action;

    getMask(): Mask;
}

class RenderResult {
    private readonly renderable: boolean;
    private readonly extension: Extension;
    private readonly response: Response;
    private readonly data: Record<string, never>;

    constructor(renderable: boolean = false, extension?: Extension, response?: Response, data?: Record<string, never>) {
        this.renderable = renderable;
        this.extension = extension;
        this.response = response;
        this.data = data;
    }

    public isRenderable(): boolean {
        return this.renderable;
    }

    public getExtension(): Extension {
        return this.extension;
    }

    public getResponse(): Response {
        return this.response;
    }

    public getData(): Record<string, never> {
        return this.data;
    }
}
