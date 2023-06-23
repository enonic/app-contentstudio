import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {LiveEditModel} from './LiveEditModel';
import {ProjectContext} from '../app/project/ProjectContext';
import {Project} from '../app/settings/data/project/Project';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {JSONObject} from '@enonic/lib-admin-ui/types';

export class InitializeLiveEditEvent
    extends Event {

    private readonly liveEditModel: LiveEditModel;

    private readonly project: Project;

    private readonly config: JSONObject;

    constructor(liveEditModel: LiveEditModel) {
        super();
        this.liveEditModel = liveEditModel;
        this.project = ProjectContext.get().getProject();
        this.config = CONFIG.getConfig();
    }

    getLiveEditModel(): LiveEditModel {
        return this.liveEditModel;
    }

    getProject(): Project {
        return this.project;
    }

    getConfig(): JSONObject {
        return this.config;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
