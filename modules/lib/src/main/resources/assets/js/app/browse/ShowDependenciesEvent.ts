import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type DependencyParams} from './DependencyParams';

export class ShowDependenciesEvent
    extends Event {

    private readonly dependencyParams: DependencyParams;

    constructor(dependencyParams: DependencyParams) {
        super();
        this.dependencyParams = dependencyParams;
    }

    getDependencyParams(): DependencyParams {
        return this.dependencyParams;
    }

    static on(handler: (event: ShowDependenciesEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ShowDependenciesEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
