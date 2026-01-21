import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ProjectContext} from '../app/project/ProjectContext';
import {CONFIG, ConfigObject} from '@enonic/lib-admin-ui/util/Config';
import {ProjectJson} from '../app/settings/resource/json/ProjectJson';
import {LiveEditParams} from './LiveEditParams';
import {PageJson} from '../app/page/PageJson';
import {PageState} from '../app/wizard/page/PageState';
import {PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ContentSummaryAndCompareStatus} from '../app/content/ContentSummaryAndCompareStatus';

export class InitializeLiveEditEvent
    extends IframeEvent {

    private projectJson: ProjectJson;

    private config: ConfigObject;

    private readonly liveEditParams: LiveEditParams;

    private pageJson: PageJson;

    private user: PrincipalJson;

    private principals: PrincipalJson[];

    private content: ContentSummaryAndCompareStatus;

    private hostDomain: string;

    constructor(liveEditParams?: LiveEditParams) {
        super();
        this.liveEditParams = liveEditParams;
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

    getContent(): ContentSummaryAndCompareStatus {
        return this.content;
    }

    setProjectJson(value: ProjectJson = ProjectContext?.get().getProject()?.toJson()) {
        this.projectJson = value;
        return this;
    }

    setConfig(value: ConfigObject = CONFIG?.getConfig()) {
        this.config = value;
        return this;
    }

    setPageJson(value: PageJson = PageState?.getState()?.toJson()) {
        this.pageJson = value;
        return this;
    }

    setUser(value: PrincipalJson = AuthContext?.get().getUser()?.toJson()) {
        this.user = value;
        return this;
    }

    setContent(value: ContentSummaryAndCompareStatus) {
        this.content = value;
        return this;
    }

    setPrincipals(value: PrincipalJson[] = AuthContext?.get().getPrincipals().map(principal => principal.toJson())) {
        this.principals = value;
        return this;
    }

    setHostDomain(value: string) {
        this.hostDomain = value;
        return this;
    }

    getHostDomain(): string {
        return this.hostDomain;
    }

    static on(handler: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: InitializeLiveEditEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
