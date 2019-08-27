import ListBox = api.ui.selector.list.ListBox;
import {ContentLayer} from '../content/ContentLayer';
import {LayerViewer} from './LayerViewer';
import {ContentLayerExtended} from './ContentLayerExtended';

export class LayersList
    extends ListBox<ContentLayerExtended> {

    constructor() {
        super('layers-list-items');
    }

    protected createItemView(item: ContentLayerExtended, readOnly: boolean): LayersListItem {
        return new LayersListItem(item);
    }

    protected getItemId(item: ContentLayer): string {
        return item.getName();
    }
}

export class LayersListItem
    extends api.dom.DivEl {

    private layerViewer: LayerViewer;

    protected layer: ContentLayerExtended;

    constructor(layer: ContentLayerExtended) {
        super('layers-list-item');

        this.layer = layer;

        this.initElements();
    }

    protected initElements() {
        this.layerViewer = new LayerViewer();
        this.layerViewer.setObject(this.layer);
    }

    getLayer(): ContentLayer {
        return this.layer;
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass(`level-${this.layer.getLevel()}`);
            this.getEl().setPaddingLeft(`${this.layer.getLevel() * 15}px`);
            this.appendChild(this.layerViewer);

            return rendered;
        });
    }

}
