import {ContentLayer} from '../content/ContentLayer';

export class LayerContext {

    private static INSTANCE: LayerContext;

    private currentLayer: ContentLayer;

    private constructor() {

    }

    static get(): LayerContext {
        if (!LayerContext.INSTANCE) {
            LayerContext.INSTANCE = new LayerContext();
        }

        return LayerContext.INSTANCE;
    }

    getCurrentLayer(): ContentLayer {
        return this.currentLayer;
    }

    setCurrentLayer(layer: ContentLayer) {
        this.currentLayer = layer;
    }
}
