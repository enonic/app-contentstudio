import {ContentLayer} from '../content/ContentLayer';
import {LayerViewer} from './LayerViewer';
import {LayersList, LayersListItem} from './LayersList';
import {LayerContext} from './LayerContext';
import {LayerChangedEvent} from './LayerChangedEvent';
import DivEl = api.dom.DivEl;
import DropdownHandle = api.ui.button.DropdownHandle;
import H6El = api.dom.H6El;
import i18n = api.util.i18n;
import PEl = api.dom.PEl;

export class LayerSelector
    extends DivEl {

    private header: DivEl;

    private headerLayerViewer: LayerViewer;

    private layersList: SelectableLayersList;

    private dropdownHandle: DropdownHandle;

    private isLayersListShown: boolean = false;

    private clickOutsideListener: (event: MouseEvent) => void;

    constructor(layers: ContentLayer[]) {
        super('layer-selector');

        this.initElements(layers);
        this.setInitialData(layers);
        this.initListeners();
    }

    private initElements(layers: ContentLayer[]) {
        this.header = new DivEl('selected-layer-view');
        this.headerLayerViewer = new LayerViewer();
        this.dropdownHandle = new DropdownHandle();
        this.layersList = new SelectableLayersList();
        this.clickOutsideListener = this.createClickOutsideListener();
    }

    private createClickOutsideListener() {
        return (event: MouseEvent) => {
            if (this.isVisible()) {
                for (let element = event.target; element; element = (<any>element).parentNode) {
                    if (element === this.getHTMLElement()) {
                        return;
                    }
                }

                if (this.isLayersListShown) {
                    this.hideLayersList();
                }
            }
        };
    }

    private setInitialData(layers: ContentLayer[]) {
        const selectedLayer: ContentLayer = LayerContext.get().getCurrentLayer();
        this.headerLayerViewer.setObject(selectedLayer);

        this.layersList.setItems(layers);
        this.layersList.selectLayer(selectedLayer);
    }

    private initListeners() {

        this.header.onClicked((event: MouseEvent) => {
            if (this.isLayersListShown) {
                this.hideLayersList();
            } else {
                this.showLayersList();
            }
        });

        this.layersList.getItemViews().forEach((layersListItem: LayersListItem) => {
            layersListItem.onClicked(() => {
                this.handleListItemSelected(layersListItem);
            });
        });
    }

    private handleListItemSelected(layersListItem: LayersListItem) {
        if (!layersListItem.getLayer().equals(LayerContext.get().getCurrentLayer())) {
            this.headerLayerViewer.setObject(layersListItem.getLayer());
            LayerContext.get().setCurrentLayer(layersListItem.getLayer());
            new LayerChangedEvent().fire();
        }

        this.hideLayersList();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.header.appendChild(this.headerLayerViewer);
            this.header.appendChild(this.dropdownHandle);
            this.appendChild(this.header);
            this.appendChild(this.layersList);

            this.hideLayersList();

            return rendered;
        });
    }

    private showLayersList() {
        api.dom.Body.get().onMouseDown(this.clickOutsideListener);
        api.ui.mask.BodyMask.get().show();
        this.isLayersListShown = true;
        this.dropdownHandle.down();
        this.layersList.show();

    }

    private hideLayersList() {
        api.dom.Body.get().unMouseDown(this.clickOutsideListener);
        api.ui.mask.BodyMask.get().hide();
        this.isLayersListShown = false;
        this.dropdownHandle.up();
        this.layersList.hide();
    }

}

class SelectableLayersList
    extends LayersList {

    private selectedListItem: LayersListItem;

    protected createItemView(item: ContentLayer, readOnly: boolean): LayersListItem {
        const layersListItem: LayersListItem = super.createItemView(item, readOnly);

        layersListItem.onClicked(() => {
            this.handleListItemSelected(layersListItem);
        });

        return layersListItem;
    }

    private handleListItemSelected(layersListItem: LayersListItem) {
        this.selectedListItem.removeClass('selected');
        layersListItem.addClass('selected');
        this.selectedListItem = layersListItem;
    }

    selectLayer(layer: ContentLayer) {
        this.getItemViews().some((view: LayersListItem) => {
            if (view.getLayer().equals(layer)) {
                view.addClass('selected');
                this.selectedListItem = view;
                return true;
            }

            return false;
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const header: DivEl = new DivEl('list-header');
            header.appendChild(new H6El('main').setHtml(i18n('field.layers.list.header.main')));
            header.appendChild(new PEl('sub').setHtml(i18n('field.layers.list.header.sub')));

            this.prependChild(header);

            return rendered;
        });
    }

}
