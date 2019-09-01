import LayerServerEvent = api.layer.event.LayerServerEvent;
import NodeServerChangeType = api.event.NodeServerChangeType;
import {ListContentLayerRequest} from '../../resource/layer/ListContentLayerRequest';
import {ContentLayer} from '../../content/ContentLayer';
import {LayerContext} from '../LayerContext';

export class LayerServerEventsHandler {

    private static INSTANCE: LayerServerEventsHandler = new LayerServerEventsHandler();

    private handler: (event: LayerServerEvent) => void;

    private layerCreatedListeners: { (layers: ContentLayer[]): void }[] = [];

    private layerUpdatedListeners: { (layers: ContentLayer[]): void }[] = [];

    private layerDeletedListeners: { (layers: ContentLayer[]): void }[] = [];

    private constructor() {
        // to let lint bypass
    }

    public static getInstance(): LayerServerEventsHandler {
        return LayerServerEventsHandler.INSTANCE;
    }

    start() {
        if (!this.handler) {
            this.handler = this.layerServerEventHandler.bind(this);
        }
        LayerServerEvent.on(this.handler);
    }

    stop() {
        if (this.handler) {
            LayerServerEvent.un(this.handler);
            this.handler = null;
        }
    }

    private layerServerEventHandler(event: LayerServerEvent) {

        if (event.getType() === NodeServerChangeType.CREATE) {
            this.handleLayersCreated();
        }

        if (event.getType() === NodeServerChangeType.UPDATE) {
            this.handleLayersUpdated();
        }

        if (event.getType() === NodeServerChangeType.DELETE) {
            this.handleLayersDeleted();
        }
    }

    private handleLayersCreated() {
        setTimeout(() => {
            new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
                this.notifyLayerCreated(layers);
            }).catch(api.DefaultErrorHandler.handle);
        }, 1000);
    }

    private handleLayersUpdated() {
        new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.updateCurrentLayer(layers);
            this.notifyLayerUpdated(layers);
        }).catch(api.DefaultErrorHandler.handle);
    }

    private updateCurrentLayer(layers: ContentLayer[]) {
        const currentLayer: ContentLayer = layers.filter((layer: ContentLayer) => layer.equals(LayerContext.get().getCurrentLayer()))[0];
        LayerContext.get().updateCurrentLayer(currentLayer);
    }

    private handleLayersDeleted() {
        new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.handleCurrentLayerDeleted(layers);
            this.notifyIssueDeleted(layers);
        }).catch(api.DefaultErrorHandler.handle);
    }

    private handleCurrentLayerDeleted(layers: ContentLayer[]) {
        if (LayerContext.get().getCurrentLayer().isBaseLayer()) {
            return; // base layer can't be deleted
        }

        if (layers.some((layer: ContentLayer) => layer.equals(LayerContext.get().getCurrentLayer()))) {
            return; // current layer wasn't deleted
        }

        this.switchToBaseLayer(layers);
    }

    private switchToBaseLayer(layers: ContentLayer[]) {
        const baseLayer: ContentLayer = layers.filter((layer: ContentLayer) => layer.isBaseLayer())[0];
        LayerContext.get().setCurrentLayer(baseLayer);
    }

    onLayerCreated(listener: (layers: ContentLayer[]) => void) {
        this.layerCreatedListeners.push(listener);
    }

    unLayerCreated(listener: (layers: ContentLayer[]) => void) {
        this.layerCreatedListeners =
            this.layerCreatedListeners.filter((currentListener: (layers: ContentLayer[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyLayerCreated(layers: ContentLayer[]) {
        this.layerCreatedListeners.forEach((listener: (layers: ContentLayer[]) => void) => {
            listener(layers);
        });
    }

    onLayerUpdated(listener: (layers: ContentLayer[]) => void) {
        this.layerUpdatedListeners.push(listener);
    }

    unLayerUpdated(listener: (layers: ContentLayer[]) => void) {
        this.layerUpdatedListeners =
            this.layerUpdatedListeners.filter((currentListener: (layers: ContentLayer[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyLayerUpdated(layers: ContentLayer[]) {
        this.layerUpdatedListeners.forEach((listener: (layers: ContentLayer[]) => void) => {
            listener(layers);
        });
    }

    onLayerDeleted(listener: (layers: ContentLayer[]) => void) {
        this.layerDeletedListeners.push(listener);
    }

    unLayerDeleted(listener: (layers: ContentLayer[]) => void) {
        this.layerDeletedListeners =
            this.layerDeletedListeners.filter((currentListener: (layers: ContentLayer[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyIssueDeleted(layers: ContentLayer[]) {
        this.layerDeletedListeners.forEach((listener: (layers: ContentLayer[]) => void) => {
            listener(layers);
        });
    }
}
