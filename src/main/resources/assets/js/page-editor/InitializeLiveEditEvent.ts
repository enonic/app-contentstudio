import './../api.ts';
import {LiveEditModel} from './LiveEditModel';

export class InitializeLiveEditEvent
    extends api.event.Event {

    private liveEditModel: LiveEditModel;

    private modifyPermissions: boolean;

    constructor(liveEditModel: LiveEditModel, modifyPermissions: boolean = false) {
        super();
        this.liveEditModel = liveEditModel;
        this.modifyPermissions = modifyPermissions;
    }

    getLiveEditModel(): LiveEditModel {
        return this.liveEditModel;
    }

    hasModifyPermissions(): boolean {
        return this.modifyPermissions;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
