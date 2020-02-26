import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {LiveEditModel} from './LiveEditModel';

export class InitializeLiveEditEvent
    extends Event {

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
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
