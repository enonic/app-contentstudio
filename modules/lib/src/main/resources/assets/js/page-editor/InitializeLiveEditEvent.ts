import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {LiveEditModel} from './LiveEditModel';
import {ProjectContext} from '../app/project/ProjectContext';
import {Project} from '../app/settings/data/project/Project';
import {CONFIG} from 'lib-admin-ui/util/Config';

export class InitializeLiveEditEvent
    extends Event {

    private readonly liveEditModel: LiveEditModel;

    private readonly modifyPermissions: boolean;

    private readonly project: Project;

    private readonly config: Object;

    constructor(liveEditModel: LiveEditModel, modifyPermissions: boolean = false) {
        super();
        this.liveEditModel = liveEditModel;
        this.modifyPermissions = modifyPermissions;
        this.project = ProjectContext.get().getProject();
        this.config = CONFIG.getConfig();
    }

    getLiveEditModel(): LiveEditModel {
        return this.liveEditModel;
    }

    hasModifyPermissions(): boolean {
        return this.modifyPermissions;
    }

    getProject(): Project {
        return this.project;
    }

    getConfig(): Object {
        return this.config;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
