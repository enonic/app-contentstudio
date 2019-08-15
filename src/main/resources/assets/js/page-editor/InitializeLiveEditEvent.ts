import './../api.ts';
import {LiveEditModel} from './LiveEditModel';
import {ContentLayer} from '../app/content/ContentLayer';
import {LayerContext} from '../app/layer/LayerContext';

export class InitializeLiveEditEvent
    extends api.event.Event {

    private liveEditModel: LiveEditModel;

    private writePermissions: boolean;

    private currentLayer: ContentLayer;

    constructor(liveEditModel: LiveEditModel, writePermissions: boolean = false) {
        super();
        this.liveEditModel = liveEditModel;
        this.writePermissions = writePermissions;
        this.currentLayer = LayerContext.get().getCurrentLayer();
    }

    getLiveEditModel(): LiveEditModel {
        return this.liveEditModel;
    }

    hasWritePermissions(): boolean {
        return this.writePermissions;
    }

    getCurrentLayer(): ContentLayer {
        return this.currentLayer;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
