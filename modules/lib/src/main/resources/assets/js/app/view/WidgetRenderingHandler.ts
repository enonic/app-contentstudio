import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentSummary} from '../content/ContentSummary';
import {RenderingMode} from '../rendering/RenderingMode';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';
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

export interface WidgetRenderer
    extends Element {

    getIFrameEl(): IFrameEl;

    getChildrenContainer(): DivEl;

    getPreviewAction(): Action;

    getWidgetSelector(): PreviewWidgetDropdown;

    getMask(): Mask;
}

export class WidgetRenderingHandler {

    private WIDGET_HEADER_NAME = 'enonic-widget-data';

    private frame: IFrameEl;

    protected readonly renderer: WidgetRenderer;

    private mask: Mask;

    private previewType: PREVIEW_TYPE;

    private itemRenderable: Q.Promise<boolean> = Q(false);

    private previewHelper: PreviewActionHelper;

    private previewAction: Action;

    private emptyView: DivEl;

    protected messageView: DivEl;

    private summary: ContentSummary;

    protected mode: RenderingMode;

    protected renderableChangedListeners: ((isRenderable: boolean, wasRenderable: boolean) => void)[] = [];


    constructor(renderer: WidgetRenderer) {
        this.renderer = renderer;
        this.frame = renderer.getIFrameEl();
        this.previewAction = renderer.getPreviewAction();
        this.mask = renderer.getMask();
        this.mode = RenderingMode.INLINE;
        this.previewHelper = new PreviewActionHelper();
        this.emptyView = this.createEmptyView();
        this.messageView = this.createErrorView();
    }


    public async renderWithWidget(summary: ContentSummary, widget: Widget): Promise<boolean> {

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

        return this.doIsRenderableWithWidget(summary, widget).then(([renderable, actualWidget, response, data]) => {
            deferred.resolve(renderable);

            if (renderable !== wasRenderable) {
                this.notifyRenderableChanged(renderable, wasRenderable);
            }

            if (renderable) {
                this.handlePreviewSuccess(response, data);
            } else {
                // handle last item failure meaning no one was successful
                this.handlePreviewFailure(response, data);
            }

            return renderable;
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
        const selectorText: SpanEl = new SpanEl();
        selectorText.setHtml(i18n('panel.noselection'));
        const noSelectionMessage = new DivEl('no-selection-message');
        noSelectionMessage.appendChild(selectorText);
        return noSelectionMessage;
    }

    protected createErrorView(): DivEl {
        const previewText: SpanEl = new SpanEl();
        previewText.setHtml(this.getDefaultMessage());
        const previewMessage = new DivEl('no-preview-message');
        previewMessage.appendChild(previewText);
        return previewMessage;
    }

    protected setPreviewType(previewType: PREVIEW_TYPE, messages?: string[]) {

        console.log('setPreviewType', PREVIEW_TYPE[previewType], messages);

        this.renderer.removeClass('widget-preview empty-preview message-preview');

        switch (previewType) {
        case PREVIEW_TYPE.WIDGET: {
            this.renderer.addClass('widget-preview');
            break;
        }
        case PREVIEW_TYPE.FAILED:
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
        if (this.previewAction) {
            this.previewAction.setEnabled(true);
        }
        this.setPreviewType(PREVIEW_TYPE.WIDGET);

        const contentType = response.headers.get('content-type');
        let mainType = 'other';
        if (contentType) {
            mainType = contentType.split('/')[0];
        }

        this.frame.setClass(mainType);
        this.frame.setSrc(response.url);
    }

    protected handlePreviewFailure(response?: Response, data?: Record<string, never>) {
        if (this.previewAction) {
            this.previewAction.setEnabled(false);
        }

        const statusCode = response.status;
        if (statusCode > 0) {

            const messages: string[] = (data?.messages as string[])?.length ? data.messages : undefined;

            switch (statusCode) {
            case StatusCode.NOT_FOUND:
            case StatusCode.I_AM_A_TEAPOT:
                this.setPreviewType(PREVIEW_TYPE.FAILED, messages || [this.getDefaultMessage()]);
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

    private async doIsRenderableWithWidget(summary: ContentSummary,
                                           selectedWidget: Widget): Promise<[boolean, Widget, Response, Record<string, never>]> {
        if (!selectedWidget || !summary) {
            return [false, undefined, undefined, undefined];
        }
        const isAuto = selectedWidget.getWidgetDescriptorKey().getName() === PreviewWidgetDropdown.WIDGET_AUTO_DESCRIPTOR;
        const items = isAuto ? this.renderer.getWidgetSelector().getAutoModeWidgets() : [selectedWidget];
        let response: Response;
        let widget: Widget;
        let isOk: boolean;
        let data: Record<string, never>;
        if (isAuto) {
            // clear previous preview url for this mode
            this.previewHelper.setPreviewUrl(selectedWidget, undefined);
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
            this.previewHelper.setPreviewUrl(selectedWidget, widget.getUrl());
        }

        return [isOk, widget, response, data];
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

        this.renderWithWidget(this.summary, event.getWidget());
    }

    protected handleEmulatorEvent(event: EmulatedEvent) {
        if (this.messageView) {
            this.messageView.getEl().setWidth(event.getWidthWithUnits());
            this.messageView.getEl().setHeight(event.getHeightWithUnits());
        }

        // Keep no selection message intact,
        // Since no toolbar shown when no content is selected
        const subjects = [
            this.frame.getHTMLElement(),
            this.messageView.getHTMLElement()
        ];
        const isFS = event.isFullscreen();
        subjects.forEach(s => {
            s.style.width = !isFS ? event.getWidthWithUnits() : '';
            s.style.height = !isFS ? event.getHeightWithUnits() : '';
        });

        const fullscreen = event.isFullscreen();
        this.renderer.getEl().toggleClass('emulated', !fullscreen);
    }

    protected bindListeners() {
        ViewWidgetEvent.on(this.handleWidgetEvent.bind(this));

        EmulatorContext.get().onDeviceChanged(this.handleEmulatorEvent.bind(this));

        this.frame.onLoaded((event: UIEvent) => {
            if (this.previewType === PREVIEW_TYPE.EMPTY) {
                return;
            }

            this.hideMask();

            const frameWindow = this.frame.getHTMLElement()['contentWindow'];

            switch (this.frame.getClass()) {
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
        const linkClicked: string = this.getLinkClicked(event);
        if (linkClicked) {
            if (!!frameWindow && !UriHelper.isNavigatingOutsideOfXP(linkClicked, frameWindow)) {
                const contentPreviewPath = UriHelper.trimUrlParams(
                    UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(linkClicked,
                        frameWindow)));
                if (!this.isNavigatingWithinSamePage(contentPreviewPath, frameWindow) && !this.isDownloadLink(contentPreviewPath)) {
                    new ContentPreviewPathChangedEvent(contentPreviewPath).fire();
                }
            }
        }
    }

    private getLinkClicked(event: UIEvent): string {
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

    private isNavigatingWithinSamePage(contentPreviewPath: string, frameWindow: Window): boolean {
        const href = frameWindow.location.href;
        return contentPreviewPath === UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(href, frameWindow));
    }

    private isDownloadLink(contentPreviewPath: string): boolean {
        return contentPreviewPath.indexOf('attachment/download') > 0;
    }

    public showMask() {
        if (this.renderer.isVisible()) {
            if (this.mask) {
                this.mask.show();
            }
            this.renderer.addClass('loading');
        }
    }

    public hideMask() {
        if (this.mask) {
            this.mask.hide();
        }
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
