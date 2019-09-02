import SpanEl = api.dom.SpanEl;
import DivEl = api.dom.DivEl;
import {CompareStatusFormatter} from '../../../../content/CompareStatus';
import {ContentInLayerViewer} from './ContentInLayerViewer';
import {ContentInLayer} from '../../../../content/ContentInLayer';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import i18n = api.util.i18n;

export class ContentInLayerItemView
    extends DivEl {

    protected header: ContentInLayerHeader;

    private viewer: ContentInLayerViewer;

    protected item: ContentInLayer;

    constructor(item: ContentInLayer, content?: ContentSummaryAndCompareStatus) {
        super('content-in-layer-item');

        this.initElements();
        this.doSetItem(item, content);
    }

    protected initElements() {
        this.header = new ContentInLayerHeader('header-container');
        this.viewer = new ContentInLayerViewer();
    }

    protected doSetItem(item: ContentInLayer, content: ContentSummaryAndCompareStatus) {
        this.item = item;

        this.header.setItem(this.item, content);
        this.viewer.setObjectAndContent(this.item, content);

        if (content) {
            this.header.setTitle(i18n('widget.layers.header.thisLayer'));
        }
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.doAppendChildren();

            return rendered;
        });
    }

    protected doAppendChildren() {
        this.appendChild(this.header);
        this.appendChild(this.viewer);
    }
}

export class ContentInLayerHeader
    extends DivEl {

    private layerDisplayName: SpanEl;

    private status: SpanEl;

    constructor(className: string) {
        super(className);
        this.layerDisplayName = new SpanEl('layer-display-name');
        this.status = new api.dom.SpanEl('content-status');

        this.appendChildren(this.layerDisplayName, this.status);
    }

    setTitle(title: string) {
        this.layerDisplayName.setHtml(title);
    }

    setItem(item: ContentInLayer, content: ContentSummaryAndCompareStatus) {
        const title = this.layerDisplayName.getHtml();
        if (!title) {
            this.setTitle(item.getLayerDisplayName());
        }

        if (item.getStatus()) {
            const compareStatus = item.getStatus().getCompareStatus();
            const contentSummary = content ? content.getContentSummary() : null;
            const statusText = CompareStatusFormatter.formatStatus(compareStatus, contentSummary);
            const statusClass = CompareStatusFormatter.formatStatus(compareStatus, contentSummary,true);

            this.status.addClass(statusClass.toLowerCase());
            this.status.setHtml(statusText);
        }
    }
}
