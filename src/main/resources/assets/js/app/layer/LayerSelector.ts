import {ContentLayer} from '../content/ContentLayer';
import {LayerViewer} from './LayerViewer';
import {LayersList, LayersListItem} from './LayersList';
import {LayerContext} from './LayerContext';
import {LayerChangedEvent} from './LayerChangedEvent';
import {LayerDialogsManager} from './LayerDialogsManager';
import DivEl = api.dom.DivEl;
import DropdownHandle = api.ui.button.DropdownHandle;
import H6El = api.dom.H6El;
import i18n = api.util.i18n;
import PEl = api.dom.PEl;
import ButtonEl = api.dom.ButtonEl;

export class LayerSelector
    extends DivEl {

    private header: DivEl;

    private headerLayerViewer: LayerViewer;

    private layersList: SelectableLayersList;

    private layersListHeader: DivEl;

    private dropdownHandle: DropdownHandle;

    private isLayersListShown: boolean = false;

    private clickOutsideListener: (event: MouseEvent) => void;

    constructor() {
        super('layer-selector');

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.header = new DivEl('selected-layer-view');
        this.headerLayerViewer = new LayerViewer();
        this.dropdownHandle = new DropdownHandle();
        this.layersListHeader = this.createLayersListHeader();
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

    setLayers(layers: ContentLayer[]) {
        const selectedLayer: ContentLayer = LayerContext.get().getCurrentLayer();
        this.headerLayerViewer.setObject(selectedLayer);

        this.layersList.setItems(layers);
        this.layersList.selectLayer(selectedLayer);

        this.layersList.getItemViews().forEach((layersListItem: LayersListItem) => {
            layersListItem.onClicked(() => {
                this.handleListItemSelected(layersListItem);
            });
        });
    }

    private initListeners() {
        this.headerLayerViewer.onClicked((event: MouseEvent) => {
            if (this.isLayersListShown) {
                this.hideLayersList();
            } else {
                this.showLayersList();
            }
        });

        LayerChangedEvent.on(() => {
            this.headerLayerViewer.setObject(LayerContext.get().getCurrentLayer());
        });
    }

    private handleListItemSelected(layersListItem: LayersListItem) {
        if (!layersListItem.getLayer().equals(LayerContext.get().getCurrentLayer())) {
            LayerContext.get().setCurrentLayer(layersListItem.getLayer());
        }

        this.hideLayersList();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.header.appendChildren(
                this.headerLayerViewer,
                this.dropdownHandle,
                this.layersListHeader
            );
            this.appendChildren(
                this.header,
                this.layersList
            );

            this.dropdownHandle.up();
            this.layersListHeader.hide();
            this.layersList.hide();

            return rendered;
        });
    }

    private showLayersList() {
        api.dom.Body.get().onMouseDown(this.clickOutsideListener);
        api.ui.mask.BodyMask.get().show();
        this.isLayersListShown = true;
        this.dropdownHandle.down();
        this.layersListHeader.show();
        this.layersList.show();

    }

    private hideLayersList() {
        api.dom.Body.get().unMouseDown(this.clickOutsideListener);
        api.ui.mask.BodyMask.get().hide();
        this.isLayersListShown = false;
        this.dropdownHandle.up();
        this.layersListHeader.hide();
        this.layersList.hide();
    }

    private createOpenLayerListIcon(): ButtonEl {
        const cogIcon = new ButtonEl();
        cogIcon.addClass('icon-cog');
        cogIcon.onClicked(() => {
            this.hideLayersList();
            LayerDialogsManager.get().openLayersListDialog();
        });

        return cogIcon;
    }

    private createLayersListHeader(): DivEl {
        const header: DivEl = new DivEl('list-header');

        header.appendChildren(
            new H6El('main').setHtml(i18n('field.layers.list.header.main')),
            new PEl('sub').setHtml(i18n('field.layers.list.header.sub')),
            this.createOpenLayerListIcon()
        );

        return header;
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

}
