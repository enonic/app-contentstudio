import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ProjectContext} from '../app/project/ProjectContext';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {JSONObject} from '@enonic/lib-admin-ui/types';
import {ProjectJson} from '../app/settings/resource/json/ProjectJson';
import {LiveEditParams} from './LiveEditParams';
import {PageJson} from '../app/page/PageJson';
import {PageState} from '../app/wizard/page/PageState';

export class InitializeLiveEditEvent
    extends Event {

    private readonly projectJson: ProjectJson;

    private readonly config: JSONObject;

    private readonly liveEditParams: LiveEditParams;

    private readonly pageJson: PageJson;

    constructor(liveEditParams?: LiveEditParams) {
        super();
        this.projectJson = ProjectContext.get().getProject().toJson();
        this.config = CONFIG.getConfig();
        this.liveEditParams = liveEditParams;
        this.pageJson = PageState.getState()?.toJson();
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

    getPageJson(): PageJson {
        return this.pageJson;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
