import SpanEl = api.dom.SpanEl;
import DivEl = api.dom.DivEl;
import {CompareStatusFormatter} from '../../../../content/CompareStatus';
import {ContentInLayerViewer} from './ContentInLayerViewer';
import {ContentInLayer} from '../../../../content/ContentInLayer';

export class ContentInLayerItemView
    extends DivEl {

    protected header: ContentInLayerHeader;

    private viewer: ContentInLayerViewer;

    protected item: ContentInLayer;

    constructor(item: ContentInLayer, title?: string) {
        super('content-in-layer-item');

        this.initElements();
        this.doSetItem(item);
        if (title) {
            this.header.setTitle(title);
        }
    }

    protected initElements() {
        this.header = new ContentInLayerHeader('header-container');
        this.viewer = new ContentInLayerViewer();
    }

    protected doSetItem(item: ContentInLayer) {
        this.item = item;

        this.header.setItem(this.item);
        this.viewer.setObject(this.item);
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

class ContentInLayerHeader
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

    setItem(item: ContentInLayer) {

        this.setTitle(item.getLayerDisplayName());

        if (item.getStatus()) {
            const statusText = CompareStatusFormatter.doFormatStatus(item.getStatus().getCompareStatus(), item.getPublishFirstTime());
            const statusClass = CompareStatusFormatter.doFormatStatus(item.getStatus().getCompareStatus(), item.getPublishFirstTime(),
                true);

            this.status.addClass(statusClass.toLowerCase());
            this.status.setHtml(statusText);
        }
    }
}
