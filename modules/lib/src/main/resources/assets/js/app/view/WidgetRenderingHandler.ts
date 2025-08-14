import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentSummary} from '../content/ContentSummary';
import {RenderingMode} from '../rendering/RenderingMode';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PreviewActionHelper} from '../action/PreviewActionHelper';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Mask} from '@enonic/lib-admin-ui/ui/mask/Mask';
import {ViewWidgetEvent} from '../event/ViewWidgetEvent';
import {EmulatedEvent} from '../event/EmulatedEvent';
import {PreviewWidgetDropdown} from './toolbar/PreviewWidgetDropdown';
import {EmulatorContext} from './context/widget/emulator/EmulatorContext';

export enum PREVIEW_TYPE {
    WIDGET,
    EMPTY,
    FAILED,
    MISSING,
}

export class WidgetRenderingHandler {

    private WIDGET_HEADER_NAME = 'enonic-widget-data';

    protected readonly renderer: WidgetRenderer;

    private previewType: PREVIEW_TYPE;

    private itemRenderable: Q.Promise<boolean> = Q(false);

    private previewHelper: PreviewActionHelper;

    private emptyView: DivEl;

    protected messageView: DivEl;

    private summary: ContentSummary;

    protected mode: RenderingMode;

    protected renderableChangedListeners: ((isRenderable: boolean, wasRenderable: boolean) => void)[] = [];


    constructor(renderer: WidgetRenderer, previewHelper?: PreviewActionHelper) {
        this.renderer = renderer;
        this.mode = RenderingMode.INLINE;
        this.previewHelper = previewHelper || new PreviewActionHelper();
        this.emptyView = this.createEmptyView();
        this.messageView = this.createErrorView();
    }


    public async render(summary: ContentSummary, widget: Widget): Promise<boolean> {

        const deferred = Q.defer<boolean>();

        const wasRenderable = await this.isItemRenderable();
        this.itemRenderable = deferred.promise;

        if (!widget || !summary) {
            this.setPreviewType(PREVIEW_TYPE.EMPTY);
            deferred.resolve(false);
            return;
        }

        this.summary = summary;

        this.showMask();
        this.renderer.getPreviewAction()?.setEnabled(false);

        return this.doRender(summary, widget)
            .then((result) => {
                const isRenderable = result.isRenderable();
                deferred.resolve(isRenderable);

                if (isRenderable !== wasRenderable) {
                    this.notifyRenderableChanged(isRenderable, wasRenderable);
                }

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
                deferred.resolve(false);

                return false;
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
        return this.createMessageView(i18n('panel.noselection'), 'no-selection-message');
    }

    protected createErrorView(): DivEl {
        return this.createMessageView(this.getDefaultMessage(), 'no-preview-message');
    }

    private createMessageView(message: string, className?: string): DivEl {
        const previewText: SpanEl = new SpanEl();
        previewText.setHtml(message);
        const previewMessage = new DivEl(className);
        previewMessage.appendChild(previewText);
        return previewMessage;
    }

    protected setPreviewType(previewType: PREVIEW_TYPE, messages?: string[]) {
        this.renderer.removeClass('widget-preview empty-preview message-preview');

        switch (previewType) {
        case PREVIEW_TYPE.WIDGET: {
            this.renderer.addClass('widget-preview');
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
        this.messageView.removeChildren();

        messages.forEach((message: string) => {
            this.messageView.appendChild(SpanEl.fromText(message));
        });
    }

    protected handlePreviewSuccess(response: Response, data: Record<string, never>) {
        this.renderer.getPreviewAction()?.setEnabled(true);
        this.setPreviewType(PREVIEW_TYPE.WIDGET);

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

    protected extractWidgetData(response: Response): Record<string, never> {
        try {
            const data = response.headers.get(this.WIDGET_HEADER_NAME);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            // no data
        }
        return {};
    }

    private async doRender(summary: ContentSummary, selectedWidget: Widget): Promise<RenderResult> {
        if (!selectedWidget || !summary) {
            return new RenderResult();
        }
        const isAuto = selectedWidget.getWidgetDescriptorKey().getName() === PreviewWidgetDropdown.WIDGET_AUTO_DESCRIPTOR;
        const items = isAuto ? this.renderer.getWidgetSelector().getAutoModeWidgets() : [selectedWidget];
        let response: Response;
        let widget: Widget;
        let isOk: boolean;
        let data: Record<string, never>;
        if (isAuto) {
            // clear previous preview url for this mode
            this.previewHelper.setPreviewUrl(selectedWidget);
        }
        for (widget of items) {
            const url = this.previewHelper.getUrl(summary, widget, this.mode) + '&auto=' + isAuto;
            response = await fetch(url, {method: 'HEAD'});

            data = this.extractWidgetData(response);
            if (data.redirect) {
                // follow redirect manually to get data headers first
                response = await fetch(data.redirect, {method: 'HEAD'});
            }

            isOk = this.isResponseOk(response, isAuto);
            if (isOk) {
                break;
            }
        }
        if (isAuto && isOk) {
            // don't save the final url, because they are different for different modes
            this.previewHelper.setPreviewUrl(selectedWidget, widget.getFullUrl());
        }

        return new RenderResult(isOk, widget, response, data);
    }

    private isResponseOk(response: Response, isAuto: boolean) {
        return response.ok || !isAuto && response.status !== StatusCode.I_AM_A_TEAPOT;
    }

    private applyImageStyles(frameWindow: Window) {
        const body = frameWindow.document.body;
        if (body) {
            body.style.display = 'flex';
            body.style.justifyContent = 'center';
            body.style.alignItems = 'center';
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

    protected handleWidgetEvent(event: ViewWidgetEvent) {
        if (!this.summary) {
            return;
        }

        void this.render(this.summary, event.getWidget());
    }

    protected handleEmulatorEvent(event: EmulatedEvent) {
        if (this.messageView) {
            this.messageView.getEl().setWidth(event.getWidthWithUnits());
            this.messageView.getEl().setHeight(event.getHeightWithUnits());
        }

        // Keep no selection message intact,
        // Since no toolbar shown when no content is selected
        const subjects = [
            this.renderer.getIFrameEl().getHTMLElement(),
            this.messageView.getHTMLElement()
        ];
        const isFullscreen = event.isFullscreen();
        subjects.forEach(s => {
            s.style.width = !isFullscreen ? event.getWidthWithUnits() : '';
            s.style.height = !isFullscreen ? event.getHeightWithUnits() : '';
        });

        this.renderer.getEl().toggleClass('emulated', !isFullscreen);
    }

    protected bindListeners() {
        ViewWidgetEvent.on(this.handleWidgetEvent.bind(this));

        EmulatorContext.get().onDeviceChanged(this.handleEmulatorEvent.bind(this));

        const iframe = this.renderer.getIFrameEl();
        iframe.onLoaded((event: UIEvent) => {
            if (this.previewType === PREVIEW_TYPE.EMPTY) {
                return;
            }

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

export interface WidgetRenderer
    extends Element {

    getIFrameEl(): IFrameEl;

    getChildrenContainer(): DivEl;

    getPreviewAction(): Action;

    getWidgetSelector(): PreviewWidgetDropdown;

    getMask(): Mask;
}

class RenderResult {
    private readonly renderable: boolean;
    private readonly widget: Widget;
    private readonly response: Response;
    private readonly data: Record<string, never>;

    constructor(renderable: boolean = false, widget?: Widget, response?: Response, data?: Record<string, never>) {
        this.renderable = renderable;
        this.widget = widget;
        this.response = response;
        this.data = data;
    }

    public isRenderable(): boolean {
        return this.renderable;
    }

    public getWidget(): Widget {
        return this.widget;
    }

    public getResponse(): Response {
        return this.response;
    }

    public getData(): Record<string, never> {
        return this.data;
    }
}
