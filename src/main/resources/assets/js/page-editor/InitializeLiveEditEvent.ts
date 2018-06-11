import './../api.ts';
import {LiveEditModel} from './LiveEditModel';

export class InitializeLiveEditEvent
    extends api.event.Event {

    private liveEditModel: LiveEditModel;

    private writePermissions: boolean;

    constructor(liveEditModel: LiveEditModel, writePermissions: boolean = false) {
        super();
        this.liveEditModel = liveEditModel;
        this.writePermissions = writePermissions;
    }

    getLiveEditModel(): LiveEditModel {
        return this.liveEditModel;
    }

    hasWritePermissions(): boolean {
        return this.writePermissions;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
