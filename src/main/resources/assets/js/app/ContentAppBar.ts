import {ContentLayer} from './content/ContentLayer';
import {LayerSelector} from './layer/LayerSelector';
import {LayerServerEventsHandler} from './layer/event/LayerServerEventsHandler';

export class ContentAppBar
    extends api.app.bar.AppBar {

    private layerSelector: LayerSelector;

    constructor(application: api.app.Application) {
        super(application);

        this.addClass('content-appbar');

        this.listenLayerEvents();
    }

    private listenLayerEvents() {
        LayerServerEventsHandler.getInstance().onLayerCreated((layers: ContentLayer[]) => {
            this.setLayers(layers);
        });

        LayerServerEventsHandler.getInstance().onLayerUpdated((layers: ContentLayer[]) => {
            this.setLayers(layers);
        });

        LayerServerEventsHandler.getInstance().onLayerDeleted((layers: ContentLayer[]) => {
            this.setLayers(layers);
        });
    }

    setLayers(layers: ContentLayer[]) {
        if (layers.length > 1) {
            this.showLayerSelector(layers);
        } else {
            this.hideLayerSelector();
        }
    }

    private showLayerSelector(layers: ContentLayer[]) {
        if (!this.layerSelector) {
            this.initLayerSelector();
        }

        this.layerSelector.setLayers(layers);
        this.addClass('has-layers');
    }

    private initLayerSelector() {
        this.layerSelector = new LayerSelector();
        this.insertChild(this.layerSelector, 1);
    }

    private hideLayerSelector() {
        if (this.layerSelector) {
            this.removeClass('has-layers');
        }
    }

}
