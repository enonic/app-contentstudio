import * as hasher from 'hasher';
import {ProjectContext} from './project/ProjectContext';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {WidgetScriptExecutor} from './view/context/WidgetScriptExecutor';

export class Router {

    private prevHash: string;

    private constructor() {
        ProjectContext.get().onProjectChanged(() => Router.onProjectChanged());
    }

    static onProjectChanged() {
        Router.updateProjectInHash();
        Router.cleanupWidgetScripts();
    }

    static updateProjectInHash() {
        const project: string = ProjectContext.get().getProject().getName();
        const currentHash: string = hasher.getHash();
        const newHash: string = project + currentHash.substring(currentHash.indexOf('/'));
        hasher.setHash(newHash);
    }

    static cleanupWidgetScripts() {
        WidgetScriptExecutor.removeScripts();
    }

    static get(): Router {
        let instance: Router = Store.instance().get(Router.name);

        if (instance == null) {
            instance = new Router();
            Store.instance().set(Router.name, instance);
        }

        return instance;
    }

    private doSetHash(path: string) {
        this.setPrevHash();

        hasher.changed.active = false;
        hasher.setHash(`${path}`);
        hasher.changed.active = true;
    }

    setHash(path: string) {
        const project: string = ProjectContext.get().getProject().getName();
        this.doSetHash(`${project}/${path}`);
    }

    setGlobalHash(path: string) {
        this.doSetHash(path);
    }

    setPath(path: string) {
        history.pushState(null, null, path);
    }

    private setPrevHash() {
        const currentHashWithoutProject: string = hasher.getHash().substring(hasher.getHash().indexOf('/') + 1);

        if (this.prevHash !== currentHashWithoutProject) {
            this.prevHash = currentHashWithoutProject;
        }
    }

    static getPath(): Path {
        return Path.create().fromString(this.getPathString()).build();
    }

    private static getPathString(): string {
        if (!CONFIG.has('appId')) {
            return '/';
        }

        const appId: string = CONFIG.getString('appId');
        const pathWithTool: string = window.location.href.split(appId)[1];

        return pathWithTool?.replace(/\/[^\/]+/, '') || '/';
    }

    back() {
        if (this.prevHash) {
            this.setHash(this.prevHash);
        }
    }

    isInitialised(): boolean {
        return this.prevHash != undefined;
    }
}
