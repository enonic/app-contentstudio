import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {ContentItemPreviewToolbar, WidgetPreviewAction} from './ContentItemPreviewToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {EmulatedEvent} from '../event/EmulatedEvent';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ItemPreviewPanel} from '@enonic/lib-admin-ui/app/view/ItemPreviewPanel';
import {ContentResourceRequest} from '../resource/ContentResourceRequest';
import {ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';
import {ContentSummaryAndCompareStatusHelper} from '../content/ContentSummaryAndCompareStatusHelper';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {ContentSummary} from '../content/ContentSummary';
import {PreviewActionHelper} from '../action/PreviewActionHelper';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PreviewWidgetDropdown} from './toolbar/PreviewWidgetDropdown';

enum PREVIEW_TYPE {
    WIDGET,
    EMPTY,
    FAILED,
    MISSING,
}

export class ContentItemPreviewPanel
    extends ItemPreviewPanel<ViewItem> {

    private WIDGET_HEADER_NAME = 'enonic-widget-data';

    protected item: ViewItem;
    protected skipNextSetItemCall: boolean = false;
    protected previewType: PREVIEW_TYPE;
    protected previewMessage: DivEl;
    protected noSelectionMessage: DivEl;
    protected debouncedSetItem: (item: ViewItem) => void;
    protected readonly contentRootPath: string;
    private previewHelper: PreviewActionHelper;
    private itemRenderable: Q.Promise<boolean>;

    constructor(contentRootPath?: string) {
        super('content-item-preview-panel');

        this.contentRootPath = contentRootPath || ContentResourceRequest.CONTENT_PATH;
        this.debouncedSetItem = AppHelper.runOnceAndDebounce(this.doSetItem.bind(this), 300);
        this.previewHelper = new PreviewActionHelper();

        this.initElements();
        this.setupListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.wrapper.appendChildren(this.noSelectionMessage, this.previewMessage);
            this.mask.addClass('content-item-preview-panel-load-mask');
            return rendered;
        });
    }

    private initElements() {
        const selectorText: SpanEl = new SpanEl();
        selectorText.setHtml(i18n('panel.noselection'));
        this.noSelectionMessage = new DivEl('no-selection-message');
        this.noSelectionMessage.appendChild(selectorText);

        const previewText: SpanEl = new SpanEl();
        previewText.setHtml(i18n('field.preview.notAvailable'));
        this.previewMessage = new DivEl('no-preview-message');
        this.previewMessage.appendChild(previewText);
    }

    public setItem(item: ViewItem) {
        this.debouncedSetItem(item);
    }

    protected viewItemToContent(item: ViewItem): ContentSummaryAndCompareStatus {
        return item as ContentSummaryAndCompareStatus;
    }

    protected async doSetItem(item: ViewItem, force: boolean = false) {
        const content = this.viewItemToContent(item);

        this.toolbar.setItem(item);

        return this.isPreviewUpdateNeeded(content, force).then((updateNeeded) => {
            // only update this.item after the isPreviewUpdateNeeded check because it uses it
            this.item = item;

            if (updateNeeded) {
                return this.update(content);
            }
        });
    }

    public isPreviewUpdateNeeded(item: ContentSummaryAndCompareStatus, force?: boolean): Q.Promise<boolean> {
        if (this.skipNextSetItemCall) {
            return Q(false);
        }
        if (this.isItemAllowsUpdate(item, force)) {
            return Q(true);
        }
        return this.isItemRenderable();
    }

    private isItemAllowsUpdate(item: ContentSummaryAndCompareStatus, force?: boolean): boolean {
        return item && (force || this.isOtherContent(item) || this.isItemChanged(item));
    }

    private isOtherContent(item: ContentSummaryAndCompareStatus): boolean {
        return item?.getId() != this.item?.getId();
    }

    private isItemChanged(item: ContentSummaryAndCompareStatus): boolean {
        const diff = ContentSummaryAndCompareStatusHelper.diff(item, this.item as ContentSummaryAndCompareStatus);
        return diff.renderable || !!diff.contentSummary?.path || !!diff.contentSummary?.displayName || !!diff.contentSummary?.name ||
               !!diff.contentSummary?.inherit;
    }

    protected async update(item: ContentSummaryAndCompareStatus) {
        let contentSummary = item.getContentSummary();
        return this.fetchPreviewForPath(contentSummary);
    }

    public isItemRenderable(): Q.Promise<boolean> {
        return this.itemRenderable ?? Q(true);
    }

    private async fetchPreviewForPath(summary: ContentSummary): Promise<void> {

        const deferred = Q.defer<boolean>();
        this.itemRenderable = deferred.promise;

        const widgetSelector = (this.toolbar as ContentItemPreviewToolbar).getWidgetSelector();
        const selectedWidget = widgetSelector.getSelectedWidget();
        if (!selectedWidget || !summary) {
            this.setPreviewType(PREVIEW_TYPE.EMPTY);
            return;
        }

        this.showMask();

        const isAuto = selectedWidget.getWidgetDescriptorKey().getName() === PreviewWidgetDropdown.WIDGET_AUTO_DESCRIPTOR;
        const items = isAuto ? widgetSelector.getAutoModeWidgets() : [selectedWidget];

        return this.processWidgets(summary, items, selectedWidget);
    }

    private async processWidgets(summary: ContentSummary, items: Widget[], selectedWidget: Widget): Promise<void> {
        for (let i = 0; i < items.length; i++) {
            const widget = items[i];
            let result = await fetch(this.previewHelper.getUrl(summary, widget), {method: 'HEAD'});

            let isOK = this.isResponseOk(result, selectedWidget);

            if (isOK) {
                selectedWidget.getConfig().setProperty("previewUrl", widget.getUrl());
                this.handlePreviewSuccess(result);
                break;
            } else if (i === items.length - 1) {
                this.handlePreviewFailure(result);
            }
        }
    }

    public clearItem() {
        (this.toolbar as ContentItemPreviewToolbar).clearItem();
    }

    private setupListeners() {

        this.onHidden((event) => {
            if (this.mask.isVisible()) {
                this.hideMask();
            }
        });

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

        (this.toolbar as ContentItemPreviewToolbar).getWidgetSelector().onSelectionChanged(() => {
            let contentSummary = this.viewItemToContent(this.item).getContentSummary();
            this.fetchPreviewForPath(contentSummary);
        });

        EmulatedEvent.on((event: EmulatedEvent) => {

            if (this.previewMessage) {
                this.previewMessage.getEl().setWidth(event.getWidthWithUnits());
                this.previewMessage.getEl().setHeight(event.getHeightWithUnits());
            }

            // Keep no selection message intact,
            // Since no toolbar shown when no content is selected
            const subjects = [
                this.frame.getHTMLElement(),
                this.previewMessage.getHTMLElement()
            ];
            const isFS = event.isFullscreen();
            subjects.forEach(s => {
                s.style.width = !isFS ? event.getWidthWithUnits() : '';
                s.style.height = !isFS ? event.getHeightWithUnits() : '';
            });

            const fullscreen = event.isFullscreen();
            this.wrapper.getEl().toggleClass('emulated', !fullscreen);
        });
    }

    protected getToolbar(): ContentItemPreviewToolbar {
        return this.toolbar as ContentItemPreviewToolbar;
    }

    createToolbar(): ContentItemPreviewToolbar {
        return new ContentItemPreviewToolbar();
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

    private setPreviewType(previewType: PREVIEW_TYPE, messages?: string[]) {

        this.getEl().removeClass('widget-preview no-preview');

        switch (previewType) {
        case PREVIEW_TYPE.WIDGET: {
            this.getEl().addClass('widget-preview');
            break;
        }
        case PREVIEW_TYPE.FAILED:
        case PREVIEW_TYPE.MISSING: {
            this.showPreviewMessages(messages || [i18n('field.preview.failed'), i18n('field.preview.missing.description')]);
            break;
        }
        case PREVIEW_TYPE.EMPTY:
        default: {
            this.showPreviewMessages(messages || [i18n('field.preview.notAvailable')]);
            break;
        }
        }

        this.previewType = previewType;
    }

    private showPreviewMessages(messages: string[]) {
        this.getEl().addClass('no-preview');
        this.previewMessage.removeChildren();

        messages.forEach((message: string) => {
            this.previewMessage.appendChild(SpanEl.fromText(message));
        });
    }

    private handlePreviewSuccess(response: Response) {
        this.getPreviewAction().setEnabled(true);
        this.setPreviewType(PREVIEW_TYPE.WIDGET);

        const contentType = response.headers.get('content-type');
        let mainType = 'other';
        if (contentType) {
            mainType = contentType.split('/')[0];
        }

        this.frame.setClass(mainType);
        this.frame.setSrc(response.url);
    }

    private handlePreviewFailure(response?: Response) {

        this.getPreviewAction().setEnabled(false);

        const statusCode = response.status;
        if (statusCode > 0) {

            const messages = this.extractWidgetMessages(response);

            switch (statusCode) {
            case StatusCode.NOT_FOUND:
            case StatusCode.I_AM_A_TEAPOT:
                this.setPreviewType(PREVIEW_TYPE.EMPTY, messages);
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

    private extractWidgetMessages(response: Response) {
        let messages: string[];
        try {
            const data = response.headers.get(this.WIDGET_HEADER_NAME);
            const json = data && JSON.parse(data);
            messages = json && json.messages;
        } catch (e) {
            // default messages will be used
        }
        return messages;
    }

    public showMask() {
        super.showMask();
        if (this.isVisible()) {
            this.addClass('loading');
        }
    }

    public hideMask() {
        super.hideMask();
        this.removeClass('loading');
    }

    public isMaskOn(): boolean {
        return this.mask.isVisible();
    }

    getActions(): Action[] {
        return [
            ...super.getActions(),
            this.getPreviewAction()
        ];
    }

    private getPreviewAction(): WidgetPreviewAction {
        return this.getToolbar().getPreviewAction();
    }

    private isResponseOk(response: Response, selectedWidget: Widget) {
        const isAuto = selectedWidget?.getWidgetDescriptorKey().getName() === PreviewWidgetDropdown.WIDGET_AUTO_DESCRIPTOR;
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
}
