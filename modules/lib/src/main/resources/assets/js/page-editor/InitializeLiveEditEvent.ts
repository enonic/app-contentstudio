import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ProjectContext} from '../app/project/ProjectContext';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {JSONObject} from '@enonic/lib-admin-ui/types';
import {ProjectJson} from '../app/settings/resource/json/ProjectJson';
import {LiveEditParams} from './LiveEditParams';

export class InitializeLiveEditEvent
    extends Event {

    private readonly projectJson: ProjectJson;

    private readonly config: JSONObject;

    private readonly liveEditParams: LiveEditParams;

    constructor(liveEditParams?: LiveEditParams) {
        super();
        this.projectJson = ProjectContext.get().getProject().toJson();
        this.config = CONFIG.getConfig();
        this.liveEditParams = liveEditParams;
    }

    getProjectJson(): ProjectJson {
        return this.projectJson;
    }

    getConfig(): JSONObject {
        return this.config;
    }

    getParams(): LiveEditParams {
        return this.liveEditParams;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
