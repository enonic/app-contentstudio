import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ProjectContext} from '../app/project/ProjectContext';
import {CONFIG, ConfigObject} from '@enonic/lib-admin-ui/util/Config';
import {ProjectJson} from '../app/settings/resource/json/ProjectJson';
import {LiveEditParams} from './LiveEditParams';
import {PageJson} from '../app/page/PageJson';
import {PageState} from '../app/wizard/page/PageState';
import {PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';

export class InitializeLiveEditEvent
    extends Event {

    private readonly projectJson: ProjectJson;

    private readonly config: ConfigObject;

    private readonly liveEditParams: LiveEditParams;

    private readonly pageJson: PageJson;

    private readonly user: PrincipalJson;

    private readonly principals: PrincipalJson[];

    constructor(liveEditParams?: LiveEditParams) {
        super();
        this.projectJson = ProjectContext.get().getProject().toJson();
        this.config = CONFIG.getConfig();
        this.liveEditParams = liveEditParams;
        this.pageJson = PageState.getState()?.toJson();
        this.user = AuthContext.get().getUser().toJson();
        this.principals = AuthContext.get().getPrincipals().map(principal => principal.toJson());
    }

    getProjectJson(): ProjectJson {
        return this.projectJson;
    }

    getConfig(): ConfigObject {
        return this.config;
    }

    getParams(): LiveEditParams {
        return this.liveEditParams;
    }

    getPageJson(): PageJson {
        return this.pageJson;
    }

    getUserJson(): PrincipalJson {
        return this.user;
    }

    getPrincipalsJson(): PrincipalJson[] {
        return this.principals;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
