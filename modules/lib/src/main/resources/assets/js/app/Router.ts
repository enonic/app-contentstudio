import * as hasher from 'hasher';
import {ProjectContext} from './project/ProjectContext';
import {Path} from 'lib-admin-ui/rest/Path';

export class Router {

    private static INSTANCE: Router;

    private prevHash: string;

    private constructor() {
        ProjectContext.get().onProjectChanged(this.updateProjectInHash.bind(this));
    }

    private updateProjectInHash() {
        const project: string = ProjectContext.get().getProject().getName();
        const currentHash: string = hasher.getHash();
        const newHash: string = project + currentHash.substring(currentHash.indexOf('/'));
        hasher.setHash(newHash);
    }

    static get(): Router {
        if (!Router.INSTANCE) {
            Router.INSTANCE = new Router();
        }

        return Router.INSTANCE;
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
        const pathAsString = window.location.hash?.substring(1) || '/';
        return Path.create().fromString(pathAsString).build();
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
