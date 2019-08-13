import Path = api.rest.Path;
import {LayerChangedEvent} from '../layer/LayerChangedEvent';
import {LayerContext} from '../layer/LayerContext';

export class LayerBasedRestPath {

    private static INSTANCE: LayerBasedRestPath;

    private parentPath: Path;

    private resourcePath: Path;

    private layerPath: string;

    private constructor() {
        this.parentPath = Path.fromString(api.util.UriHelper.getRestUri(''));
        this.setupPaths();

        LayerChangedEvent.on(() => {
            this.setupPaths();
        });
    }

    private setupPaths() {
        this.layerPath = `cms/default/${LayerContext.get().getCurrentLayer().getName()}`;
        this.resourcePath = Path.fromParent(this.parentPath, this.layerPath);
    }

    static get(): LayerBasedRestPath {
        if (!LayerBasedRestPath.INSTANCE) {
            LayerBasedRestPath.INSTANCE = new LayerBasedRestPath();
        }

        return LayerBasedRestPath.INSTANCE;
    }

    getRestPath(): Path {
        return this.resourcePath;
    }

    getLayerPath(): string {
        return this.layerPath;
    }
}
