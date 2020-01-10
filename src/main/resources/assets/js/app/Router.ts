import * as hasher from 'hasher';
import {ProjectContext} from './project/ProjectContext';
import {ProjectChangedEvent} from './project/ProjectChangedEvent';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentAppMode} from './ContentAppMode';

export class Router {

    private static INSTANCE: Router;

    private prevHash: string;

    private constructor() {
        ProjectChangedEvent.on(this.updateProjectInHash.bind(this));
    }

    private updateProjectInHash() {
        const project: string = ProjectContext.get().getProject();
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

    setHash(path: string) {
        this.setPrevHash();

        const project: string = ProjectContext.get().getProject();
        hasher.changed.active = false;
        hasher.setHash(`${project}/${path}`);
        hasher.changed.active = true;
    }

    private setPrevHash() {
        const currentHashWithoutProject: string = hasher.getHash().substring(hasher.getHash().indexOf('/') + 1);

        if (this.prevHash !== currentHashWithoutProject) {
            this.prevHash = currentHashWithoutProject;
        }
    }

    static getPath(): Path {
        const pathAsString = window.location.hash ? window.location.hash.substr(1) : `/${ProjectContext.DEFAULT_PROJECT}`;
        const path: Path = Path.fromString(pathAsString);

        if (Router.containsProject(path)) {
            return path;
        }

        return Router.prependDefaultProjectToPath(path);
    }

    private static prependDefaultProjectToPath(path: Path): Path {
        const elements: string[] = path.getElements().slice(0);
        elements.unshift(ProjectContext.DEFAULT_PROJECT);
        return new Path(elements);
    }

    private static containsProject(path: Path): boolean {
        const firstPathEl: string = path.getElement(0);

        if (firstPathEl === ContentAppMode.BROWSE ||
            firstPathEl === ContentAppMode.EDIT ||
            firstPathEl === ContentAppMode.NEW ||
            firstPathEl === ContentAppMode.INBOUND ||
            firstPathEl === ContentAppMode.OUTBOUND ||
            firstPathEl === ContentAppMode.ISSUE) {
            return false;
        }

        return true;
    }

    back() {
        if (this.prevHash) {
            this.setHash(this.prevHash);
        }
    }
}
