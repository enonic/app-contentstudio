import '../api.ts';
import {LayerContext} from './layer/LayerContext';
import {LayerChangedEvent} from './layer/LayerChangedEvent';

export class Router {

    private static INSTANCE: Router;

    private prevHash: string;

    private constructor() {
        LayerChangedEvent.on(this.updateLayerInHash.bind(this));
    }

    private updateLayerInHash() {
        const layerName: string = LayerContext.get().getCurrentLayer().getName();
        const currentHash: string = hasher.getHash();
        const newHash: string = layerName + currentHash.substring(currentHash.indexOf('/'));
        hasher.setHash(newHash);
    }

    static get(): Router {
        if (!Router.INSTANCE) {
            Router.INSTANCE = new Router();
        }

        return Router.INSTANCE;
    }

    setHash(path: string) {
        this.setPrevHash();

        const layer: string = LayerContext.get().getCurrentLayer().getName();
        hasher.changed.active = false;
        hasher.setHash(`${layer}/${path}`);
        hasher.changed.active = true;
    }

    private setPrevHash() {
        const currentHashWithoutLayer: string = hasher.getHash().substring(hasher.getHash().indexOf('/') + 1);

        if (this.prevHash !== currentHashWithoutLayer) {
            this.prevHash = currentHashWithoutLayer;
        }
    }

    static getPath(): string {
        return window.location.hash ? window.location.hash.substr(1) : '/';
    }

    back() {
        if (this.prevHash) {
            this.setHash(this.prevHash);
        }
    }
}
