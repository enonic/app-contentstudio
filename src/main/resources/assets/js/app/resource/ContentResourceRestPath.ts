import Path = api.rest.Path;
import {LayerChangedEvent} from '../layer/LayerChangedEvent';
import {LayerContext} from '../layer/LayerContext';

export class ContentResourceRestPath {

    private static INSTANCE: ContentResourceRestPath;

    private parentPath: Path;

    private resourcePath: Path;

    private constructor() {
        this.parentPath = Path.fromString(api.util.UriHelper.getRestUri(''));
        this.resourcePath = Path.fromParent(this.parentPath, `cms/default/${LayerContext.get().getCurrentLayer().getName()}`);

        LayerChangedEvent.on(() => {
            const layerName: string = LayerContext.get().getCurrentLayer().getName();
            this.resourcePath = Path.fromParent(this.parentPath, `cms/default/${layerName}`);
        });
    }

    static get(): ContentResourceRestPath {
        if (!ContentResourceRestPath.INSTANCE) {
            ContentResourceRestPath.INSTANCE = new ContentResourceRestPath();
        }

        return ContentResourceRestPath.INSTANCE;
    }

    getRestPath(): Path {
        return this.resourcePath;
    }
}
