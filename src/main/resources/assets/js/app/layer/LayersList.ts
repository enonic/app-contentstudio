import ListBox = api.ui.selector.list.ListBox;
import ActionButton = api.ui.button.ActionButton;
import Action = api.ui.Action;
import {ContentLayer} from '../content/ContentLayer';
import {LayerViewer} from './LayerViewer';

export class LayersList
    extends ListBox<ContentLayer> {

    private editClickedListeners: { (layer: ContentLayer): void; }[] = [];

    private removeClickedListeners: { (layer: ContentLayer): void; }[] = [];

    constructor() {
        super('layers-list-dialog-items');
    }

    setItems(items: ContentLayer[], silent?: boolean) {
        new LayersSorter(items).sort();
        super.setItems(items, silent);
    }

    protected createItemView(item: ContentLayer, readOnly: boolean): api.dom.Element {
        const layersHelper: LayersHelper = new LayersHelper(this.getItems());
        const layersListItem: LayersListItem = new LayersListItem(item, layersHelper.hasChildLayers(item),
            layersHelper.getLayerLevel(item));

        layersListItem.onEditClicked((layer: ContentLayer) => {
            this.notifyEditClicked(layer);
        });

        layersListItem.onRemoveClicked((layer: ContentLayer) => {
            this.notifyRemoveClicked(layer);
        });

        return layersListItem;
    }

    protected getItemId(item: ContentLayer): string {
        return item.getName();
    }

    onEditClicked(listener: (layer: ContentLayer) => void) {
        this.editClickedListeners.push(listener);
    }

    private notifyEditClicked(layer: ContentLayer) {
        this.editClickedListeners.forEach((listener) => {
            listener(layer);
        });
    }

    onRemoveClicked(listener: (layer: ContentLayer) => void) {
        this.removeClickedListeners.push(listener);
    }

    private notifyRemoveClicked(layer: ContentLayer) {
        this.removeClickedListeners.forEach((listener) => {
            listener(layer);
        });
    }
}

class LayersListItem
    extends api.dom.DivEl {

    private layer: ContentLayer;

    private layerViewer: LayerViewer;

    private hasChildLayers: boolean;

    private level: number;

    private editButton: ActionButton;

    private removeButton: ActionButton;

    private editClickedListeners: { (layer: ContentLayer): void; }[] = [];

    private removeClickedListeners: { (layer: ContentLayer): void; }[] = [];

    constructor(layer: ContentLayer, hasChildLayers: boolean, level: number) {
        super('layers-list-dialog-item');

        this.layer = layer;
        this.hasChildLayers = hasChildLayers;
        this.level = level;

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.layerViewer = new LayerViewer();
        this.layerViewer.setObject(this.layer);
        this.editButton = new ActionButton(new Action(''));
        this.removeButton = new ActionButton(new Action(''));

        if (this.hasChildLayers) {
            this.removeButton.setEnabled(false);
        }
    }

    private initListeners() {
        this.editButton.getAction().onExecuted(() => {
            this.notifyEditClicked();
        });

        if (this.hasChildLayers) {
            return;
        }

        this.removeButton.getAction().onExecuted(() => {
            this.notifyRemoveClicked();
        });
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.editButton.setClass('edit-button');
            this.removeButton.setClass('remove-button');
            this.addClass(`level-${this.level}`);

            this.appendChild(this.layerViewer);
            this.appendChild(this.editButton);
            this.appendChild(this.removeButton);

            return rendered;
        });
    }

    onEditClicked(listener: (layer: ContentLayer) => void) {
        this.editClickedListeners.push(listener);
    }

    private notifyEditClicked() {
        this.editClickedListeners.forEach((listener) => {
            listener(this.layer);
        });
    }

    onRemoveClicked(listener: (layer: ContentLayer) => void) {
        this.removeClickedListeners.push(listener);
    }

    private notifyRemoveClicked() {
        this.removeClickedListeners.forEach((listener) => {
            listener(this.layer);
        });
    }
}

class LayersHelper {

    protected layers: ContentLayer[];

    constructor(layers: ContentLayer[]) {
        this.layers = layers;
    }

    hasChildLayers(layer: ContentLayer): boolean {
        return layer.isBaseLayer() || this.layers.some((item: ContentLayer) => {
            return layer.getName() === item.getParentName();
        });
    }

    getLayerLevel(layer: ContentLayer): number {
        if (layer.isBaseLayer()) {
            return 1;
        }

        if (layer.getParentName() === ContentLayer.DEFAULT_LAYER_NAME) {
            return 2;
        }

        const parentLayer: ContentLayer = this.getParentLayer(layer);

        return 1 + this.getLayerLevel(parentLayer);
    }

    getParentLayer(layer: ContentLayer): ContentLayer {
        if (layer.isBaseLayer()) {
            return null;
        }

        const result: ContentLayer[] = this.layers.filter((item: ContentLayer) => item.getName() === layer.getParentName());
        if (result.length > 0) {
            return result[0];
        }

        return null;
    }
}

class LayersSorter
    extends LayersHelper {

    sort() {
        this.layers.sort(this.doSort.bind(this));
    }

    private doSort(a: ContentLayer, b: ContentLayer): number {
        if (this.isLayerAParentOfB(a, b)) {
            return -1;
        }

        if (this.isLayerAParentOfB(b, a)) {
            return 1;
        }

        return 0;
    }

    private isLayerAParentOfB(a: ContentLayer, b: ContentLayer): boolean {
        if (a.isBaseLayer()) {
            return true;
        }

        if (a.getName() === b.getParentName()) {
            return true;
        }

        const parentLayer: ContentLayer = this.getParentLayer(b);

        if (!!parentLayer) {
            return this.isLayerAParentOfB(a, parentLayer);
        }

        return false;
    }
}
